import Stripe from 'stripe';
import { filterEntities, getEntity, updateEntity } from './_lib/supabase.js';

const PARCELAS_MAX = 3;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { transacaoId, comprador, metodo, parcelas, valor: valorBody } = body;

    if (!transacaoId) {
      return res.status(400).json({ error: 'transacaoId é obrigatório' });
    }

    const configs = await filterEntities('ConfiguracaoStripe', {});
    const cfg = configs[0];
    const stripeSecret = process.env.STRIPE_SECRET_KEY || cfg?.secretKey || cfg?.token;
    if (!stripeSecret) {
      return res.status(400).json({
        error: 'Stripe não configurado. Acesse Financeiro > Stripe e salve suas credenciais (ou defina STRIPE_SECRET_KEY na Vercel).',
      });
    }

    let valorTransacao = 0;
    let descricaoTransacao = 'Pagamento Personal Fit Up';
    let transacaoNoBanco = null;

    if (!String(transacaoId).startsWith('parceiro_')) {
      transacaoNoBanco = await getEntity('Transacao', transacaoId);
      if (!transacaoNoBanco) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }
      valorTransacao = parseFloat(transacaoNoBanco.valor);
      descricaoTransacao = transacaoNoBanco.descricao || descricaoTransacao;
    } else {
      valorTransacao = parseFloat(valorBody || 0);
      descricaoTransacao = body.descricao || 'Consulta parceiro Personal Fit Up';
    }

    if (!valorTransacao || valorTransacao <= 0) {
      return res.status(400).json({ error: 'Valor inválido para cobrança.' });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
    const valorCentavos = Math.round(valorTransacao * 100);
    const numParcelas = Math.min(Math.max(parseInt(parcelas, 10) || 1, 1), PARCELAS_MAX);
    const isPix = metodo === 'pix';

    const paymentIntentParams = {
      amount: valorCentavos,
      currency: 'brl',
      payment_method_types: isPix ? ['pix'] : ['card'],
      description: descricaoTransacao,
      metadata: {
        transacaoId: String(transacaoId),
        alunoNome: comprador?.nome || '',
        cpf: comprador?.cpf || '',
        metodo: metodo || 'credito',
        parcelas: String(isPix || metodo === 'debito' ? 1 : numParcelas),
      },
    };

    if (isPix) {
      paymentIntentParams.payment_method_options = {
        pix: { expires_after_seconds: 3600 },
      };
    } else if (metodo !== 'debito') {
      // Habilita parcelamento no cartão (até 3x). O plano escolhido é enviado no confirm do client.
      paymentIntentParams.payment_method_options = {
        card: {
          installments: { enabled: true },
        },
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    if (transacaoNoBanco) {
      await updateEntity('Transacao', transacaoId, {
        status: 'pendente',
        stripePaymentIntentId: paymentIntent.id,
        dataAtualizacaoStripe: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      metodo: isPix ? 'pix' : (metodo || 'credito'),
      parcelas: String(isPix || metodo === 'debito' ? 1 : numParcelas),
    });
  } catch (error) {
    console.error('stripe-checkout error:', error);
    const msg = error.type === 'StripeInvalidRequestError'
      ? error.message
      : 'Erro ao iniciar pagamento. Verifique a configuração do Stripe.';
    return res.status(400).json({ error: msg });
  }
}

import Stripe from 'stripe';
import { filterEntities, getEntity, updateEntity } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { transacaoId, cartao, comprador, metodo } = body;

    if (!transacaoId || !cartao) {
      return res.status(400).json({ error: 'transacaoId e cartao são obrigatórios' });
    }

    const configs = await filterEntities('ConfiguracaoPagBank', {});
    const cfg = configs[0];
    if (!cfg?.token) {
      return res.status(400).json({
        error: 'Stripe não configurado. Acesse Financeiro > Stripe e salve suas credenciais.',
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
      valorTransacao = parseFloat(cartao.valor || 0);
      descricaoTransacao = cartao.descricao || 'Consulta parceiro Personal Fit Up';
    }

    if (!valorTransacao || valorTransacao <= 0) {
      return res.status(400).json({ error: 'Valor inválido para cobrança.' });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY || cfg.token;
    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
    const valorCentavos = Math.round(valorTransacao * 100);
    const parcelas = parseInt(cartao.parcelas, 10) || 1;

    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: cartao.numero.replace(/\s/g, ''),
        exp_month: parseInt(cartao.mesValidade, 10),
        exp_year: parseInt(cartao.anoValidade, 10),
        cvc: cartao.cvv,
      },
      billing_details: {
        name: cartao.nomeTitular,
        email: comprador?.email || '',
      },
    });

    const paymentMethodOptions = {};
    if (metodo !== 'debito' && parcelas > 1) {
      paymentMethodOptions.card = {
        installments: { enabled: true },
        request_three_d_secure: 'automatic',
      };
    }

    const returnUrl = process.env.VITE_APP_URL || 'https://personalfitup.com.br';

    const paymentIntent = await stripe.paymentIntents.create({
      amount: valorCentavos,
      currency: 'brl',
      payment_method: paymentMethod.id,
      confirm: true,
      description: descricaoTransacao,
      metadata: {
        transacaoId,
        alunoNome: comprador?.nome || '',
        cpf: comprador?.cpf || '',
        metodo: metodo || 'credito',
      },
      ...(Object.keys(paymentMethodOptions).length > 0 ? { payment_method_options: paymentMethodOptions } : {}),
      return_url: returnUrl,
    });

    let novoStatus = 'pendente';
    if (paymentIntent.status === 'succeeded') novoStatus = 'pago';
    else if (['canceled', 'requires_payment_method'].includes(paymentIntent.status)) novoStatus = 'cancelado';

    if (transacaoNoBanco) {
      await updateEntity('Transacao', transacaoId, {
        status: novoStatus,
        stripePaymentIntentId: paymentIntent.id,
        dataAtualizacaoStripe: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      ok: true,
      status: paymentIntent.status,
      novoStatus,
      chargeId: paymentIntent.id,
      mensagem: novoStatus === 'pago'
        ? 'Pagamento aprovado com sucesso!'
        : novoStatus === 'cancelado'
          ? 'Pagamento recusado. Verifique os dados do cartão.'
          : 'Pagamento em análise.',
    });
  } catch (error) {
    console.error('pagbank-checkout error:', error);
    const msg = error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError'
      ? error.message
      : 'Erro ao processar pagamento. Verifique os dados e tente novamente.';
    return res.status(400).json({ error: msg });
  }
}

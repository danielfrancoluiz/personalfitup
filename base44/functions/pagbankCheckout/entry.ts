import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { transacaoId, cartao, comprador, metodo } = body;

    if (!transacaoId || !cartao) {
      return Response.json({ error: 'transacaoId e cartao são obrigatórios' }, { status: 400 });
    }

    // Busca config Stripe salva (token = secretKey)
    const configs = await base44.asServiceRole.entities.ConfiguracaoPagBank.filter({});
    const cfg = configs[0];
    if (!cfg || !cfg.token) {
      return Response.json({ error: 'Stripe não configurado. Acesse Financeiro > Stripe e salve suas credenciais.' }, { status: 400 });
    }

    // Busca a transação — pode ser virtual (parceiro) sem registro no banco
    let valorTransacao = 0;
    let descricaoTransacao = 'Pagamento FitPro';
    let transacaoNoBanco = null;

    // IDs de parceiro não existem no banco — extrai valor do transacaoId ou ignora
    if (!transacaoId.startsWith('parceiro_')) {
      transacaoNoBanco = await base44.asServiceRole.entities.Transacao.get(transacaoId);
      if (!transacaoNoBanco) {
        return Response.json({ error: 'Transação não encontrada' }, { status: 404 });
      }
      valorTransacao = parseFloat(transacaoNoBanco.valor);
      descricaoTransacao = transacaoNoBanco.descricao || 'Pagamento FitPro';
    } else {
      // Para parceiros: extrai o valor do payload de cartao (enviado pelo modal)
      valorTransacao = parseFloat(cartao.valor || 0);
      descricaoTransacao = cartao.descricao || 'Consulta parceiro FitPro';
    }

    if (!valorTransacao || valorTransacao <= 0) {
      return Response.json({ error: 'Valor inválido para cobrança.' }, { status: 400 });
    }

    const stripe = new Stripe(cfg.token, { apiVersion: '2023-10-16' });
    const valorCentavos = Math.round(valorTransacao * 100);
    const parcelas = parseInt(cartao.parcelas) || 1;
    const tipoCartao = metodo === 'debito' ? 'debit' : 'credit';

    // Cria PaymentMethod com os dados do cartão
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: cartao.numero.replace(/\s/g, ''),
        exp_month: parseInt(cartao.mesValidade),
        exp_year: parseInt(cartao.anoValidade),
        cvc: cartao.cvv,
      },
      billing_details: {
        name: cartao.nomeTitular,
        email: comprador?.email || user.email,
      },
    });

    // Monta opções de parcelamento (crédito)
    const paymentMethodOptions = {};
    if (metodo !== 'debito' && parcelas > 1) {
      paymentMethodOptions.card = {
        installments: { enabled: true },
        request_three_d_secure: 'automatic',
      };
    }

    // Cria e confirma o PaymentIntent
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
      return_url: 'https://app.base44.com',
    });

    console.log('Stripe PaymentIntent:', paymentIntent.id, 'status:', paymentIntent.status);

    // Mapeia status Stripe → status interno
    let novoStatus = 'pendente';
    if (paymentIntent.status === 'succeeded') novoStatus = 'pago';
    else if (['canceled', 'requires_payment_method'].includes(paymentIntent.status)) novoStatus = 'cancelado';

    // Atualiza transação no banco (somente se existe)
    if (transacaoNoBanco) {
      await base44.asServiceRole.entities.Transacao.update(transacaoId, {
        status: novoStatus,
        stripePaymentIntentId: paymentIntent.id,
        dataAtualizacaoStripe: new Date().toISOString(),
      });
    }

    return Response.json({
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
    console.error('Stripe error:', error.type, error.message);
    const msg = (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError')
      ? error.message
      : 'Erro ao processar pagamento. Verifique os dados e tente novamente.';
    return Response.json({ error: msg }, { status: 400 });
  }
});
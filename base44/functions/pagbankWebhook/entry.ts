import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Mapa de status PagSeguro/PagBank -> status interno FitPro
const STATUS_MAP = {
  'PAID': 'pago',
  'AVAILABLE': 'pago',
  'APPROVED': 'pago',
  'AUTHORIZED': 'pago',
  'DECLINED': 'cancelado',
  'CANCELLED': 'cancelado',
  'CANCELED': 'cancelado',
  'REFUNDED': 'cancelado',
  'CHARGED_BACK': 'cancelado',
  'IN_ANALYSIS': 'pendente',
  'WAITING': 'pendente',
  'WAITING_PAYMENT': 'pendente',
};

Deno.serve(async (req) => {
  // PagSeguro valida o endpoint com GET antes de cadastrar — responde 200 imediatamente
  if (req.method === 'GET') {
    return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  console.log('PagBank webhook recebido:', JSON.stringify(body).substring(0, 600));

  // Usa serviceRole — o webhook é chamado pelo PagSeguro (sem usuário autenticado)
  const base44 = createClientFromRequest(req);

  // Suporta formato novo PagBank (order com charges) e legado (notificationType)
  const charges = body.charges || body.order?.charges || [];
  const orderStatus = body.order?.status || body.status;
  const referenceId = body.referenceId || body.order?.referenceId || body.reference_id;

  // Resolve status interno
  let novoStatus = null;

  if (charges.length > 0) {
    const charge = charges[0];
    novoStatus = STATUS_MAP[charge.status?.toUpperCase()] || null;
  } else if (orderStatus) {
    novoStatus = STATUS_MAP[orderStatus?.toUpperCase()] || null;
  }

  if (!novoStatus) {
    console.log('Status não mapeado:', { orderStatus, charges: charges.map(c => c.status) });
    return Response.json({ ok: true, message: 'Status não requer atualização' });
  }

  console.log('Status resolvido:', novoStatus, '| referenceId:', referenceId);

  // Busca transação pelo referenceId
  if (referenceId) {
    const transacoes = await base44.asServiceRole.entities.Transacao.filter({ referenceId });

    if (transacoes.length > 0) {
      await base44.asServiceRole.entities.Transacao.update(transacoes[0].id, {
        status: novoStatus,
        dataAtualizacaoPagBank: new Date().toISOString(),
        payloadPagBank: JSON.stringify(body).substring(0, 500),
      });
      console.log(`Transação ${transacoes[0].id} atualizada para: ${novoStatus}`);
      return Response.json({ ok: true, transacaoId: transacoes[0].id, novoStatus });
    }
  }

  // Fallback: busca por valor
  const chargeAmount = charges[0]?.amount?.value;
  const valorReais = chargeAmount ? chargeAmount / 100 : null;

  if (valorReais) {
    const pendentes = await base44.asServiceRole.entities.Transacao.filter({ status: 'pendente' });
    const match = pendentes.find(t => Math.abs(parseFloat(t.valor) - valorReais) < 0.01);

    if (match) {
      await base44.asServiceRole.entities.Transacao.update(match.id, {
        status: novoStatus,
        dataAtualizacaoPagBank: new Date().toISOString(),
        payloadPagBank: JSON.stringify(body).substring(0, 500),
      });
      console.log(`Transação ${match.id} atualizada por valor (R$${valorReais}) para: ${novoStatus}`);
      return Response.json({ ok: true, transacaoId: match.id, novoStatus, matchBy: 'valor' });
    }
  }

  console.log('Nenhuma transação correspondente:', { referenceId, valorReais });
  return Response.json({ ok: true, message: 'Nenhuma transação encontrada' });
});
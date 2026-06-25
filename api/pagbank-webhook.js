import { filterEntities, updateEntity } from './_lib/supabase.js';

const STATUS_MAP = {
  PAID: 'pago',
  AVAILABLE: 'pago',
  APPROVED: 'pago',
  AUTHORIZED: 'pago',
  DECLINED: 'cancelado',
  CANCELLED: 'cancelado',
  CANCELED: 'cancelado',
  REFUNDED: 'cancelado',
  CHARGED_BACK: 'cancelado',
  IN_ANALYSIS: 'pendente',
  WAITING: 'pendente',
  WAITING_PAYMENT: 'pendente',
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('OK');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const charges = body.charges || body.order?.charges || [];
  const orderStatus = body.order?.status || body.status;
  const referenceId = body.referenceId || body.order?.referenceId || body.reference_id;

  let novoStatus = null;

  if (charges.length > 0) {
    const charge = charges[0];
    novoStatus = STATUS_MAP[charge.status?.toUpperCase()] || null;
  } else if (orderStatus) {
    novoStatus = STATUS_MAP[orderStatus?.toUpperCase()] || null;
  }

  if (!novoStatus) {
    return res.status(200).json({ ok: true, message: 'Status não requer atualização' });
  }

  try {
    if (referenceId) {
      const transacoes = await filterEntities('Transacao', { referenceId });
      if (transacoes.length > 0) {
        await updateEntity('Transacao', transacoes[0].id, {
          status: novoStatus,
          dataAtualizacaoPagBank: new Date().toISOString(),
          payloadPagBank: JSON.stringify(body).substring(0, 500),
        });
        return res.status(200).json({ ok: true, transacaoId: transacoes[0].id, novoStatus });
      }
    }

    const chargeAmount = charges[0]?.amount?.value;
    const valorReais = chargeAmount ? chargeAmount / 100 : null;

    if (valorReais) {
      const pendentes = await filterEntities('Transacao', { status: 'pendente' });
      const match = pendentes.find((t) => Math.abs(parseFloat(t.valor) - valorReais) < 0.01);
      if (match) {
        await updateEntity('Transacao', match.id, {
          status: novoStatus,
          dataAtualizacaoPagBank: new Date().toISOString(),
          payloadPagBank: JSON.stringify(body).substring(0, 500),
        });
        return res.status(200).json({ ok: true, transacaoId: match.id, novoStatus, matchBy: 'valor' });
      }
    }

    return res.status(200).json({ ok: true, message: 'Nenhuma transação encontrada' });
  } catch (error) {
    console.error('pagbank-webhook error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
}

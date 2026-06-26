import Stripe from 'stripe';
import { filterEntities, updateEntity } from './_lib/supabase.js';

const STATUS_BY_INTENT = {
  succeeded: 'pago',
  processing: 'pendente',
  requires_payment_method: 'cancelado',
  requires_action: 'pendente',
  canceled: 'cancelado',
};

async function readRawBody(req) {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function atualizarTransacao(transacaoId, novoStatus, evento) {
  if (!transacaoId || String(transacaoId).startsWith('parceiro_')) return null;
  await updateEntity('Transacao', transacaoId, {
    status: novoStatus,
    dataAtualizacaoStripe: new Date().toISOString(),
    payloadStripe: JSON.stringify({
      type: evento.type,
      id: evento.id,
    }).substring(0, 500),
  });
  return transacaoId;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('OK');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' }) : null;

    if (webhookSecret && signature && stripe) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      event = JSON.parse(rawBody);
    }
  } catch (error) {
    console.error('stripe-webhook signature error:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
      const intent = event.data.object;
      const novoStatus = event.type === 'payment_intent.succeeded'
        ? 'pago'
        : event.type === 'payment_intent.canceled'
          ? 'cancelado'
          : STATUS_BY_INTENT[intent.status] || 'pendente';
      const transacaoId = intent.metadata?.transacaoId;
      if (transacaoId) {
        await atualizarTransacao(transacaoId, novoStatus, event);
        return res.status(200).json({ ok: true, transacaoId, novoStatus });
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const intentId = charge.payment_intent;
      if (intentId) {
        const transacoes = await filterEntities('Transacao', { stripePaymentIntentId: intentId });
        if (transacoes.length > 0) {
          await atualizarTransacao(transacoes[0].id, 'cancelado', event);
          return res.status(200).json({ ok: true, transacaoId: transacoes[0].id, novoStatus: 'cancelado' });
        }
      }
    }

    return res.status(200).json({ ok: true, message: 'Evento recebido' });
  } catch (error) {
    console.error('stripe-webhook error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
}

const SUPORTE_EMAIL = 'comercial@trafficclicks.com.br';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { nome, email, assunto, mensagem } = body || {};

    if (!assunto?.trim() || !mensagem?.trim()) {
      return res.status(400).json({ error: 'Assunto e mensagem são obrigatórios.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Serviço de e-mail não configurado.',
        fallbackMailto: true,
      });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Personal Fit Up <onboarding@resend.dev>';
    const texto = [
      `Nome: ${nome || 'Não informado'}`,
      `Email: ${email || 'Não informado'}`,
      '',
      mensagem.trim(),
    ].join('\n');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [SUPORTE_EMAIL],
        reply_to: email || undefined,
        subject: `[Personal Fit Up] ${assunto.trim()}`,
        text: texto,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('[suporte-email] Resend error:', data);
      return res.status(502).json({
        error: data?.message || 'Falha ao enviar e-mail.',
        fallbackMailto: true,
      });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error('[suporte-email]', err);
    return res.status(500).json({
      error: 'Erro interno ao enviar e-mail.',
      fallbackMailto: true,
    });
  }
}

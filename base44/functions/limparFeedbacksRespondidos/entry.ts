import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const todos = await base44.asServiceRole.entities.FeedbackTreino.list();

    const agora = new Date();
    const TRES_DIAS_MS = 3 * 24 * 60 * 60 * 1000;

    const paraExcluir = todos.filter(f => {
      if (!f.resposta || !f.dataResposta) return false;
      const dataResp = new Date(f.dataResposta);
      return (agora - dataResp) >= TRES_DIAS_MS;
    });

    let excluidos = 0;
    for (const f of paraExcluir) {
      await base44.asServiceRole.entities.FeedbackTreino.delete(f.id);
      excluidos++;
    }

    return Response.json({ ok: true, excluidos });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
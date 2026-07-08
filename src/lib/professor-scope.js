/** IDs dos alunos vinculados a um professor */
export function getIdsAlunosProfessor(alunos, professorId) {
  if (!professorId) return new Set();
  return new Set(
    (alunos || [])
      .filter((a) => a.professorId === professorId)
      .map((a) => a.id)
  );
}

/** Transação pertence ao escopo do professor (alunos vinculados ou cobrança do próprio plano) */
export function transacaoPertenceAoProfessor(t, professorId, idsAlunos) {
  if (!professorId || !t) return false;

  // Cobrança do admin ao professor (assinatura de plano)
  if (t.professorId && !t.alunoId) return t.professorId === professorId;

  if (t.alunoId) {
    if (!idsAlunos.has(t.alunoId)) return false;
    if (t.professorId && t.professorId !== professorId) return false;
    return true;
  }

  return t.professorId === professorId;
}

export function filterTransacoesProfessor(transacoes, professorId, alunos) {
  const ids = getIdsAlunosProfessor(alunos, professorId);
  return (transacoes || []).filter((t) => transacaoPertenceAoProfessor(t, professorId, ids));
}

/** Feedback de treino pertence ao professor e ao aluno vinculado */
export function feedbackPertenceAoProfessor(f, professorId, idsAlunos) {
  if (!professorId || !f) return false;
  if (f.professorId && f.professorId !== professorId) return false;
  if (f.alunoId && !idsAlunos.has(f.alunoId)) return false;
  return !!(f.professorId || f.alunoId);
}

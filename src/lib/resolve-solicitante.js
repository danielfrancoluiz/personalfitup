import { resolveProfessorId } from './resolve-professor-id';

/**
 * Resolve o perfil (aluno/professor) e todos os IDs que podem aparecer
 * em solicitanteId de pedidos — evita lista vazia ou "fantasma" durante o load.
 */
export function resolveSolicitantePerfil(user, alunos = [], professores = []) {
  if (!user) return { perfil: null, tipo: '', ids: [] };

  const email = (user.email || '').trim().toLowerCase();
  const ids = new Set();

  if (user.role === 'aluno') {
    const porLinked = user.linkedId ? alunos.find((a) => a.id === user.linkedId) : null;
    const porEmail = email
      ? alunos.find((a) => (a.email || '').trim().toLowerCase() === email)
      : null;
    const aluno = porLinked || porEmail || null;
    if (aluno?.id) ids.add(aluno.id);
    if (user.linkedId) ids.add(user.linkedId);
    return { perfil: aluno, tipo: 'aluno', ids: [...ids] };
  }

  if (user.role === 'professor') {
    const profId = resolveProfessorId(user, professores);
    const porLinked = profId ? professores.find((p) => p.id === profId) : null;
    const porEmail = email
      ? professores.find((p) => (p.email || '').trim().toLowerCase() === email)
      : null;
    const professor = porLinked || porEmail || null;
    if (professor?.id) ids.add(professor.id);
    if (profId) ids.add(profId);
    if (user.linkedId) ids.add(user.linkedId);
    return { perfil: professor, tipo: 'professor', ids: [...ids] };
  }

  return { perfil: null, tipo: '', ids: [] };
}

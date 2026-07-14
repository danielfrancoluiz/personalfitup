/** Resolve o ID do registro de professor a partir do usuário logado. */
export function resolveProfessorId(user, professores = []) {
  if (!user) return '';
  if (user.linkedId) return user.linkedId;

  const email = (user.email || '').trim().toLowerCase();
  if (!email) return '';

  const porEmail = professores.find(
    (p) => (p.email || '').trim().toLowerCase() === email
  );
  return porEmail?.id || '';
}

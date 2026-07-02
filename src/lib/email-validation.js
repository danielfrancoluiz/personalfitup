/** Remove espaços e normaliza e-mail para armazenamento */
export function normalizeEmail(email) {
  return (email || '').replace(/\s/g, '').trim().toLowerCase();
}

/** Bloqueia espaços durante digitação */
export function sanitizeEmailInput(value) {
  return (value || '').replace(/\s/g, '');
}

/** Valida formato de e-mail (validação no app — não usa Supabase Auth) */
export function isValidEmail(email) {
  const e = normalizeEmail(email);
  if (!e || e.length > 254) return false;
  const re = /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;
  if (!re.test(e)) return false;
  const [local, domain] = e.split('@');
  if (!local || !domain || domain.indexOf('.') === -1) return false;
  return true;
}

export function validateEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false, email: '', message: 'Email é obrigatório' };
  if (/\s/.test(email || '')) return { ok: false, email: normalized, message: 'Email não pode conter espaços' };
  if (!isValidEmail(normalized)) return { ok: false, email: normalized, message: 'Informe um email válido' };
  return { ok: true, email: normalized, message: '' };
}

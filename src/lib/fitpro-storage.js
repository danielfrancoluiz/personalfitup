import { base44 } from '@/api/base44Client';
import { normalizeEmail } from './email-validation';

// ── ID generator (mantido para compatibilidade com IDs locais de sessões/exercícios dentro de arrays) ──
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateSessionToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return generateId() + generateId();
}

export const SESSION_EXPIRED_KEY = 'fitpro_session_expired';

// ── Credenciais (via Supabase) ──────────────────────────────────────────
export async function getCredentials() {
  return await base44.entities.Credencial.list();
}

export async function saveCredentials(creds) {
  // Não usado diretamente — use addCredential / updateCredential
}

export async function addCredential(cred) {
  const email = normalizeEmail(cred.email);
  return await base44.entities.Credencial.create({ ...cred, email });
}

export async function updateCredential(id, updates) {
  return await base44.entities.Credencial.update(id, updates);
}

export async function deleteCredential(id) {
  return await base44.entities.Credencial.delete(id);
}

export async function emailExists(email) {
  const creds = await getCredentials();
  const norm = normalizeEmail(email);
  return creds.some(c => normalizeEmail(c.email) === norm);
}

// ── Auth (session via sessionStorage — uma sessão ativa por usuário no servidor) ──
const SESSION_KEY = 'fitpro_session';

export async function login(email, password) {
  const creds = await getCredentials();
  const norm = normalizeEmail(email);
  const cred = creds.find(
    c => normalizeEmail(c.email) === norm && c.password === password
  );
  if (!cred) return null;
  // Inatividade de consultoria (aluno) não bloqueia login — só restringe menus no app
  if (cred.role !== 'aluno' && !cred.ativo) return null;

  const sessionToken = generateSessionToken();
  await updateCredential(cred.id, { sessionToken });

  const user = {
    id: cred.id,
    nome: cred.nome,
    email: cred.email,
    role: cred.role,
    linkedId: cred.linkedId,
    autoRegistrado: cred.autoRegistrado ?? false,
    sessionToken,
  };
  sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export async function logout() {
  const user = getSession();
  if (user?.id) {
    try {
      await updateCredential(user.id, { sessionToken: '' });
    } catch {
      // ignora falha de rede no logout
    }
  }
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Valida token da sessão no servidor — invalida login em outro dispositivo */
export async function validateSession() {
  const user = getSession();
  if (!user?.id || !user?.sessionToken) return null;

  try {
    const cred = await base44.entities.Credencial.get(user.id);
    const sessaoInvalida = cred.sessionToken !== user.sessionToken;
    const contaDesativada = user.role !== 'aluno' && !cred.ativo;
    if (sessaoInvalida || contaDesativada) {
      sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return user;
  } catch {
    // Sem rede: mantém sessão local até próxima validação
    return user;
  }
}

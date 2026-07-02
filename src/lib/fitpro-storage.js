import { base44 } from '@/api/base44Client';
import { normalizeEmail } from './email-validation';

// ── ID generator (mantido para compatibilidade com IDs locais de sessões/exercícios dentro de arrays) ──
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

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

// ── Auth (session via sessionStorage — leve, sem localStorage) ───────────────
const SESSION_KEY = 'fitpro_session';

export async function login(email, password) {
  const creds = await getCredentials();
  const norm = normalizeEmail(email);
  const cred = creds.find(
    c => normalizeEmail(c.email) === norm && c.password === password && c.ativo
  );
  if (!cred) return null;
  const user = {
    id: cred.id,
    nome: cred.nome,
    email: cred.email,
    role: cred.role,
    linkedId: cred.linkedId,
    autoRegistrado: cred.autoRegistrado ?? false,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function logout() {
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
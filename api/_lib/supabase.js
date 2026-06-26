import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getServiceSupabase() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios nas API routes');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const TABLE_MAP = {
  Transacao: 'transacoes',
  ConfiguracaoStripe: 'configuracoes_stripe',
};

function rowToEntity(row) {
  if (!row) return null;
  return { id: row.id, ...(row.data || {}) };
}

export async function getEntity(tableKey, id) {
  const table = TABLE_MAP[tableKey];
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return rowToEntity(data);
}

export async function filterEntities(tableKey, criteria = {}) {
  const table = TABLE_MAP[tableKey];
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return (data || [])
    .map(rowToEntity)
    .filter((entity) =>
      Object.entries(criteria).every(([key, value]) => String(entity[key]) === String(value)),
    );
}

export async function updateEntity(tableKey, id, updates) {
  const table = TABLE_MAP[tableKey];
  const supabase = getServiceSupabase();
  const existing = await getEntity(tableKey, id);
  const { id: _id, ...rest } = { ...existing, ...updates };
  const { data, error } = await supabase
    .from(table)
    .update({ data: rest })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToEntity(data);
}

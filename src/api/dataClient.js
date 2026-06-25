import { supabase } from './supabaseClient';

const ENTITY_TABLES = {
  Aluno: 'alunos',
  Professor: 'professores',
  Avaliacao: 'avaliacoes',
  PlanoTreino: 'planos_treino',
  Periodizacao: 'periodizacoes',
  Especialista: 'especialistas',
  ExercicioBiblioteca: 'exercicios_biblioteca',
  Produto: 'produtos',
  Transacao: 'transacoes',
  PlanoCorrida: 'planos_corrida',
  Agenda: 'agenda',
  BibliotecaTreino: 'biblioteca_treinos',
  Credencial: 'credenciais',
  FeedbackTreino: 'feedbacks_treino',
  PARQResposta: 'parq_respostas',
  SolicitacaoVinculo: 'solicitacoes_vinculo',
  ConfiguracaoPagBank: 'configuracoes_pagbank',
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function rowToEntity(row) {
  if (!row) return null;
  const { id, data, created_at, updated_at } = row;
  return {
    id,
    ...(data || {}),
    ...(created_at ? { createdAt: created_at } : {}),
    ...(updated_at ? { updatedAt: updated_at } : {}),
  };
}

function entityToData(entity) {
  const { id, createdAt, updatedAt, created_at, updated_at, ...rest } = entity;
  return rest;
}

function valuesMatch(stored, expected) {
  if (expected === null || expected === undefined) return stored == null;
  if (typeof expected === 'boolean') {
    if (typeof stored === 'boolean') return stored === expected;
    if (stored === 'true') return expected === true;
    if (stored === 'false') return expected === false;
    return Boolean(stored) === expected;
  }
  if (typeof expected === 'number') return Number(stored) === expected;
  return String(stored) === String(expected);
}

function matchesFilter(entity, criteria) {
  return Object.entries(criteria).every(([key, value]) => {
    if (key === 'email' && typeof value === 'string') {
      return String(entity[key] || '').toLowerCase() === value.toLowerCase();
    }
    return valuesMatch(entity[key], value);
  });
}

function createEntityClient(tableName) {
  return {
    async list() {
      const { data, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(rowToEntity);
    },

    async filter(criteria = {}) {
      const all = await this.list();
      return all.filter((entity) => matchesFilter(entity, criteria));
    },

    async get(id) {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(`Registro não encontrado: ${id}`);
      return rowToEntity(data);
    },

    async create(entity) {
      const id = entity.id || generateId();
      const payload = entityToData({ ...entity, id });
      const { data, error } = await supabase
        .from(tableName)
        .insert({ id, data: payload })
        .select()
        .single();
      if (error) throw error;
      return rowToEntity(data);
    },

    async update(id, updates) {
      const existing = await this.get(id);
      const merged = { ...existing, ...updates, id };
      const payload = entityToData(merged);
      const { data, error } = await supabase
        .from(tableName)
        .update({ data: payload })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return rowToEntity(data);
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  };
}

const entities = Object.fromEntries(
  Object.entries(ENTITY_TABLES).map(([name, table]) => [name, createEntityClient(table)]),
);

async function uploadFile({ file }) {
  const ext = (file.name?.split('.').pop() || 'bin').toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('uploads').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  return { file_url: data.publicUrl };
}

const FUNCTION_ENDPOINTS = {
  pagbankCheckout: '/api/pagbank-checkout',
};

async function invokeFunction(name, payload) {
  const endpoint = FUNCTION_ENDPOINTS[name];
  if (!endpoint) {
    throw new Error(`Função não implementada: ${name}`);
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: { ok: false, error: data.error || res.statusText } };
  }
  return { data };
}

/** API compatível com @base44/sdk — permite migração sem alterar as telas */
export const dataClient = {
  entities,
  integrations: {
    Core: {
      UploadFile: uploadFile,
    },
  },
  functions: {
    invoke: invokeFunction,
  },
  auth: {
    async me() {
      return null;
    },
    logout() {
      // autenticação FitPro usa sessionStorage via fitpro-storage.js
    },
    redirectToLogin() {
      window.location.href = '/';
    },
  },
};

export default dataClient;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Footprints, Plus, X, Trash2, Edit2, ChevronRight, ChevronDown, ChevronUp,
  Clock, Target, Zap, Calendar, Save, Users, BarChart2
} from 'lucide-react';
import { useApp, useAuth } from '../../context/FitProContext';
import { generateId } from '../../lib/fitpro-storage';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

const ZONAS = [
  { id: 'Z1', label: 'Z1 — Recuperação Ativa', color: '#60a5fa', desc: '50–60% FC máx' },
  { id: 'Z2', label: 'Z2 — Aeróbico Base', color: '#34d399', desc: '60–70% FC máx' },
  { id: 'Z3', label: 'Z3 — Aeróbico Médio', color: '#fbbf24', desc: '70–80% FC máx' },
  { id: 'Z4', label: 'Z4 — Limiar Anaeróbico', color: '#fb923c', desc: '80–90% FC máx' },
  { id: 'Z5', label: 'Z5 — Máximo', color: '#ef4444', desc: '90–100% FC máx' },
];

const TIPOS_TREINO = ['Rodagem', 'Intervalado', 'Fartlek', 'Tempo Run', 'Long Run', 'Recuperação', 'Progressivo', 'Strides', 'Hill Repeats'];
const OBJETIVOS = ['5km', '10km', 'Meia Maratona', 'Maratona', 'Trail Running', 'Condicionamento Geral', 'Perda de Peso', 'Velocidade'];
const NIVEIS = ['Iniciante', 'Intermediário', 'Avançado'];

function emptyPlanoCorrida() {
  return {
    nome: '', alunoId: '', nivel: 'Iniciante', objetivo: '5km',
    duracaoSemanas: 12, dataInicio: '', fcMaxima: '', fcRepouso: '',
    ritmoBase: '', distanciaSemanal: '', observacoes: '', sessoes: [],
  };
}

function emptySessao(idx) {
  return {
    id: generateId(), nome: `Treino ${idx + 1}`, diaSemana: 'Segunda-feira',
    tipo: 'Rodagem', zona: 'Z2', distancia: '', tempo: '', pace: '',
    aquecimento: '', principal: '', desaquecimento: '', observacoes: '',
  };
}

const DIAS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
const ZONA_COLOR = { Z1: '#60a5fa', Z2: '#34d399', Z3: '#fbbf24', Z4: '#fb923c', Z5: '#ef4444' };

export default function ConsultoriaCorridaView() {
  const { alunos, planosCorrida, addPlanoCorrida, updatePlanoCorrida, deletePlanoCorrida } = useApp();
  const { user } = useAuth();

  const alunosFiltrados = alunos;

  const [selectedPlano, setSelectedPlano] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyPlanoCorrida());
  const [saved, setSaved] = useState(false);
  const [alunoFilter, setAlunoFilter] = useState('');
  const [expandedSessao, setExpandedSessao] = useState({});

  const planos = planosCorrida || [];
  const exibidos = alunoFilter ? planos.filter(p => p.alunoId === alunoFilter) : planos;

  const handleSave = async () => {
    if (!form.nome.trim()) return alert('Nome é obrigatório');
    if (!form.alunoId) return alert('Selecione um aluno');
    if (editId) {
      await updatePlanoCorrida(editId, form);
    } else {
      await addPlanoCorrida(form);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditId(null); setForm(emptyPlanoCorrida()); }, 1200);
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este plano de corrida?')) return;
    await deletePlanoCorrida(id);
    setSelectedPlano(null);
  };

  const addSessao = () => setForm(f => ({ ...f, sessoes: [...f.sessoes, emptySessao(f.sessoes.length)] }));
  const removeSessao = (id) => setForm(f => ({ ...f, sessoes: f.sessoes.filter(s => s.id !== id) }));
  const updateSessao = (id, field, val) => setForm(f => ({
    ...f, sessoes: f.sessoes.map(s => s.id === id ? { ...s, [field]: val } : s),
  }));

  const openEdit = (plano) => {
    setForm({ ...emptyPlanoCorrida(), ...plano });
    setEditId(plano.id);
    setShowForm(true);
  };

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (selectedPlano) {
    const plano = planos.find(p => p.id === selectedPlano.id) || selectedPlano;
    const aluno = alunos.find(a => a.id === plano.alunoId);
    const totalKm = plano.sessoes?.reduce((acc, s) => acc + (parseFloat(s.distancia) || 0), 0) || 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedPlano(null)} className="p-2 rounded-xl hover:bg-white/5">
            <ChevronRight size={18} color="#9ca3af" className="rotate-180" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{plano.nome}</h2>
            <p className="text-xs text-slate-500">{aluno?.nome} • {plano.nivel} • Objetivo: {plano.objetivo}</p>
          </div>
          <button onClick={() => openEdit(plano)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
            <Edit2 size={12} />Editar
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Sessões/sem', value: plano.sessoes?.length || 0, color: '#60a5fa' },
            { label: 'Km/semana', value: `${totalKm.toFixed(1)}km`, color: '#34d399' },
            { label: 'Duração', value: `${plano.duracaoSemanas} sem`, color: '#fbbf24' },
            { label: 'FC Máx', value: plano.fcMaxima ? `${plano.fcMaxima} bpm` : '—', color: '#f472b6' },
          ].map((k, i) => (
            <div key={i} className="p-3 rounded-xl text-center" style={{ background: `${k.color}10`, border: `1px solid ${k.color}25` }}>
              <div className="text-lg font-bold" style={{ color: k.color }}>{k.value}</div>
              <div className="text-xs text-slate-500">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Zonas de FC */}
        {plano.fcMaxima && (
          <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2"><Zap size={14} color="#fbbf24" />Zonas de Frequência Cardíaca</h3>
            <div className="space-y-2">
              {ZONAS.map(z => {
                const fc = parseInt(plano.fcMaxima);
                const ranges = { Z1: [0.50, 0.60], Z2: [0.60, 0.70], Z3: [0.70, 0.80], Z4: [0.80, 0.90], Z5: [0.90, 1.00] };
                const [lo, hi] = ranges[z.id];
                return (
                  <div key={z.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: `${z.color}08`, border: `1px solid ${z.color}20` }}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: z.color }} />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-white">{z.label}</div>
                      <div className="text-xs text-slate-500">{z.desc}</div>
                    </div>
                    <div className="text-xs font-bold" style={{ color: z.color }}>
                      {Math.round(fc * lo)}–{Math.round(fc * hi)} bpm
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sessões */}
        <div className="space-y-3">
          <h3 className="font-semibold text-white text-sm">Sessões de Treino Semanais</h3>
          {(plano.sessoes || []).map((s, si) => {
            const cor = ZONA_COLOR[s.zona] || '#64748b';
            const exp = expandedSessao[s.id];
            return (
              <div key={s.id} className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${cor}30` }}>
                <button onClick={() => setExpandedSessao(e => ({ ...e, [s.id]: !e[s.id] }))}
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white flex-shrink-0" style={{ background: `${cor}25` }}>
                    {si + 1}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white text-sm">{s.nome}</div>
                    <div className="text-xs text-slate-500">{s.diaSemana} • {s.tipo} • {s.zona}</div>
                  </div>
                  <div className="flex gap-2 text-xs mr-2">
                    {s.distancia && <span className="px-2 py-0.5 rounded-lg text-white" style={{ background: `${cor}20` }}>{s.distancia}km</span>}
                    {s.tempo && <span className="px-2 py-0.5 rounded-lg text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{s.tempo}</span>}
                  </div>
                  {exp ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
                </button>
                {exp && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Pace Alvo', value: s.pace || '—', color: cor },
                        { label: 'Distância', value: s.distancia ? `${s.distancia}km` : '—', color: '#60a5fa' },
                        { label: 'Tempo Total', value: s.tempo || '—', color: '#a78bfa' },
                      ].map((k, i) => (
                        <div key={i} className="p-2 rounded-xl text-center" style={{ background: `${k.color}10`, border: `1px solid ${k.color}20` }}>
                          <div className="text-sm font-bold" style={{ color: k.color }}>{k.value}</div>
                          <div className="text-xs text-slate-500">{k.label}</div>
                        </div>
                      ))}
                    </div>
                    {s.aquecimento && (
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="text-xs font-semibold text-slate-400 mb-1">🔥 Aquecimento</div>
                        <p className="text-xs text-slate-300">{s.aquecimento}</p>
                      </div>
                    )}
                    {s.principal && (
                      <div className="p-3 rounded-xl" style={{ background: `${cor}08`, border: `1px solid ${cor}20` }}>
                        <div className="text-xs font-semibold mb-1" style={{ color: cor }}>🏃 Parte Principal</div>
                        <p className="text-xs text-slate-300">{s.principal}</p>
                      </div>
                    )}
                    {s.desaquecimento && (
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="text-xs font-semibold text-slate-400 mb-1">❄️ Desaquecimento</div>
                        <p className="text-xs text-slate-300">{s.desaquecimento}</p>
                      </div>
                    )}
                    {s.observacoes && <p className="text-xs text-slate-500">📝 {s.observacoes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {plano.observacoes && (
          <div className="p-4 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Observações Gerais</h4>
            <p className="text-sm text-slate-300">{plano.observacoes}</p>
          </div>
        )}
      </div>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Footprints size={20} color="#34d399" />Consultoria de Corrida
          </h2>
          <p className="text-xs text-slate-500">{exibidos.length} plano(s) de corrida</p>
        </div>
        <button onClick={() => { setForm(emptyPlanoCorrida()); setEditId(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
          <Plus size={14} />Novo Plano
        </button>
      </div>

      {/* Zonas de referência */}
      <div className="grid grid-cols-5 gap-2">
        {ZONAS.map(z => (
          <div key={z.id} className="p-2 rounded-xl text-center" style={{ background: `${z.color}10`, border: `1px solid ${z.color}25` }}>
            <div className="text-xs font-bold" style={{ color: z.color }}>{z.id}</div>
            <div className="text-xs text-slate-500 hidden lg:block">{z.desc}</div>
          </div>
        ))}
      </div>

      {alunosFiltrados.length > 0 && (
        <select value={alunoFilter} onChange={e => setAlunoFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm text-white outline-none"
          style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="">Todos os alunos</option>
          {alunosFiltrados.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
      )}

      {exibidos.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Footprints size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum plano de corrida criado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {exibidos.map((plano, i) => {
            const aluno = alunos.find(a => a.id === plano.alunoId);
            const colors = ['#34d399', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6', '#fb923c'];
            const color = colors[i % 6];
            const totalKm = plano.sessoes?.reduce((acc, s) => acc + (parseFloat(s.distancia) || 0), 0) || 0;
            return (
              <motion.div key={plano.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                      <Footprints size={20} style={{ color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{plano.nome}</h3>
                      <p className="text-xs text-slate-500">{aluno?.nome} • {plano.nivel}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>{plano.objetivo}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Sessões', value: plano.sessoes?.length || 0, color },
                    { label: 'Km/sem', value: `${totalKm.toFixed(0)}km`, color: '#34d399' },
                    { label: 'Semanas', value: plano.duracaoSemanas, color: '#fbbf24' },
                  ].map((k, j) => (
                    <div key={j} className="p-2 rounded-xl text-center" style={{ background: `${k.color}08`, border: `1px solid ${k.color}20` }}>
                      <div className="text-sm font-bold" style={{ color: k.color }}>{k.value}</div>
                      <div className="text-xs text-slate-500">{k.label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedPlano(plano)} className="flex-1 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
                    Ver Plano
                  </button>
                  <button onClick={() => openEdit(plano)} className="px-3 py-2 rounded-xl text-xs hover:bg-white/5" style={{ color: '#fbbf24' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(plano.id)} className="px-3 py-2 rounded-xl text-xs hover:bg-red-500/10" style={{ color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 my-4" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{editId ? 'Editar' : 'Novo'} Plano de Corrida</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={18} color="#6b7280" /></button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Aluno</label>
                <select value={form.alunoId} onChange={e => setForm(f => ({ ...f, alunoId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="">Selecionar aluno</option>
                  {alunosFiltrados.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nome do Plano</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Plano 10km — Maio 2025"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nível</label>
                  <select value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {NIVEIS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Objetivo</label>
                  <select value={form.objetivo} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Duração (semanas)</label>
                  <input type="number" value={form.duracaoSemanas} onChange={e => setForm(f => ({ ...f, duracaoSemanas: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Data de Início</label>
                  <input type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">FC Máxima (bpm)</label>
                  <input type="number" value={form.fcMaxima} onChange={e => setForm(f => ({ ...f, fcMaxima: e.target.value }))}
                    placeholder="Ex: 185"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Pace Base (min/km)</label>
                  <input value={form.ritmoBase} onChange={e => setForm(f => ({ ...f, ritmoBase: e.target.value }))}
                    placeholder="Ex: 5:30"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
            </div>

            {/* Sessões */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white text-sm">Sessões de Treino</h4>
                <button onClick={addSessao} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
                  <Plus size={12} />Adicionar Sessão
                </button>
              </div>
              <div className="space-y-3">
                {form.sessoes.map((s, si) => {
                  const cor = ZONA_COLOR[s.zona] || '#64748b';
                  return (
                    <div key={s.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${cor}30` }}>
                      <div className="flex items-center gap-2 p-3" style={{ background: `${cor}10` }}>
                        <span className="text-xs font-bold" style={{ color: cor }}>Sessão {si + 1}</span>
                        <input value={s.nome} onChange={e => updateSessao(s.id, 'nome', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg text-sm text-white outline-none" style={{ background: 'rgba(0,0,0,0.2)' }} />
                        <button onClick={() => removeSessao(s.id)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                      </div>
                      <div className="p-3 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Dia da Semana</label>
                          <select value={s.diaSemana} onChange={e => updateSessao(s.id, 'diaSemana', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Tipo</label>
                          <select value={s.tipo} onChange={e => updateSessao(s.id, 'tipo', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {TIPOS_TREINO.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Zona FC</label>
                          <select value={s.zona} onChange={e => updateSessao(s.id, 'zona', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {ZONAS.map(z => <option key={z.id} value={z.id}>{z.id} — {z.desc}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Distância (km)</label>
                          <input value={s.distancia} onChange={e => updateSessao(s.id, 'distancia', e.target.value)}
                            placeholder="Ex: 8"
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Tempo Total</label>
                          <input value={s.tempo} onChange={e => updateSessao(s.id, 'tempo', e.target.value)}
                            placeholder="Ex: 45min"
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Pace Alvo (min/km)</label>
                          <input value={s.pace} onChange={e => updateSessao(s.id, 'pace', e.target.value)}
                            placeholder="Ex: 5:15"
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-slate-500 block mb-1">🔥 Aquecimento</label>
                          <input value={s.aquecimento} onChange={e => updateSessao(s.id, 'aquecimento', e.target.value)}
                            placeholder="Ex: 10min caminhada + mobilidade"
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-slate-500 block mb-1">🏃 Parte Principal</label>
                          <textarea value={s.principal} onChange={e => updateSessao(s.id, 'principal', e.target.value)}
                            placeholder="Ex: 6x1000m no pace de 4:50, com 2min de recuperação"
                            rows={2} className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none resize-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-slate-500 block mb-1">❄️ Desaquecimento</label>
                          <input value={s.desaquecimento} onChange={e => updateSessao(s.id, 'desaquecimento', e.target.value)}
                            placeholder="Ex: 5min trote leve + alongamento"
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {form.sessoes.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">Clique em "Adicionar Sessão" para começar</p>
                )}
              </div>
            </div>

            <button onClick={handleSave} className="w-full py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #34d399, #059669)' }}>
              {saved ? '✓ Salvo!' : `${editId ? 'Salvar' : 'Criar'} Plano de Corrida`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
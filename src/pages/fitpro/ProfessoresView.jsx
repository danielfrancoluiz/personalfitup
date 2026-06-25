import React, { useState } from 'react';
import { UserCheck, Plus, X, Trash2, Edit2, ChevronRight, Search, Phone, Mail, CreditCard, Pencil, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/FitProContext';
import { getCredentials, addCredential, deleteCredential } from '../../lib/fitpro-storage';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

const PLANOS_DEFAULT = [
  { id: 'basico', nome: 'Básico', preco: 0, desc: 'Até 5 alunos — Gratuito' },
  { id: 'profissional', nome: 'Profissional', preco: 99.90, desc: 'Até 50 alunos, todos os recursos, periodização' },
  { id: 'premium', nome: 'Premium', preco: 179.90, desc: 'Alunos ilimitados, financeiro, relatórios avançados' },
  { id: 'enterprise', nome: 'Enterprise', preco: 299.90, desc: 'Multi-professor, API, suporte dedicado, white-label' },
];

function loadPlanos() {
  try {
    const saved = JSON.parse(localStorage.getItem('fitpro_planos'));
    if (!saved || !Array.isArray(saved) || saved.length < 4) {
      savePlanos(PLANOS_DEFAULT);
      return PLANOS_DEFAULT;
    }
    // Garante que planos com IDs conhecidos tenham os valores corretos como base
    const merged = PLANOS_DEFAULT.map(def => {
      const s = saved.find(p => p.id === def.id);
      return s ? s : def;
    });
    // Força o básico como gratuito sempre
    const idx = merged.findIndex(p => p.id === 'basico');
    if (idx >= 0) merged[idx] = { ...merged[idx], preco: 0 };
    return merged;
  } catch { return PLANOS_DEFAULT; }
}
function savePlanos(planos) {
  localStorage.setItem('fitpro_planos', JSON.stringify(planos));
}

const PLANO_COLOR = { basico: '#60a5fa', profissional: '#34d399', premium: '#fbbf24', enterprise: '#a78bfa' };

const emptyForm = {
  nome: '', email: '', telefone: '', cref: '', especialidade: '',
  planoCobranca: 'profissional', statusPlano: 'ativo', dataVencimento: '',
  endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' }
};

export default function ProfessoresView() {
  const { professores, alunos, avaliacoes, planosTreino, addProfessor, updateProfessor, deleteProfessor } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);
  const [selectedProf, setSelectedProf] = useState(null);
  const [formStep, setFormStep] = useState('dados'); // 'dados' | 'plano'
  const [planos, setPlanos] = useState(loadPlanos);
  const [editingPlanoId, setEditingPlanoId] = useState(null);
  const [editingPlanoData, setEditingPlanoData] = useState({});

  const filtered = professores.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  const handleSave = () => {
    if (!form.nome.trim()) return alert('Nome é obrigatório');
    if (editId) {
      updateProfessor(editId, form);
    } else {
      const profId = addProfessor(form);
      if (form.email && form.senha) {
        addCredential({ email: form.email, password: form.senha, role: 'professor', nome: form.nome, linkedId: profId, ativo: true, autoRegistrado: false });
      }
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditId(null); setForm(emptyForm); setFormStep('dados'); }, 1200);
  };

  const openForm = (prof = null) => {
    setForm(prof ? { ...emptyForm, ...prof } : emptyForm);
    setEditId(prof?.id || null);
    setFormStep('dados');
    setShowForm(true);
  };

  if (selectedProf) {
    const prof = professores.find(p => p.id === selectedProf.id) || selectedProf;
    const meusAlunos = alunos.filter(a => a.professorId === prof.id);
    const avsTotal = avaliacoes.filter(av => meusAlunos.some(a => a.id === av.alunoId)).length;
    const treinosTotal = planosTreino.filter(t => meusAlunos.some(a => a.id === t.alunoId)).length;
    const plano = planos.find(p => p.id === prof.planoCobranca) || planos.find(p => p.id === 'basico') || planos[0];
    const planoColor = PLANO_COLOR[prof.planoCobranca] || PLANO_COLOR[plano?.id] || '#60a5fa';

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedProf(null)} className="p-2 rounded-xl hover:bg-white/5">
            <ChevronRight size={18} color="#9ca3af" className="rotate-180" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{prof.nome}</h2>
            <p className="text-xs text-slate-500">{prof.especialidade} {prof.cref ? `• CREF: ${prof.cref}` : ''}</p>
          </div>
          <button onClick={() => openForm(prof)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
            <Edit2 size={12} className="inline mr-1" />Editar
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Alunos', value: meusAlunos.length, color: '#a78bfa' },
            { label: 'Avaliações', value: avsTotal, color: '#fb923c' },
            { label: 'Treinos', value: treinosTotal, color: '#f472b6' },
          ].map(k => (
            <div key={k.label} className="p-3 rounded-xl text-center" style={{ background: `${k.color}10`, border: `1px solid ${k.color}25` }}>
              <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
              <div className="text-xs text-slate-500">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Plano de cobrança */}
        <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${planoColor}30` }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1"><CreditCard size={12} />Plano de Cobrança</h4>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: prof.statusPlano === 'ativo' ? '#34d39915' : '#ef444415', color: prof.statusPlano === 'ativo' ? '#34d399' : '#ef4444' }}>
              {prof.statusPlano === 'ativo' ? 'Ativo' : prof.statusPlano === 'suspenso' ? 'Suspenso' : 'Cancelado'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-bold" style={{ color: planoColor }}>{plano.nome}</div>
              <div className="text-xs text-slate-500">{plano.desc}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">{plano.preco === 0 ? 'Grátis' : `R$ ${plano.preco.toFixed(2)}`}</div>
                        <div className="text-xs text-slate-500">{plano.preco === 0 ? '' : '/mês'}</div>
            </div>
          </div>
          {prof.dataVencimento && <div className="text-xs text-slate-500 mt-2">Vencimento: {new Date(prof.dataVencimento).toLocaleDateString('pt-BR')}</div>}
        </div>

        <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contato</h4>
          <div className="space-y-2">
            {prof.email && <div className="flex items-center gap-2 text-sm text-slate-300"><Mail size={14} color="#64748b" />{prof.email}</div>}
            {prof.telefone && <div className="flex items-center gap-2 text-sm text-slate-300"><Phone size={14} color="#64748b" />{prof.telefone}</div>}
          </div>
        </div>

        {meusAlunos.length > 0 && (
          <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h4 className="font-semibold text-white mb-3">Alunos ({meusAlunos.length})</h4>
            <div className="space-y-2">
              {meusAlunos.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: ['#a78bfa','#34d399','#60a5fa'][i%3] + '30' }}>{a.nome.charAt(0)}</div>
                  <div className="flex-1"><div className="text-sm text-white">{a.nome}</div><div className="text-xs text-slate-500">{a.objetivo}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><UserCheck size={20} color="#34d399" />Professores</h2>
          <p className="text-xs text-slate-500">{filtered.length} professor(es)</p>
        </div>
        <button onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
          <Plus size={14} />Novo Professor
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar professor..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
          style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500"><UserCheck size={40} className="mx-auto mb-3 opacity-30" /><p>Nenhum professor cadastrado</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((prof, i) => {
            const meusAlunos = alunos.filter(a => a.professorId === prof.id);
            const colors = ['#34d399','#60a5fa','#a78bfa','#fb923c','#f472b6'];
            const color = colors[i % 5];
            const plano = planos.find(p => p.id === prof.planoCobranca) || planos.find(p => p.id === 'basico') || planos[0];
            const planoColor = PLANO_COLOR[prof.planoCobranca] || PLANO_COLOR[plano?.id] || '#60a5fa';
            return (
              <motion.div key={prof.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-5 rounded-2xl cursor-pointer hover:opacity-90 transition-all"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white"
                    style={{ background: `${color}25` }}>{prof.nome.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="font-bold text-white">{prof.nome}</div>
                    <div className="text-xs text-slate-400">{prof.especialidade} {prof.cref ? `• ${prof.cref}` : ''}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${planoColor}15`, color: planoColor, border: `1px solid ${planoColor}25` }}>{plano.nome}</span>
                </div>
                <div className="flex gap-3 mb-3">
                  <div className="flex-1 p-2 rounded-xl text-center" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                    <div className="text-lg font-bold" style={{ color }}>{meusAlunos.length}</div>
                    <div className="text-xs text-slate-500">Alunos</div>
                  </div>
                  <div className="flex-1 p-2 rounded-xl text-center" style={{ background: `${planoColor}08`, border: `1px solid ${planoColor}20` }}>
                    <div className="text-sm font-bold" style={{ color: planoColor }}>{plano.preco === 0 ? 'Grátis' : `R$${plano.preco.toFixed(0)}`}</div>
                    <div className="text-xs text-slate-500">{plano.preco === 0 ? '' : '/mês'}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedProf(prof)} className="flex-1 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>Ver Perfil</button>
                  <button onClick={(e) => { e.stopPropagation(); openForm(prof); }}
                    className="px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-all" style={{ color: '#fbbf24' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('Excluir este professor?')) deleteProfessor(prof.id); }}
                    className="px-3 py-2 rounded-xl text-xs hover:bg-red-500/10" style={{ color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 my-4" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{editId ? 'Editar' : 'Novo'} Professor</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); setFormStep('dados'); }}><X size={18} color="#6b7280" /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {[{ id: 'dados', label: 'Dados' }, { id: 'plano', label: 'Plano de Cobrança' }].map(t => (
                <button key={t.id} onClick={() => setFormStep(t.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: formStep === t.id ? '#34d39920' : 'rgba(255,255,255,0.04)', color: formStep === t.id ? '#34d399' : '#64748b', border: formStep === t.id ? '1px solid #34d39930' : '1px solid rgba(255,255,255,0.06)' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {formStep === 'dados' && (
              <div className="space-y-3">
                {[
                  { label: 'Nome', field: 'nome', placeholder: 'Nome completo' },
                  { label: 'Email', field: 'email', placeholder: 'email@exemplo.com' },
                  { label: 'Telefone', field: 'telefone', placeholder: '(11) 99999-9999' },
                  { label: 'CREF', field: 'cref', placeholder: '000000-G/SP' },
                ].map(f => (
                  <div key={f.field}>
                    <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                    <input value={form[f.field] || ''} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                      placeholder={f.placeholder} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Especialidade</label>
                  <select value={form.especialidade || ''} onChange={e => setForm(p => ({ ...p, especialidade: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <option value="">Selecionar</option>
                    {['Musculação','Personal Trainer','Funcional','CrossFit','Pilates','Avaliação Física'].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                {!editId && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Senha de acesso (opcional)</label>
                    <input type="password" value={form.senha || ''} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
                      placeholder="Deixe vazio para não criar acesso" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                )}
              </div>
            )}

            {formStep === 'plano' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 mb-1">Selecione e personalize os planos de cobrança:</p>
                <div className="space-y-2">
                  {planos.map(plano => {
                    const color = PLANO_COLOR[plano.id];
                    const selected = form.planoCobranca === plano.id;
                    const isEditing = editingPlanoId === plano.id;
                    return (
                      <div key={plano.id} className="rounded-xl overflow-hidden"
                        style={{ background: selected ? `${color}12` : 'rgba(255,255,255,0.03)', border: selected ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.07)' }}>
                        {isEditing ? (
                          <div className="p-3 space-y-2">
                            <div className="flex gap-2">
                              <input value={editingPlanoData.nome} onChange={e => setEditingPlanoData(d => ({ ...d, nome: e.target.value }))}
                                className="flex-1 px-2 py-1.5 rounded-lg text-sm text-white outline-none font-bold"
                                style={{ background: '#1e2a3a', border: `1px solid ${color}40` }} placeholder="Nome" />
                              <div className="relative flex items-center">
                                <span className="absolute left-2 text-xs text-slate-400">R$</span>
                                <input type="number" step="0.01" value={editingPlanoData.preco} onChange={e => setEditingPlanoData(d => ({ ...d, preco: parseFloat(e.target.value) || 0 }))}
                                  className="w-24 pl-7 pr-2 py-1.5 rounded-lg text-sm text-white outline-none font-bold"
                                  style={{ background: '#1e2a3a', border: `1px solid ${color}40` }} />
                              </div>
                            </div>
                            <input value={editingPlanoData.desc} onChange={e => setEditingPlanoData(d => ({ ...d, desc: e.target.value }))}
                              className="w-full px-2 py-1.5 rounded-lg text-xs text-slate-300 outline-none"
                              style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="Descrição" />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingPlanoId(null)}
                                className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                Cancelar
                              </button>
                              <button onClick={() => {
                                 const newData = { ...editingPlanoData, preco: plano.id === 'basico' ? 0 : (parseFloat(editingPlanoData.preco) || 0) };
                                 const updated = planos.map(p => p.id === plano.id ? { ...p, ...newData } : p);
                                 setPlanos(updated);
                                 savePlanos(updated);
                                 setEditingPlanoId(null);
                               }} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold"
                                style={{ background: `${color}20`, color }}>
                                <Check size={11} />Salvar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3">
                            <div className="flex-1 cursor-pointer" onClick={() => setForm(f => ({ ...f, planoCobranca: plano.id }))}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-bold text-sm" style={{ color: selected ? color : '#94a3b8' }}>{plano.nome}</span>
                                <span className="font-bold text-sm" style={{ color: selected ? color : '#64748b' }}>
                                  {plano.preco === 0 ? 'Grátis' : `R$ ${plano.preco.toFixed(2)}/mês`}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{plano.desc}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setEditingPlanoId(plano.id); setEditingPlanoData({ nome: plano.nome, preco: plano.preco, desc: plano.desc }); }}
                              className="p-1.5 rounded-lg flex-shrink-0 hover:bg-white/10 transition-all" style={{ color: '#64748b' }}>
                              <Pencil size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Status do Plano</label>
                    <select value={form.statusPlano || 'ativo'} onChange={e => setForm(f => ({ ...f, statusPlano: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <option value="ativo">Ativo</option>
                      <option value="suspenso">Suspenso</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Data de Vencimento</label>
                    <input type="date" value={form.dataVencimento || ''} onChange={e => setForm(f => ({ ...f, dataVencimento: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                </div>
              </div>
            )}

            <button onClick={handleSave} className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #34d399, #059669)' }}>
              {saved ? '✓ Salvo!' : `${editId ? 'Salvar' : 'Cadastrar'} Professor`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
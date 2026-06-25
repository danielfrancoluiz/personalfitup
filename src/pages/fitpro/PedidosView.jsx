import React, { useState } from 'react';
import { ClipboardList, Plus, X, Search, CheckCircle2, Clock, Truck, XCircle, ChevronDown, ChevronUp, Stethoscope, Percent, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp, useAuth } from '../../context/FitProContext';
import { generateId } from '../../lib/fitpro-storage';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

const STATUS = {
  pendente: { label: 'Pendente', color: '#fbbf24', icon: Clock },
  confirmado: { label: 'Confirmado', color: '#60a5fa', icon: CheckCircle2 },
  realizado: { label: 'Realizado', color: '#34d399', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: '#ef4444', icon: XCircle },
};

const EMOJIS = { Médico: '👨‍⚕️', Nutricionista: '🥗', Fisioterapeuta: '🏥', Psicólogo: '🧠', Cardiologista: '❤️', Ortopedista: '🦴', 'Professor de Educação Física': '💪', 'Personal Trainer': '🏋️' };

export default function PedidosView() {
  const { alunos, professores, especialistas, produtos } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [pedidosEsp, setPedidosEsp] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fitpro_pedidos_especialistas') || '[]'); } catch { return []; }
  });
  const [pedidosLoja] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fitpro_pedidos') || '[]'); } catch { return []; }
  });
  const savePedidos = (p) => { setPedidosEsp(p); localStorage.setItem('fitpro_pedidos_especialistas', JSON.stringify(p)); };

  const [aba, setAba] = useState('especialistas'); // especialistas | loja
  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ solicitanteId: '', tipoSolicitante: 'aluno', especialistaId: '', dataAgendamento: '', horario: '', status: 'pendente', observacoes: '' });
  const [saved, setSaved] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const especialistasParceiros = especialistas.filter(e => e.parceiro);
  const todosUsuarios = [
    ...alunos.map(a => ({ ...a, tipo: 'aluno' })),
    ...professores.map(p => ({ ...p, tipo: 'professor' })),
  ];

  const filtrados = pedidosEsp.filter(p => {
    const usuario = todosUsuarios.find(u => u.id === p.solicitanteId);
    const esp = especialistas.find(e => e.id === p.especialistaId);
    const matchSearch = !search ||
      (usuario?.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (esp?.nome || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleSave = () => {
    if (!form.solicitanteId) return alert('Selecione o solicitante');
    if (!form.especialistaId) return alert('Selecione o especialista');
    if (!form.dataAgendamento) return alert('Informe a data de agendamento');
    const esp = especialistas.find(e => e.id === form.especialistaId);
    const novo = { ...form, id: generateId(), valorConsulta: esp?.valorConsulta || 0, comissaoPlataforma: esp?.percentualComissao || 0, createdAt: new Date().toISOString() };
    savePedidos([novo, ...pedidosEsp]);
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setForm({ solicitanteId: '', tipoSolicitante: 'aluno', especialistaId: '', dataAgendamento: '', horario: '', status: 'pendente', observacoes: '' }); }, 1200);
  };

  const updateStatus = (id, status) => savePedidos(pedidosEsp.map(p => p.id === id ? { ...p, status } : p));
  const deletePedido = (id) => { if (confirm('Excluir agendamento?')) savePedidos(pedidosEsp.filter(p => p.id !== id)); };

  const totalRealizados = pedidosEsp.filter(p => p.status === 'realizado').reduce((acc, p) => acc + (p.valorConsulta || 0), 0);
  const totalComissao = pedidosEsp.filter(p => p.status === 'realizado').reduce((acc, p) => acc + ((p.valorConsulta || 0) * (p.comissaoPlataforma || 0) / 100), 0);

  const filtradosLoja = pedidosLoja.filter(p => {
    const usuario = todosUsuarios.find(u => u.id === p.alunoId);
    return !search || (usuario?.nome || '').toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><ClipboardList size={20} color="#60a5fa" />Pedidos & Agendamentos</h2>
          <p className="text-xs text-slate-500">Todos os pedidos realizados na plataforma</p>
        </div>
        {aba === 'especialistas' && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: '#60a5fa20', color: '#60a5fa', border: '1px solid #60a5fa30' }}>
            <Plus size={14} />Novo Agendamento
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Agendamentos', value: pedidosEsp.length, color: '#60a5fa' },
          { label: 'Pedidos Loja', value: pedidosLoja.length, color: '#fb923c' },
          { label: 'Confirmados', value: pedidosEsp.filter(p => p.status === 'confirmado' || p.status === 'realizado').length, color: '#34d399' },
          { label: 'Comissão Plat.', value: `R$${totalComissao.toFixed(0)}`, color: '#a78bfa' },
        ].map((k, i) => (
          <div key={i} className="p-3 rounded-xl text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="flex gap-2">
        {[
          { id: 'especialistas', label: '🏥 Agendamentos Parceiros', color: '#60a5fa' },
          { id: 'loja', label: '🛒 Pedidos da Loja', color: '#fb923c' },
        ].map(t => (
          <button key={t.id} onClick={() => { setAba(t.id); setSearch(''); setFiltroStatus('todos'); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: aba === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)', color: aba === t.id ? t.color : '#64748b', border: aba === t.id ? `1px solid ${t.color}30` : '1px solid rgba(255,255,255,0.06)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={aba === 'especialistas' ? 'Buscar por aluno ou especialista...' : 'Buscar por aluno...'}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        {aba === 'especialistas' && (
          <div className="flex gap-1 flex-wrap">
            {['todos', ...Object.keys(STATUS)].map(s => {
              const color = s === 'todos' ? '#64748b' : STATUS[s].color;
              return (
                <button key={s} onClick={() => setFiltroStatus(s)}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{ background: filtroStatus === s ? `${color}20` : 'rgba(255,255,255,0.03)', color: filtroStatus === s ? color : '#64748b', border: filtroStatus === s ? `1px solid ${color}30` : '1px solid rgba(255,255,255,0.06)' }}>
                  {s === 'todos' ? 'Todos' : STATUS[s].label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ABA LOJA */}
      {aba === 'loja' && (
        filtradosLoja.length === 0 ? (
          <div className="text-center py-16 text-slate-500"><ShoppingBag size={40} className="mx-auto mb-3 opacity-30" /><p>Nenhum pedido da loja encontrado</p></div>
        ) : (
          <div className="space-y-3">
            {filtradosLoja.map((pedido) => {
              const usuario = todosUsuarios.find(u => u.id === pedido.alunoId);
              const stColor = pedido.status === 'pago' ? '#34d399' : pedido.status === 'cancelado' ? '#ef4444' : '#fbbf24';
              return (
                <motion.div key={pedido.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-4 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fb923c20' }}>
                      <ShoppingBag size={16} color="#fb923c" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{usuario?.nome || 'Usuário'} <span className="text-xs text-slate-500">({usuario?.tipo || 'aluno'})</span></div>
                      <div className="text-xs text-slate-500">
                        {pedido.itens?.length || 0} item(s) • {pedido.formaPagamento} • {new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-400">R$ {parseFloat(pedido.total || 0).toFixed(2)}</div>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${stColor}15`, color: stColor }}>{pedido.status}</span>
                    </div>
                  </div>
                  {pedido.itens?.length > 0 && (
                    <div className="mt-3 flex gap-1 flex-wrap">
                      {pedido.itens.map((item, ii) => {
                        const prod = (produtos || []).find(p => p.id === item.produtoId);
                        return prod ? (
                          <span key={ii} className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            {prod.nome} ×{item.quantidade}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {/* ABA ESPECIALISTAS */}
      {aba === 'especialistas' && filtrados.length === 0 ? (
        <div className="text-center py-16 text-slate-500"><Stethoscope size={40} className="mx-auto mb-3 opacity-30" /><p>Nenhum agendamento encontrado</p></div>
      ) : aba === 'especialistas' && (
        <div className="space-y-3">
          {filtrados.map((pedido) => {
            const usuario = todosUsuarios.find(u => u.id === pedido.solicitanteId);
            const esp = especialistas.find(e => e.id === pedido.especialistaId);
            const st = STATUS[pedido.status] || STATUS.pendente;
            const StatusIcon = st.icon;
            const expanded = expandedId === pedido.id;
            const comissaoValor = (pedido.valorConsulta || 0) * (pedido.comissaoPlataforma || 0) / 100;
            return (
              <motion.div key={pedido.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <button onClick={() => setExpandedId(expanded ? null : pedido.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: `${st.color}20` }}>
                    {EMOJIS[esp?.especialidade] || '👨‍⚕️'}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-white">{esp?.nome || 'Especialista'} <span className="text-xs text-slate-500">({esp?.especialidade})</span></div>
                    <div className="text-xs text-slate-500">
                      {usuario?.nome || '?'} ({pedido.tipoSolicitante}) • {new Date(pedido.dataAgendamento).toLocaleDateString('pt-BR')} {pedido.horario && `• ${pedido.horario}`}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 mr-2">
                    <div className="text-sm font-bold text-green-400">R$ {parseFloat(pedido.valorConsulta || 0).toFixed(2)}</div>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${st.color}15`, color: st.color }}>{st.label}</span>
                  </div>
                  {expanded ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
                </button>
                {expanded && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="text-slate-500">Valor da Consulta</div>
                        <div className="font-bold text-green-400">R$ {parseFloat(pedido.valorConsulta || 0).toFixed(2)}</div>
                      </div>
                      {isAdmin && (
                        <div className="p-2 rounded-lg" style={{ background: '#a78bfa08', border: '1px solid #a78bfa20' }}>
                          <div className="text-slate-500 flex items-center gap-1"><Percent size={10} />Comissão Plataforma ({pedido.comissaoPlataforma || 0}%)</div>
                          <div className="font-bold" style={{ color: '#a78bfa' }}>R$ {comissaoValor.toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                    {pedido.observacoes && <p className="text-xs text-slate-500">📝 {pedido.observacoes}</p>}
                    <div className="flex gap-2 flex-wrap items-center">
                      <span className="text-xs text-slate-500">Status:</span>
                      {Object.entries(STATUS).map(([key, s]) => (
                        <button key={key} onClick={() => updateStatus(pedido.id, key)}
                          className="px-2 py-1 rounded-lg text-xs transition-all"
                          style={{ background: pedido.status === key ? `${s.color}20` : 'rgba(255,255,255,0.04)', color: pedido.status === key ? s.color : '#64748b', border: pedido.status === key ? `1px solid ${s.color}30` : '1px solid rgba(255,255,255,0.06)' }}>
                          {s.label}
                        </button>
                      ))}
                      {isAdmin && <button onClick={() => deletePedido(pedido.id)} className="ml-auto px-2 py-1 rounded-lg text-xs" style={{ color: '#ef4444' }}>Excluir</button>}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Form novo agendamento */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 my-4" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Novo Agendamento</h3>
              <button onClick={() => setShowForm(false)}><X size={18} color="#6b7280" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tipo de solicitante</label>
                <div className="flex gap-2">
                  {['aluno', 'professor'].map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, tipoSolicitante: t, solicitanteId: '' }))}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
                      style={{ background: form.tipoSolicitante === t ? '#60a5fa20' : 'rgba(255,255,255,0.04)', color: form.tipoSolicitante === t ? '#60a5fa' : '#64748b', border: form.tipoSolicitante === t ? '1px solid #60a5fa30' : '1px solid rgba(255,255,255,0.06)' }}>
                      {t === 'aluno' ? '👥 Aluno' : '👨‍🏫 Professor'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">{form.tipoSolicitante === 'aluno' ? 'Aluno' : 'Professor'}</label>
                <select value={form.solicitanteId} onChange={e => setForm(f => ({ ...f, solicitanteId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="">Selecionar...</option>
                  {(form.tipoSolicitante === 'aluno' ? alunos : professores).map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Especialista Parceiro</label>
                <select value={form.especialistaId} onChange={e => setForm(f => ({ ...f, especialistaId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="">Selecionar especialista...</option>
                  {especialistasParceiros.map(e => (
                    <option key={e.id} value={e.id}>{EMOJIS[e.especialidade] || ''} {e.nome} ({e.especialidade}) — R${e.valorConsulta}</option>
                  ))}
                </select>
                {form.especialistaId && (() => {
                  const esp = especialistas.find(e => e.id === form.especialistaId);
                  return esp ? (
                    <div className="mt-1 text-xs text-slate-500">
                      {esp.disponibilidade && <span>🕐 {esp.disponibilidade}</span>}
                      {isAdmin && esp.percentualComissao > 0 && <span className="ml-2" style={{ color: '#a78bfa' }}>• {esp.percentualComissao}% comissão plataforma</span>}
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Data</label>
                  <input type="date" value={form.dataAgendamento} onChange={e => setForm(f => ({ ...f, dataAgendamento: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Horário</label>
                  <input type="time" value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
            </div>
            <button onClick={handleSave} className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #60a5fa, #2563eb)' }}>
              {saved ? '✓ Agendado!' : 'Confirmar Agendamento'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
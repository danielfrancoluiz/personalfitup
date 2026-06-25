import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Plus, X, ChevronLeft, ChevronRight, Clock,
  User, Edit2, Trash2, CheckCircle2, AlertCircle, Circle
} from 'lucide-react';
import { useApp, useAuth } from '../../context/FitProContext';
import { generateId, getCredentials } from '../../lib/fitpro-storage';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

const TIPOS = ['Avaliação', 'Treino Personalizado', 'Consultoria', 'Corrida', 'Reposição', 'Online', 'Outro'];
const STATUS_CONFIG = {
  confirmado: { label: 'Confirmado', color: '#34d399', icon: CheckCircle2 },
  pendente:   { label: 'Pendente',   color: '#fbbf24', icon: Circle },
  cancelado:  { label: 'Cancelado',  color: '#ef4444', icon: X },
  realizado:  { label: 'Realizado',  color: '#60a5fa', icon: CheckCircle2 },
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const HORARIOS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const TIPO_COLOR = {
  'Avaliação': '#fb923c', 'Treino Personalizado': '#f472b6', 'Consultoria': '#60a5fa',
  'Corrida': '#34d399', 'Reposição': '#fbbf24', 'Online': '#a78bfa', 'Outro': '#64748b',
};

function emptyEvento(data = '') {
  return { titulo: '', alunoId: '', tipo: 'Treino Personalizado', data, hora: '08:00', duracao: '60', status: 'confirmado', observacoes: '' };
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function AgendaView() {
  const { alunos, agenda: eventos, addAgendaEvento, updateAgendaEvento, deleteAgendaEvento } = useApp();
  const { user } = useAuth();
  const [professorId, setProfessorId] = useState('');

  useEffect(() => {
    getCredentials().then(creds => {
      const myCred = creds.find(c => c.id === user?.id);
      setProfessorId(myCred?.linkedId || '');
    });
  }, [user?.id]);

  const alunosDoFormulario = user?.role === 'professor'
    ? alunos.filter(a => professorId && a.professorId === professorId)
    : alunos;

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyEvento());
  const [saved, setSaved] = useState(false);
  const [viewMode, setViewMode] = useState('mes'); // 'mes' | 'semana' | 'lista'

  const handleSave = async () => {
    if (!form.titulo.trim()) return alert('Título é obrigatório');
    if (!form.data) return alert('Data é obrigatória');
    const data = { ...form, professorId: user?.id };
    if (editId) {
      await updateAgendaEvento(editId, data);
    } else {
      await addAgendaEvento(data);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditId(null); setForm(emptyEvento()); }, 1000);
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este evento?')) return;
    await deleteAgendaEvento(id);
  };

  const openEdit = (ev) => {
    setForm({ ...emptyEvento(), ...ev });
    setEditId(ev.id);
    setShowForm(true);
  };

  const openNew = (data = '') => {
    setForm(emptyEvento(data));
    setEditId(null);
    setShowForm(true);
  };

  // Filtra eventos apenas do professor logado (admin vê todos)
  const eventosFiltrados = user?.role === 'professor' && professorId
    ? eventos.filter(e => e.professorId === user?.id || !e.professorId)
    : eventos;

  const eventosDoMes = eventosFiltrados.filter(e => {
    const d = new Date(e.data);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  const eventosOrdenados = [...eventosFiltrados].sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`));

  // Semana atual
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  // ── CALENDAR GRID ────────────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const getEventosDay = (dateStr) => eventosFiltrados.filter(e => e.data === dateStr).sort((a, b) => a.hora.localeCompare(b.hora));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays size={20} color="#a78bfa" />Agenda
          </h2>
          <p className="text-xs text-slate-500">{eventosDoMes.length} evento(s) este mês</p>
        </div>
        <button onClick={() => openNew()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#a78bfa20', color: '#a78bfa', border: '1px solid #a78bfa30' }}>
          <Plus size={14} />Novo Evento
        </button>
      </div>

      {/* Controles de view */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {[{ id: 'mes', label: 'Mês' }, { id: 'semana', label: 'Semana' }, { id: 'lista', label: 'Lista' }].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: viewMode === v.id ? '#a78bfa20' : 'transparent', color: viewMode === v.id ? '#a78bfa' : '#64748b' }}>
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (viewMode === 'semana') { setWeekOffset(w => w - 1); return; }
            if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1);
          }} className="p-2 rounded-xl hover:bg-white/5"><ChevronLeft size={16} color="#9ca3af" /></button>
          <span className="text-sm font-semibold text-white min-w-32 text-center">
            {viewMode === 'semana'
              ? `${weekDays[0].getDate()}/${weekDays[0].getMonth() + 1} – ${weekDays[6].getDate()}/${weekDays[6].getMonth() + 1}`
              : `${MESES[viewMonth]} ${viewYear}`}
          </span>
          <button onClick={() => {
            if (viewMode === 'semana') { setWeekOffset(w => w + 1); return; }
            if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1);
          }} className="p-2 rounded-xl hover:bg-white/5"><ChevronRight size={16} color="#9ca3af" /></button>
        </div>
      </div>

      {/* VIEW MÊS */}
      {viewMode === 'mes' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="grid grid-cols-7 border-b" style={{ borderColor: BORDER }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarCells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="p-1 min-h-16" style={{ borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }} />;
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const evs = getEventosDay(dateStr);
              const isToday = dateStr === toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
              const isSelected = selectedDay === dateStr;
              return (
                <div key={day} onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  className="p-1 min-h-16 cursor-pointer hover:bg-white/5 transition-all"
                  style={{ borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, background: isSelected ? 'rgba(167,139,250,0.08)' : undefined }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${isToday ? 'text-black' : 'text-slate-400'}`}
                      style={{ background: isToday ? '#a78bfa' : undefined }}>
                      {day}
                    </span>
                    {evs.length > 0 && <span className="text-xs text-slate-500">{evs.length}</span>}
                  </div>
                  <div className="space-y-0.5">
                    {evs.slice(0, 2).map(ev => {
                      const cor = TIPO_COLOR[ev.tipo] || '#64748b';
                      return (
                        <div key={ev.id} className="truncate text-xs px-1 py-0.5 rounded"
                          style={{ background: `${cor}20`, color: cor }}>
                          {ev.hora} {ev.titulo}
                        </div>
                      );
                    })}
                    {evs.length > 2 && <div className="text-xs text-slate-500 px-1">+{evs.length - 2} mais</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detalhes do dia selecionado */}
      {viewMode === 'mes' && selectedDay && (
        <div className="rounded-2xl p-4" style={{ background: CARD, border: '1px solid #a78bfa30' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white text-sm">
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <button onClick={() => openNew(selectedDay)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: '#a78bfa20', color: '#a78bfa', border: '1px solid #a78bfa30' }}>
              <Plus size={11} />Adicionar
            </button>
          </div>
          {getEventosDay(selectedDay).length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Nenhum evento neste dia</p>
          ) : (
            <div className="space-y-2">
              {getEventosDay(selectedDay).map(ev => <EventoCard key={ev.id} ev={ev} alunos={alunos} onEdit={openEdit} onDelete={handleDelete} onChangeStatus={(id, st) => updateAgendaEvento(id, { status: st })} />)}
            </div>
          )}
        </div>
      )}

      {/* VIEW SEMANA */}
      {viewMode === 'semana' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="grid grid-cols-7 border-b" style={{ borderColor: BORDER }}>
            {weekDays.map((d, i) => {
              const isToday = d.toDateString() === today.toDateString();
              return (
                <div key={i} className="py-3 text-center cursor-pointer hover:bg-white/5"
                  onClick={() => { setSelectedDay(d.toISOString().split('T')[0]); setViewMode('mes'); }}>
                  <div className="text-xs text-slate-500">{DIAS_SEMANA[i]}</div>
                  <div className={`w-7 h-7 mx-auto mt-1 flex items-center justify-center rounded-full text-sm font-bold ${isToday ? 'text-black' : 'text-white'}`}
                    style={{ background: isToday ? '#a78bfa' : undefined }}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 min-h-64 divide-x" style={{ borderColor: BORDER }}>
            {weekDays.map((d, i) => {
              const dateStr = d.toISOString().split('T')[0];
              const evs = getEventosDay(dateStr);
              return (
                <div key={i} className="p-1.5 space-y-1 cursor-pointer hover:bg-white/5" onClick={() => openNew(dateStr)}>
                  {evs.map(ev => {
                    const cor = TIPO_COLOR[ev.tipo] || '#64748b';
                    return (
                      <div key={ev.id} onClick={e => { e.stopPropagation(); openEdit(ev); }}
                        className="p-1.5 rounded-lg text-xs cursor-pointer hover:opacity-90"
                        style={{ background: `${cor}20`, borderLeft: `3px solid ${cor}` }}>
                        <div className="font-semibold truncate" style={{ color: cor }}>{ev.hora}</div>
                        <div className="text-white truncate">{ev.titulo}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW LISTA */}
      {viewMode === 'lista' && (
        <div className="space-y-2">
          {eventosOrdenados.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum evento cadastrado</p>
            </div>
          ) : (
            eventosOrdenados.map(ev => (
              <EventoCard key={ev.id} ev={ev} alunos={alunos} onEdit={openEdit} onDelete={handleDelete}
                onChangeStatus={(id, st) => updateAgendaEvento(id, { status: st })} />
            ))
          )}
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 my-4" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{editId ? 'Editar' : 'Novo'} Evento</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={18} color="#6b7280" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Título</label>
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ex: Treino — João Silva"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Aluno (opcional)</label>
                <select value={form.alunoId} onChange={e => setForm(f => ({ ...f, alunoId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="">Sem aluno vinculado</option>
                  {alunosDoFormulario.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tipo</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3 lg:col-span-1">
                  <label className="text-xs text-slate-400 block mb-1">Data</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Horário</label>
                  <select value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Duração (min)</label>
                  <select value={form.duracao} onChange={e => setForm(f => ({ ...f, duracao: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {['30','45','60','75','90','120'].map(d => <option key={d} value={d}>{d}min</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, s]) => (
                    <button key={key} onClick={() => setForm(f => ({ ...f, status: key }))}
                      className="py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: form.status === key ? `${s.color}25` : 'rgba(255,255,255,0.04)', color: form.status === key ? s.color : '#64748b', border: form.status === key ? `1px solid ${s.color}40` : '1px solid rgba(255,255,255,0.06)' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
            </div>
            <button onClick={handleSave} className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
              {saved ? '✓ Salvo!' : `${editId ? 'Salvar' : 'Criar'} Evento`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EventoCard({ ev, alunos, onEdit, onDelete, onChangeStatus }) {
  const aluno = alunos.find(a => a.id === ev.alunoId);
  const cor = TIPO_COLOR[ev.tipo] || '#64748b';
  const st = STATUS_CONFIG[ev.status] || STATUS_CONFIG.pendente;
  const StatusIcon = st.icon;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex items-start gap-3 p-4 rounded-2xl"
      style={{ background: CARD, border: `1px solid ${cor}25`, borderLeft: `4px solid ${cor}` }}>
      <div className="flex-shrink-0 text-center mt-0.5">
        <div className="text-sm font-bold text-white">{ev.hora}</div>
        <div className="text-xs text-slate-500">{ev.duracao}min</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-white truncate">{ev.titulo}</span>
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${cor}15`, color: cor }}>{ev.tipo}</span>
        </div>
        {aluno && (
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <User size={10} />{aluno.nome}
          </div>
        )}
        {ev.data && (
          <div className="text-xs text-slate-500 mt-0.5">
            {new Date(ev.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        )}
        {ev.observacoes && <p className="text-xs text-slate-500 mt-1 truncate">📝 {ev.observacoes}</p>}
        {/* Status chips */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {Object.entries(STATUS_CONFIG).map(([key, s]) => (
            <button key={key} onClick={() => onChangeStatus(ev.id, key)}
              className="px-2 py-0.5 rounded-lg text-xs transition-all"
              style={{ background: ev.status === key ? `${s.color}20` : 'rgba(255,255,255,0.04)', color: ev.status === key ? s.color : '#475569' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onEdit(ev)} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: '#94a3b8' }}><Edit2 size={13} /></button>
        <button onClick={() => onDelete(ev.id)} className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: '#ef4444' }}><Trash2 size={13} /></button>
      </div>
    </motion.div>
  );
}
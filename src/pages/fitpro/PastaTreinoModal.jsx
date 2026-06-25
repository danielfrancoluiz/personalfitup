import React, { useState } from 'react';
import { X, FolderPlus, Dumbbell, CalendarDays, Sparkles, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { generateId } from '../../lib/fitpro-storage';
import { TREINO_TEMPLATES, aplicarTemplate } from '../../lib/treinoTemplates';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';
const COR_SESSAO = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#fb923c'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS = ['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'];

const emptyEx = () => ({ id: generateId(), nome: '', series: 3, repeticoes: '10-12', carga: 0, descanso: 60 });
const emptySessao = (idx) => ({ id: generateId(), nome: `Treino ${String.fromCharCode(65 + idx)}`, dia: 'Segunda-feira', exercicios: [] });

function gerarPlanoAnual({ alunoId, nomePasta, nivel, objetivo, sessoes, exerciciosBiblioteca, dataInicio }) {
  const planos = [];
  const base = dataInicio ? new Date(dataInicio + 'T12:00:00') : new Date();

  for (let m = 0; m < 12; m++) {
    const inicio = new Date(base);
    inicio.setMonth(base.getMonth() + m);
    inicio.setDate(1);
    const fim = new Date(inicio);
    fim.setMonth(fim.getMonth() + 1);
    fim.setDate(0);

    const sessoesDoMes = sessoes.length > 0
      ? sessoes.map(s => ({
          ...s,
          id: generateId(),
          exercicios: s.exercicios.map(e => ({ ...e, id: generateId() })),
        }))
      : (() => {
          const tmpl = aplicarTemplate(nivel, alunoId, exerciciosBiblioteca || []);
          return tmpl ? tmpl.sessoes : [];
        })();

    planos.push({
      nome: `${nomePasta} — ${MESES[inicio.getMonth()]} ${inicio.getFullYear()}`,
      alunoId,
      objetivo,
      nivel,
      duracaoSemanas: 4,
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: fim.toISOString().split('T')[0],
      sessoes: sessoesDoMes,
      pasta: nomePasta,
    });
  }
  return planos;
}

export default function PastaTreinoModal({ onClose, alunosFiltrados, exerciciosBiblioteca, onSavePlanos, bibSearch, setBibSearch }) {
  const [etapa, setEtapa] = useState('escolha'); // 'escolha' | 'rotina' | 'anual'
  const [nomePasta, setNomePasta] = useState('');
  const [alunoId, setAlunoId] = useState(alunosFiltrados[0]?.id || '');
  const [nivel, setNivel] = useState('Intermediário');
  const [objetivo, setObjetivo] = useState('Hipertrofia');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [sessoes, setSessoes] = useState([]);
  const [gerarAuto, setGerarAuto] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collapsedSessoes, setCollapsedSessoes] = useState({});
  const [localBibSearch, setLocalBibSearch] = useState({});

  const addSessao = () => setSessoes(s => [...s, emptySessao(s.length)]);
  const removeSessao = (id) => setSessoes(s => s.filter(x => x.id !== id));
  const updateSessaoNome = (id, val) => setSessoes(s => s.map(x => x.id === id ? { ...x, nome: val } : x));
  const updateSessaoDia = (id, val) => setSessoes(s => s.map(x => x.id === id ? { ...x, dia: val } : x));

  const addExercicio = (sessaoId) => setSessoes(s => s.map(x => x.id === sessaoId ? { ...x, exercicios: [...x.exercicios, emptyEx()] } : x));
  const removeExercicio = (sessaoId, exId) => setSessoes(s => s.map(x => x.id === sessaoId ? { ...x, exercicios: x.exercicios.filter(e => e.id !== exId) } : x));
  const updateEx = (sessaoId, exId, field, val) => setSessoes(s => s.map(x => x.id === sessaoId ? {
    ...x, exercicios: x.exercicios.map(e => e.id === exId ? { ...e, [field]: val } : e)
  } : x));

  const addFromBib = (sessaoId, bEx) => {
    const novo = { id: generateId(), nome: bEx.nome, grupoMuscular: bEx.grupoMuscular, series: parseInt(bEx.series?.split('-')[0] || '3') || 3, repeticoes: bEx.repeticoes || '10-12', carga: 0, descanso: bEx.descanso || 60 };
    setSessoes(s => s.map(x => x.id === sessaoId ? { ...x, exercicios: [...x.exercicios, novo] } : x));
  };

  const handleSalvar = () => {
    if (!nomePasta.trim()) return alert('Informe o nome da pasta/rotina');
    if (!alunoId) return alert('Selecione um aluno');
    setSaving(true);

    if (etapa === 'anual') {
      const planos = gerarPlanoAnual({ alunoId, nomePasta, nivel, objetivo, sessoes: gerarAuto ? [] : sessoes, exerciciosBiblioteca, dataInicio });
      onSavePlanos(planos);
    } else {
      // Rotina simples: um plano
      const sessoesFinais = gerarAuto
        ? (() => { const t = aplicarTemplate(nivel, alunoId, exerciciosBiblioteca || []); return t ? t.sessoes : []; })()
        : sessoes;
      onSavePlanos([{
        nome: nomePasta,
        alunoId,
        objetivo,
        nivel,
        duracaoSemanas: 8,
        dataInicio,
        dataFim: '',
        sessoes: sessoesFinais,
        pasta: nomePasta,
      }]);
    }
  };

  const bibDisponivel = (exerciciosBiblioteca || []);

  const inp = "w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none";
  const inpStyle = { background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-2xl rounded-2xl p-6 my-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#a78bfa20' }}>
              <FolderPlus size={18} color="#a78bfa" />
            </div>
            <div>
              <h3 className="font-bold text-white">Nova Pasta de Treino</h3>
              <p className="text-xs text-slate-500">Organize rotinas e planos anuais</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X size={18} color="#6b7280" /></button>
        </div>

        {/* Dados base sempre visíveis */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Nome da Pasta / Rotina</label>
            <input value={nomePasta} onChange={e => setNomePasta(e.target.value)} placeholder="Ex: Hipertrofia 2025, Emagrecimento Verão..." className={inp} style={inpStyle} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Aluno</label>
              <select value={alunoId} onChange={e => setAlunoId(e.target.value)} className={inp} style={inpStyle}>
                <option value="">Selecionar aluno</option>
                {alunosFiltrados.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Data de Início</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className={inp} style={inpStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nível</label>
              <select value={nivel} onChange={e => setNivel(e.target.value)} className={inp} style={inpStyle}>
                {['Iniciante','Intermediário','Avançado'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Objetivo</label>
              <select value={objetivo} onChange={e => setObjetivo(e.target.value)} className={inp} style={inpStyle}>
                {['Hipertrofia','Força','Emagrecimento','Condicionamento','Resistência'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Escolha do tipo */}
        {etapa === 'escolha' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 mb-2">O que deseja criar nesta pasta?</p>
            <button onClick={() => setEtapa('rotina')}
              className="w-full p-4 rounded-2xl text-left transition-all hover:scale-[1.01]"
              style={{ background: '#f472b610', border: '1px solid #f472b630' }}>
              <div className="flex items-center gap-3 mb-1">
                <Dumbbell size={18} color="#f472b6" />
                <span className="font-bold text-white">Rotina de Treino</span>
              </div>
              <p className="text-xs text-slate-400 ml-7">Crie uma rotina com sessões e exercícios personalizados ou gere automaticamente pela biblioteca</p>
            </button>
            <button onClick={() => setEtapa('anual')}
              className="w-full p-4 rounded-2xl text-left transition-all hover:scale-[1.01]"
              style={{ background: '#a78bfa10', border: '1px solid #a78bfa30' }}>
              <div className="flex items-center gap-3 mb-1">
                <CalendarDays size={18} color="#a78bfa" />
                <span className="font-bold text-white">Plano Anual (12 meses)</span>
              </div>
              <p className="text-xs text-slate-400 ml-7">Gera automaticamente 12 planos mensais com os exercícios da biblioteca, ou personalize as sessões para todos os meses</p>
            </button>
          </div>
        )}

        {/* Rotina / Anual — opção auto ou manual */}
        {(etapa === 'rotina' || etapa === 'anual') && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl flex gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
              <button onClick={() => setGerarAuto(true)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: gerarAuto ? '#a78bfa20' : 'transparent', color: gerarAuto ? '#a78bfa' : '#64748b' }}>
                <Sparkles size={12} className="inline mr-1" />Gerar automaticamente
              </button>
              <button onClick={() => setGerarAuto(false)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: !gerarAuto ? '#f472b620' : 'transparent', color: !gerarAuto ? '#f472b6' : '#64748b' }}>
                <Plus size={12} className="inline mr-1" />Criar manualmente
              </button>
            </div>

            {gerarAuto && (
              <div className="p-4 rounded-2xl" style={{ background: '#a78bfa08', border: '1px solid #a78bfa25' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={15} color="#a78bfa" />
                  <span className="text-sm font-semibold text-white">Geração Automática</span>
                </div>
                <p className="text-xs text-slate-400">
                  {etapa === 'anual'
                    ? `Serão criados 12 planos mensais (Janeiro a Dezembro) com sessões do template "${nivel}" usando os exercícios da sua biblioteca.`
                    : `Será criada uma rotina com o template padrão "${nivel}" preenchido com exercícios da biblioteca.`}
                </p>
                {TREINO_TEMPLATES[nivel] && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {TREINO_TEMPLATES[nivel].sessoes.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full text-slate-300" style={{ background: 'rgba(255,255,255,0.06)' }}>{s.nome.split('—')[0].trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!gerarAuto && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white text-sm">Sessões de Treino</h4>
                  <button onClick={addSessao} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: '#f472b620', color: '#f472b6', border: '1px solid #f472b630' }}>
                    <Plus size={12} />Sessão
                  </button>
                </div>
                {sessoes.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Clique em "Sessão" para adicionar</p>}
                {sessoes.map((sessao, si) => {
                  const cor = COR_SESSAO[si % COR_SESSAO.length];
                  const collapsed = collapsedSessoes[sessao.id];
                  const busca = (localBibSearch[sessao.id] || '').toLowerCase();
                  const filtrados = busca.length > 0 ? bibDisponivel.filter(b => b.nome?.toLowerCase().includes(busca)).slice(0, 20) : [];
                  return (
                    <div key={sessao.id} className="mb-3 rounded-xl overflow-visible" style={{ border: `1px solid ${cor}30` }}>
                      <div className="flex items-center gap-2 p-3" style={{ background: `${cor}10` }}>
                        <span className="font-bold text-xs flex-shrink-0" style={{ color: cor }}>{String.fromCharCode(65 + si)}</span>
                        <input value={sessao.nome} onChange={e => updateSessaoNome(sessao.id, e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg text-sm text-white outline-none" style={{ background: 'rgba(0,0,0,0.2)' }} />
                        <select value={sessao.dia} onChange={e => updateSessaoDia(sessao.id, e.target.value)}
                          className="px-2 py-1 rounded-lg text-xs text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <button onClick={() => setCollapsedSessoes(c => ({ ...c, [sessao.id]: !c[sessao.id] }))} className="text-slate-500 hover:text-white">
                          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </button>
                        <button onClick={() => removeSessao(sessao.id)} className="text-red-400 hover:text-red-300"><X size={13} /></button>
                      </div>
                      {!collapsed && (
                        <div className="p-3 space-y-2">
                          {sessao.exercicios.map((ex, ei) => (
                            <div key={ex.id} className="flex gap-2 items-center p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${cor}25`, color: cor }}>{ei + 1}</span>
                              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-1">
                                <input value={ex.nome} onChange={e => updateEx(sessao.id, ex.id, 'nome', e.target.value)}
                                  placeholder="Exercício" className="col-span-2 px-2 py-1 rounded-lg text-xs text-white outline-none" style={inpStyle} />
                                <input type="number" value={ex.series} onChange={e => updateEx(sessao.id, ex.id, 'series', parseInt(e.target.value) || 1)}
                                  placeholder="Séries" className="px-2 py-1 rounded-lg text-xs text-white outline-none" style={inpStyle} />
                                <input value={ex.repeticoes} onChange={e => updateEx(sessao.id, ex.id, 'repeticoes', e.target.value)}
                                  placeholder="Reps" className="px-2 py-1 rounded-lg text-xs text-white outline-none" style={inpStyle} />
                                <input type="number" value={ex.carga || ''} onChange={e => updateEx(sessao.id, ex.id, 'carga', parseFloat(e.target.value) || 0)}
                                  placeholder="Carga (kg)" className="px-2 py-1 rounded-lg text-xs text-white outline-none" style={inpStyle} />
                                <input type="number" value={ex.descanso} onChange={e => updateEx(sessao.id, ex.id, 'descanso', parseInt(e.target.value) || 60)}
                                  placeholder="Descanso (s)" className="px-2 py-1 rounded-lg text-xs text-white outline-none" style={inpStyle} />
                              </div>
                              <button onClick={() => removeExercicio(sessao.id, ex.id)} className="text-red-400 flex-shrink-0"><X size={12} /></button>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => addExercicio(sessao.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: `${cor}10`, color: cor }}>
                              <Plus size={10} />Exercício
                            </button>
                            <div className="flex-1 relative">
                              <input
                                value={localBibSearch[sessao.id] || ''}
                                onChange={e => setLocalBibSearch(s => ({ ...s, [sessao.id]: e.target.value }))}
                                placeholder="🔍 Buscar da biblioteca..."
                                className="w-full px-2 py-1 rounded-lg text-xs text-white outline-none"
                                style={inpStyle}
                              />
                              {filtrados.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20 max-h-44 overflow-y-auto"
                                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                                  {filtrados.map(b => (
                                    <button key={b.id} type="button"
                                      onMouseDown={() => { addFromBib(sessao.id, b); setLocalBibSearch(s => ({ ...s, [sessao.id]: '' })); }}
                                      className="w-full text-left px-3 py-2 text-xs text-white hover:bg-white/10 flex items-center gap-2">
                                      <span className="text-slate-400">{b.grupoMuscular}</span><span>{b.nome}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button onClick={() => setEtapa('escolha')} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}>
                Voltar
              </button>
              <button onClick={handleSalvar} disabled={saving}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
                style={{ background: etapa === 'anual' ? 'linear-gradient(135deg, #a78bfa, #7c3aed)' : 'linear-gradient(135deg, #f472b6, #db2777)' }}>
                {saving ? '⏳ Salvando...' : etapa === 'anual' ? `✨ Gerar Plano Anual (12 meses)` : '💾 Salvar Rotina'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
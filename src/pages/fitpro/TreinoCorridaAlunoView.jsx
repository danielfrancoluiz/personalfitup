import React, { useState, useEffect } from 'react';
import { Footprints, ChevronDown, ChevronUp, Calendar, Clock, Target, Zap, CheckCircle2 } from 'lucide-react';
import { useApp, useAuth } from '../../context/FitProContext';
import { getCredentials } from '../../lib/fitpro-storage';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';
const ZONA_COLOR = { Z1: '#60a5fa', Z2: '#34d399', Z3: '#fbbf24', Z4: '#fb923c', Z5: '#ef4444' };

const ZONAS_INFO = [
  { id: 'Z1', label: 'Z1 — Recuperação', color: '#60a5fa', desc: '50–60% FC máx' },
  { id: 'Z2', label: 'Z2 — Aeróbico Base', color: '#34d399', desc: '60–70% FC máx' },
  { id: 'Z3', label: 'Z3 — Aeróbico Médio', color: '#fbbf24', desc: '70–80% FC máx' },
  { id: 'Z4', label: 'Z4 — Limiar Anaeróbico', color: '#fb923c', desc: '80–90% FC máx' },
  { id: 'Z5', label: 'Z5 — Máximo', color: '#ef4444', desc: '90–100% FC máx' },
];

export default function TreinoCorridaAlunoView() {
  const { alunos } = useApp();
  const { user } = useAuth();
  const [expandedSessao, setExpandedSessao] = useState({});
  const [sessoesFeitas, setSessoesFeitas] = useState({});
  const [linkedId, setLinkedId] = useState('');

  useEffect(() => {
    getCredentials().then(creds => {
      const myCred = creds.find(c => c.id === user?.id);
      setLinkedId(myCred?.linkedId || '');
    });
  }, [user?.id]);

  const alunoAtual = alunos.find(a => a.id === linkedId || a.email?.toLowerCase() === user?.email?.toLowerCase());

  const { planosCorrida } = useApp();
  const planos = planosCorrida || [];
  const meusPlanos = planos.filter(p => p.alunoId === alunoAtual?.id);

  const toggleFeita = (sessaoId) => {
    setSessoesFeitas(s => ({ ...s, [sessaoId]: !s[sessaoId] }));
  };

  if (!alunoAtual) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Footprints size={40} className="mx-auto mb-3 opacity-30" />
        <p>Perfil de aluno não encontrado</p>
        <p className="text-xs mt-1">Entre em contato com seu professor.</p>
      </div>
    );
  }

  if (meusPlanos.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Footprints size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-semibold text-white">Nenhum plano de corrida disponível</p>
        <p className="text-xs mt-1">Seu professor ainda não criou um plano de corrida para você.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Footprints size={20} color="#34d399" />Treino de Corrida
        </h2>
        <p className="text-xs text-slate-500">{meusPlanos.length} plano(s) disponível(is)</p>
      </div>

      {meusPlanos.map((plano, pi) => {
        const totalKm = plano.sessoes?.reduce((acc, s) => acc + (parseFloat(s.distancia) || 0), 0) || 0;
        const feitasCount = (plano.sessoes || []).filter(s => sessoesFeitas[s.id]).length;

        return (
          <div key={plano.id} className="space-y-4">
            {/* Header do plano */}
            <div className="p-5 rounded-2xl" style={{ background: CARD, border: '1px solid #34d39930' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{plano.nome}</h3>
                  <p className="text-xs text-slate-400">{plano.nivel} • Objetivo: {plano.objetivo}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
                  {plano.objetivo}
                </span>
              </div>

              {/* Progress */}
              {plano.sessoes?.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progresso da semana</span>
                    <span>{feitasCount}/{plano.sessoes.length} sessões</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(feitasCount / plano.sessoes.length) * 100}%`, background: 'linear-gradient(90deg, #34d399, #059669)' }} />
                  </div>
                </div>
              )}

              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Sessões/sem', value: plano.sessoes?.length || 0, color: '#60a5fa' },
                  { label: 'Km/semana', value: `${totalKm.toFixed(0)}km`, color: '#34d399' },
                  { label: 'Duração', value: `${plano.duracaoSemanas} sem`, color: '#fbbf24' },
                  { label: 'Pace Base', value: plano.ritmoBase || '—', color: '#a78bfa' },
                ].map((k, i) => (
                  <div key={i} className="p-3 rounded-xl text-center" style={{ background: `${k.color}10`, border: `1px solid ${k.color}25` }}>
                    <div className="text-base font-bold" style={{ color: k.color }}>{k.value}</div>
                    <div className="text-xs text-slate-500">{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Zonas de FC */}
              {plano.fcMaxima && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Suas Zonas de FC (FC Máx: {plano.fcMaxima} bpm)</h4>
                  <div className="grid grid-cols-5 gap-1">
                    {ZONAS_INFO.map(z => {
                      const fc = parseInt(plano.fcMaxima);
                      const ranges = { Z1: [0.50, 0.60], Z2: [0.60, 0.70], Z3: [0.70, 0.80], Z4: [0.80, 0.90], Z5: [0.90, 1.00] };
                      const [lo, hi] = ranges[z.id];
                      return (
                        <div key={z.id} className="p-2 rounded-xl text-center" style={{ background: `${z.color}10`, border: `1px solid ${z.color}25` }}>
                          <div className="text-xs font-bold" style={{ color: z.color }}>{z.id}</div>
                          <div className="text-xs text-slate-500">{Math.round(fc * lo)}–{Math.round(fc * hi)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sessões */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white text-sm px-1">Sessões desta Semana</h4>
              {(plano.sessoes || []).map((s, si) => {
                const cor = ZONA_COLOR[s.zona] || '#64748b';
                const exp = expandedSessao[s.id];
                const feita = sessoesFeitas[s.id];

                return (
                  <div key={s.id} className="rounded-2xl overflow-hidden transition-all"
                    style={{ background: feita ? '#34d39908' : CARD, border: `1px solid ${feita ? '#34d39940' : cor + '30'}` }}>
                    <div className="flex items-center gap-3 p-4">
                      <button onClick={() => toggleFeita(s.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: feita ? '#34d399' : 'rgba(255,255,255,0.08)', border: feita ? 'none' : '2px solid rgba(255,255,255,0.2)' }}>
                        {feita && <CheckCircle2 size={16} color="#fff" />}
                      </button>
                      <button onClick={() => setExpandedSessao(e => ({ ...e, [s.id]: !e[s.id] }))}
                        className="flex-1 flex items-center gap-3 text-left">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white flex-shrink-0"
                          style={{ background: `${cor}25`, opacity: feita ? 0.5 : 1 }}>
                          {si + 1}
                        </div>
                        <div className="flex-1">
                          <div className={`font-semibold text-sm ${feita ? 'line-through text-slate-500' : 'text-white'}`}>{s.nome}</div>
                          <div className="text-xs text-slate-500">{s.diaSemana} • {s.tipo}</div>
                        </div>
                        <div className="flex gap-2 text-xs mr-2 flex-wrap justify-end">
                          {s.zona && <span className="px-2 py-0.5 rounded-lg font-bold" style={{ background: `${cor}20`, color: cor }}>{s.zona}</span>}
                          {s.distancia && <span className="px-2 py-0.5 rounded-lg text-white" style={{ background: 'rgba(255,255,255,0.07)' }}>{s.distancia}km</span>}
                          {s.pace && <span className="px-2 py-0.5 rounded-lg text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{s.pace}/km</span>}
                        </div>
                        {exp ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
                      </button>
                    </div>

                    {exp && (
                      <div className="px-4 pb-4 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Pace Alvo', value: s.pace || '—', color: cor },
                            { label: 'Distância', value: s.distancia ? `${s.distancia}km` : '—', color: '#60a5fa' },
                            { label: 'Tempo', value: s.tempo || '—', color: '#a78bfa' },
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
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Observações do Professor</h4>
                <p className="text-sm text-slate-300">{plano.observacoes}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
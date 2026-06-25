import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, Dumbbell, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp, useAuth } from '../../context/FitProContext';
import { getCredentials } from '../../lib/fitpro-storage';
import { getCorClassificacao } from '../../lib/fitpro-calculations';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

export default function EvolucaoAlunoView() {
  const { avaliacoes, alunos, planosTreino, periodizacoes } = useApp();
  const { user } = useAuth();
  const [activeChart, setActiveChart] = useState('gordura');
  const [alunoId, setAlunoId] = useState('');

  useEffect(() => {
    getCredentials().then(creds => {
      const myCred = creds.find(c => c.id === user?.id);
      const linkedId = myCred?.linkedId || '';
      if (linkedId) { setAlunoId(linkedId); return; }
      const byEmail = alunos.find(a => a.email?.toLowerCase() === user?.email?.toLowerCase());
      setAlunoId(byEmail?.id || '');
    });
  }, [user?.id, alunos]);

  const aluno = alunos.find(a => a.id === alunoId);

  const minhasAvaliacoes = avaliacoes
    .filter(a => a.alunoId === alunoId)
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  const meusTreinos = planosTreino.filter(t => t.alunoId === alunoId);
  const minhasPeriodizacoes = periodizacoes.filter(p => p.alunoId === alunoId);

  const ultimaAv = minhasAvaliacoes[minhasAvaliacoes.length - 1];
  const primeiraAv = minhasAvaliacoes[0];

  const chartData = minhasAvaliacoes.map((av, i) => ({
    label: `Aval ${i + 1}`,
    data: new Date(av.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    gordura: av.percentualGordura ? parseFloat(av.percentualGordura.toFixed(1)) : 0,
    massaMagra: av.massaMagra ? parseFloat(av.massaMagra.toFixed(1)) : 0,
    massaGorda: av.massaGorda ? parseFloat(av.massaGorda.toFixed(1)) : 0,
    peso: av.peso || 0,
    imc: av.imc ? parseFloat(av.imc.toFixed(1)) : 0,
  }));

  const charts = [
    { id: 'gordura', label: '% Gordura', dataKey: 'gordura', color: '#fb923c', unit: '%' },
    { id: 'massaMagra', label: 'Massa Magra', dataKey: 'massaMagra', color: '#34d399', unit: 'kg' },
    { id: 'peso', label: 'Peso', dataKey: 'peso', color: '#60a5fa', unit: 'kg' },
    { id: 'imc', label: 'IMC', dataKey: 'imc', color: '#a78bfa', unit: '' },
  ];

  const progressoCards = primeiraAv && ultimaAv && minhasAvaliacoes.length > 1 ? [
    {
      label: 'Variação % Gordura',
      value: ultimaAv.percentualGordura != null && primeiraAv.percentualGordura != null
        ? `${(ultimaAv.percentualGordura - primeiraAv.percentualGordura) > 0 ? '+' : ''}${(ultimaAv.percentualGordura - primeiraAv.percentualGordura).toFixed(1)}%`
        : 'N/A',
      color: ultimaAv.percentualGordura < primeiraAv.percentualGordura ? '#34d399' : '#ef4444',
      icon: '🔥',
    },
    {
      label: 'Variação Massa Magra',
      value: ultimaAv.massaMagra != null && primeiraAv.massaMagra != null
        ? `${(ultimaAv.massaMagra - primeiraAv.massaMagra) > 0 ? '+' : ''}${(ultimaAv.massaMagra - primeiraAv.massaMagra).toFixed(1)}kg`
        : 'N/A',
      color: ultimaAv.massaMagra > primeiraAv.massaMagra ? '#34d399' : '#ef4444',
      icon: '💪',
    },
    {
      label: 'Variação de Peso',
      value: `${(ultimaAv.peso - primeiraAv.peso) > 0 ? '+' : ''}${(ultimaAv.peso - primeiraAv.peso).toFixed(1)}kg`,
      color: '#60a5fa',
      icon: '⚖️',
    },
    {
      label: 'Total de Avaliações',
      value: minhasAvaliacoes.length,
      color: '#a78bfa',
      icon: '📊',
    },
  ] : [];

  if (!alunoId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="text-4xl">⚠️</span>
        <p className="text-slate-400 text-sm text-center">Seu perfil não está vinculado a um aluno.<br />Solicite ao professor para vincular.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} color="#fbbf24" />
          Minha Evolução
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {aluno?.nome} • {minhasAvaliacoes.length} avaliação(ões) registradas
        </p>
      </div>

      {minhasAvaliacoes.length === 0 ? (
        <div className="text-center py-16" style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}` }}>
          <Activity size={48} className="mx-auto mb-3 opacity-20 text-slate-500" />
          <p className="text-slate-400">Nenhuma avaliação registrada ainda</p>
          <p className="text-xs text-slate-600 mt-1">Solicite uma avaliação ao seu professor</p>
        </div>
      ) : (
        <>
          {/* Cards de progresso */}
          {progressoCards.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {progressoCards.map((card, i) => (
                <div key={i} className="p-4 rounded-2xl" style={{ background: `${card.color}10`, border: `1px solid ${card.color}25` }}>
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <div className="text-lg font-bold" style={{ color: card.color }}>{card.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Última avaliação resumo */}
          {ultimaAv && (
            <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <h3 className="font-semibold text-white mb-3 text-sm">Última Avaliação — {new Date(ultimaAv.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: '% Gordura', value: ultimaAv.percentualGordura != null ? `${ultimaAv.percentualGordura.toFixed(1)}%` : null, color: '#fb923c' },
                  { label: 'Massa Magra', value: ultimaAv.massaMagra != null ? `${ultimaAv.massaMagra.toFixed(1)}kg` : null, color: '#34d399' },
                  { label: 'Massa Gorda', value: ultimaAv.massaGorda != null ? `${ultimaAv.massaGorda.toFixed(1)}kg` : null, color: '#ef4444' },
                  { label: 'IMC', value: ultimaAv.imc != null ? ultimaAv.imc.toFixed(1) : null, color: '#60a5fa' },
                  { label: 'Peso', value: `${ultimaAv.peso}kg`, color: '#a78bfa' },
                  { label: 'Classificação', value: ultimaAv.classificacaoGordura || null, color: getCorClassificacao(ultimaAv.classificacaoGordura || '') },
                  { label: 'Class. IMC', value: ultimaAv.classificacaoIMC || null, color: '#fbbf24' },
                  { label: 'TMB', value: ultimaAv.tmb ? `${Math.round(ultimaAv.tmb)} kcal` : null, color: '#f472b6' },
                ].filter(it => it.value).map((item, j) => (
                  <div key={j} className="p-3 rounded-xl" style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                    <div className="text-sm font-bold truncate" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráficos de evolução */}
          {chartData.length > 1 && (
            <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Gráfico de Evolução</h3>
                <div className="flex gap-1 flex-wrap">
                  {charts.map(c => (
                    <button key={c.id} onClick={() => setActiveChart(c.id)}
                      className="px-3 py-1 rounded-xl text-xs font-medium transition-all"
                      style={{ background: activeChart === c.id ? `${c.color}20` : 'rgba(255,255,255,0.04)', color: activeChart === c.id ? c.color : '#64748b', border: activeChart === c.id ? `1px solid ${c.color}30` : '1px solid rgba(255,255,255,0.06)' }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              {(() => {
                const c = charts.find(ch => ch.id === activeChart);
                return (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id={`grad-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={c.color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={c.color} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="data" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                        formatter={(val) => [`${val}${c.unit}`, c.label]}
                      />
                      <Area type="monotone" dataKey={c.dataKey} stroke={c.color} strokeWidth={2} fill={`url(#grad-${c.id})`} dot={{ fill: c.color, r: 4 }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          )}

          {/* Comparativo de barras */}
          {chartData.length > 1 && (
            <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <h3 className="font-semibold text-white mb-4">Composição Corporal por Avaliação</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="data" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Bar dataKey="massaMagra" name="Massa Magra (kg)" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="massaGorda" name="Massa Gorda (kg)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Resumo dos treinos */}
          {meusTreinos.length > 0 && (
            <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Dumbbell size={16} color="#f472b6" />Treinos Ativos</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {meusTreinos.map((t, i) => {
                  const colors = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399'];
                  const color = colors[i % 4];
                  const totalExs = t.sessoes?.reduce((acc, s) => acc + s.exercicios.length, 0) || 0;
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white" style={{ background: `${color}25` }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{t.nome}</div>
                        <div className="text-xs text-slate-500">{t.sessoes?.length || 0} sessões • {totalExs} exercícios • {t.duracaoSemanas} sem</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>{t.nivel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Histórico de avaliações */}
          <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h3 className="font-semibold text-white mb-4">Histórico Completo</h3>
            <div className="space-y-3">
              {[...minhasAvaliacoes].reverse().map((av, i) => (
                <div key={av.id} className="p-4 rounded-xl" style={{ background: '#fb923c06', border: '1px solid rgba(251,146,60,0.15)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white">{new Date(av.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    {av.classificacaoGordura && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${getCorClassificacao(av.classificacaoGordura)}15`, color: getCorClassificacao(av.classificacaoGordura) }}>
                        {av.classificacaoGordura}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
                    {[
                      { label: '% Gord', value: av.percentualGordura != null ? `${av.percentualGordura.toFixed(1)}%` : null, color: '#fb923c' },
                      { label: 'Magra', value: av.massaMagra != null ? `${av.massaMagra.toFixed(1)}kg` : null, color: '#34d399' },
                      { label: 'Gorda', value: av.massaGorda != null ? `${av.massaGorda.toFixed(1)}kg` : null, color: '#ef4444' },
                      { label: 'Peso', value: `${av.peso}kg`, color: '#a78bfa' },
                      { label: 'IMC', value: av.imc != null ? av.imc.toFixed(1) : null, color: '#60a5fa' },
                    ].filter(it => it.value).map((item, j) => (
                      <div key={j} className="p-2 rounded-lg text-center" style={{ background: `${item.color}08` }}>
                        <div className="text-xs font-bold" style={{ color: item.color }}>{item.value}</div>
                        <div className="text-xs text-slate-600">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
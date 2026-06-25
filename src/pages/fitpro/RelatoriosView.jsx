import React, { useState } from 'react';
import { BarChart2, Users, Activity, Dumbbell, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { useApp } from '../../context/FitProContext';
import { calcularIMC, classificarIMC, classificarGordura } from '../../lib/fitpro-calculations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';
const COLORS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#fb923c', '#00d4ff', '#ef4444'];

export default function RelatoriosView() {
  const { alunos, professores, avaliacoes, planosTreino, periodizacoes, especialistas, transacoes } = useApp();
  const [tab, setTab] = useState('geral');

  // ── Dados gerais ───────────────────────────────────────────────────────────
  const alunosPorObjetivo = Object.entries(
    alunos.reduce((acc, a) => { const obj = a.objetivo || 'Não definido'; acc[obj] = (acc[obj] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const alunosPorSexo = [
    { name: 'Masculino', value: alunos.filter(a => a.sexo === 'M').length },
    { name: 'Feminino', value: alunos.filter(a => a.sexo === 'F').length },
  ];

  const professorRanking = professores.map(p => ({
    name: p.nome.split(' ')[0],
    alunos: alunos.filter(a => a.professorId === p.id).length,
    avaliacoes: avaliacoes.filter(av => alunos.some(a => a.id === av.alunoId && a.professorId === p.id)).length,
  })).sort((a, b) => b.alunos - a.alunos).slice(0, 8);

  // ── Dados de avaliação ─────────────────────────────────────────────────────
  const classificacaoGordura = Object.entries(
    avaliacoes.reduce((acc, av) => {
      if (av.classificacaoGordura) { acc[av.classificacaoGordura] = (acc[av.classificacaoGordura] || 0) + 1; }
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const classificacaoIMC = Object.entries(
    avaliacoes.reduce((acc, av) => {
      if (av.classificacaoIMC) { acc[av.classificacaoIMC] = (acc[av.classificacaoIMC] || 0) + 1; }
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Média de % gordura por mês
  const gorduraPorMes = Object.entries(
    avaliacoes.reduce((acc, av) => {
      const mes = av.data?.slice(0, 7);
      if (mes && av.percentualGordura != null) {
        if (!acc[mes]) acc[mes] = { total: 0, count: 0 };
        acc[mes].total += av.percentualGordura;
        acc[mes].count += 1;
      }
      return acc;
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([mes, d]) => ({
    mes: new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    media: parseFloat((d.total / d.count).toFixed(1)),
  }));

  // ── Dados financeiros ──────────────────────────────────────────────────────
  const receitaTotal = (transacoes || []).filter(t => t.status === 'pago' && (t.categoria === 'receita' || !t.categoria)).reduce((acc, t) => acc + (parseFloat(t.valor) || 0), 0);
  const despesaTotal = (transacoes || []).filter(t => t.categoria === 'despesa').reduce((acc, t) => acc + (parseFloat(t.valor) || 0), 0);
  const pendente = (transacoes || []).filter(t => t.status === 'pendente').reduce((acc, t) => acc + (parseFloat(t.valor) || 0), 0);

  const receitaPorTipo = Object.entries(
    (transacoes || []).filter(t => t.status === 'pago').reduce((acc, t) => {
      const tipo = t.tipo || 'Outros'; acc[tipo] = (acc[tipo] || 0) + (parseFloat(t.valor) || 0); return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

  const tabs = [
    { id: 'geral', label: 'Visão Geral' },
    { id: 'alunos', label: 'Alunos' },
    { id: 'avaliacoes', label: 'Avaliações' },
    { id: 'financeiro', label: 'Financeiro' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><BarChart2 size={20} color="#fbbf24" />Relatórios</h2>
        <p className="text-xs text-slate-500">Análises completas da plataforma</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
            style={{ background: tab === t.id ? '#fbbf2420' : 'rgba(255,255,255,0.03)', color: tab === t.id ? '#fbbf24' : '#64748b', border: tab === t.id ? '1px solid #fbbf2430' : '1px solid rgba(255,255,255,0.06)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'geral' && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Alunos', value: alunos.length, icon: '👥', color: '#a78bfa' },
              { label: 'Professores', value: professores.length, icon: '👨‍🏫', color: '#34d399' },
              { label: 'Avaliações', value: avaliacoes.length, icon: '📊', color: '#fb923c' },
              { label: 'Planos de Treino', value: planosTreino.length, icon: '💪', color: '#f472b6' },
            ].map((k, i) => (
              <div key={i} className="p-4 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="text-2xl mb-1">{k.icon}</div>
                <div className="text-2xl font-bold text-white">{k.value}</div>
                <div className="text-xs text-slate-500">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Ranking professores */}
          {professorRanking.length > 0 && (
            <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <h3 className="font-semibold text-white mb-4">Ranking de Professores por Alunos</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={professorRanking} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={70} />
                  <Tooltip contentStyle={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="alunos" name="Alunos" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="avaliacoes" name="Avaliações" fill="#fb923c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {tab === 'alunos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {alunosPorObjetivo.length > 0 && (
              <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <h3 className="font-semibold text-white mb-4">Alunos por Objetivo</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={alunosPorObjetivo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {alunosPorObjetivo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {alunosPorSexo.some(s => s.value > 0) && (
              <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <h3 className="font-semibold text-white mb-4">Distribuição por Sexo</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={alunosPorSexo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      <Cell fill="#60a5fa" />
                      <Cell fill="#f472b6" />
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Tabela de alunos */}
          <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h3 className="font-semibold text-white mb-4">Resumo por Aluno</h3>
            <div className="space-y-2">
              {alunos.map((aluno, i) => {
                const avsAluno = avaliacoes.filter(av => av.alunoId === aluno.id);
                const ultima = avsAluno.sort((a, b) => new Date(b.data) - new Date(a.data))[0];
                return (
                  <div key={aluno.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: COLORS[i % COLORS.length] + '40' }}>{aluno.nome.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{aluno.nome}</div>
                      <div className="text-xs text-slate-500">{aluno.objetivo}</div>
                    </div>
                    <div className="text-xs text-right flex-shrink-0">
                      <div className="text-slate-400">{avsAluno.length} aval.</div>
                      {ultima?.percentualGordura != null && <div style={{ color: '#fb923c' }}>{ultima.percentualGordura.toFixed(1)}% gord</div>}
                    </div>
                  </div>
                );
              })}
              {alunos.length === 0 && <p className="text-center text-slate-500 text-sm py-4">Nenhum aluno cadastrado</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'avaliacoes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Total de Avaliações', value: avaliacoes.length, color: '#fb923c' },
              { label: 'Com % Gordura', value: avaliacoes.filter(av => av.percentualGordura != null).length, color: '#34d399' },
              { label: 'Média % Gordura', value: avaliacoes.length > 0 ? `${(avaliacoes.filter(av => av.percentualGordura != null).reduce((a, av) => a + av.percentualGordura, 0) / (avaliacoes.filter(av => av.percentualGordura != null).length || 1)).toFixed(1)}%` : 'N/A', color: '#fbbf24' },
            ].map((k, i) => (
              <div key={i} className="p-4 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs text-slate-500">{k.label}</div>
              </div>
            ))}
          </div>

          {gorduraPorMes.length > 1 && (
            <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <h3 className="font-semibold text-white mb-4">Média de % Gordura por Mês</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={gorduraPorMes}>
                  <defs>
                    <linearGradient id="gradGordura" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} formatter={v => [`${v}%`, 'Média']} />
                  <Area type="monotone" dataKey="media" stroke="#fb923c" strokeWidth={2} fill="url(#gradGordura)" dot={{ fill: '#fb923c', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {classificacaoGordura.length > 0 && (
              <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <h3 className="font-semibold text-white mb-4">Classificação de Gordura</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={classificacaoGordura} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                      {classificacaoGordura.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {classificacaoIMC.length > 0 && (
              <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <h3 className="font-semibold text-white mb-4">Classificação de IMC</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={classificacaoIMC} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} width={90} />
                    <Tooltip contentStyle={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="value" name="Alunos" radius={[0, 4, 4, 0]}>
                      {classificacaoIMC.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {avaliacoes.length === 0 && <p className="text-center text-slate-500 py-8">Nenhuma avaliação registrada para gerar relatórios.</p>}
        </div>
      )}

      {tab === 'financeiro' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Receitas', value: `R$ ${receitaTotal.toFixed(2)}`, color: '#34d399', icon: TrendingUp },
              { label: 'Despesas', value: `R$ ${despesaTotal.toFixed(2)}`, color: '#ef4444', icon: TrendingDown },
              { label: 'Pendente', value: `R$ ${pendente.toFixed(2)}`, color: '#fbbf24', icon: BarChart2 },
            ].map((k, i) => {
              const Icon = k.icon;
              return (
                <div key={i} className="p-4 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <Icon size={18} style={{ color: k.color }} className="mb-2" />
                  <div className="text-lg font-bold" style={{ color: k.color }}>{k.value}</div>
                  <div className="text-xs text-slate-500">{k.label}</div>
                </div>
              );
            })}
          </div>

          {receitaPorTipo.length > 0 && (
            <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <h3 className="font-semibold text-white mb-4">Receita por Tipo</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={receitaPorTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: R$${value}`}>
                    {receitaPorTipo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} formatter={v => [`R$ ${parseFloat(v).toFixed(2)}`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {(transacoes || []).length === 0 && <p className="text-center text-slate-500 py-8">Nenhuma transação registrada para gerar relatórios.</p>}
        </div>
      )}
    </div>
  );
}
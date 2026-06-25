import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Stethoscope, Activity, BarChart2, Settings, ChevronRight, AlertCircle, Clock, Dumbbell, Calendar, Link } from 'lucide-react';
import { useApp, useAuth } from '../../context/FitProContext';
import VincularAlunoProfessorModal from '../../components/fitpro/VincularAlunoProfessorModal';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

export default function DashboardAdmin({ onNav }) {
  const { alunos, professores, avaliacoes, planosTreino, periodizacoes, especialistas } = useApp();
  const { user } = useAuth();
  const [showVincular, setShowVincular] = useState(false);

  const parceiros = especialistas.filter(e => e.parceiro).length;

  const professoresRanking = professores.map(p => ({
    ...p,
    totalAlunos: alunos.filter(a => a.professorId === p.id).length,
    totalAvaliacoes: avaliacoes.filter(av => alunos.find(a => a.id === av.alunoId && a.professorId === p.id)).length,
  })).sort((a, b) => b.totalAlunos - a.totalAlunos);

  const alunosSemAvaliacao = alunos.filter(a => !avaliacoes.some(av => av.alunoId === a.id));
  const alunosSemTreino = alunos.filter(a => !planosTreino.some(t => t.alunoId === a.id));

  const objetivos = alunos.reduce((acc, a) => {
    const obj = a.objetivo || 'Não definido';
    acc[obj] = (acc[obj] || 0) + 1;
    return acc;
  }, {});

  const objetivoColors = {
    'Emagrecimento': '#fb923c', 'Hipertrofia': '#f472b6', 'Condicionamento': '#60a5fa',
    'Saúde': '#34d399', 'Reabilitação': '#a78bfa', 'Performance': '#fbbf24', 'Não definido': '#475569',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
        <p className="text-slate-400 text-sm mt-1">Olá, {user?.nome?.split(' ')[0]} 👋</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Alunos', value: alunos.length, icon: Users, color: '#a78bfa', sub: 'na plataforma' },
          { label: 'Professores', value: professores.length, icon: UserCheck, color: '#34d399', sub: 'ativos' },
          { label: 'Especialistas', value: especialistas.length, icon: Stethoscope, color: '#60a5fa', sub: `${parceiros} parceiros` },
          { label: 'Avaliações', value: avaliacoes.length, icon: Activity, color: '#fbbf24', sub: 'realizadas' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{s.label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}20` }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-500">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Desempenho por Professor</h3>
            <button onClick={() => onNav('relatorios')} className="text-xs text-slate-500 hover:text-slate-300">Ver relatórios →</button>
          </div>
          {professoresRanking.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">Nenhum professor cadastrado</div>
          ) : (
            <div className="space-y-3">
              {professoresRanking.map((prof, i) => {
                const pct = alunos.length > 0 ? Math.round((prof.totalAlunos / alunos.length) * 100) : 0;
                const colors = ['#a78bfa', '#34d399', '#60a5fa', '#fb923c', '#f472b6'];
                const color = colors[i % 5];
                return (
                  <div key={prof.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: `${color}20`, color }}>{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white font-medium">{prof.nome}</span>
                        <span className="text-slate-400 text-xs">{prof.totalAlunos} alunos</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                    <span className="text-xs" style={{ color }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <h3 className="font-semibold text-white mb-4">Gestão Rápida</h3>
          <div className="space-y-2">
            {[
              { label: 'Alunos', value: alunos.length, color: '#a78bfa', icon: Users, view: 'alunos' },
              { label: 'Professores', value: professores.length, color: '#34d399', icon: UserCheck, view: 'professores' },
              { label: 'Especialistas', value: especialistas.length, color: '#60a5fa', icon: Stethoscope, view: 'especialistas' },
              { label: 'Relatórios', value: '', color: '#fb923c', icon: BarChart2, view: 'relatorios' },
              { label: 'Usuários', value: '', color: '#e879f9', icon: Settings, view: 'usuarios' },
              { label: 'Vincular Aluno', value: '', color: '#34d399', icon: Link, view: '__vincular__' },
            ].map((item, i) => (
              <button key={i} onClick={() => item.view === '__vincular__' ? setShowVincular(true) : onNav(item.view)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all text-left">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15` }}>
                  <item.icon size={14} style={{ color: item.color }} />
                </div>
                <span className="text-sm text-slate-300 flex-1">{item.label}</span>
                {item.value !== '' && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${item.color}15`, color: item.color }}>{item.value}</span>}
                <ChevronRight size={12} color="#374151" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Alunos Recentes</h3>
            <button onClick={() => onNav('alunos')} className="text-xs text-slate-500">Ver todos →</button>
          </div>
          {alunos.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">Nenhum aluno cadastrado</div>
          ) : (
            <div className="space-y-2">
              {[...alunos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6).map((aluno, i) => {
                const temAv = avaliacoes.some(av => av.alunoId === aluno.id);
                const temTreino = planosTreino.some(t => t.alunoId === aluno.id);
                const colors = ['#a78bfa','#34d399','#60a5fa','#fb923c','#f472b6'];
                return (
                  <div key={aluno.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: colors[i % 5] + '30' }}>{aluno.nome.charAt(0)}</div>
                    <div className="flex-1"><div className="text-sm text-white">{aluno.nome}</div><div className="text-xs text-slate-500">{aluno.objetivo}</div></div>
                    <div className="flex gap-1">
                      {temAv && <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: '#34d39915', color: '#34d399' }}>Aval</span>}
                      {temTreino && <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: '#f472b615', color: '#f472b6' }}>Treino</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {(alunosSemAvaliacao.length > 0 || alunosSemTreino.length > 0) && (
          <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><AlertCircle size={16} color="#fbbf24" />Atenção</h3>
            <div className="space-y-2">
              {alunosSemAvaliacao.slice(0, 3).map(a => (
                <div key={a.id} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: '#fbbf2408', border: '1px solid #fbbf2420' }}>
                  <Clock size={12} color="#fbbf24" /><span className="text-sm text-white flex-1 truncate">{a.nome}</span><span className="text-xs text-slate-500">sem avaliação</span>
                </div>
              ))}
              {alunosSemTreino.slice(0, 3).map(a => (
                <div key={a.id} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: '#f472b608', border: '1px solid #f472b620' }}>
                  <Dumbbell size={12} color="#f472b6" /><span className="text-sm text-white flex-1 truncate">{a.nome}</span><span className="text-xs text-slate-500">sem treino</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {alunos.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h3 className="font-semibold text-white mb-4">Por Objetivo</h3>
            <div className="space-y-2">
              {Object.entries(objetivos).sort((a, b) => b[1] - a[1]).map(([obj, count], i) => {
                const pct = Math.round((count / alunos.length) * 100);
                const color = objetivoColors[obj] || '#475569';
                return (
                  <div key={obj}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">{obj}</span><span style={{ color }}>{count}</span></div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showVincular && <VincularAlunoProfessorModal onClose={() => setShowVincular(false)} />}
    </div>
  );
}
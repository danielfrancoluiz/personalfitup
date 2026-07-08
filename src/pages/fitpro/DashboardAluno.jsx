import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Dumbbell, Calendar, Stethoscope, TrendingUp, Heart, ChevronRight, Settings, CalendarDays, Clock, AlertCircle, QrCode, MessageCircle, ClipboardList, UserCheck } from 'lucide-react';
import CarrosselParceiros from '../../components/fitpro/CarrosselParceiros';
import { useApp, useAuth } from '../../context/FitProContext';
import { getCredentials } from '../../lib/fitpro-storage';
import { calcularIdade } from '../../lib/fitpro-calculations';
import ModalEditarPerfil from '../../components/fitpro/ModalEditarPerfil';
import SolicitarVinculoModal from '../../components/fitpro/SolicitarVinculoModal';
import { ModalPixAluno } from '../../components/fitpro/PixProfessorConfig';
import PARQResponderModal from '../../components/fitpro/PARQResponderModal';
import { base44 } from '@/api/base44Client';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

export default function DashboardAluno({ onNav }) {
  const { alunos, professores, avaliacoes, planosTreino, periodizacoes, especialistas, produtos, transacoes } = useApp();
  const { user } = useAuth();
  const [showEditarPerfil, setShowEditarPerfil] = useState(false);
  const [showSolicitarVinculo, setShowSolicitarVinculo] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixTransacao, setPixTransacao] = useState(null);
  const [professorIdAluno, setProfessorIdAluno] = useState('');
  const [showPARQ, setShowPARQ] = useState(false);
  const [temPARQPendente, setTemPARQPendente] = useState(false);

  const [resolvedAlunoId, setResolvedAlunoId] = useState('');
  useEffect(() => {
    getCredentials().then(creds => {
      const myCred = creds.find(c => c.id === user?.id);
      const alunoId = myCred?.linkedId || '';
      if (alunoId) { setResolvedAlunoId(alunoId); return; }
      const byEmail = alunos.find(a => a.email?.toLowerCase() === user?.email?.toLowerCase());
      setResolvedAlunoId(byEmail?.id || '');
    });
  }, [user?.id, alunos]);

  // Descobre o professorId do aluno para buscar o PIX do professor
  useEffect(() => {
    if (!resolvedAlunoId) return;
    const aluno = alunos.find(a => a.id === resolvedAlunoId);
    if (aluno?.professorId) setProfessorIdAluno(aluno.professorId);
  }, [resolvedAlunoId, alunos]);

  // Verifica se há PAR-Q pendente para este aluno
  useEffect(() => {
    if (!resolvedAlunoId) return;
    base44.entities.PARQResposta.filter({ alunoId: resolvedAlunoId, status: 'pendente' })
      .then(list => setTemPARQPendente(list.length > 0));
  }, [resolvedAlunoId]);

  const aluno = alunos.find(a => a.id === resolvedAlunoId);
  const professor = professores?.find(p => p.id === aluno?.professorId);
  const minhasAvaliacoes = avaliacoes.filter(a => a.alunoId === resolvedAlunoId).sort((a, b) => new Date(b.data) - new Date(a.data));

  // Pendência financeira
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const minhasMensalidades = (transacoes || []).filter(t =>
    t.alunoId === resolvedAlunoId && t.tipo === 'Mensalidade' && t.categoria !== 'despesa'
  );
  const pendenciaVencida = minhasMensalidades.find(t => {
    if (t.status === 'pago') return false;
    const venc = t.vencimento ? new Date(t.vencimento) : new Date(t.data);
    venc.setHours(0, 0, 0, 0);
    return venc < hoje;
  });
  const pendenciaPendente = !pendenciaVencida && minhasMensalidades.find(t => {
    if (t.status !== 'pendente') return false;
    const venc = t.vencimento ? new Date(t.vencimento) : new Date(t.data);
    venc.setHours(0, 0, 0, 0);
    return venc <= hoje; // só mostra se vencimento é hoje ou já passou
  });
  const meusTreinos = planosTreino.filter(t => t.alunoId === resolvedAlunoId);
  const minhasPeriodizacoes = periodizacoes.filter(p => p.alunoId === resolvedAlunoId);
  const ultimaAvaliacao = minhasAvaliacoes[0];
  const parceiros = especialistas.filter(e => e.parceiro);

  const quickNav = [
    { label: 'Avaliações', icon: Activity, value: minhasAvaliacoes.length, color: '#fb923c', view: 'avaliacoes' },
    { label: 'Treinos', icon: Dumbbell, value: meusTreinos.length, color: '#f472b6', view: 'treinos' },
    { label: 'Evolução', icon: Calendar, value: minhasPeriodizacoes.length, color: '#fbbf24', view: 'evolucao' },
    { label: 'Saúde', icon: Stethoscope, value: parceiros.length, color: '#00AAFF', view: 'servicos' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #1a0533, #0d1525)', border: `1px solid ${BORDER}` }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
        </div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Bem-vindo 👋</p>
            <h2 className="text-2xl font-black text-white">{aluno?.nome?.split(' ')[0] || user?.nome?.split(' ')[0]}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <button onClick={() => setShowSolicitarVinculo(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(0,232,122,0.15)', color: '#00E87A', border: '1px solid rgba(0,232,122,0.3)' }}>
                <UserCheck size={13} />Solicitar Professor
              </button>
              {professor?.telefone && (
                <button onClick={() => {
                  const tel = professor.telefone.replace(/\D/g, '');
                  window.open(`https://wa.me/55${tel}`, '_blank');
                }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: 'rgba(37,211,102,0.15)', color: '#25d366', border: '1px solid rgba(37,211,102,0.3)' }}>
                  <MessageCircle size={13} />Falar com Professor
                </button>
              )}
              {temPARQPendente && (
                <button onClick={() => setShowPARQ(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all animate-pulse"
                  style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.4)' }}>
                  <ClipboardList size={13} />Responder PAR-Q
                </button>
              )}
            </div>
          </div>
          <button onClick={() => setShowEditarPerfil(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
            style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
            <Settings size={13} />Editar Perfil
          </button>
        </div>
        {aluno && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {aluno.objetivo && <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#a78bfa15', color: '#a78bfa', border: '1px solid #a78bfa25' }}>{aluno.objetivo}</span>}
            {aluno.dataNascimento && <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: `1px solid ${BORDER}` }}>{calcularIdade(aluno.dataNascimento)} anos</span>}
            {aluno.peso > 0 && <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: `1px solid ${BORDER}` }}>{aluno.peso}kg</span>}
          </div>
        )}
        {!resolvedAlunoId && (
          <div className="mt-3 p-2 rounded-xl text-xs" style={{ background: '#fbbf2410', border: '1px solid #fbbf2430', color: '#fbbf24' }}>
            ⚠️ Seu perfil ainda não está vinculado a um aluno. Solicite ao professor para vincular.
          </div>
        )}
      </div>

      {/* Sem professor vinculado */}
      {resolvedAlunoId && !aluno?.professorId && (
        <div className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ background: '#a78bfa12', border: '1px solid #a78bfa35' }}>
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <UserCheck size={18} color="#a78bfa" className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Vincule um professor</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Vincule um professor e aproveite ainda mais os benefícios do sistema.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSolicitarVinculo(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff' }}
          >
            <UserCheck size={13} />
            Escolher professor
          </button>
        </div>
      )}

      {/* Notificação de pendência financeira */}
      {(pendenciaVencida || pendenciaPendente) && (() => {
        const cobranca = pendenciaVencida || pendenciaPendente;
        const cor = pendenciaVencida ? '#ef4444' : '#fbbf24';
        return (
          <div className="p-4 rounded-2xl"
            style={{ background: `${cor}12`, border: `1px solid ${cor}40` }}>
            <div className="flex items-start gap-3">
              <AlertCircle size={18} style={{ color: cor, flexShrink: 0, marginTop: 1 }} />
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ color: cor }}>
                  {pendenciaVencida ? '⚠️ Mensalidade Vencida' : '💰 Cobrança Pendente'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {cobranca.descricao} — <span className="font-semibold text-white">R$ {parseFloat(cobranca.valor || 0).toFixed(2)}</span>
                  {cobranca.vencimento && ` • Venc. ${new Date(cobranca.vencimento).toLocaleDateString('pt-BR')}`}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setPixTransacao(cobranca); setShowPixModal(true); }}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: `${cor}20`, color: cor, border: `1px solid ${cor}40` }}>
              <QrCode size={15} />Pagar agora via PIX
            </button>
          </div>
        );
      })()}

      {/* Modal PIX do professor */}
      {showPixModal && pixTransacao && (
        <ModalPixAluno
          transacao={pixTransacao}
          professorId={professorIdAluno}
          onClose={() => { setShowPixModal(false); setPixTransacao(null); }}
        />
      )}

      {/* Quick Nav 2x2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickNav.map((item, i) => {
          const Icon = item.icon;
          return (
            <button key={i} onClick={() => onNav(item.view)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:scale-105 cursor-pointer text-center"
              style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}20` }}>
                <Icon size={18} style={{ color: item.color }} />
              </div>
              <div className="text-2xl font-bold text-white">{item.value}</div>
              <div className="text-xs text-slate-400">{item.label}</div>
            </button>
          );
        })}
      </div>

      {/* Próximas Aulas */}
      {(() => {
        const agenda = (() => { try { return JSON.parse(localStorage.getItem('fitpro_agenda') || '[]'); } catch { return []; } })();
        const hoje = new Date().toISOString().split('T')[0];
        const proximas = agenda
          .filter(ev => ev.alunoId === resolvedAlunoId && ev.data >= hoje && ev.status !== 'cancelado')
          .sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`))
          .slice(0, 3);

        if (proximas.length === 0) return null;

        const TIPO_COLOR = {
          'Avaliação': '#fb923c', 'Treino Personalizado': '#f472b6', 'Consultoria': '#60a5fa',
          'Corrida': '#34d399', 'Reposição': '#fbbf24', 'Online': '#a78bfa', 'Outro': '#64748b',
        };

        return (
          <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2"><CalendarDays size={16} color="#a78bfa" />Próximas Aulas</h3>
            </div>
            <div className="space-y-2">
              {proximas.map(ev => {
                const cor = TIPO_COLOR[ev.tipo] || '#a78bfa';
                const dataFormatada = new Date(ev.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
                return (
                  <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: `${cor}08`, border: `1px solid ${cor}20` }}>
                    <div className="flex-shrink-0 text-center">
                      <div className="text-sm font-bold text-white">{ev.hora}</div>
                      <div className="text-xs text-slate-500">{ev.duracao}min</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{ev.titulo}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Clock size={10} />
                        <span>{dataFormatada}</span>
                        <span className="px-1.5 py-0.5 rounded-full" style={{ background: `${cor}15`, color: cor }}>{ev.tipo}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Última Avaliação */}
        <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white">Última Avaliação</h3>
            <button onClick={() => onNav('avaliacoes')} className="text-xs text-slate-500">Ver tudo →</button>
          </div>
          {!ultimaAvaliacao ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">Nenhuma avaliação realizada</p>
              <p className="text-xs text-slate-600 mt-1">Solicite ao seu professor</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-4">{new Date(ultimaAvaliacao.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '% Gordura', value: ultimaAvaliacao.percentualGordura != null ? `${ultimaAvaliacao.percentualGordura?.toFixed(1)}%` : null, color: '#fb923c' },
                  { label: 'Massa Magra', value: ultimaAvaliacao.massaMagra != null ? `${ultimaAvaliacao.massaMagra?.toFixed(1)}kg` : null, color: '#00E87A' },
                  { label: 'IMC', value: ultimaAvaliacao.imc != null ? ultimaAvaliacao.imc?.toFixed(1) : null, color: '#00AAFF' },
                  { label: 'Classificação', value: ultimaAvaliacao.classificacaoGordura || null, color: '#a78bfa' },
                ].filter(it => it.value).map((item, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                    <div className="text-base font-bold" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Serviços & Parceiros — ao lado da Última Avaliação */}
        {(parceiros.length > 0 || produtos.length > 0) && (
          <CarrosselParceiros
            parceiros={parceiros}
            produtos={produtos}
            onNavServicos={() => onNav('servicos')}
            onNavLoja={() => onNav('loja')}
          />
        )}
      </div>

      {/* Minha Evolução */}
      {minhasAvaliacoes.length > 1 && (
        <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} color="#00E87A" />Minha Evolução</h3>
          <div className="space-y-3">
            {minhasAvaliacoes.slice(0, 3).map((av, i) => (
              <div key={av.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: '#a78bfa20', color: '#a78bfa' }}>#{minhasAvaliacoes.length - i}</div>
                <div className="text-xs text-slate-400">{new Date(av.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
                <div className="flex gap-2 ml-auto">
                  {av.percentualGordura != null && <span className="text-xs font-bold" style={{ color: '#fb923c' }}>{av.percentualGordura?.toFixed(1)}%</span>}
                  {av.massaMagra != null && <span className="text-xs font-bold" style={{ color: '#00E87A' }}>{av.massaMagra?.toFixed(1)}kg</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meus Treinos */}
      {meusTreinos.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2"><Dumbbell size={16} color="#f472b6" />Meus Treinos</h3>
            <button onClick={() => onNav('treinos')} className="text-xs text-slate-500">Ver tudo →</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {meusTreinos.slice(0, 2).map((treino, i) => (
              <div key={treino.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-90"
                style={{ background: '#f472b608', border: '1px solid #f472b620' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: '#f472b620', color: '#f472b6' }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{treino.nome}</div>
                  <div className="text-xs text-slate-500">{treino.sessoes?.length || 0} sessões • {treino.nivel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showEditarPerfil && (
        <ModalEditarPerfil user={user} tipoUsuario="aluno" onClose={() => setShowEditarPerfil(false)} />
      )}
      {showSolicitarVinculo && (
        <SolicitarVinculoModal onClose={() => setShowSolicitarVinculo(false)} />
      )}
      {showPARQ && (
        <PARQResponderModal onClose={() => { setShowPARQ(false); setTemPARQPendente(false); }} />
      )}
    </div>
  );
}
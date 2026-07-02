import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, MessageCircle, MessageSquare, ChevronDown, ChevronUp, Maximize2, ClipboardList, Edit2, UserCheck, UserX } from 'lucide-react';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';
const COLORS = ['#a78bfa','#fb923c','#34d399','#60a5fa','#f472b6'];

export default function AlunoListItem({
  aluno, i, avaliacoes, planosTreino, feedbacksNaoLidos,
  onVerPerfil, onVerFeedback, onEnviarPARQ, onEdit, onDelete,
  ativoEfetivo, podeToggleStatus, onToggleStatus,
}) {
  const [expanded, setExpanded] = useState(false);
  const color = COLORS[i % COLORS.length];
  const avsAluno = avaliacoes.filter(a => a.alunoId === aluno.id);
  const treinosAluno = planosTreino.filter(t => t.alunoId === aluno.id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: CARD, border: `1px solid ${expanded ? color + '40' : BORDER}` }}>

      {/* Linha resumo */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-white/5 transition-all"
        onClick={() => setExpanded(e => !e)}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
          style={{ background: color + '25' }}>
          {aluno.nome.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-white text-sm truncate">{aluno.nome}</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
              style={{
                background: ativoEfetivo ? '#34d39918' : '#64748b18',
                color: ativoEfetivo ? '#34d399' : '#94a3b8',
                border: `1px solid ${ativoEfetivo ? '#34d39935' : '#64748b35'}`,
              }}>
              {ativoEfetivo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <div className="text-xs text-slate-500 truncate">{aluno.objetivo || '—'} • {aluno.peso}kg • {aluno.altura}cm</div>
        </div>
        <button onClick={e => { e.stopPropagation(); onVerPerfil(aluno); }}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-all flex-shrink-0"
          title="Ver perfil completo" style={{ color }}>
          <Maximize2 size={14} />
        </button>
        <div className="text-slate-600 flex-shrink-0">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </div>

      {/* Detalhes expandidos */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ borderTop: `1px solid ${color}20` }}>
            <div className="px-4 py-3 space-y-3">
              {/* Stats */}
              <div className="flex gap-3">
                {[
                  { label: 'Avaliações', value: avsAluno.length, color: '#fb923c' },
                  { label: 'Treinos', value: treinosAluno.length, color: '#f472b6' },
                ].map((s, j) => (
                  <div key={j} className="flex-1 p-2 rounded-xl text-center" style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                    <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Ações */}
              <div className="flex items-center gap-2 flex-wrap">
                {onToggleStatus && (
                  <button
                    onClick={e => { e.stopPropagation(); if (podeToggleStatus) onToggleStatus(aluno); }}
                    disabled={!podeToggleStatus}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: ativoEfetivo ? '#34d39915' : '#64748b15',
                      color: ativoEfetivo ? '#34d399' : '#94a3b8',
                      border: `1px solid ${ativoEfetivo ? '#34d39930' : '#64748b30'}`,
                    }}
                    title={podeToggleStatus ? (ativoEfetivo ? 'Desativar aluno' : 'Ativar aluno') : 'No plano gratuito apenas os 5 primeiros cadastrados ficam ativos'}
                  >
                    {ativoEfetivo ? <UserCheck size={13} /> : <UserX size={13} />}
                    {ativoEfetivo ? 'Desativar' : 'Ativar'}
                  </button>
                )}
                <button onClick={e => { e.stopPropagation(); onVerFeedback(aluno); }}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: feedbacksNaoLidos[aluno.id] ? '#60a5fa20' : 'rgba(255,255,255,0.05)', color: feedbacksNaoLidos[aluno.id] ? '#60a5fa' : '#94a3b8', border: `1px solid ${feedbacksNaoLidos[aluno.id] ? '#60a5fa40' : 'rgba(255,255,255,0.08)'}` }}>
                  <MessageSquare size={13} />Ver Feedback
                  {feedbacksNaoLidos[aluno.id] > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                      style={{ background: '#ef4444', fontSize: 9 }}>
                      {feedbacksNaoLidos[aluno.id]}
                    </span>
                  )}
                </button>
                {aluno.telefone && (
                  <button onClick={e => {
                    e.stopPropagation();
                    const tel = aluno.telefone.replace(/\D/g, '');
                    window.open(`https://wa.me/55${tel}`, '_blank');
                  }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:bg-green-500/10"
                    style={{ color: '#25d366', background: '#25d36610', border: '1px solid #25d36625' }}>
                    <MessageCircle size={13} />WhatsApp
                  </button>
                )}
                <button onClick={e => { e.stopPropagation(); onEnviarPARQ(aluno); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:bg-purple-500/10"
                  style={{ color: '#a78bfa', background: '#a78bfa10', border: '1px solid #a78bfa25' }}
                  title="Enviar/Ver PAR-Q">
                  <ClipboardList size={13} />PAR-Q
                </button>
                {onEdit && (
                  <button onClick={e => { e.stopPropagation(); onEdit(aluno); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:bg-violet-500/10 ml-auto"
                    style={{ color: '#a78bfa', background: '#a78bfa10', border: '1px solid #a78bfa25' }}>
                    <Edit2 size={13} />Editar
                  </button>
                )}
                <button onClick={e => { e.stopPropagation(); onDelete(aluno.id); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:bg-red-500/10 ${onEdit ? '' : 'ml-auto'}`}
                  style={{ color: '#ef4444', background: '#ef444410', border: '1px solid #ef444425' }}>
                  <Trash2 size={13} />Excluir
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
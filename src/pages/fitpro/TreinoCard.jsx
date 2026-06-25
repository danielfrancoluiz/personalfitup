import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Edit2, Copy, Trash2, FolderInput, MessageSquarePlus, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { gerarPDFTreino } from '../../lib/fitpro-pdf';
import { generateId } from '../../lib/fitpro-storage';
import SalvarEmPastaModal from '../../components/fitpro/SalvarEmPastaModal';
import FeedbackTreinoModal from '../../components/fitpro/FeedbackTreinoModal';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';
const COLORS = ['#f472b6', '#a78bfa', '#34d399', '#60a5fa', '#fb923c', '#fbbf24'];

export default function TreinoCard({ treino, i, alunos, user, setSelectedTreino, onEdit, addPlanoTreino, deletePlanoTreino }) {
  const aluno = alunos.find(a => a.id === treino.alunoId);
  const totalExs = treino.sessoes?.reduce((a, s) => a + s.exercicios.length, 0) || 0;
  const color = COLORS[i % COLORS.length];
  const [showSalvarPasta, setShowSalvarPasta] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: CARD, border: `1px solid ${expanded ? color + '40' : BORDER}` }}>

      {/* Linha resumo — sempre visível */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-white/5 transition-all"
        onClick={() => setExpanded(e => !e)}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{ background: `${color}20`, color }}>
          {String.fromCharCode(65 + i)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{treino.nome}</p>
          <p className="text-xs text-slate-500 truncate">{aluno?.nome} • {treino.nivel} • {treino.sessoes?.length || 0} sessões</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setSelectedTreino(treino); }}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-all flex-shrink-0"
          title="Ver planilha completa"
          style={{ color }}>
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
              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>{treino.sessoes?.length || 0} sessões</span>
                <span className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{treino.duracaoSemanas} sem</span>
                <span className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{totalExs} exerc</span>
                {treino.dataInicio && <span className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>▶ {new Date(treino.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>}
                {treino.dataFim && <span className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>⏹ {new Date(treino.dataFim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>}
              </div>

              {/* Ações */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setSelectedTreino(treino)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
                  Ver Planilha
                </button>
                <button onClick={() => gerarPDFTreino(treino, aluno)}
                  className="px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-all" title="Baixar PDF" style={{ color: '#34d399' }}>
                  <Download size={14} />
                </button>
                {user?.role !== 'admin' && user?.role !== 'aluno' && (
                  <>
                    <button onClick={() => setShowSalvarPasta(true)}
                      className="px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-all" title="Salvar em Treinos Personalizados" style={{ color: '#a78bfa' }}>
                      <FolderInput size={14} />
                    </button>
                    <button onClick={() => onEdit(treino)}
                      className="px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-all" style={{ color: '#fbbf24' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => {
                      const clone = { ...treino, id: undefined, nome: `${treino.nome} (cópia)`, sessoes: (treino.sessoes || []).map(s => ({ ...s, id: generateId(), exercicios: (s.exercicios || []).map(ex => ({ ...ex, id: generateId() })) })) };
                      addPlanoTreino(clone);
                    }} className="px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-all" title="Clonar" style={{ color: '#60a5fa' }}>
                      <Copy size={14} />
                    </button>
                    <button onClick={() => { if (confirm('Excluir este treino?')) deletePlanoTreino(treino.id); }}
                      className="px-3 py-2 rounded-xl text-xs hover:bg-red-500/10 transition-all" style={{ color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>

              {/* Feedback — só para aluno */}
              {user?.role === 'aluno' && (
                <button onClick={() => setShowFeedback(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: '#60a5fa12', color: '#60a5fa', border: '1px solid #60a5fa25' }}>
                  <MessageSquarePlus size={13} />Feedback do Treino
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showSalvarPasta && <SalvarEmPastaModal treino={treino} onClose={() => setShowSalvarPasta(false)} />}
      {showFeedback && <FeedbackTreinoModal treino={treino} aluno={alunos?.find(a => a.id === treino.alunoId)} onClose={() => setShowFeedback(false)} />}
    </motion.div>
  );
}
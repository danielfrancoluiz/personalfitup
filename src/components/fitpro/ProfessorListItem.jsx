import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, MessageCircle, ChevronDown, ChevronUp, Maximize2, Edit2, CreditCard } from 'lucide-react';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';
const COLORS = ['#34d399', '#60a5fa', '#a78bfa', '#fb923c', '#f472b6'];

const STATUS_LABEL = {
  ativo: 'Ativo',
  pendente: 'Pendente',
  suspenso: 'Suspenso',
  cancelado: 'Cancelado',
};

const STATUS_STYLE = {
  ativo: { bg: '#34d39918', color: '#34d399', border: '#34d39935' },
  pendente: { bg: '#fbbf2418', color: '#fbbf24', border: '#fbbf2435' },
  suspenso: { bg: '#ef444418', color: '#ef4444', border: '#ef444435' },
  cancelado: { bg: '#64748b18', color: '#94a3b8', border: '#64748b35' },
};

export default function ProfessorListItem({
  professor,
  i,
  alunosCount,
  avaliacoesCount,
  treinosCount,
  plano,
  planoColor,
  precoLabel,
  onVerPerfil,
  onEdit,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(false);
  const color = COLORS[i % COLORS.length];
  const status = professor.statusPlano || 'ativo';
  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.ativo;

  const sublinha = [
    professor.especialidade || '—',
    `${alunosCount} aluno${alunosCount !== 1 ? 's' : ''}`,
    plano?.nome || professor.planoAssinatura || '—',
  ].join(' • ');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: CARD, border: `1px solid ${expanded ? color + '40' : BORDER}` }}>

      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-white/5 transition-all"
        onClick={() => setExpanded(e => !e)}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
          style={{ background: color + '25' }}>
          {professor.nome.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-white text-sm truncate">{professor.nome}</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
              style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
              {STATUS_LABEL[status] || status}
            </span>
          </div>
          <div className="text-xs text-slate-500 truncate">{sublinha}</div>
        </div>
        <button onClick={e => { e.stopPropagation(); onVerPerfil(professor); }}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-all flex-shrink-0"
          title="Ver perfil completo" style={{ color }}>
          <Maximize2 size={14} />
        </button>
        <div className="text-slate-600 flex-shrink-0">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ borderTop: `1px solid ${color}20` }}>
            <div className="px-4 py-3 space-y-3">
              <div className="flex gap-3">
                {[
                  { label: 'Alunos', value: alunosCount, color: '#a78bfa' },
                  { label: 'Avaliações', value: avaliacoesCount, color: '#fb923c' },
                  { label: 'Treinos', value: treinosCount, color: '#f472b6' },
                ].map((s) => (
                  <div key={s.label} className="flex-1 p-2 rounded-xl text-center"
                    style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                    <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl"
                style={{ background: `${planoColor}08`, border: `1px solid ${planoColor}20` }}>
                <div className="flex items-center gap-2 min-w-0">
                  <CreditCard size={13} color={planoColor} />
                  <span className="text-xs font-semibold truncate" style={{ color: planoColor }}>{plano?.nome || 'Plano'}</span>
                </div>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: planoColor }}>{precoLabel}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {professor.telefone && (
                  <button onClick={e => {
                    e.stopPropagation();
                    const tel = professor.telefone.replace(/\D/g, '');
                    window.open(`https://wa.me/55${tel}`, '_blank');
                  }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:bg-green-500/10"
                    style={{ color: '#25d366', background: '#25d36610', border: '1px solid #25d36625' }}>
                    <MessageCircle size={13} />WhatsApp
                  </button>
                )}
                <button onClick={e => { e.stopPropagation(); onEdit(professor); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:bg-emerald-500/10 ml-auto"
                  style={{ color: '#34d399', background: '#34d39910', border: '1px solid #34d39925' }}>
                  <Edit2 size={13} />Editar
                </button>
                <button onClick={e => { e.stopPropagation(); onDelete(professor.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:bg-red-500/10"
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

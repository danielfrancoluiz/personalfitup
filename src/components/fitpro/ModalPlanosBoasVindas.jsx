import React, { useState } from 'react';
import { X, Check, Zap, Star, Crown, Building2 } from 'lucide-react';

const PLANOS_DEFAULT = [
  { id: 'basico', nome: 'Básico', preco: 0, desc: 'Até 5 alunos — Gratuito', icon: Zap, color: '#60a5fa', recursos: ['Até 5 alunos', 'Treinos básicos', 'Avaliações físicas', 'Acesso ao app'] },
  { id: 'profissional', nome: 'Profissional', preco: 99.90, desc: 'Até 50 alunos, todos os recursos', icon: Star, color: '#34d399', recursos: ['Até 50 alunos', 'Todos os treinos', 'Periodização', 'Agenda', 'Financeiro básico'] },
  { id: 'premium', nome: 'Premium', preco: 179.90, desc: 'Alunos ilimitados e relatórios avançados', icon: Crown, color: '#fbbf24', recursos: ['Alunos ilimitados', 'Relatórios avançados', 'Financeiro completo', 'Biblioteca exclusiva', 'Suporte prioritário'] },
  { id: 'enterprise', nome: 'Enterprise', preco: 299.90, desc: 'Multi-professor, API e suporte dedicado', icon: Building2, color: '#a78bfa', recursos: ['Multi-professor', 'API de integração', 'White-label', 'Suporte dedicado', 'Treinamento incluído'] },
];

function loadPlanos() {
  try {
    const saved = JSON.parse(localStorage.getItem('fitpro_planos'));
    if (!saved || !Array.isArray(saved) || saved.length < 4) return PLANOS_DEFAULT;
    return PLANOS_DEFAULT.map(def => {
      const s = saved.find(p => p.id === def.id);
      return s ? { ...def, ...s } : def;
    });
  } catch { return PLANOS_DEFAULT; }
}

export default function ModalPlanosBoasVindas({ nomeProf, onClose }) {
  const planos = loadPlanos();
  const [selecionado, setSelecionado] = useState('profissional');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0d1a2e, #0d1525)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} color="#00d4ff" />
                <span className="text-xs font-semibold" style={{ color: '#00d4ff' }}>FitPro Platform</span>
              </div>
              <h2 className="text-xl font-black text-white">Bem-vindo, {nomeProf?.split(' ')[0]}! 🎉</h2>
              <p className="text-sm text-slate-400 mt-1">Escolha o plano ideal para sua jornada como personal trainer</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 flex-shrink-0 mt-1">
              <X size={16} color="#6b7280" />
            </button>
          </div>
        </div>

        {/* Planos */}
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {planos.map(plano => {
            const Icon = plano.icon;
            const selected = selecionado === plano.id;
            return (
              <button key={plano.id} onClick={() => setSelecionado(plano.id)}
                className="w-full text-left rounded-2xl p-4 transition-all"
                style={{
                  background: selected ? `${plano.color}12` : 'rgba(255,255,255,0.03)',
                  border: selected ? `1.5px solid ${plano.color}50` : '1.5px solid rgba(255,255,255,0.07)',
                  transform: selected ? 'scale(1.01)' : 'scale(1)',
                }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${plano.color}20` }}>
                    <Icon size={18} style={{ color: plano.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-white">{plano.nome}</span>
                      <span className="font-black text-base" style={{ color: plano.preco === 0 ? '#34d399' : plano.color }}>
                        {plano.preco === 0 ? 'Grátis' : `R$ ${plano.preco.toFixed(2)}`}
                        {plano.preco > 0 && <span className="text-xs font-normal text-slate-500">/mês</span>}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{plano.desc}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {plano.recursos.map(r => (
                        <span key={r} className="flex items-center gap-1 text-xs" style={{ color: selected ? plano.color : '#64748b' }}>
                          <Check size={10} />
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selected && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: plano.color }}>
                      <Check size={11} color="#fff" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex-shrink-0 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
          <button onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${planos.find(p => p.id === selecionado)?.color || '#34d399'}, ${planos.find(p => p.id === selecionado)?.color || '#34d399'}cc)` }}>
            Começar com o plano {planos.find(p => p.id === selecionado)?.nome}
          </button>
          <p className="text-center text-xs text-slate-600">Você pode alterar seu plano a qualquer momento no painel</p>
        </div>
      </div>
    </div>
  );
}
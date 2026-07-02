import React, { useEffect, useState } from 'react';
import { Pencil, Check, X, Zap } from 'lucide-react';
import { savePlanos, loadPlanosAsync, savePlanosAsync, PLANO_COLOR, PLANOS_DEFAULT } from '../../lib/planos-professor';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

export default function ConfigPlanosGlobais() {
  const [planos, setPlanos] = useState(PLANOS_DEFAULT);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlanosAsync(true).then((p) => {
      setPlanos(p);
      setLoading(false);
    });
  }, []);

  const salvarPlano = async (planoId) => {
    setSaveError('');
    const newData = {
      ...editData,
      preco: planoId === 'basico' ? 0 : (parseFloat(editData.preco) || 0),
    };
    const updated = planos.map(p => (p.id === planoId ? { ...p, ...newData } : p));
    setPlanos(updated);
    savePlanos(updated);
    const result = await savePlanosAsync(updated);
    if (!result.ok) {
      setSaveError(result.error || 'Não foi possível salvar no servidor.');
      return;
    }
    setEditingId(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return <p className="text-sm text-slate-500 text-center py-8">Carregando planos...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl" style={{ background: '#00d4ff08', border: '1px solid #00d4ff25' }}>
        <p className="text-sm text-slate-300">
          <strong className="text-white">Valores globais.</strong> Alterações aqui valem para{' '}
          <strong className="text-white">todos os professores</strong>. A próxima cobrança de cada professor
          usará o preço vigente no momento da fatura. Cada professor mantém sua própria data de adesão e vencimento.
        </p>
      </div>

      {saved && (
        <div className="text-center text-sm font-semibold text-emerald-400">✓ Planos atualizados para toda a plataforma</div>
      )}

      {saveError && (
        <div className="text-center text-sm font-semibold text-amber-400">{saveError}</div>
      )}

      <div className="space-y-2">
        {planos.map(plano => {
          const color = PLANO_COLOR[plano.id] || '#60a5fa';
          const isEditing = editingId === plano.id;
          const Icon = plano.icon || Zap;
          return (
            <div key={plano.id} className="rounded-2xl overflow-hidden"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              {isEditing ? (
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <input value={editData.nome} onChange={e => setEditData(d => ({ ...d, nome: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none font-bold"
                      style={{ background: '#1e2a3a', border: `1px solid ${color}40` }} placeholder="Nome" />
                    <div className="relative flex items-center">
                      <span className="absolute left-2 text-xs text-slate-400">R$</span>
                      <input type="number" step="0.01" min="0" disabled={plano.id === 'basico'}
                        value={editData.preco} onChange={e => setEditData(d => ({ ...d, preco: parseFloat(e.target.value) || 0 }))}
                        className="w-28 pl-7 pr-2 py-2 rounded-xl text-sm text-white outline-none font-bold disabled:opacity-50"
                        style={{ background: '#1e2a3a', border: `1px solid ${color}40` }} />
                    </div>
                  </div>
                  <input value={editData.desc} onChange={e => setEditData(d => ({ ...d, desc: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs text-slate-300 outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="Descrição" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white flex items-center gap-1"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <X size={12} />Cancelar
                    </button>
                    <button onClick={() => salvarPlano(plano.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: `${color}20`, color }}>
                      <Check size={12} />Salvar para todos
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}20` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">{plano.nome}</span>
                      <span className="font-bold text-sm" style={{ color: plano.preco === 0 ? '#34d399' : color }}>
                        {plano.preco === 0 ? 'Grátis' : `R$ ${Number(plano.preco).toFixed(2)}/mês`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{plano.desc}</p>
                  </div>
                  {plano.id !== 'basico' && (
                    <button type="button"
                      onClick={() => { setEditingId(plano.id); setEditData({ nome: plano.nome, preco: plano.preco, desc: plano.desc }); }}
                      className="p-2 rounded-lg hover:bg-white/10 flex-shrink-0" style={{ color: '#64748b' }}
                      title="Editar valor global">
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

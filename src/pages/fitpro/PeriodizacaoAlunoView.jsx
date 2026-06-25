import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight, Moon, Download } from 'lucide-react';
import { gerarPDFPeriodizacao } from '../../lib/fitpro-pdf';
import { useApp, useAuth } from '../../context/FitProContext';
import { getCredentials } from '../../lib/fitpro-storage';
import PeriodizacaoChart from '../../components/fitpro/PeriodizacaoChart';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

const CORES_FASE = {
  'Adaptação': '#60a5fa', 'Hipertrofia': '#f472b6', 'Força': '#fb923c',
  'Potência': '#fbbf24', 'Pico': '#ef4444', 'Recuperação': '#34d399', 'Manutenção': '#a78bfa',
};

export default function PeriodizacaoAlunoView() {
  const { periodizacoes, alunos, planosTreino } = useApp();
  const { user } = useAuth();

  const [alunoId, setAlunoId] = useState('');
  const [selectedPer, setSelectedPer] = useState(null);

  useEffect(() => {
    getCredentials().then(creds => {
      const myCred = creds.find(c => c.id === user?.id);
      const linkedId = myCred?.linkedId || '';
      if (linkedId) { setAlunoId(linkedId); return; }
      const byEmail = alunos.find(a => a.email?.toLowerCase() === user?.email?.toLowerCase());
      setAlunoId(byEmail?.id || '');
    });
  }, [user?.id, alunos]);

  const minhasPeriodizacoes = periodizacoes.filter(p => p.alunoId === alunoId);

  // ── Detalhe de uma periodização ──────────────────────────────────────────
  if (selectedPer) {
    const per = periodizacoes.find(p => p.id === selectedPer.id) || selectedPer;

    let semanaAtual = 1;
    const timeline = (per.fases || []).map(fase => {
      const start = semanaAtual;
      semanaAtual += parseInt(fase.duracaoSemanas) || 1;
      return { ...fase, startWeek: start, endWeek: semanaAtual - 1 };
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedPer(null)} className="p-2 rounded-xl hover:bg-white/5">
            <ChevronRight size={18} color="#9ca3af" className="rotate-180" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{per.nome}</h2>
            <p className="text-xs text-slate-500">{per.tipo} • {per.duracaoTotal} semanas</p>
          </div>
          <button onClick={() => { const a = alunos.find(x => x.id === per.alunoId); gerarPDFPeriodizacao(per, a, planosTreino); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0"
            style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
            <Download size={13} />PDF
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Tipo', value: per.tipo, color: '#60a5fa' },
            { label: 'Duração', value: `${per.duracaoTotal} semanas`, color: '#fbbf24' },
            { label: 'Fases', value: per.fases?.length || 0, color: '#a78bfa' },
            { label: 'Início', value: per.dataInicio ? new Date(per.dataInicio).toLocaleDateString('pt-BR') : '—', color: '#34d399' },
          ].map((k, i) => (
            <div key={i} className="p-3 rounded-xl text-center" style={{ background: `${k.color}10`, border: `1px solid ${k.color}25` }}>
              <div className="text-sm font-bold" style={{ color: k.color }}>{k.value}</div>
              <div className="text-xs text-slate-500">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Gráfico */}
        {timeline.length > 0 && (
          <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <PeriodizacaoChart periodizacao={per} planosTreino={planosTreino} />
          </div>
        )}

        {/* Detalhes por fase */}
        {timeline.length > 0 && (
          <div className="p-5 rounded-2xl space-y-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h3 className="font-semibold text-white text-sm">Detalhes por Fase</h3>
            {timeline.map(fase => {
              const cor = CORES_FASE[fase.nome] || '#64748b';
              const treino = planosTreino.find(t => t.id === fase.treinoId);
              return (
                <div key={fase.id} className="p-3 rounded-xl" style={{ background: `${cor}08`, border: `1px solid ${cor}20` }}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cor }} />
                    <span className="text-sm font-semibold text-white">{fase.nome}</span>
                    <span className="text-xs text-slate-500">S{fase.startWeek}–S{fase.endWeek} ({fase.duracaoSemanas} sem)</span>
                    {fase.tpmAjuste && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: '#f472b615', color: '#f472b6', border: '1px solid #f472b625' }}>
                        <Moon size={10} />TPM
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap text-xs mt-1">
                    <span style={{ color: cor }}>Intensidade: {fase.intensidade}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">Volume: {fase.volume}</span>
                    {treino && <><span className="text-slate-500">•</span><span className="text-slate-400">Treino: {treino.nome}</span></>}
                  </div>
                  {fase.objetivo && <p className="text-xs text-slate-500 mt-1">🎯 {fase.objetivo}</p>}
                  {fase.observacoes && <p className="text-xs text-slate-600 mt-0.5">📝 {fase.observacoes}</p>}
                </div>
              );
            })}
          </div>
        )}

        {per.observacoes && (
          <div className="p-4 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Observações do Professor</h4>
            <p className="text-sm text-slate-300">{per.observacoes}</p>
          </div>
        )}
      </div>
    );
  }

  // ── Lista de periodizações ────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar size={20} color="#fbbf24" />Minha Periodização
        </h2>
        <p className="text-xs text-slate-500">{minhasPeriodizacoes.length} periodização(ões) disponível(is)</p>
      </div>

      {!alunoId && (
        <div className="p-4 rounded-xl text-sm" style={{ background: '#fbbf2410', border: '1px solid #fbbf2430', color: '#fbbf24' }}>
          ⚠️ Seu perfil não está vinculado a um aluno. Solicite ao professor para vincular.
        </div>
      )}

      {minhasPeriodizacoes.length === 0 && alunoId ? (
        <div className="text-center py-16 text-slate-500" style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}` }}>
          <Calendar size={48} className="mx-auto mb-3 opacity-20 text-slate-500" />
          <p className="font-semibold text-white">Nenhuma periodização disponível</p>
          <p className="text-xs mt-1">Seu professor ainda não criou uma periodização para você.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {minhasPeriodizacoes.map((per, i) => {
            const colors = ['#fbbf24', '#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fb923c'];
            const color = colors[i % 6];
            return (
              <div key={per.id} className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white">{per.nome}</h3>
                    <p className="text-xs text-slate-500">{per.tipo}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${color}15`, color }}>
                    {per.duracaoTotal} sem
                  </span>
                </div>

                {/* Mini timeline */}
                {(per.fases || []).length > 0 && (
                  <div className="flex gap-1 mb-3 overflow-hidden rounded-lg h-5">
                    {(per.fases || []).map(fase => {
                      const cor = CORES_FASE[fase.nome] || '#64748b';
                      const pct = ((parseInt(fase.duracaoSemanas) || 1) / per.duracaoTotal) * 100;
                      return (
                        <div key={fase.id} className="h-full rounded-sm" title={`${fase.nome} (${fase.duracaoSemanas}sem)`}
                          style={{ width: `${pct}%`, minWidth: 6, background: cor }} />
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap mb-4">
                  <span className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {per.fases?.length || 0} fases
                  </span>
                  {per.dataInicio && (
                    <span className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      Início: {new Date(per.dataInicio).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {per.objetivo && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}10`, color }}>
                      {per.objetivo}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setSelectedPer(per)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
                    Ver Timeline Completa
                  </button>
                  <button onClick={() => { const a = alunos.find(x => x.id === per.alunoId); gerarPDFPeriodizacao(per, a, planosTreino); }}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: '#34d39915', color: '#34d399', border: '1px solid #34d39925' }}
                    title="Baixar PDF">
                    <Download size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
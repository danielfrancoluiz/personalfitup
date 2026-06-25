import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Moon } from 'lucide-react';

const CORES_FASE = {
  'Adaptação': '#60a5fa', 'Hipertrofia': '#f472b6', 'Força': '#fb923c',
  'Potência': '#fbbf24', 'Pico': '#ef4444', 'Recuperação': '#34d399', 'Manutenção': '#a78bfa',
};

const INTENSIDADE_VALOR = { 'Baixa': 25, 'Moderada': 50, 'Alta': 75, 'Máxima': 100 };
const VOLUME_VALOR = { 'Baixo': 25, 'Moderado': 50, 'Alto': 75, 'Muito Alto': 100 };

// Tooltip customizado
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const cor = CORES_FASE[d.fase] || '#64748b';
  return (
    <div className="rounded-xl p-3 text-xs shadow-xl" style={{ background: '#0d1525', border: `1px solid ${cor}50`, minWidth: 160 }}>
      <div className="font-bold mb-1" style={{ color: cor }}>Semana {label}</div>
      <div className="text-white font-semibold mb-1">{d.fase}</div>
      <div className="text-slate-400">Intensidade: <span style={{ color: cor }}>{d.intensidadeLabel}</span></div>
      <div className="text-slate-400">Volume: <span className="text-white">{d.volumeLabel}</span></div>
      {d.tpmAjuste && (
        <div className="flex items-center gap-1 mt-1.5 px-2 py-1 rounded-lg" style={{ background: '#f472b615', color: '#f472b6' }}>
          <Moon size={10} />TPM — Ajuste automático
        </div>
      )}
    </div>
  );
}

export default function PeriodizacaoChart({ periodizacao, planosTreino }) {
  const [view, setView] = useState('intensidade'); // 'intensidade' | 'volume' | 'fases'

  const { fases = [], duracaoTotal = 0, dataInicio } = periodizacao;

  // Gera dados por semana
  const dadosSemana = [];
  let semanaAtual = 1;
  for (const fase of fases) {
    const dur = parseInt(fase.duracaoSemanas) || 1;
    for (let s = 0; s < dur; s++) {
      const semana = semanaAtual + s;
      dadosSemana.push({
        semana,
        label: `S${semana}`,
        fase: fase.nome,
        intensidade: INTENSIDADE_VALOR[fase.intensidade] || 50,
        intensidadeLabel: fase.intensidade,
        volume: VOLUME_VALOR[fase.volume] || 50,
        volumeLabel: fase.volume,
        tpmAjuste: !!fase.tpmAjuste,
        cor: CORES_FASE[fase.nome] || '#64748b',
      });
    }
    semanaAtual += dur;
  }

  // Datas por semana
  const getDataSemana = (semana) => {
    if (!dataInicio) return null;
    const d = new Date(dataInicio);
    d.setDate(d.getDate() + (semana - 1) * 7);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  // Legenda de fases
  const fasesUnicas = [...new Set(fases.map(f => f.nome))];

  if (dadosSemana.length === 0) return null;

  const dataKey = view === 'volume' ? 'volume' : 'intensidade';

  return (
    <div className="space-y-4">
      {/* Controles de view */}
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <h3 className="font-semibold text-white text-sm">Gráfico por Semana</h3>
        <div className="flex gap-1">
          {[
            { id: 'intensidade', label: 'Intensidade' },
            { id: 'volume', label: 'Volume' },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: view === v.id ? '#fbbf2420' : 'rgba(255,255,255,0.04)',
                color: view === v.id ? '#fbbf24' : '#64748b',
                border: view === v.id ? '1px solid #fbbf2430' : '1px solid rgba(255,255,255,0.06)',
              }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico de barras por semana */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <div style={{ minWidth: Math.max(dadosSemana.length * 36, 300), height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosSemana} barSize={Math.min(28, Math.max(10, 300 / dadosSemana.length))}
              margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} interval={dadosSemana.length > 20 ? 3 : 0} />
              <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                {dadosSemana.map((entry, i) => (
                  <Cell key={i}
                    fill={entry.tpmAjuste ? '#f472b6' : entry.cor}
                    opacity={entry.tpmAjuste ? 0.7 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Barra de fases visual contínua */}
      <div>
        <div className="text-xs text-slate-500 mb-1">Linha do Tempo de Fases</div>
        <div className="flex gap-0.5 rounded-xl overflow-hidden h-8">
          {dadosSemana.map((d, i) => (
            <div key={i} title={`S${d.semana} — ${d.fase}${d.tpmAjuste ? ' (TPM)' : ''}`}
              className="flex-1 flex items-center justify-center transition-all hover:opacity-80"
              style={{ background: d.tpmAjuste ? '#f472b6' : d.cor, minWidth: 4, opacity: d.tpmAjuste ? 0.75 : 1 }}>
              {dadosSemana.length <= 16 && (
                <span className="text-xs font-bold text-white/70" style={{ fontSize: 8 }}>{d.semana}</span>
              )}
            </div>
          ))}
        </div>
        {/* Labels das fases abaixo */}
        <div className="flex gap-0.5 mt-0.5">
          {fases.map((fase, fi) => {
            const cor = CORES_FASE[fase.nome] || '#64748b';
            const pct = ((parseInt(fase.duracaoSemanas) || 1) / duracaoTotal) * 100;
            return (
              <div key={fase.id} style={{ width: `${pct}%`, minWidth: 0 }} className="overflow-hidden">
                <div className="text-center truncate" style={{ fontSize: 9, color: cor, opacity: 0.8 }}>{fase.nome}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Datas de referência */}
      {dataInicio && (
        <div className="flex justify-between text-xs text-slate-600">
          <span>Início: {getDataSemana(1)}</span>
          <span>Fim: {getDataSemana(dadosSemana.length)}</span>
        </div>
      )}

      {/* Legenda */}
      <div className="flex flex-wrap gap-2">
        {fasesUnicas.map(fase => {
          const cor = CORES_FASE[fase] || '#64748b';
          return (
            <div key={fase} className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-sm" style={{ background: cor }} />
              {fase}
            </div>
          );
        })}
        {fases.some(f => f.tpmAjuste) && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#f472b6' }}>
            <Moon size={11} /><span>TPM</span>
          </div>
        )}
      </div>

      {/* Tabela semana a semana resumida */}
      <div>
        <div className="text-xs text-slate-500 mb-2">Ciclo Semanal Detalhado</div>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="grid text-xs font-semibold text-slate-500 px-3 py-2"
            style={{ gridTemplateColumns: '48px 1fr 90px 80px', background: 'rgba(255,255,255,0.03)' }}>
            <span>Sem.</span><span>Fase</span><span>Intensidade</span><span>Volume</span>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {dadosSemana.map((d, i) => {
              const data = getDataSemana(d.semana);
              return (
                <div key={i} className="grid px-3 py-2 text-xs border-t items-center"
                  style={{
                    gridTemplateColumns: '48px 1fr 90px 80px',
                    borderColor: 'rgba(255,255,255,0.05)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  }}>
                  <span className="font-bold text-slate-400">S{d.semana}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.tpmAjuste ? '#f472b6' : d.cor }} />
                    <span className="text-white truncate">{d.fase}</span>
                    {d.tpmAjuste && <Moon size={9} color="#f472b6" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', maxWidth: 48 }}>
                      <div className="h-full rounded-full" style={{ width: `${d.intensidade}%`, background: d.cor }} />
                    </div>
                    <span className="text-slate-400 w-12 text-right">{d.intensidadeLabel}</span>
                  </div>
                  <span className="text-slate-500">{d.volumeLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
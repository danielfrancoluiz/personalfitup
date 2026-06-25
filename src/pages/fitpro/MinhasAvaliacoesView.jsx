import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Download } from 'lucide-react';
import { gerarPDFAvaliacao } from '../../lib/fitpro-pdf';
import { useApp, useAuth } from '../../context/FitProContext';
import { getCredentials } from '../../lib/fitpro-storage';
import { getCorClassificacao } from '../../lib/fitpro-calculations';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

export default function MinhasAvaliacoesView() {
  const { avaliacoes, alunos } = useApp();
  const { user } = useAuth();

  const [alunoId, setAlunoId] = useState('');
  useEffect(() => {
    getCredentials().then(creds => {
      const myCred = creds.find(c => c.id === user?.id);
      const linkedId = myCred?.linkedId || '';
      if (linkedId) { setAlunoId(linkedId); return; }
      const byEmail = alunos.find(a => a.email?.toLowerCase() === user?.email?.toLowerCase());
      setAlunoId(byEmail?.id || '');
    });
  }, [user?.id, alunos]);

  const minhasAvaliacoes = avaliacoes.filter(a => a.alunoId === alunoId).sort((a, b) => new Date(a.data) - new Date(b.data));
  const ultimaAv = minhasAvaliacoes[minhasAvaliacoes.length - 1];
  const primeiraAv = minhasAvaliacoes[0];

  const chartData = minhasAvaliacoes.map((av, i) => ({
    label: `Aval ${i + 1}`,
    data: new Date(av.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    gordura: av.percentualGordura ? parseFloat(av.percentualGordura.toFixed(1)) : 0,
    massaMagra: av.massaMagra ? parseFloat(av.massaMagra.toFixed(1)) : 0,
    peso: av.peso,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Activity size={20} color="#fb923c" />Minhas Avaliações</h2>
        <p className="text-xs text-slate-500">Acompanhe sua evolução física ao longo do tempo</p>
      </div>

      {!alunoId && (
        <div className="p-4 rounded-xl text-sm" style={{ background: '#fbbf2410', border: '1px solid #fbbf2430', color: '#fbbf24' }}>
          ⚠️ Seu perfil não está vinculado a um aluno. Solicite ao professor para vincular seu perfil.
        </div>
      )}

      {minhasAvaliacoes.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Activity size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma avaliação registrada</p>
          <p className="text-xs mt-1">Solicite uma avaliação ao seu professor</p>
        </div>
      ) : (
        <>
          {/* Progresso */}
          {minhasAvaliacoes.length > 1 && primeiraAv && ultimaAv && (
            <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <h3 className="font-semibold text-white mb-4">Progresso Total ({minhasAvaliacoes.length} avaliações)</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Variação % Gordura', value: ultimaAv.percentualGordura && primeiraAv.percentualGordura ? `${(ultimaAv.percentualGordura - primeiraAv.percentualGordura).toFixed(1)}%` : 'N/A', color: ultimaAv.percentualGordura < primeiraAv.percentualGordura ? '#34d399' : '#ef4444' },
                  { label: 'Variação Massa Magra', value: ultimaAv.massaMagra && primeiraAv.massaMagra ? `${ultimaAv.massaMagra - primeiraAv.massaMagra > 0 ? '+' : ''}${(ultimaAv.massaMagra - primeiraAv.massaMagra).toFixed(1)}kg` : 'N/A', color: ultimaAv.massaMagra > primeiraAv.massaMagra ? '#34d399' : '#ef4444' },
                  { label: 'Variação de Peso', value: `${ultimaAv.peso - primeiraAv.peso > 0 ? '+' : ''}${(ultimaAv.peso - primeiraAv.peso).toFixed(1)}kg`, color: '#fbbf24' },
                  { label: 'Classificação Atual', value: ultimaAv.classificacaoGordura || 'N/A', color: getCorClassificacao(ultimaAv.classificacaoGordura || '') },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                    <div className="text-base font-bold" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts */}
          {chartData.length > 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                { label: 'Evolução do % Gordura', dataKey: 'gordura', color: '#fb923c' },
                { label: 'Evolução da Massa Magra (kg)', dataKey: 'massaMagra', color: '#34d399' },
              ].map(chart => (
                <div key={chart.dataKey} className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <h4 className="text-sm font-semibold text-white mb-3">{chart.label}</h4>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="data" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey={chart.dataKey} stroke={chart.color} fill={`${chart.color}20`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}

          {/* Histórico */}
          <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h3 className="font-semibold text-white mb-4">Histórico Completo</h3>
            <div className="space-y-3">
              {[...minhasAvaliacoes].reverse().map((av, i) => (
                <div key={av.id} className="p-4 rounded-xl" style={{ background: '#fb923c08', border: '1px solid #fb923c20' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm text-white">{new Date(av.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                      <div className="text-xs text-slate-500">Peso: {av.peso}kg • Altura: {av.altura}cm</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {av.classificacaoGordura && (
                        <span className="text-xs px-2 py-0.5 rounded-full hidden sm:inline" style={{ background: `${getCorClassificacao(av.classificacaoGordura)}15`, color: getCorClassificacao(av.classificacaoGordura) }}>
                          {av.classificacaoGordura}
                        </span>
                      )}
                      <button onClick={() => { const aluno = alunos.find(a => a.id === av.alunoId); gerarPDFAvaliacao(av, aluno); }}
                        className="p-1.5 rounded-xl hover:bg-white/5 transition-all" title="Baixar PDF" style={{ color: '#34d399' }}>
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {[
                      { label: '% Gordura', value: av.percentualGordura != null ? `${av.percentualGordura?.toFixed(1)}%` : null, color: '#fb923c' },
                      { label: 'Massa Magra', value: av.massaMagra != null ? `${av.massaMagra?.toFixed(1)}kg` : null, color: '#34d399' },
                      { label: 'Massa Gorda', value: av.massaGorda != null ? `${av.massaGorda?.toFixed(1)}kg` : null, color: '#ef4444' },
                      { label: 'IMC', value: av.imc != null ? av.imc?.toFixed(1) : null, color: '#60a5fa' },
                    ].filter(it => it.value).map((item, j) => (
                      <div key={j} className="p-2 rounded-xl" style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                        <div className="text-sm font-bold" style={{ color: item.color }}>{item.value}</div>
                        <div className="text-xs text-slate-500">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  {av.observacoes && <p className="text-xs text-slate-500 mt-2">📝 {av.observacoes}</p>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
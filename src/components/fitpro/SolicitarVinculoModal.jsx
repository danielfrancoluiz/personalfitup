import React, { useState, useEffect, useMemo } from 'react';
import { X, UserCheck, Send, CheckCircle2, Clock, XCircle, MapPin, Search, Filter, AlertCircle } from 'lucide-react';
import { useApp, useAuth } from '../../context/FitProContext';
import { getCredentials } from '../../lib/fitpro-storage';
import { base44 } from '@/api/base44Client';
import { contarAlunosProfessor, podeCadastrarAluno } from '../../lib/planos-professor';

const BORDER = 'rgba(255,255,255,0.07)';
const MSG_PLANO_LIMITADO =
  'Aguardando aprovação do professor. Este professor está no limite do plano. Você também pode escolher outro na lista.';

// Extrai prefixo numérico do CEP para estimar proximidade
function cepPrefix(cep) {
  if (!cep) return null;
  return parseInt((cep || '').replace(/\D/g, '').substring(0, 5)) || null;
}

function distanciaCep(cepA, cepB) {
  const a = cepPrefix(cepA);
  const b = cepPrefix(cepB);
  if (a == null || b == null) return Infinity;
  return Math.abs(a - b);
}

export default function SolicitarVinculoModal({ onClose }) {
  const { professores, alunos } = useApp();
  const { user } = useAuth();
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [resolvedAlunoId, setResolvedAlunoId] = useState('');
  const [alunoData, setAlunoData] = useState(null);

  // Filtros
  const [filtroCidade, setFiltroCidade] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busca, setBusca] = useState('');
  const [avisoPlanoLimitado, setAvisoPlanoLimitado] = useState('');
  const [enviadoOk, setEnviadoOk] = useState(false);

  useEffect(() => {
    getCredentials().then(creds => {
      const myCred = creds.find(c => c.id === user?.id);
      const alunoId = myCred?.linkedId || '';
      if (alunoId) { setResolvedAlunoId(alunoId); return; }
      const byEmail = alunos.find(a => a.email?.toLowerCase() === user?.email?.toLowerCase());
      setResolvedAlunoId(byEmail?.id || '');
    });
  }, [user?.id, alunos]);

  useEffect(() => {
    if (!resolvedAlunoId) return;
    const a = alunos.find(x => x.id === resolvedAlunoId);
    setAlunoData(a);
    base44.entities.SolicitacaoVinculo.filter({ alunoId: resolvedAlunoId })
      .then(list => setSolicitacoes(list.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))));
  }, [resolvedAlunoId, alunos]);

  const profAtual = professores.find(p => p.id === alunoData?.professorId);
  const alunoCep = alunoData?.endereco?.cep || '';

  // Listas únicas para os filtros
  const cidades = useMemo(() =>
    [...new Set(professores.map(p => p.endereco?.cidade).filter(Boolean))].sort(),
    [professores]
  );
  const estados = useMemo(() =>
    [...new Set(professores.map(p => p.endereco?.estado).filter(Boolean))].sort(),
    [professores]
  );

  // Professores filtrados e ordenados por proximidade de CEP
  const professoresFiltrados = useMemo(() => {
    let lista = [...professores];

    if (filtroEstado) lista = lista.filter(p => p.endereco?.estado === filtroEstado);
    if (filtroCidade) lista = lista.filter(p => p.endereco?.cidade === filtroCidade);
    if (busca.trim()) lista = lista.filter(p =>
      p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      p.especialidade?.toLowerCase().includes(busca.toLowerCase()) ||
      p.endereco?.cidade?.toLowerCase().includes(busca.toLowerCase())
    );

    // Ordenação: primeiro por proximidade de CEP, depois alfabética
    lista.sort((a, b) => {
      const distA = distanciaCep(alunoCep, a.endereco?.cep);
      const distB = distanciaCep(alunoCep, b.endereco?.cep);
      if (distA !== distB) return distA - distB;
      return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
    });

    return lista;
  }, [professores, filtroEstado, filtroCidade, busca, alunoCep]);

  const profNoLimite = (prof) => {
    if (!prof) return false;
    const qtd = contarAlunosProfessor(alunos, prof.id);
    return !podeCadastrarAluno(prof, qtd);
  };

  const handleEnviar = async () => {
    if (!selectedProfessor) return;
    const prof = professores.find(p => p.id === selectedProfessor);
    setEnviando(true);
    setAvisoPlanoLimitado('');
    setEnviadoOk(false);

    await base44.entities.SolicitacaoVinculo.create({
      alunoId: resolvedAlunoId,
      alunoNome: alunoData?.nome || user?.nome || '',
      alunoEmail: alunoData?.email || user?.email || '',
      professorId: selectedProfessor,
      professorNome: prof?.nome || '',
      status: 'pendente',
      mensagem: mensagem.trim(),
      planoLimitado: profNoLimite(prof),
    });
    const list = await base44.entities.SolicitacaoVinculo.filter({ alunoId: resolvedAlunoId });
    setSolicitacoes(list.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));

    if (profNoLimite(prof)) {
      setAvisoPlanoLimitado(MSG_PLANO_LIMITADO);
    } else {
      setEnviadoOk(true);
    }

    setSelectedProfessor('');
    setMensagem('');
    setEnviando(false);
  };

  const statusConfig = {
    pendente:  { icon: Clock,        color: '#fbbf24', label: 'Aguardando' },
    aceito:    { icon: CheckCircle2, color: '#34d399', label: 'Aceito' },
    recusado:  { icon: XCircle,      color: '#ef4444', label: 'Recusado' },
  };

  const profSelecionado = professores.find(p => p.id === selectedProfessor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0d1525', border: `1px solid ${BORDER}`, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: '#080d1a', borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#a78bfa20' }}>
              <UserCheck size={16} color="#a78bfa" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Solicitar Professor</h3>
              <p className="text-xs text-slate-500">Encontre um professor próximo a você</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X size={16} color="#6b7280" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Professor atual */}
          {profAtual && (
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: '#34d39910', border: '1px solid #34d39930' }}>
              <CheckCircle2 size={16} color="#34d399" className="flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Seu professor atual</p>
                <p className="text-sm font-semibold text-white">{profAtual.nome}</p>
                {profAtual.endereco?.cidade && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />{profAtual.endereco.cidade}{profAtual.endereco.estado ? `, ${profAtual.endereco.estado}` : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CEP do aluno (aviso se não preenchido) */}
          {!alunoCep && (
            <div className="px-3 py-2 rounded-xl text-xs" style={{ background: '#fbbf2410', border: '1px solid #fbbf2430', color: '#fbbf24' }}>
              💡 Preencha seu CEP no perfil para ver os professores mais próximos primeiro.
            </div>
          )}

          {/* Filtros */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Filter size={11} />Filtrar professores
            </div>

            {/* Busca por nome */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nome ou especialidade..."
                className="w-full pl-8 pr-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Filtro Estado */}
              <select
                value={filtroEstado}
                onChange={e => { setFiltroEstado(e.target.value); setFiltroCidade(''); }}
                className="px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                <option value="">Todos os estados</option>
                {estados.map(e => <option key={e} value={e}>{e}</option>)}
              </select>

              {/* Filtro Cidade */}
              <select
                value={filtroCidade}
                onChange={e => setFiltroCidade(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                <option value="">Todas as cidades</option>
                {(filtroEstado
                  ? professores.filter(p => p.endereco?.estado === filtroEstado).map(p => p.endereco?.cidade).filter(Boolean)
                  : cidades
                ).filter((v, i, arr) => arr.indexOf(v) === i).sort().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Lista de professores */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">
                {professoresFiltrados.length} professor{professoresFiltrados.length !== 1 ? 'es' : ''}
                {alunoCep ? ' — ordenado por proximidade' : ' — ordem alfabética'}
              </span>
              {(filtroEstado || filtroCidade || busca) && (
                <button onClick={() => { setFiltroEstado(''); setFiltroCidade(''); setBusca(''); }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-all">
                  Limpar filtros
                </button>
              )}
            </div>

            {professoresFiltrados.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                Nenhum professor encontrado com esses filtros
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {professoresFiltrados.map(prof => {
                  const selecionado = selectedProfessor === prof.id;
                  const temLocal = prof.endereco?.cidade || prof.endereco?.estado;
                  const dist = alunoCep ? distanciaCep(alunoCep, prof.endereco?.cep) : Infinity;
                  const muitoProximo = dist < 500;
                  const noLimite = profNoLimite(prof);
                  return (
                    <button
                      key={prof.id}
                      onClick={() => {
                        setSelectedProfessor(selecionado ? '' : prof.id);
                        setAvisoPlanoLimitado('');
                        setEnviadoOk(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                      style={{
                        background: selecionado ? '#a78bfa20' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selecionado ? '#a78bfa50' : 'rgba(255,255,255,0.07)'}`,
                      }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                        style={{ background: selecionado ? '#a78bfa30' : 'rgba(255,255,255,0.08)' }}>
                        {prof.nome?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white truncate">{prof.nome}</span>
                          {muitoProximo && alunoCep && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: '#34d39915', color: '#34d399', border: '1px solid #34d39930' }}>
                              📍 Próximo
                            </span>
                          )}
                          {noLimite && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: '#fbbf2415', color: '#fbbf24', border: '1px solid #fbbf2430' }}>
                              Plano limitado
                            </span>
                          )}
                        </div>
                        {prof.especialidade && (
                          <span className="text-xs text-slate-500">{prof.especialidade}</span>
                        )}
                        {temLocal && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin size={10} />
                            {[prof.endereco?.cidade, prof.endereco?.estado].filter(Boolean).join(', ')}
                            {prof.endereco?.cep && (
                              <span className="text-slate-600 ml-1">CEP {prof.endereco.cep}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {selecionado && <CheckCircle2 size={16} color="#a78bfa" className="flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Professor selecionado — preview */}
          {profSelecionado && (
            <div className="p-3 rounded-xl space-y-2" style={{ background: '#a78bfa10', border: '1px solid #a78bfa30' }}>
              <div>
                <p className="text-xs text-slate-400 mb-1">Professor selecionado</p>
                <p className="text-sm font-bold text-white">{profSelecionado.nome}</p>
                {profSelecionado.endereco?.cidade && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    {[profSelecionado.endereco.cidade, profSelecionado.endereco.estado].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              {profNoLimite(profSelecionado) && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: '#fbbf2412', border: '1px solid #fbbf2430' }}>
                  <AlertCircle size={14} color="#fbbf24" className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200 leading-relaxed">
                    Este professor está no limite do plano. Sua solicitação ficará <strong className="text-white">aguardando aprovação</strong>. Você também pode escolher outro na lista.
                  </p>
                </div>
              )}
            </div>
          )}

          {avisoPlanoLimitado && (
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: '#fbbf2412', border: '1px solid #fbbf2435' }}>
              <AlertCircle size={15} color="#fbbf24" className="flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200 leading-relaxed">{avisoPlanoLimitado}</p>
            </div>
          )}

          {enviadoOk && !avisoPlanoLimitado && (
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: '#34d39912', border: '1px solid #34d39935' }}>
              <CheckCircle2 size={15} color="#34d399" className="flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-200 leading-relaxed">
                Solicitação enviada! Aguarde a aprovação do professor.
              </p>
            </div>
          )}

          {/* Mensagem + enviar */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Mensagem (opcional)</label>
            <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={2}
              placeholder="Ex: Quero começar a treinar com foco em emagrecimento..."
              className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none mb-3"
              style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />

            <button onClick={handleEnviar} disabled={!selectedProfessor || enviando || !resolvedAlunoId}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{
                background: (!selectedProfessor || !resolvedAlunoId) ? '#1e2a3a' : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                color: (!selectedProfessor || !resolvedAlunoId) ? '#475569' : '#fff',
                opacity: enviando ? 0.7 : 1,
              }}>
              <Send size={14} />
              {enviando ? 'Enviando...' : 'Enviar Solicitação'}
            </button>

            {!resolvedAlunoId && (
              <p className="text-xs text-amber-400 mt-2 text-center">
                ⚠️ Seu cadastro de aluno não foi encontrado. Peça ao admin para criar seu perfil.
              </p>
            )}
          </div>

          {/* Histórico */}
          {solicitacoes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Histórico de Solicitações</h4>
              <div className="space-y-2">
                {solicitacoes.map(sol => {
                  const cfg = statusConfig[sol.status] || statusConfig.pendente;
                  const Icon = cfg.icon;
                  const prof = professores.find(p => p.id === sol.professorId);
                  const labelHist = sol.status === 'pendente' && (sol.planoLimitado || (prof && profNoLimite(prof)))
                    ? 'Aguardando aprovação do professor'
                    : cfg.label;
                  return (
                    <div key={sol.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}25` }}>
                      <Icon size={16} color={cfg.color} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{prof?.nome || sol.professorNome}</p>
                        {prof?.endereco?.cidade && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin size={9} />{prof.endereco.cidade}{prof.endereco.estado ? `, ${prof.endereco.estado}` : ''}
                          </p>
                        )}
                        <p className="text-xs" style={{ color: cfg.color }}>{labelHist}</p>
                        {sol.status === 'pendente' && (sol.planoLimitado || (prof && profNoLimite(prof))) && (
                          <p className="text-xs text-slate-500 mt-0.5">Ou escolha outro professor na lista</p>
                        )}
                      </div>
                      {sol.created_date && (
                        <p className="text-xs text-slate-600 flex-shrink-0">
                          {new Date(sol.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { X, Check, Zap, AlertCircle } from 'lucide-react';
import { loadPlanos, loadPlanosAsync, isPlanoGratuito, dadosVigenciaPlanoPago, getPrecoPlanoAtual, limparContratoPlano, PLANOS_DEFAULT } from '../../lib/planos-professor';
import ModalCheckoutStripe from './ModalCheckoutStripe';

export default function ModalPlanosBoasVindas({
  nomeProf,
  professorId,
  professor,
  modo = 'cadastro',
  updateProfessor,
  addTransacao,
  updateTransacao,
  onClose,
  onComplete,
}) {
  const [planos, setPlanos] = useState(loadPlanos);
  const [carregandoPlanos, setCarregandoPlanos] = useState(true);

  useEffect(() => {
    let ativo = true;
    loadPlanosAsync(true).then((p) => {
      if (ativo) {
        setPlanos(p);
        setCarregandoPlanos(false);
      }
    });
    return () => { ativo = false; };
  }, []);

  const planosVisiveis = modo === 'upgrade' ? planos.filter(p => p.preco > 0) : planos;
  const [selecionado, setSelecionado] = useState(modo === 'upgrade' ? 'profissional' : 'basico');
  const [periodoContrato, setPeriodoContrato] = useState('mensal');
  const [checkoutTransacao, setCheckoutTransacao] = useState(null);
  const [processando, setProcessando] = useState(false);

  const planoSel = planos.find(p => p.id === selecionado);
  const planoPago = planoSel && !isPlanoGratuito(planoSel.id);

  const aplicarPlanoGratuito = async () => {
    if (!updateProfessor || !professorId) {
      onComplete?.();
      onClose();
      return;
    }
    setProcessando(true);
    try {
      await updateProfessor(professorId, {
        planoCobranca: 'basico',
        planoAssinatura: 'Básico',
        statusPlano: 'ativo',
        dataInicioPlano: new Date().toISOString().split('T')[0],
        dataVencimento: '',
        ...limparContratoPlano(),
      });
      onComplete?.();
      onClose();
    } finally {
      setProcessando(false);
    }
  };

  const iniciarPagamento = async () => {
    if (!planoSel || !addTransacao || !updateProfessor || !professorId) return;
    setProcessando(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const venc = new Date();
      venc.setDate(venc.getDate() + 7);
      const nome = nomeProf || professor?.nome || 'Professor';
      const precoContrato = getPrecoPlanoAtual(planoSel.id);
      const transacaoData = {
        descricao: `${planoSel.nome}${periodoContrato === 'anual' ? ' (anual)' : ''} — ${nome}`,
        tipo: 'Mensalidade',
        valor: String(precoContrato),
        data: hoje,
        vencimento: venc.toISOString().split('T')[0],
        status: 'pendente',
        professorId,
        alunoId: '',
        observacoes: `Assinatura plano ${planoSel.nome}`,
        categoria: 'receita',
      };
      const transacaoId = await addTransacao(transacaoData);
      await updateProfessor(professorId, {
        planoCobranca: planoSel.id,
        planoAssinatura: planoSel.nome,
        statusPlano: 'pendente',
      });
      setCheckoutTransacao({ ...transacaoData, id: transacaoId });
    } finally {
      setProcessando(false);
    }
  };

  const handleConfirmar = async () => {
    if (!planoSel) return;
    if (isPlanoGratuito(planoSel.id)) {
      await aplicarPlanoGratuito();
    } else {
      await iniciarPagamento();
    }
  };

  const handlePagamentoSucesso = async () => {
    if (!checkoutTransacao) return;
    if (updateTransacao) {
      await updateTransacao(checkoutTransacao.id, { status: 'pago' });
    }
    if (updateProfessor && professorId && planoSel) {
      await updateProfessor(professorId, dadosVigenciaPlanoPago(planoSel.id, planoSel.nome, { periodoContrato }));
    }
    setCheckoutTransacao(null);
    onComplete?.();
    onClose();
  };

  const titulo = modo === 'upgrade'
    ? 'Limite de alunos atingido'
    : `Bem-vindo, ${nomeProf?.split(' ')[0]}! 🎉`;

  const subtitulo = modo === 'upgrade'
    ? 'Você atingiu o limite de 5 alunos no plano gratuito. Para cadastrar o próximo aluno, adira a um plano pago.'
    : 'Escolha o plano ideal para sua jornada como personal trainer';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.88)' }}>
        <div className="w-full max-w-xl rounded-2xl overflow-hidden"
          style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

          <div className="px-6 pt-6 pb-4 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0d1a2e, #0d1525)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={16} color="#00d4ff" />
                  <span className="text-xs font-semibold" style={{ color: '#00d4ff' }}>Personal Fit Up</span>
                </div>
                <h2 className="text-xl font-black text-white">{titulo}</h2>
                <p className="text-sm text-slate-400 mt-1">{subtitulo}</p>
              </div>
              {modo !== 'upgrade' && (
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 flex-shrink-0 mt-1">
                  <X size={16} color="#6b7280" />
                </button>
              )}
            </div>

            {modo === 'upgrade' && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl"
                style={{ background: '#fbbf2410', border: '1px solid #fbbf2430' }}>
                <AlertCircle size={16} color="#fbbf24" className="flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  O plano <strong className="text-white">Básico</strong> permite até <strong className="text-white">5 alunos</strong>.
                  Escolha um plano pago abaixo para continuar cadastrando alunos.
                </p>
              </div>
            )}
          </div>

          <div className="overflow-y-auto flex-1 p-5 space-y-3">
            {carregandoPlanos ? (
              <p className="text-sm text-slate-500 text-center py-8">Carregando planos...</p>
            ) : planosVisiveis.map(plano => {
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
                      <p className="text-xs text-slate-400">
                        {plano.desc || PLANOS_DEFAULT.find(p => p.id === plano.id)?.desc || ''}
                      </p>
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

          {planoPago && (
            <div className="px-5 pb-2 flex-shrink-0">
              <p className="text-xs text-slate-500 mb-2">Período do contrato (preço travado até o fim):</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'mensal', label: 'Mensal', desc: 'Preço fixo por 1 mês' },
                  { id: 'anual', label: 'Anual', desc: 'Preço fixo por 12 meses' },
                ].map(p => (
                  <button key={p.id} type="button" onClick={() => setPeriodoContrato(p.id)}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{
                      background: periodoContrato === p.id ? `${planoSel?.color || '#34d399'}15` : 'rgba(255,255,255,0.03)',
                      border: periodoContrato === p.id ? `1px solid ${planoSel?.color || '#34d399'}50` : '1px solid rgba(255,255,255,0.07)',
                    }}>
                    <div className="text-sm font-bold text-white">{p.label}</div>
                    <div className="text-[10px] text-slate-500">{p.desc}</div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-2 text-center">
                Mesmo que o plano suba de preço, você paga R$ {planoSel?.preco?.toFixed(2)}/mês até o fim do contrato {periodoContrato === 'anual' ? 'de 12 meses' : 'mensal'}.
              </p>
            </div>
          )}

          <div className="px-5 pb-5 flex-shrink-0 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
            <button
              onClick={handleConfirmar}
              disabled={processando || !planoSel}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${planoSel?.color || '#34d399'}, ${planoSel?.color || '#34d399'}cc)` }}>
              {processando
                ? 'Processando...'
                : planoPago
                  ? `Continuar para pagamento — ${planoSel?.nome}`
                  : `Começar com o plano ${planoSel?.nome} (Grátis)`}
            </button>
            {modo === 'upgrade' && (
              <button onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Cancelar
              </button>
            )}
            {modo === 'cadastro' && (
              <p className="text-center text-xs text-slate-600">Você pode alterar seu plano a qualquer momento no painel</p>
            )}
          </div>
        </div>
      </div>

      {checkoutTransacao && (
        <ModalCheckoutStripe
          transacao={checkoutTransacao}
          aluno={professor || { nome: nomeProf, email: professor?.email }}
          onClose={() => setCheckoutTransacao(null)}
          onSucesso={handlePagamentoSucesso}
        />
      )}
    </>
  );
}

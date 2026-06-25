import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2, AlertCircle, Loader2, Lock, Smartphone, QrCode, Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function formatCartao(v) {
  return v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 19);
}
function formatValidade(v) {
  return v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1/$2').substring(0, 5);
}

const METODOS = [
  { id: 'credito', label: 'Crédito', icon: CreditCard, color: '#a5b4fc' },
  { id: 'debito', label: 'Débito', icon: CreditCard, color: '#34d399' },
  { id: 'pix', label: 'PIX', icon: Smartphone, color: '#00E87A' },
];

export default function ModalCheckoutStripe({ transacao, aluno, onClose, onSucesso }) {
  const [metodo, setMetodo] = useState('credito');
  const [cartao, setCartao] = useState({ numero: '', nomeTitular: '', validade: '', cvv: '', parcelas: '1' });
  const [comprador, setComprador] = useState({ nome: aluno?.nome || '', email: aluno?.email || '', cpf: '' });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [pixCopiado, setPixCopiado] = useState(false);

  const valor = parseFloat(transacao?.valor || 0);

  const maxParcelas = (() => {
    try { return parseInt(JSON.parse(localStorage.getItem('fitpro_stripe_config') || '{}').parcelasMax) || 12; }
    catch { return 12; }
  })();

  // PIX payload fixo — integração real futura via Stripe
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136fitpro@pagamento.com.br5204000053039865802BR5913FitPro Saude6009SAO PAULO62070503***6304ABCD`;

  const handlePagar = async () => {
    if (metodo === 'pix') {
      // PIX: confirma manualmente (aguarda pagamento externo)
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setResultado({ ok: true, novoStatus: 'pendente', mensagem: 'PIX gerado! Aguardando confirmação do pagamento.' });
      }, 1000);
      return;
    }

    if (!cartao.numero || !cartao.nomeTitular || !cartao.validade || !cartao.cvv) {
      setErro('Preencha todos os dados do cartão.');
      return;
    }
    if (!comprador.cpf || comprador.cpf.replace(/\D/g, '').length < 11) {
      setErro('Informe o CPF do titular.');
      return;
    }

    setErro('');
    setLoading(true);

    try {
      const [mes, ano] = cartao.validade.split('/');
      const payload = {
        transacaoId: transacao.id,
        metodo,
        cartao: {
          numero: cartao.numero.replace(/\s/g, ''),
          nomeTitular: cartao.nomeTitular,
          mesValidade: mes,
          anoValidade: ano?.length === 2 ? `20${ano}` : ano,
          cvv: cartao.cvv,
          parcelas: metodo === 'debito' ? '1' : cartao.parcelas,
        },
        comprador,
      };

      const res = await base44.functions.invoke('pagbankCheckout', payload);
      const data = res?.data;

      if (data?.ok) {
        setResultado(data);
        if (data.novoStatus === 'pago') onSucesso?.();
      } else {
        setErro(data?.error || 'Erro ao processar pagamento. Tente novamente.');
      }
    } catch (e) {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '95vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: '#080d1a', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#635bff20', border: '1px solid #635bff40' }}>
              <CreditCard size={16} color="#a5b4fc" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Pagamento Seguro</h3>
              <p className="text-xs text-slate-500">Processado via Stripe</p>
            </div>
          </div>
          {!loading && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X size={16} color="#6b7280" /></button>}
        </div>

        {/* Resultado final */}
        {resultado ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            {resultado.novoStatus === 'pago' ? (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: '#00E87A20', border: '2px solid #00E87A' }}>
                  <CheckCircle2 size={32} color="#00E87A" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Pagamento Aprovado!</h3>
                <p className="text-slate-400 text-sm mb-2">{resultado.mensagem}</p>
                <p className="text-2xl font-black" style={{ color: '#00E87A' }}>R$ {valor.toFixed(2)}</p>
                {resultado.chargeId && <p className="text-xs text-slate-500 mt-2">ID: {resultado.chargeId}</p>}
              </>
            ) : resultado.novoStatus === 'pendente' ? (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: '#00E87A20', border: '2px solid #00E87A' }}>
                  <Smartphone size={32} color="#00E87A" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">PIX Gerado!</h3>
                <p className="text-slate-400 text-sm mb-4">{resultado.mensagem}</p>
                <div className="w-full p-4 rounded-xl text-xs font-mono break-all text-slate-400 mb-3"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {pixCode.slice(0, 80)}...
                </div>
                <button onClick={() => { navigator.clipboard.writeText(pixCode); setPixCopiado(true); setTimeout(() => setPixCopiado(false), 2000); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mb-2"
                  style={{ background: pixCopiado ? '#00E87A20' : '#1e2a3a', color: pixCopiado ? '#00E87A' : '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Copy size={14} />{pixCopiado ? 'Copiado!' : 'Copiar código PIX'}
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: '#ef444420', border: '2px solid #ef4444' }}>
                  <AlertCircle size={32} color="#ef4444" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Pagamento Recusado</h3>
                <p className="text-slate-400 text-sm">{resultado.mensagem}</p>
              </>
            )}
            <button onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: resultado.novoStatus === 'pago' || resultado.novoStatus === 'pendente' ? 'linear-gradient(135deg, #00E87A, #059669)' : 'linear-gradient(135deg, #475569, #334155)' }}>
              Fechar
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {/* Resumo */}
            <div className="p-3 rounded-xl flex items-center justify-between"
              style={{ background: '#635bff10', border: '1px solid #635bff25' }}>
              <div>
                <p className="text-xs text-slate-400 truncate max-w-[180px]">{transacao?.descricao}</p>
                <p className="text-xs text-slate-500">{aluno?.nome}</p>
              </div>
              <p className="text-lg font-black" style={{ color: '#a5b4fc' }}>R$ {valor.toFixed(2)}</p>
            </div>

            {/* Seleção de método */}
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">Método de Pagamento</p>
              <div className="grid grid-cols-3 gap-2">
                {METODOS.map(m => {
                  const Icon = m.icon;
                  const ativo = metodo === m.id;
                  return (
                    <button key={m.id} onClick={() => { setMetodo(m.id); setErro(''); }}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                      style={{ background: ativo ? `${m.color}15` : 'rgba(255,255,255,0.04)', border: `1px solid ${ativo ? m.color + '40' : 'rgba(255,255,255,0.07)'}` }}>
                      <Icon size={16} style={{ color: ativo ? m.color : '#64748b' }} />
                      <span className="text-xs font-semibold" style={{ color: ativo ? m.color : '#64748b' }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIX */}
            {metodo === 'pix' && (
              <div className="p-4 rounded-xl text-center space-y-3"
                style={{ background: '#00E87A08', border: '1px solid #00E87A20' }}>
                <QrCode size={40} className="mx-auto" color="#00E87A" />
                <p className="text-sm text-white font-semibold">Clique em Pagar para gerar o código PIX</p>
                <p className="text-xs text-slate-400">Após o pagamento, aguarde confirmação do professor.</p>
              </div>
            )}

            {/* Dados do comprador (cartão/débito) */}
            {metodo !== 'pix' && (
              <>
                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">Dados do Comprador</p>
                  <div className="space-y-2">
                    <input value={comprador.nome} onChange={e => setComprador(c => ({ ...c, nome: e.target.value }))}
                      placeholder="Nome completo"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={comprador.cpf} onChange={e => setComprador(c => ({ ...c, cpf: e.target.value }))}
                        placeholder="CPF (somente números)"
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                      <input value={comprador.email} onChange={e => setComprador(c => ({ ...c, email: e.target.value }))}
                        placeholder="E-mail"
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">
                    {metodo === 'debito' ? 'Dados do Cartão de Débito' : 'Dados do Cartão de Crédito'}
                  </p>
                  <div className="space-y-2">
                    <input value={cartao.numero} onChange={e => setCartao(c => ({ ...c, numero: formatCartao(e.target.value) }))}
                      placeholder="0000 0000 0000 0000" maxLength={19}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none font-mono tracking-widest"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                    <input value={cartao.nomeTitular} onChange={e => setCartao(c => ({ ...c, nomeTitular: e.target.value.toUpperCase() }))}
                      placeholder="NOME COMO NO CARTÃO"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none uppercase"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={cartao.validade} onChange={e => setCartao(c => ({ ...c, validade: formatValidade(e.target.value) }))}
                        placeholder="MM/AA" maxLength={5}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                      <input value={cartao.cvv} onChange={e => setCartao(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').substring(0, 4) }))}
                        placeholder="CVV" maxLength={4}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                    </div>
                    {metodo === 'credito' && maxParcelas > 1 && (
                      <select value={cartao.parcelas} onChange={e => setCartao(c => ({ ...c, parcelas: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {Array.from({ length: maxParcelas }, (_, i) => i + 1).map(n => {
                          const vlr = (valor / n).toFixed(2);
                          return <option key={n} value={String(n)}>{n === 1 ? `À vista — R$ ${valor.toFixed(2)}` : `${n}x de R$ ${vlr}`}</option>;
                        })}
                      </select>
                    )}
                  </div>
                </div>
              </>
            )}

            {erro && (
              <div className="flex items-center gap-2 p-3 rounded-xl"
                style={{ background: '#ef444415', border: '1px solid #ef444430' }}>
                <AlertCircle size={14} color="#ef4444" />
                <p className="text-xs text-red-400">{erro}</p>
              </div>
            )}

            <div className="flex items-center gap-2 justify-center text-xs text-slate-600">
              <Lock size={11} />
              <span>Pagamento seguro — criptografado via Stripe</span>
            </div>
          </div>
        )}

        {!resultado && (
          <div className="px-5 pb-5 flex-shrink-0">
            <button onClick={handlePagar} disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{
                background: metodo === 'pix'
                  ? 'linear-gradient(135deg, #00E87A, #059669)'
                  : metodo === 'debito'
                    ? 'linear-gradient(135deg, #34d399, #059669)'
                    : 'linear-gradient(135deg, #635bff, #00AAFF)'
              }}>
              {loading
                ? <><Loader2 size={16} className="animate-spin" />Processando...</>
                : metodo === 'pix'
                  ? <><Smartphone size={16} />Gerar PIX — R$ {valor.toFixed(2)}</>
                  : <><CreditCard size={16} />Pagar R$ {valor.toFixed(2)}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
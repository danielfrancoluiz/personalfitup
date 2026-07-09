import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, X, Edit2, ChevronRight, Search, Phone, Mail, CreditCard } from 'lucide-react';
import { useApp } from '../../context/FitProContext';
import ProfessorListItem from '../../components/fitpro/ProfessorListItem';
import { getCredentials, addCredential, deleteCredential } from '../../lib/fitpro-storage';
import MaskedInput from '../../components/fitpro/MaskedInput';
import { loadPlanos, loadPlanosAsync, PLANO_COLOR, isPlanoGratuito, dadosVigenciaPlanoPago, limparContratoPlano, getPrecoCobrancaProfessor, contratoPrecoVigente } from '../../lib/planos-professor';
import FormField, { formInputClass, formInputStyle, formRowClass } from '../../components/fitpro/FormField';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

const emptyForm = {
  nome: '', email: '', telefone: '', cref: '', especialidade: '',
  planoCobranca: 'basico', planoAssinatura: 'Básico', statusPlano: 'ativo',
  periodoContrato: 'mensal', precoPlanoContratado: '', dataFimContrato: '',
  dataInicioPlano: '', dataVencimento: '',
  endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' }
};

export default function ProfessoresView() {
  const { professores, alunos, avaliacoes, planosTreino, addProfessor, updateProfessor, deleteProfessor } = useApp();
  const [search, setSearch] = useState('');
  const [filtroPlano, setFiltroPlano] = useState('');
  const [filtroEspecialidade, setFiltroEspecialidade] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);
  const [selectedProf, setSelectedProf] = useState(null);
  const [formStep, setFormStep] = useState('dados');
  const [planos, setPlanos] = useState(loadPlanos);
  const [planoAnterior, setPlanoAnterior] = useState(null);

  useEffect(() => {
    if (showForm) loadPlanosAsync().then(setPlanos);
  }, [showForm]);

  const filtered = professores.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase())
      || (p.email || '').toLowerCase().includes(search.toLowerCase());
    const matchPlano = !filtroPlano || p.planoCobranca === filtroPlano;
    const matchEsp = !filtroEspecialidade || p.especialidade === filtroEspecialidade;
    return matchSearch && matchPlano && matchEsp;
  }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  const especialidades = [...new Set(professores.map(p => p.especialidade).filter(Boolean))];

  const handleSave = async () => {
    if (!form.nome.trim()) return alert('Nome é obrigatório');
    let payload = { ...form };
    const planoSel = planos.find(p => p.id === form.planoCobranca);
    if (planoSel) payload.planoAssinatura = planoSel.nome;

    const mudouPlano = editId && planoAnterior && planoAnterior !== form.planoCobranca;
    if (!isPlanoGratuito(form.planoCobranca) && (!editId || mudouPlano)) {
      if (form.statusPlano === 'ativo') {
        payload = {
          ...payload,
          ...dadosVigenciaPlanoPago(form.planoCobranca, planoSel?.nome || '', {
            periodoContrato: form.periodoContrato || 'mensal',
          }),
        };
      } else if (!payload.dataInicioPlano) {
        payload.dataInicioPlano = new Date().toISOString().split('T')[0];
      }
    }
    if (isPlanoGratuito(form.planoCobranca)) {
      payload = { ...payload, dataVencimento: '', ...limparContratoPlano() };
    }

    if (editId) {
      await updateProfessor(editId, payload);
    } else {
      const profId = await addProfessor(payload);
      if (form.email && form.senha) {
        await addCredential({
          email: form.email,
          password: form.senha,
          role: 'professor',
          nome: form.nome,
          linkedId: profId,
          ativo: true,
          autoRegistrado: false,
        });
      }
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditId(null); setForm(emptyForm); setFormStep('dados'); setPlanoAnterior(null); }, 1200);
  };

  const openForm = (prof = null) => {
    setForm(prof ? { ...emptyForm, ...prof } : emptyForm);
    setEditId(prof?.id || null);
    setPlanoAnterior(prof?.planoCobranca || null);
    setFormStep('dados');
    setShowForm(true);
  };

  if (selectedProf) {
    const prof = professores.find(p => p.id === selectedProf.id) || selectedProf;
    const meusAlunos = alunos.filter(a => a.professorId === prof.id);
    const avsTotal = avaliacoes.filter(av => meusAlunos.some(a => a.id === av.alunoId)).length;
    const treinosTotal = planosTreino.filter(t => meusAlunos.some(a => a.id === t.alunoId)).length;
    const plano = planos.find(p => p.id === prof.planoCobranca) || planos.find(p => p.id === 'basico') || planos[0];
    const planoColor = PLANO_COLOR[prof.planoCobranca] || PLANO_COLOR[plano?.id] || '#60a5fa';

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedProf(null)} className="p-2 rounded-xl hover:bg-white/5">
            <ChevronRight size={18} color="#9ca3af" className="rotate-180" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{prof.nome}</h2>
            <p className="text-xs text-slate-500">{prof.especialidade} {prof.cref ? `• CREF: ${prof.cref}` : ''}</p>
          </div>
          <button onClick={() => openForm(prof)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
            <Edit2 size={12} className="inline mr-1" />Editar
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Alunos', value: meusAlunos.length, color: '#a78bfa' },
            { label: 'Avaliações', value: avsTotal, color: '#fb923c' },
            { label: 'Treinos', value: treinosTotal, color: '#f472b6' },
          ].map(k => (
            <div key={k.label} className="p-3 rounded-xl text-center" style={{ background: `${k.color}10`, border: `1px solid ${k.color}25` }}>
              <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
              <div className="text-xs text-slate-500">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Plano de cobrança */}
        <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${planoColor}30` }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1"><CreditCard size={12} />Plano de Cobrança</h4>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: prof.statusPlano === 'ativo' ? '#34d39915' : '#ef444415', color: prof.statusPlano === 'ativo' ? '#34d399' : '#ef4444' }}>
              {prof.statusPlano === 'ativo' ? 'Ativo' : prof.statusPlano === 'suspenso' ? 'Suspenso' : 'Cancelado'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-bold" style={{ color: planoColor }}>{plano.nome}</div>
              <div className="text-xs text-slate-500">{plano.desc}</div>
              {contratoPrecoVigente(prof) && (
                <div className="text-xs text-slate-400 mt-1">
                  Contrato: R$ {Number(prof.precoPlanoContratado).toFixed(2)}/mês
                  {prof.periodoContrato === 'anual' ? ' (anual)' : ' (mensal)'}
                  {prof.dataFimContrato && ` · até ${new Date(prof.dataFimContrato + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">
                {getPrecoCobrancaProfessor(prof, prof.planoCobranca) === 0
                  ? 'Grátis'
                  : `R$ ${getPrecoCobrancaProfessor(prof, prof.planoCobranca).toFixed(2)}`}
              </div>
              <div className="text-xs text-slate-500">/mês cobrado</div>
              {contratoPrecoVigente(prof) && Number(prof.precoPlanoContratado) !== plano.preco && (
                <div className="text-[10px] text-slate-600">Tabela: R$ {plano.preco.toFixed(2)}</div>
              )}
            </div>
          </div>
          {prof.dataInicioPlano && <div className="text-xs text-slate-500 mt-2">Adesão: {new Date(prof.dataInicioPlano + 'T12:00:00').toLocaleDateString('pt-BR')}</div>}
          {prof.dataVencimento && <div className="text-xs text-slate-500">Próx. vencimento: {new Date(prof.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</div>}
        </div>

        <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contato</h4>
          <div className="space-y-2">
            {prof.email && <div className="flex items-center gap-2 text-sm text-slate-300"><Mail size={14} color="#64748b" />{prof.email}</div>}
            {prof.telefone && <div className="flex items-center gap-2 text-sm text-slate-300"><Phone size={14} color="#64748b" />{prof.telefone}</div>}
          </div>
        </div>

        {meusAlunos.length > 0 && (
          <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h4 className="font-semibold text-white mb-3">Alunos ({meusAlunos.length})</h4>
            <div className="space-y-2">
              {meusAlunos.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: ['#a78bfa','#34d399','#60a5fa'][i%3] + '30' }}>{a.nome.charAt(0)}</div>
                  <div className="flex-1"><div className="text-sm text-white">{a.nome}</div><div className="text-xs text-slate-500">{a.objetivo}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Professores Cadastrados</h2>
          <p className="text-xs text-slate-500">{filtered.length} professor(es)</p>
        </div>
        <button onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
          <Plus size={14} />Novo Professor
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        {planos.length > 0 && (
          <select value={filtroPlano} onChange={e => setFiltroPlano(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="">Todos os planos</option>
            {planos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        )}
        {especialidades.length > 0 && (
          <select value={filtroEspecialidade} onChange={e => setFiltroEspecialidade(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="">Todas especialidades</option>
            {especialidades.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500"><UserCheck size={40} className="mx-auto mb-3 opacity-30" /><p>Nenhum professor cadastrado</p></div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((prof, i) => {
            const meusAlunos = alunos.filter(a => a.professorId === prof.id);
            const avsTotal = avaliacoes.filter(av => meusAlunos.some(a => a.id === av.alunoId)).length;
            const treinosTotal = planosTreino.filter(t => meusAlunos.some(a => a.id === t.alunoId)).length;
            const plano = planos.find(p => p.id === prof.planoCobranca) || planos.find(p => p.id === 'basico') || planos[0];
            const planoColor = PLANO_COLOR[prof.planoCobranca] || PLANO_COLOR[plano?.id] || '#60a5fa';
            const preco = getPrecoCobrancaProfessor(prof, prof.planoCobranca);
            const precoLabel = preco === 0 ? 'Grátis' : `R$ ${preco.toFixed(2)}/mês`;

            return (
              <ProfessorListItem
                key={prof.id}
                professor={prof}
                i={i}
                alunosCount={meusAlunos.length}
                avaliacoesCount={avsTotal}
                treinosCount={treinosTotal}
                plano={plano}
                planoColor={planoColor}
                precoLabel={precoLabel}
                onVerPerfil={setSelectedProf}
                onEdit={openForm}
                onDelete={(id) => { if (confirm('Excluir este professor?')) deleteProfessor(id); }}
              />
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 my-4" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{editId ? 'Editar' : 'Novo'} Professor</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); setFormStep('dados'); }}><X size={18} color="#6b7280" /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {[{ id: 'dados', label: 'Dados' }, { id: 'plano', label: 'Plano de Cobrança' }].map(t => (
                <button key={t.id} onClick={() => setFormStep(t.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: formStep === t.id ? '#34d39920' : 'rgba(255,255,255,0.04)', color: formStep === t.id ? '#34d399' : '#64748b', border: formStep === t.id ? '1px solid #34d39930' : '1px solid rgba(255,255,255,0.06)' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {formStep === 'dados' && (
              <div className="space-y-3">
                {[
                  { label: 'Nome', field: 'nome', placeholder: 'Nome completo' },
                  { label: 'Email', field: 'email', placeholder: 'email@exemplo.com' },
                ].map(f => (
                  <div key={f.field}>
                    <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                    <input value={form[f.field] || ''} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                      placeholder={f.placeholder} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Telefone</label>
                  <MaskedInput mask="telefone" value={form.telefone || ''} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                    placeholder="(11) 99999-9999" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">CREF</label>
                  <MaskedInput mask="cref" value={form.cref || ''} onChange={e => setForm(p => ({ ...p, cref: e.target.value }))}
                    placeholder="000000-G/SP" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Especialidade</label>
                  <select value={form.especialidade || ''} onChange={e => setForm(p => ({ ...p, especialidade: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <option value="">Selecionar</option>
                    {['Musculação','Personal Trainer','Funcional','CrossFit','Pilates','Avaliação Física'].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                {!editId && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Senha de acesso (opcional)</label>
                    <input type="password" value={form.senha || ''} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
                      placeholder="Deixe vazio para não criar acesso" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                )}
              </div>
            )}

            {formStep === 'plano' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 mb-1">
                  Selecione o plano deste professor. Os <strong className="text-slate-300">valores são globais</strong> — altere preços em Financeiro → Planos.
                </p>
                <div className="space-y-2">
                  {planos.map(plano => {
                    const color = PLANO_COLOR[plano.id];
                    const selected = form.planoCobranca === plano.id;
                    return (
                      <button key={plano.id} type="button"
                        onClick={() => setForm(f => ({ ...f, planoCobranca: plano.id, planoAssinatura: plano.nome }))}
                        className="w-full text-left rounded-xl p-3 transition-all"
                        style={{
                          background: selected ? `${color}12` : 'rgba(255,255,255,0.03)',
                          border: selected ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.07)',
                        }}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-sm" style={{ color: selected ? color : '#94a3b8' }}>{plano.nome}</span>
                          <span className="font-bold text-sm" style={{ color: selected ? color : '#64748b' }}>
                            {plano.preco === 0 ? 'Grátis' : `R$ ${Number(plano.preco).toFixed(2)}/mês`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{plano.desc}</p>
                      </button>
                    );
                  })}
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Período do contrato</label>
                  <select value={form.periodoContrato || 'mensal'} onChange={e => setForm(f => ({ ...f, periodoContrato: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <option value="mensal">Mensal — preço fixo por 1 mês</option>
                    <option value="anual">Anual — preço fixo por 12 meses</option>
                  </select>
                  <p className="text-[10px] text-slate-600 mt-1">Ao ativar ou trocar plano, o preço da tabela é travado até o fim do período.</p>
                </div>
                <div className={formRowClass}>
                  <FormField label="Status do Plano">
                    <select value={form.statusPlano || 'ativo'} onChange={e => setForm(f => ({ ...f, statusPlano: e.target.value }))}
                      className={formInputClass} style={formInputStyle}>
                      <option value="ativo">Ativo</option>
                      <option value="pendente">Pendente pagamento</option>
                      <option value="suspenso">Suspenso</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </FormField>
                  <FormField label="Data de Adesão">
                    <input type="date" value={form.dataInicioPlano || ''} onChange={e => setForm(f => ({ ...f, dataInicioPlano: e.target.value }))}
                      className={formInputClass} style={formInputStyle} />
                  </FormField>
                </div>
                <div className={formRowClass}>
                  <FormField label="Fim do contrato (preço travado)">
                    <input type="date" value={form.dataFimContrato || ''} onChange={e => setForm(f => ({ ...f, dataFimContrato: e.target.value }))}
                      className={formInputClass} style={formInputStyle} />
                  </FormField>
                  <FormField label="Próx. vencimento">
                    <input type="date" value={form.dataVencimento || ''} onChange={e => setForm(f => ({ ...f, dataVencimento: e.target.value }))}
                      className={formInputClass} style={formInputStyle} />
                  </FormField>
                </div>
                {form.precoPlanoContratado !== '' && form.precoPlanoContratado != null && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Preço contratado (R$/mês)</label>
                    <input type="number" step="0.01" value={form.precoPlanoContratado} readOnly
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-400 outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                )}
              </div>
            )}

            <button onClick={handleSave} className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #34d399, #059669)' }}>
              {saved ? '✓ Salvo!' : `${editId ? 'Salvar' : 'Cadastrar'} Professor`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, ChevronRight, Activity, Dumbbell, Calendar, Phone, Mail, Trash2, Edit2, Save, X, Filter, MessageCircle, Eye, EyeOff, MessageSquare, Bell, AlertCircle } from 'lucide-react';
import AlunoListItem from '../../components/fitpro/AlunoListItem';
import { useApp, useAuth } from '../../context/FitProContext';
import { getCredentials, addCredential } from '../../lib/fitpro-storage';
import { calcularIdade, calcularIMC, classificarIMC } from '../../lib/fitpro-calculations';
import { base44 } from '@/api/base44Client';
import VerFeedbackModal from '../../components/fitpro/VerFeedbackModal';
import { contarAlunosProfessor, podeCadastrarAluno, professorNoLimiteGratuito, professorPrecisaRenovarPlano } from '../../lib/planos-professor';
import {
  alunoAtivoEfetivo, getAlunosDoProfessor, professorPodeGerenciarStatusAluno,
  isAlunoAtivoRegistro, getAlunosVisiveisPlanoGratuito, professorVeApenasAlunosPlanoGratuito,
} from '../../lib/aluno-status';
import ModalPlanosBoasVindas from '../../components/fitpro/ModalPlanosBoasVindas';
import PARQVerRespostasModal from '../../components/fitpro/PARQVerRespostasModal';
import MaskedInput from '../../components/fitpro/MaskedInput';
import { feedbackPertenceAoProfessor, getIdsAlunosProfessor } from '../../lib/professor-scope';
import { resolveProfessorId } from '../../lib/resolve-professor-id';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';
const inpClass = 'w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none';
const inpStyle = { background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' };

const emptyAluno = { nome: '', email: '', telefone: '', dataNascimento: '', sexo: 'M', peso: '', altura: '', objetivo: '', observacoes: '', professorId: '', endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' } };

function ModalEditarAluno({ form, setForm, onSave, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Editar Aluno</h3>
          <button onClick={onClose}><X size={18} color="#6b7280" /></button>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Nome', field: 'nome', placeholder: 'Nome completo' },
            { label: 'Email', field: 'email', placeholder: 'email@exemplo.com' },
          ].map(f => (
            <div key={f.field}>
              <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
              <input value={form[f.field] || ''} onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))} placeholder={f.placeholder}
                className={inpClass} style={inpStyle} />
            </div>
          ))}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Telefone</label>
            <MaskedInput mask="telefone" value={form.telefone || ''} onChange={e => setForm(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-9999" className={inpClass} style={inpStyle} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Data de Nascimento</label>
            <MaskedInput mask="data" value={form.dataNascimento || ''} onChange={e => setForm(prev => ({ ...prev, dataNascimento: e.target.value }))}
              className={inpClass} style={inpStyle} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Sexo</label>
            <select value={form.sexo || 'M'} onChange={e => setForm(p => ({ ...p, sexo: e.target.value }))} className={inpClass} style={inpStyle}>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Peso (kg)</label>
              <input type="number" value={form.peso} onChange={e => setForm(p => ({ ...p, peso: e.target.value }))} className={inpClass} style={inpStyle} />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Altura (cm)</label>
              <input type="number" value={form.altura} onChange={e => setForm(p => ({ ...p, altura: e.target.value }))} className={inpClass} style={inpStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Objetivo</label>
            <select value={form.objetivo || ''} onChange={e => setForm(p => ({ ...p, objetivo: e.target.value }))} className={inpClass} style={inpStyle}>
              <option value="">Selecionar</option>
              {['Emagrecimento', 'Hipertrofia', 'Condicionamento', 'Saúde', 'Reabilitação', 'Performance'].map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Observações</label>
            <textarea value={form.observacoes || ''} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none" style={inpStyle} />
          </div>
        </div>
        <button onClick={onSave} className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
          Salvar
        </button>
      </div>
    </div>
  );
}

export default function AlunosView({ roleOverride }) {
  const { alunos, professores, avaliacoes, planosTreino, periodizacoes, addAluno, updateAluno, deleteAluno, updateProfessor, addTransacao, updateTransacao } = useApp();
  const { user } = useAuth();
  const role = roleOverride || user?.role;

  const [professorIdAsync, setProfessorIdAsync] = useState('');
  useEffect(() => {
    getCredentials().then(creds => {
      const myCred = creds.find(c => c.id === user?.id);
      if (myCred?.linkedId) setProfessorIdAsync(myCred.linkedId);
    });
  }, [user?.id]);

  // Preferir linkedId da sessão (síncrono) — evita salvar aluno sem professorId
  const professorId = resolveProfessorId(user, professores) || professorIdAsync;

  const [search, setSearch] = useState('');
  const [filtroProf, setFiltroProf] = useState('');
  const [filtroObj, setFiltroObj] = useState('');
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyAluno);
  const [activeTab, setActiveTab] = useState('perfil');

  const meuProfessor = professores.find(p => p.id === professorId);
  const alunosDoProfessor = getAlunosDoProfessor(alunos, professorId);
  const planoGratuitoEfetivo = role === 'professor' && professorVeApenasAlunosPlanoGratuito(meuProfessor);
  const alunosBaseProfessor = planoGratuitoEfetivo
    ? getAlunosVisiveisPlanoGratuito(alunosDoProfessor)
    : alunosDoProfessor;

  const alunosFiltrados = role === 'professor'
    ? (professorId ? alunosBaseProfessor : [])
    : alunos;

  const filtered = alunosFiltrados.filter(a => {
    const matchSearch = a.nome.toLowerCase().includes(search.toLowerCase()) || (a.email || '').toLowerCase().includes(search.toLowerCase());
    const matchProf = !filtroProf || a.professorId === filtroProf;
    const matchObj = !filtroObj || a.objetivo === filtroObj;
    return matchSearch && matchProf && matchObj;
  }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  const objetivos = [...new Set(alunosFiltrados.map(a => a.objetivo).filter(Boolean))];

  const [senhaNovo, setSenhaNovo] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [feedbacksNaoLidos, setFeedbacksNaoLidos] = useState({}); // { [alunoId]: count }
  const [verFeedbackAluno, setVerFeedbackAluno] = useState(null);
  const [verPARQAluno, setVerPARQAluno] = useState(null);
  const [enviandoPARQ, setEnviandoPARQ] = useState(false);
  const [showUpgradePlano, setShowUpgradePlano] = useState(false);
  const [pendenteNovoAluno, setPendenteNovoAluno] = useState(false);

  const qtdMeusAlunos = contarAlunosProfessor(alunos, professorId);
  const qtdAlunosOcultos = planoGratuitoEfetivo ? Math.max(0, alunosDoProfessor.length - alunosBaseProfessor.length) : 0;
  const noLimiteGratuito = role === 'professor' && professorNoLimiteGratuito(meuProfessor, qtdMeusAlunos);
  const planoExpirado = role === 'professor' && professorPrecisaRenovarPlano(meuProfessor);
  const podeToggleStatus = role === 'professor' && professorPodeGerenciarStatusAluno(meuProfessor);

  useEffect(() => {
    if (!planoGratuitoEfetivo || !selectedAluno) return;
    const idsVisiveis = new Set(alunosBaseProfessor.map(a => a.id));
    if (!idsVisiveis.has(selectedAluno.id)) setSelectedAluno(null);
  }, [planoGratuitoEfetivo, selectedAluno, alunosBaseProfessor]);

  const abrirFormNovoAluno = () => {
    if (role === 'professor' && professorId) {
      const prof = professores.find(p => p.id === professorId);
      const qtd = contarAlunosProfessor(alunos, professorId);
      if (!podeCadastrarAluno(prof, qtd)) {
        setPendenteNovoAluno(true);
        setShowUpgradePlano(true);
        return;
      }
    }
    setForm({ ...emptyAluno, professorId });
    setEditId(null);
    setShowForm(true);
  };

  // Carrega feedbacks não lidos dos alunos vinculados a este professor
  useEffect(() => {
    if (role !== 'professor' && role !== 'admin') return;
    if (role === 'professor' && !professorId) return;

    const aplicarFeedbacks = (list) => {
      let filtrados = list;
      if (role === 'professor') {
        const idsMeusAlunos = getIdsAlunosProfessor(alunos, professorId);
        filtrados = list.filter((f) => feedbackPertenceAoProfessor(f, professorId, idsMeusAlunos));
      }
      const mapa = {};
      filtrados.forEach((f) => { mapa[f.alunoId] = (mapa[f.alunoId] || 0) + 1; });
      setFeedbacksNaoLidos(mapa);
    };

    if (role === 'professor') {
      base44.entities.FeedbackTreino.filter({ professorId, lido: false })
        .then(aplicarFeedbacks);
      return;
    }

    base44.entities.FeedbackTreino.filter({ lido: false }).then(aplicarFeedbacks);
  }, [role, professorId, alunos]);

  const handleEnviarPARQ = (aluno) => {
    setVerPARQAluno(aluno);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return alert('Nome é obrigatório');
    const assignedProfessorId = role === 'professor'
      ? (professorId || resolveProfessorId(user, professores))
      : (form.professorId || '');
    if (role === 'professor' && !assignedProfessorId) {
      return alert('Não foi possível vincular o aluno ao seu perfil de professor. Faça login novamente.');
    }
    if (!editId && role === 'professor' && assignedProfessorId) {
      const prof = professores.find(p => p.id === assignedProfessorId);
      const qtd = contarAlunosProfessor(alunos, assignedProfessorId);
      if (!podeCadastrarAluno(prof, qtd)) {
        setPendenteNovoAluno(true);
        setShowUpgradePlano(true);
        return;
      }
    }
    const data = {
      ...form,
      peso: parseFloat(form.peso) || 0,
      altura: parseFloat(form.altura) || 0,
      professorId: assignedProfessorId,
      ativo: true,
      createdAt: form.createdAt || new Date().toISOString(),
    };
    if (editId) {
      await updateAluno(editId, data);
      if (selectedAluno?.id === editId) setSelectedAluno(prev => ({ ...prev, ...data }));
    } else {
      const id = await addAluno(data);
      if (form.email && senhaNovo) {
        await addCredential({ email: form.email, password: senhaNovo, role: 'aluno', nome: form.nome, linkedId: id, ativo: true, autoRegistrado: false });
      }
    }
    setShowForm(false); setEditId(null); setForm(emptyAluno); setSenhaNovo('');
  };

  const handleEnviarWhatsApp = () => {
    const tel = (form.telefone || '').replace(/\D/g, '');
    if (!tel) return alert('Informe o telefone do aluno para enviar via WhatsApp.');
    if (!form.email) return alert('Informe o email do aluno.');
    if (!senhaNovo) return alert('Defina uma senha para enviar ao aluno.');
    const msg = encodeURIComponent(
      `Olá, ${form.nome}! 🏋️\n\nSeu acesso à plataforma FitPro foi criado!\n\n*Login:* ${form.email}\n*Senha:* ${senhaNovo}\n\nBons treinos! 💪`
    );
    window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
  };

  const handleEdit = (aluno) => {
    setForm({ ...aluno, peso: String(aluno.peso ?? ''), altura: String(aluno.altura ?? '') });
    setEditId(aluno.id);
    setShowForm(true);
  };

  const fecharEdicao = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyAluno);
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este aluno?')) return;
    await deleteAluno(id); setSelectedAluno(null);
  };

  const handleToggleAtivo = async (aluno) => {
    if (!podeToggleStatus) return;
    const novoAtivo = !isAlunoAtivoRegistro(aluno);
    await updateAluno(aluno.id, { ativo: novoAtivo });
  };

  if (selectedAluno) {
    const aluno = alunos.find(a => a.id === selectedAluno.id) || selectedAluno;
    const prof = professores.find(p => p.id === aluno.professorId);
    const avsAluno = avaliacoes.filter(a => a.alunoId === aluno.id).sort((a, b) => new Date(b.data) - new Date(a.data));
    const treinosAluno = planosTreino.filter(t => t.alunoId === aluno.id);
    const perAluno = periodizacoes.filter(p => p.alunoId === aluno.id);
    const imc = calcularIMC(aluno.peso, aluno.altura);
    const idade = aluno.dataNascimento ? calcularIdade(aluno.dataNascimento) : 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedAluno(null)} className="p-2 rounded-xl hover:bg-white/5"><ChevronRight size={18} color="#9ca3af" className="rotate-180" /></button>
          <div className="flex-1"><h2 className="text-lg font-bold text-white">{aluno.nome}</h2><p className="text-xs text-slate-500">Perfil completo do aluno</p></div>
          <button onClick={() => handleEdit(aluno)} className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: '#a78bfa20', color: '#a78bfa', border: '1px solid #a78bfa30' }}>
            <Edit2 size={12} className="inline mr-1" />Editar
          </button>
        </div>

        <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white" style={{ background: '#a78bfa25' }}>{aluno.nome.charAt(0)}</div>
            <div>
              <h3 className="text-lg font-bold text-white">{aluno.nome}</h3>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#a78bfa15', color: '#a78bfa' }}>{aluno.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
                {idade > 0 && <span className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{idade} anos</span>}
                {aluno.objetivo && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#34d39915', color: '#34d399' }}>{aluno.objetivo}</span>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Peso', value: `${aluno.peso}kg`, color: '#fb923c' },
              { label: 'Altura', value: `${aluno.altura}cm`, color: '#60a5fa' },
              { label: 'IMC', value: aluno.peso > 0 ? imc.toFixed(1) : '—', color: imc > 25 ? '#fbbf24' : '#34d399' },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl text-center" style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                <div className="text-base font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'perfil', label: 'Perfil' },
            { id: 'avaliacoes', label: `Avaliações (${avsAluno.length})` },
            { id: 'treinos', label: `Treinos (${treinosAluno.length})` },
            { id: 'periodizacao', label: 'Periodização' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
              style={{ background: activeTab === tab.id ? '#a78bfa20' : 'rgba(255,255,255,0.03)', color: activeTab === tab.id ? '#a78bfa' : '#64748b', border: activeTab === tab.id ? '1px solid #a78bfa30' : '1px solid rgba(255,255,255,0.06)' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          {activeTab === 'perfil' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contato</h4>
                <div className="space-y-2">
                  {aluno.email && <div className="flex items-center gap-2 text-sm text-slate-300"><Mail size={14} color="#64748b" />{aluno.email}</div>}
                  {aluno.telefone && <div className="flex items-center gap-2 text-sm text-slate-300"><Phone size={14} color="#64748b" />{aluno.telefone}</div>}
                  {prof && <div className="text-sm text-slate-300">Prof: {prof.nome}</div>}
                </div>
              </div>
              {aluno.observacoes && <div><h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Observações</h4><p className="text-sm text-slate-300">{aluno.observacoes}</p></div>}
            </div>
          )}
          {activeTab === 'avaliacoes' && (
            <div>
              <div className="flex justify-between mb-4"><h4 className="font-semibold text-white">Histórico</h4></div>
              {avsAluno.length === 0 ? <p className="text-slate-500 text-sm text-center py-8">Nenhuma avaliação realizada</p> : (
                <div className="space-y-3">
                  {avsAluno.map((av, i) => (
                    <div key={av.id} className="p-4 rounded-xl" style={{ background: '#fb923c08', border: '1px solid #fb923c20' }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-white">{new Date(av.data).toLocaleDateString('pt-BR')}</span>
                        {av.classificacaoGordura && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#34d39915', color: '#34d399' }}>{av.classificacaoGordura}</span>}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: '% Gord', value: av.percentualGordura != null ? `${av.percentualGordura?.toFixed(1)}%` : null, color: '#fb923c' },
                          { label: 'Magra', value: av.massaMagra != null ? `${av.massaMagra?.toFixed(1)}kg` : null, color: '#34d399' },
                          { label: 'IMC', value: av.imc != null ? av.imc?.toFixed(1) : null, color: '#60a5fa' },
                          { label: 'Peso', value: `${av.peso}kg`, color: '#a78bfa' },
                        ].filter(it => it.value).map((item, j) => (
                          <div key={j} className="p-2 rounded-lg text-center" style={{ background: `${item.color}08` }}>
                            <div className="text-xs font-bold" style={{ color: item.color }}>{item.value}</div>
                            <div className="text-xs text-slate-600">{item.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'treinos' && (
            <div>
              <div className="flex justify-between mb-4"><h4 className="font-semibold text-white">Planos de Treino</h4></div>
              {treinosAluno.length === 0 ? <p className="text-slate-500 text-sm text-center py-8">Nenhum treino criado</p> : (
                <div className="space-y-3">
                  {treinosAluno.map((t, i) => (
                    <div key={t.id} className="p-4 rounded-xl" style={{ background: '#f472b608', border: '1px solid #f472b620' }}>
                      <div className="font-semibold text-white">{t.nome}</div>
                      <div className="flex gap-2 mt-1 text-xs text-slate-400">
                        <span style={{ color: '#f472b6' }}>{t.nivel}</span>
                        <span>•</span><span>{t.sessoes?.length || 0} sessões</span>
                        <span>•</span><span>{t.duracaoSemanas} semanas</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'periodizacao' && (
            <div>
              {perAluno.length === 0 ? <p className="text-slate-500 text-sm text-center py-8">Nenhuma periodização criada</p> : (
                <div className="space-y-3">
                  {perAluno.map(p => (
                    <div key={p.id} className="p-4 rounded-xl" style={{ background: '#fbbf2408', border: '1px solid #fbbf2420' }}>
                      <div className="font-semibold text-white">{p.nome}</div>
                      <div className="text-xs text-slate-400 mt-1">{p.tipo} • {p.duracaoTotal} semanas</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {showForm && editId && (
          <ModalEditarAluno
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onClose={fecharEdicao}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-white">{role === 'professor' ? 'Meus Alunos' : 'Alunos Cadastrados'}</h2>
          <p className="text-xs text-slate-500">
            {filtered.length} aluno(s)
            {qtdAlunosOcultos > 0 && (
              <span className="text-amber-500/80"> · {qtdAlunosOcultos} oculto(s) no plano gratuito</span>
            )}
          </p></div>
        {role !== 'admin' && (
          <button onClick={abrirFormNovoAluno}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: '#a78bfa20', color: '#a78bfa', border: '1px solid #a78bfa30' }}>
            <Plus size={14} />Novo Aluno
          </button>
        )}
      </div>

      {/* Alerta de feedbacks não lidos */}
      {Object.keys(feedbacksNaoLidos).length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: '#60a5fa0d', border: '1px solid #60a5fa35' }}>
          <Bell size={16} color="#60a5fa" />
          <p className="text-sm text-slate-300 flex-1">
            <span className="font-bold text-white">{Object.values(feedbacksNaoLidos).reduce((a, b) => a + b, 0)}</span> novo(s) feedback(s) de treino não lido(s)
          </p>
        </div>
      )}

      {/* Alerta plano gratuito — status automático */}
      {planoGratuitoEfetivo && alunosDoProfessor.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: '#60a5fa0d', border: '1px solid #60a5fa35' }}>
          <AlertCircle size={16} color="#60a5fa" />
          <p className="text-sm text-slate-300 flex-1">
            No plano gratuito você vê e gerencia apenas os{' '}
            <span className="font-bold text-white">5 primeiros alunos cadastrados</span>.
            {qtdAlunosOcultos > 0 && (
              <> Os outros <span className="font-bold text-white">{qtdAlunosOcultos}</span> alunos ficam ocultos até você aderir a um plano pago.</>
            )}
          </p>
          {qtdAlunosOcultos > 0 && (
            <button onClick={() => { setPendenteNovoAluno(false); setShowUpgradePlano(true); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
              style={{ background: '#60a5fa20', color: '#60a5fa', border: '1px solid #60a5fa30' }}>
              Ver planos
            </button>
          )}
        </div>
      )}

      {/* Alerta plano expirado */}
      {planoExpirado && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: '#ef44440d', border: '1px solid #ef444435' }}>
          <AlertCircle size={16} color="#ef4444" />
          <p className="text-sm text-slate-300 flex-1">
            Seu plano <span className="font-bold text-white">{meuProfessor?.planoAssinatura}</span> venceu
            {meuProfessor?.dataVencimento ? ` em ${new Date(meuProfessor.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}.
            Renove para continuar cadastrando alunos além do limite gratuito.
          </p>
          <button onClick={() => { setPendenteNovoAluno(false); setShowUpgradePlano(true); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
            style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444430' }}>
            Renovar plano
          </button>
        </div>
      )}

      {/* Alerta limite plano gratuito */}
      {noLimiteGratuito && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: '#fbbf240d', border: '1px solid #fbbf2435' }}>
          <AlertCircle size={16} color="#fbbf24" />
          <p className="text-sm text-slate-300 flex-1">
            Você atingiu o limite de <span className="font-bold text-white">5 alunos</span> no plano gratuito.
            Para cadastrar mais alunos, adira a um plano pago.
          </p>
          <button onClick={() => { setPendenteNovoAluno(true); setShowUpgradePlano(true); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
            style={{ background: '#fbbf2420', color: '#fbbf24', border: '1px solid #fbbf2430' }}>
            Ver planos
          </button>
        </div>
      )}

      {/* Search & filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        {role === 'admin' && (
          <select value={filtroProf} onChange={e => setFiltroProf(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="">Todos os professores</option>
            {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        )}
        {objetivos.length > 0 && (
          <select value={filtroObj} onChange={e => setFiltroObj(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="">Todos objetivos</option>
            {objetivos.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum aluno encontrado</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((aluno, i) => (
            <AlunoListItem
              key={aluno.id}
              aluno={aluno}
              i={i}
              avaliacoes={avaliacoes}
              planosTreino={planosTreino}
              feedbacksNaoLidos={feedbacksNaoLidos}
              ativoEfetivo={alunoAtivoEfetivo(aluno, meuProfessor, alunosDoProfessor)}
              podeToggleStatus={podeToggleStatus}
              onToggleStatus={role === 'professor' ? handleToggleAtivo : undefined}
              onVerPerfil={setSelectedAluno}
              onVerFeedback={setVerFeedbackAluno}
              onEnviarPARQ={handleEnviarPARQ}
              onEdit={handleEdit}
              onDelete={id => { if (confirm('Excluir este aluno?')) handleDelete(id); }}
            />
          ))}
        </div>
      )}

      {/* Modal Ver Feedback */}
      {verFeedbackAluno && (
        <VerFeedbackModal
          aluno={verFeedbackAluno}
          onClose={() => setVerFeedbackAluno(null)}
          onMarcarLido={() => {
            setFeedbacksNaoLidos(prev => {
              const n = { ...prev };
              delete n[verFeedbackAluno.id];
              return n;
            });
          }}
        />
      )}

      {/* Modal Ver PAR-Q */}
      {verPARQAluno && (
        <PARQVerRespostasModal
          aluno={verPARQAluno}
          professorId={professorId}
          onClose={() => setVerPARQAluno(null)}
        />
      )}

      {/* Modal editar aluno */}
      {showForm && editId && (
        <ModalEditarAluno
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={fecharEdicao}
        />
      )}

      {/* Form modal para novo aluno */}
      {showForm && !editId && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Novo Aluno</h3>
              <button type="button" onClick={() => setShowForm(false)}><X size={18} color="#6b7280" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Nome', field: 'nome', placeholder: 'Nome completo' },
                { label: 'Email', field: 'email', placeholder: 'email@exemplo.com' },
              ].map(f => (
                <div key={f.field}>
                  <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                  <input value={form[f.field] || ''} onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))} placeholder={f.placeholder}
                    className={inpClass} style={inpStyle} />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Telefone</label>
                <MaskedInput mask="telefone" value={form.telefone || ''} onChange={e => setForm(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999" className={inpClass} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Data de Nascimento</label>
                <MaskedInput mask="data" value={form.dataNascimento || ''} onChange={e => setForm(p => ({ ...p, dataNascimento: e.target.value }))}
                  className={inpClass} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Sexo</label>
                <select value={form.sexo || 'M'} onChange={e => setForm(p => ({ ...p, sexo: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="M">Masculino</option><option value="F">Feminino</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-slate-400 block mb-1">Peso (kg)</label><input type="number" value={form.peso} onChange={e => setForm(p => ({ ...p, peso: e.target.value }))} placeholder="70" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Altura (cm)</label><input type="number" value={form.altura} onChange={e => setForm(p => ({ ...p, altura: e.target.value }))} placeholder="175" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} /></div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Objetivo</label>
                <select value={form.objetivo || ''} onChange={e => setForm(p => ({ ...p, objetivo: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="">Selecionar objetivo</option>
                  {['Emagrecimento','Hipertrofia','Condicionamento','Saúde','Reabilitação','Performance'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Senha de acesso */}
              <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <label className="text-xs text-slate-400 block mb-1">Senha de Acesso (opcional)</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={senhaNovo}
                    onChange={e => setSenhaNovo(e.target.value)}
                    placeholder="Crie uma senha para o aluno"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <button type="button" onClick={() => setShowSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-1">Se informada, o aluno poderá fazer login com o email e esta senha.</p>
              </div>

              {/* Botão enviar WhatsApp */}
              {form.telefone && senhaNovo && form.email && (
                <button type="button" onClick={handleEnviarWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: '#25d36615', color: '#25d366', border: '1px solid #25d36630' }}>
                  <MessageCircle size={15} />Enviar credenciais via WhatsApp
                </button>
              )}
            </div>
            <button type="button" onClick={handleSave} className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>Cadastrar Aluno</button>
          </div>
        </div>,
        document.body
      )}

      {showUpgradePlano && (
        <ModalPlanosBoasVindas
          nomeProf={meuProfessor?.nome}
          professorId={professorId}
          professor={meuProfessor}
          modo="upgrade"
          updateProfessor={updateProfessor}
          addTransacao={addTransacao}
          updateTransacao={updateTransacao}
          onClose={() => {
            setShowUpgradePlano(false);
            setPendenteNovoAluno(false);
          }}
          onComplete={() => {
            setShowUpgradePlano(false);
            if (pendenteNovoAluno) {
              setPendenteNovoAluno(false);
              setForm({ ...emptyAluno, professorId });
              setEditId(null);
              setShowForm(true);
            }
          }}
        />
      )}
    </div>
  );
}
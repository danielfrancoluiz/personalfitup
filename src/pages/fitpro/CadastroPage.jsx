import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Phone, UserCheck, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp, useAuth } from '../../context/FitProContext';
import { addCredential, emailExists } from '../../lib/fitpro-storage';
import ModalPlanosBoasVindas from '../../components/fitpro/ModalPlanosBoasVindas';
import BrandLogo from '../../components/fitpro/BrandLogo';

const estados = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
];
const emptyAddr = { rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' };

export default function CadastroPage({ onBack, tipoInicial, professorIdInicial = '' }) {
  const { addAluno, addProfessor, professores } = useApp();
  const { login } = useAuth();

  const [tipo, setTipo] = useState(tipoInicial || 'escolha');
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPlanos, setShowPlanos] = useState(false);
  const [erro, setErro] = useState('');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [sexo, setSexo] = useState('M');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [endereco, setEndereco] = useState(emptyAddr);
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [professorId, setProfessorId] = useState(professorIdInicial);
  const [cref, setCref] = useState('');
  const [especialidade, setEspecialidade] = useState('');

  const setAddr = (f, v) => setEndereco(e => ({ ...e, [f]: v }));

  const handleNext = () => {
    setErro('');
    if (step === 1) {
      if (!nome.trim()) return setErro('Nome é obrigatório');
      if (!email.includes('@')) return setErro('Email inválido');
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setErro('');
    if (password.length < 6) return setErro('Senha deve ter no mínimo 6 caracteres');
    if (password !== confirmPass) return setErro('As senhas não conferem');
    const jaExiste = await emailExists(email);
    if (jaExiste) return setErro('Este email já está cadastrado');

    setLoading(true);

    if (tipo === 'aluno') {
      const alunoId = await addAluno({ nome, email, telefone, dataNascimento: dataNasc, sexo, peso: parseFloat(peso) || 0, altura: parseFloat(altura) || 0, objetivo, observacoes: '', endereco, professorId: professorId || '' });
      await addCredential({ email, password, role: 'aluno', nome, linkedId: alunoId, ativo: true, autoRegistrado: true });
      setDone(true);
      await new Promise(r => setTimeout(r, 1500));
      await login(email, password);
    } else {
      const profId = await addProfessor({ nome, email, telefone, cref, especialidade, endereco });
      await addCredential({ email, password, role: 'professor', nome, linkedId: profId, ativo: true, autoRegistrado: true });
      setShowPlanos(true);
    }

    setLoading(false);
  };

  if (showPlanos) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e1a' }}>
      <ModalPlanosBoasVindas
        nomeProf={nome}
        onClose={async () => {
          setShowPlanos(false);
          setDone(true);
          await login(email, password);
        }}
      />
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e1a' }}>
      <div className="text-center">
        <CheckCircle2 size={64} color="#34d399" className="mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Cadastro Realizado!</h2>
        <p className="text-slate-400">Entrando na plataforma...</p>
      </div>
    </div>
  );

  if (tipo === 'escolha') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0e1a' }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <BrandLogo size="medium" />
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#00AAFF15', color: '#00AAFF', border: '1px solid #00AAFF30' }}>Cadastro</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Criar conta</h2>
        <p className="text-slate-400 text-sm mb-8 text-center">Selecione o tipo de conta</p>
        <div className="space-y-3">
          <button onClick={() => setTipo('aluno')} className="w-full p-5 rounded-2xl text-left transition-all hover:scale-[1.01]" style={{ background: '#a78bfa10', border: '1px solid #a78bfa30' }}>
            <div className="flex items-center gap-3 mb-1"><Users size={20} color="#a78bfa" /><span className="font-bold text-white">Sou Aluno</span></div>
            <p className="text-sm text-slate-400 ml-8">Acesse seus treinos, avaliações, evolução e serviços de saúde</p>
          </button>
          <button onClick={() => setTipo('professor')} className="w-full p-5 rounded-2xl text-left transition-all hover:scale-[1.01]" style={{ background: '#34d39910', border: '1px solid #34d39930' }}>
            <div className="flex items-center gap-3 mb-1"><UserCheck size={20} color="#34d399" /><span className="font-bold text-white">Sou Professor</span></div>
            <p className="text-sm text-slate-400 ml-8">Gerencie alunos, crie treinos, avaliações e periodizações</p>
          </button>
          <button onClick={onBack} className="w-full mt-2 py-3 text-sm text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-1">
            <ArrowLeft size={14} />Voltar ao login
          </button>
        </div>
      </div>
    </div>
  );

  const accentColor = tipo === 'aluno' ? '#a78bfa' : '#34d399';
  const steps = ['Dados Pessoais', 'Endereço', 'Acesso'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0e1a' }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { if (step > 1) setStep(s => s - 1); else setTipo('escolha'); }}
            className="p-2 rounded-xl hover:bg-white/5"><ArrowLeft size={18} color="#9ca3af" /></button>
          <div>
            <h2 className="text-lg font-bold text-white">Cadastro de {tipo === 'aluno' ? 'Aluno' : 'Professor'}</h2>
            <p className="text-xs text-slate-500">Etapa {step} de {steps.length}: {steps[step - 1]}</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: i < step ? '100%' : '0%', background: accentColor }} />
            </div>
          ))}
        </div>

        <div className="p-5 rounded-2xl" style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.07)' }}>
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-white mb-4">Dados Pessoais</h3>
              {[
                { label: 'Nome Completo', value: nome, onChange: e => setNome(e.target.value), placeholder: 'Seu nome completo' },
                { label: 'Email', value: email, onChange: e => setEmail(e.target.value), placeholder: 'seu@email.com', type: 'email' },
                { label: 'Telefone', value: telefone, onChange: e => setTelefone(e.target.value), placeholder: '(11) 99999-9999' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                  <input {...f} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Data de Nascimento</label>
                <input type="date" value={dataNasc} onChange={e => setDataNasc(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Sexo</label>
                <select value={sexo} onChange={e => setSexo(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="M">Masculino</option><option value="F">Feminino</option>
                </select>
              </div>
              {tipo === 'aluno' && <>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-slate-400 block mb-1">Peso (kg)</label><input type="number" value={peso} onChange={e => setPeso(e.target.value)} placeholder="70.5" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} /></div>
                  <div><label className="text-xs text-slate-400 block mb-1">Altura (cm)</label><input type="number" value={altura} onChange={e => setAltura(e.target.value)} placeholder="175" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} /></div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Objetivo</label>
                  <select value={objetivo} onChange={e => setObjetivo(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <option value="">Selecionar objetivo</option>
                    {['Emagrecimento','Hipertrofia','Condicionamento','Saúde','Reabilitação','Performance'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Professor (opcional)</label>
                  <select value={professorId} onChange={e => setProfessorId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <option value="">Sem professor vinculado</option>
                    {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
              </>}
              {tipo === 'professor' && <>
                <div><label className="text-xs text-slate-400 block mb-1">CREF</label><input value={cref} onChange={e => setCref(e.target.value)} placeholder="000000-G/SP" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} /></div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Especialidade</label>
                  <select value={especialidade} onChange={e => setEspecialidade(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <option value="">Selecionar</option>
                    {['Musculação','Personal Trainer','Funcional','CrossFit','Pilates','Avaliação Física'].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-white mb-4">Endereço</h3>
              {[
                { label: 'Rua', field: 'rua', placeholder: 'Rua das Flores' },
                { label: 'Número', field: 'numero', placeholder: '123' },
                { label: 'Complemento', field: 'complemento', placeholder: 'Apto 42' },
                { label: 'Bairro', field: 'bairro', placeholder: 'Centro' },
                { label: 'CEP', field: 'cep', placeholder: '00000-000' },
                { label: 'Cidade', field: 'cidade', placeholder: 'São Paulo' },
              ].map(f => (
                <div key={f.field}><label className="text-xs text-slate-400 block mb-1">{f.label}</label><input value={endereco[f.field]} onChange={e => setAddr(f.field, e.target.value)} placeholder={f.placeholder} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} /></div>
              ))}
              <div><label className="text-xs text-slate-400 block mb-1">Estado</label>
                <select value={endereco.estado} onChange={e => setAddr('estado', e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="">Selecione o estado</option>{estados.map(s => <option key={s.uf} value={s.uf}>{s.uf} - {s.nome}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-white mb-2">Dados de Acesso</h3>
              <div className="p-3 rounded-xl text-xs space-y-1 mb-4" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
                <div className="text-slate-300">Nome: <span className="text-white">{nome}</span></div>
                <div className="text-slate-300">Email: <span className="text-white">{email}</span></div>
                <div className="text-slate-300">Tipo: <span style={{ color: accentColor }}>{tipo === 'aluno' ? 'Aluno' : 'Professor'}</span></div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Senha</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full px-3 pr-10 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Confirmar Senha</label>
                <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Repita a senha" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
            </div>
          )}

          {erro && <div className="flex items-center gap-1 text-xs text-red-400 mt-3"><AlertCircle size={12} />{erro}</div>}

          <div className="mt-4">
            {step < 3 ? (
              <button onClick={handleNext} className="w-full py-3 rounded-xl font-semibold text-sm text-white" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}>Continuar</button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}>
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Criar Conta e Entrar'}
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">Já tem conta? <button onClick={onBack} className="hover:text-white transition-colors" style={{ color: '#64748b' }}>Fazer login</button></p>
      </div>
    </div>
  );
}
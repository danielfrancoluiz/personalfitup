import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, MapPin, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/FitProContext';
import { getCredentials, updateCredential } from '../../lib/fitpro-storage';

const BORDER = 'rgba(255,255,255,0.07)';

export default function ModalEditarPerfil({ user, tipoUsuario, onClose }) {
  const { alunos, professores, updateAluno, updateProfessor } = useApp();

  const perfilAtual = tipoUsuario === 'aluno'
    ? (alunos.find(a => a.email?.toLowerCase() === user?.email?.toLowerCase()))
    : (professores.find(p => p.email?.toLowerCase() === user?.email?.toLowerCase()));

  const [form, setForm] = useState({
    nome: perfilAtual?.nome || user?.nome || '',
    email: perfilAtual?.email || user?.email || '',
    telefone: perfilAtual?.telefone || '',
    dataNascimento: perfilAtual?.dataNascimento || '',
    sexo: perfilAtual?.sexo || 'M',
    peso: perfilAtual?.peso || '',
    altura: perfilAtual?.altura || '',
    objetivo: perfilAtual?.objetivo || '',
    especialidade: perfilAtual?.especialidade || '',
    cref: perfilAtual?.cref || '',
    observacoes: perfilAtual?.observacoes || '',
    endereco: {
      rua: perfilAtual?.endereco?.rua || '',
      numero: perfilAtual?.endereco?.numero || '',
      complemento: perfilAtual?.endereco?.complemento || '',
      bairro: perfilAtual?.endereco?.bairro || '',
      cidade: perfilAtual?.endereco?.cidade || '',
      estado: perfilAtual?.endereco?.estado || '',
      cep: perfilAtual?.endereco?.cep || '',
    },
  });
  const [novaSenha, setNovaSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aba, setAba] = useState('pessoal');

  const handleSave = () => {
    if (!form.nome.trim()) return alert('Nome é obrigatório');

    if (perfilAtual?.id) {
      if (tipoUsuario === 'aluno') {
        updateAluno(perfilAtual.id, { ...form, peso: parseFloat(form.peso) || 0, altura: parseFloat(form.altura) || 0 });
      } else {
        updateProfessor(perfilAtual.id, form);
      }
    }

    // Atualiza senha nas credenciais se informada
    if (novaSenha.trim() && user?.id) {
      updateCredential(user.id, { password: novaSenha.trim() });
    }

    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  const inp = "w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none";
  const inpStyle = { background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl p-6 my-4" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white">Editar Perfil</h3>
            <p className="text-xs text-slate-500">Atualize seus dados pessoais</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X size={18} color="#6b7280" /></button>
        </div>

        {/* Avatar visual */}
        <div className="flex items-center gap-4 mb-5 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
            style={{ background: tipoUsuario === 'aluno' ? '#a78bfa25' : '#34d39925' }}>
            {(form.nome?.charAt(0) || '?').toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-white">{form.nome || 'Seu nome'}</div>
            <div className="text-xs text-slate-400">{tipoUsuario === 'aluno' ? '🎓 Aluno' : '🏋️ Professor'}</div>
            {form.email && <div className="text-xs text-slate-500">{form.email}</div>}
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {[
            { id: 'pessoal', label: '👤 Pessoal' },
            { id: 'endereco', label: '📍 Endereço' },
            { id: 'seguranca', label: '🔒 Senha' },
          ].map(t => (
            <button key={t.id} onClick={() => setAba(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: aba === t.id ? '#1e2a3a' : 'transparent', color: aba === t.id ? '#fff' : '#64748b' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ABA PESSOAL */}
        {aba === 'pessoal' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nome Completo</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Seu nome completo" className={inp} style={inpStyle} />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1"><Mail size={11} />Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="seu@email.com" className={inp} style={inpStyle} />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1"><Phone size={11} />Telefone / WhatsApp</label>
              <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                placeholder="(11) 99999-9999" className={inp} style={inpStyle} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Data de Nascimento</label>
                <input type="date" value={form.dataNascimento} onChange={e => setForm(f => ({ ...f, dataNascimento: e.target.value }))}
                  className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Sexo</label>
                <select value={form.sexo} onChange={e => setForm(f => ({ ...f, sexo: e.target.value }))}
                  className={inp} style={inpStyle}>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
            </div>
            {tipoUsuario === 'aluno' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Peso (kg)</label>
                    <input type="number" value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))}
                      placeholder="70" className={inp} style={inpStyle} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Altura (cm)</label>
                    <input type="number" value={form.altura} onChange={e => setForm(f => ({ ...f, altura: e.target.value }))}
                      placeholder="175" className={inp} style={inpStyle} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Objetivo</label>
                  <select value={form.objetivo} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))}
                    className={inp} style={inpStyle}>
                    <option value="">Selecionar</option>
                    {['Emagrecimento', 'Hipertrofia', 'Condicionamento', 'Saúde', 'Reabilitação', 'Performance'].map(o =>
                      <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Observações pessoais</label>
                  <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                    rows={2} placeholder="Lesões, restrições, informações relevantes..."
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none" style={inpStyle} />
                </div>
              </>
            )}
            {tipoUsuario === 'professor' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">CREF</label>
                  <input value={form.cref} onChange={e => setForm(f => ({ ...f, cref: e.target.value }))}
                    placeholder="000000-G/SP" className={inp} style={inpStyle} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Especialidade</label>
                  <select value={form.especialidade} onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))}
                    className={inp} style={inpStyle}>
                    <option value="">Selecionar</option>
                    {['Musculação', 'Personal Trainer', 'Funcional', 'CrossFit', 'Pilates', 'Corrida', 'Avaliação Física'].map(o =>
                      <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA ENDEREÇO */}
        {aba === 'endereco' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">CEP</label>
                <input value={form.endereco.cep} onChange={e => setForm(f => ({ ...f, endereco: { ...f.endereco, cep: e.target.value } }))}
                  placeholder="00000-000" className={inp} style={inpStyle} />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Rua / Logradouro</label>
              <input value={form.endereco.rua} onChange={e => setForm(f => ({ ...f, endereco: { ...f.endereco, rua: e.target.value } }))}
                placeholder="Nome da rua, avenida..." className={inp} style={inpStyle} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-xs text-slate-400 block mb-1">Número</label>
                <input value={form.endereco.numero} onChange={e => setForm(f => ({ ...f, endereco: { ...f.endereco, numero: e.target.value } }))}
                  placeholder="123" className={inp} style={inpStyle} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Complemento</label>
                <input value={form.endereco.complemento} onChange={e => setForm(f => ({ ...f, endereco: { ...f.endereco, complemento: e.target.value } }))}
                  placeholder="Apto, Bloco..." className={inp} style={inpStyle} />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Bairro</label>
              <input value={form.endereco.bairro} onChange={e => setForm(f => ({ ...f, endereco: { ...f.endereco, bairro: e.target.value } }))}
                placeholder="Bairro" className={inp} style={inpStyle} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Cidade</label>
                <input value={form.endereco.cidade} onChange={e => setForm(f => ({ ...f, endereco: { ...f.endereco, cidade: e.target.value } }))}
                  placeholder="Cidade" className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Estado</label>
                <select value={form.endereco.estado} onChange={e => setForm(f => ({ ...f, endereco: { ...f.endereco, estado: e.target.value } }))}
                  className={inp} style={inpStyle}>
                  <option value="">UF</option>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf =>
                    <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ABA SENHA */}
        {aba === 'seguranca' && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Lock size={14} color="#a78bfa" />
                <span className="text-sm font-semibold text-white">Alterar Senha</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">Deixe em branco para manter a senha atual.</p>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm text-white outline-none"
                  style={inpStyle}
                />
                <button type="button" onClick={() => setShowSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="p-3 rounded-xl text-xs text-slate-500" style={{ background: '#a78bfa08', border: '1px solid #a78bfa20' }}>
              💡 Use pelo menos 6 caracteres. Evite usar dados pessoais óbvios como data de nascimento.
            </div>
          </div>
        )}

        <button onClick={handleSave}
          className="w-full mt-5 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
          style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
          <Save size={15} />{saved ? '✓ Salvo com sucesso!' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
}
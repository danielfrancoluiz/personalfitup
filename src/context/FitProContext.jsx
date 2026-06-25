import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { login as doLogin, logout as doLogout, getSession, generateId } from '../lib/fitpro-storage';

// ── App Context ──────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function FitProAppProvider({ children }) {
  const [alunos, setAlunos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [planosTreino, setPlanosTreino] = useState([]);
  const [periodizacoes, setPeriodizacoes] = useState([]);
  const [especialistas, setEspecialistas] = useState([]);
  const [exerciciosBiblioteca, setExerciciosBiblioteca] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [planosCorrida, setPlanosCorrida] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [bibliotecaTreinos, setBibliotecaTreinos] = useState([]);
  const [feedbacksTreino, setFeedbacksTreino] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carrega todos os dados na inicialização
  useEffect(() => {
    async function loadAll() {
      try {
        const [
          al, pr, av, pt, per, esp, ex, prod, tr, pc, ag, bt
        ] = await Promise.all([
          base44.entities.Aluno.list(),
          base44.entities.Professor.list(),
          base44.entities.Avaliacao.list(),
          base44.entities.PlanoTreino.list(),
          base44.entities.Periodizacao.list(),
          base44.entities.Especialista.list(),
          base44.entities.ExercicioBiblioteca.list(),
          base44.entities.Produto.list(),
          base44.entities.Transacao.list(),
          base44.entities.PlanoCorrida.list(),
          base44.entities.Agenda.list(),
          base44.entities.BibliotecaTreino.list(),
        ]);
        setAlunos(al);
        setProfessores(pr);
        setAvaliacoes(av);
        setPlanosTreino(pt);
        setPeriodizacoes(per);
        setEspecialistas(esp);
        setExerciciosBiblioteca(ex);
        setProdutos(prod);
        setTransacoes(tr);
        setPlanosCorrida(pc);
        setAgenda(ag);
        setBibliotecaTreinos(bt);
      } catch (e) {
        console.error('[FitPro] loadAll error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // ── Alunos ──
  const addAluno = useCallback(async (aluno) => {
    const created = await base44.entities.Aluno.create(aluno);
    setAlunos(s => [...s, created]);
    return created.id;
  }, []);
  const updateAluno = useCallback(async (id, aluno) => {
    const updated = await base44.entities.Aluno.update(id, aluno);
    setAlunos(s => s.map(a => a.id === id ? updated : a));
  }, []);
  const deleteAluno = useCallback(async (id) => {
    await base44.entities.Aluno.delete(id);
    setAlunos(s => s.filter(a => a.id !== id));
  }, []);

  // ── Professores ──
  const addProfessor = useCallback(async (prof) => {
    const created = await base44.entities.Professor.create(prof);
    setProfessores(s => [...s, created]);
    return created.id;
  }, []);
  const updateProfessor = useCallback(async (id, prof) => {
    const updated = await base44.entities.Professor.update(id, prof);
    setProfessores(s => s.map(p => p.id === id ? updated : p));
  }, []);
  const deleteProfessor = useCallback(async (id) => {
    await base44.entities.Professor.delete(id);
    setProfessores(s => s.filter(p => p.id !== id));
  }, []);

  // ── Avaliações ──
  const addAvaliacao = useCallback(async (av) => {
    const created = await base44.entities.Avaliacao.create(av);
    setAvaliacoes(s => [...s, created]);
    return created.id;
  }, []);
  const updateAvaliacao = useCallback(async (id, av) => {
    const updated = await base44.entities.Avaliacao.update(id, av);
    setAvaliacoes(s => s.map(a => a.id === id ? updated : a));
  }, []);
  const deleteAvaliacao = useCallback(async (id) => {
    await base44.entities.Avaliacao.delete(id);
    setAvaliacoes(s => s.filter(a => a.id !== id));
  }, []);

  // ── Planos de Treino ──
  const addPlanoTreino = useCallback(async (plano) => {
    const created = await base44.entities.PlanoTreino.create(plano);
    setPlanosTreino(s => [...s, created]);
    return created.id;
  }, []);
  const updatePlanoTreino = useCallback(async (id, plano) => {
    const updated = await base44.entities.PlanoTreino.update(id, plano);
    setPlanosTreino(s => s.map(p => p.id === id ? updated : p));
  }, []);
  const deletePlanoTreino = useCallback(async (id) => {
    await base44.entities.PlanoTreino.delete(id);
    setPlanosTreino(s => s.filter(p => p.id !== id));
  }, []);

  // ── Periodizações ──
  const addPeriodizacao = useCallback(async (per) => {
    const created = await base44.entities.Periodizacao.create(per);
    setPeriodizacoes(s => [...s, created]);
    return created.id;
  }, []);
  const updatePeriodizacao = useCallback(async (id, per) => {
    const updated = await base44.entities.Periodizacao.update(id, per);
    setPeriodizacoes(s => s.map(p => p.id === id ? updated : p));
  }, []);
  const deletePeriodizacao = useCallback(async (id) => {
    await base44.entities.Periodizacao.delete(id);
    setPeriodizacoes(s => s.filter(p => p.id !== id));
  }, []);

  // ── Especialistas ──
  const addEspecialista = useCallback(async (esp) => {
    const created = await base44.entities.Especialista.create(esp);
    setEspecialistas(s => [...s, created]);
    return created.id;
  }, []);
  const updateEspecialista = useCallback(async (id, esp) => {
    const updated = await base44.entities.Especialista.update(id, esp);
    setEspecialistas(s => s.map(e => e.id === id ? updated : e));
  }, []);
  const deleteEspecialista = useCallback(async (id) => {
    await base44.entities.Especialista.delete(id);
    setEspecialistas(s => s.filter(e => e.id !== id));
  }, []);

  // ── Biblioteca de Exercícios ──
  const addExercicioBiblioteca = useCallback(async (ex) => {
    const created = await base44.entities.ExercicioBiblioteca.create(ex);
    setExerciciosBiblioteca(s => [...s, created]);
    return created.id;
  }, []);
  const updateExercicioBiblioteca = useCallback(async (id, ex) => {
    const updated = await base44.entities.ExercicioBiblioteca.update(id, ex);
    setExerciciosBiblioteca(s => s.map(e => e.id === id ? updated : e));
  }, []);
  const deleteExercicioBiblioteca = useCallback(async (id) => {
    await base44.entities.ExercicioBiblioteca.delete(id);
    setExerciciosBiblioteca(s => s.filter(e => e.id !== id));
  }, []);

  // ── Produtos ──
  const addProduto = useCallback(async (p) => {
    const created = await base44.entities.Produto.create(p);
    setProdutos(s => [...s, created]);
    return created.id;
  }, []);
  const updateProduto = useCallback(async (id, p) => {
    const updated = await base44.entities.Produto.update(id, p);
    setProdutos(s => s.map(x => x.id === id ? updated : x));
  }, []);
  const deleteProduto = useCallback(async (id) => {
    await base44.entities.Produto.delete(id);
    setProdutos(s => s.filter(x => x.id !== id));
  }, []);

  // ── Transações ──
  const addTransacao = useCallback(async (t) => {
    const created = await base44.entities.Transacao.create(t);
    setTransacoes(s => [...s, created]);
    return created.id;
  }, []);
  const updateTransacao = useCallback(async (id, t) => {
    const updated = await base44.entities.Transacao.update(id, t);
    setTransacoes(s => s.map(x => x.id === id ? updated : x));
  }, []);
  const deleteTransacao = useCallback(async (id) => {
    await base44.entities.Transacao.delete(id);
    setTransacoes(s => s.filter(x => x.id !== id));
  }, []);

  // ── Planos de Corrida ──
  const addPlanoCorrida = useCallback(async (p) => {
    const created = await base44.entities.PlanoCorrida.create(p);
    setPlanosCorrida(s => [...s, created]);
    return created.id;
  }, []);
  const updatePlanoCorrida = useCallback(async (id, p) => {
    const updated = await base44.entities.PlanoCorrida.update(id, p);
    setPlanosCorrida(s => s.map(x => x.id === id ? updated : x));
  }, []);
  const deletePlanoCorrida = useCallback(async (id) => {
    await base44.entities.PlanoCorrida.delete(id);
    setPlanosCorrida(s => s.filter(x => x.id !== id));
  }, []);

  // ── Biblioteca de Treinos (Pastas/Rotinas) ──
  const addBibliotecaTreino = useCallback(async (item) => {
    const created = await base44.entities.BibliotecaTreino.create(item);
    setBibliotecaTreinos(s => [...s, created]);
    return created.id;
  }, []);
  const updateBibliotecaTreino = useCallback(async (id, item) => {
    const updated = await base44.entities.BibliotecaTreino.update(id, item);
    setBibliotecaTreinos(s => s.map(x => x.id === id ? updated : x));
  }, []);
  const deleteBibliotecaTreino = useCallback(async (id) => {
    await base44.entities.BibliotecaTreino.delete(id);
    setBibliotecaTreinos(s => s.filter(x => x.id !== id));
  }, []);

  // ── Agenda ──
  const addAgendaEvento = useCallback(async (ev) => {
    const created = await base44.entities.Agenda.create(ev);
    setAgenda(s => [...s, created]);
    return created.id;
  }, []);
  const updateAgendaEvento = useCallback(async (id, ev) => {
    const updated = await base44.entities.Agenda.update(id, ev);
    setAgenda(s => s.map(x => x.id === id ? updated : x));
  }, []);
  const deleteAgendaEvento = useCallback(async (id) => {
    await base44.entities.Agenda.delete(id);
    setAgenda(s => s.filter(x => x.id !== id));
  }, []);

  const value = {
    // data
    alunos, professores, avaliacoes, planosTreino, periodizacoes,
    especialistas, exerciciosBiblioteca, produtos, transacoes,
    planosCorrida, agenda, bibliotecaTreinos, loading,
    // alunos
    addAluno, updateAluno, deleteAluno,
    // professores
    addProfessor, updateProfessor, deleteProfessor,
    // avaliacoes
    addAvaliacao, updateAvaliacao, deleteAvaliacao,
    // treinos
    addPlanoTreino, updatePlanoTreino, deletePlanoTreino,
    // periodizacao
    addPeriodizacao, updatePeriodizacao, deletePeriodizacao,
    // especialistas
    addEspecialista, updateEspecialista, deleteEspecialista,
    // biblioteca
    addExercicioBiblioteca, updateExercicioBiblioteca, deleteExercicioBiblioteca,
    // produtos
    addProduto, updateProduto, deleteProduto,
    // transacoes
    addTransacao, updateTransacao, deleteTransacao,
    // corrida
    addPlanoCorrida, updatePlanoCorrida, deletePlanoCorrida,
    // agenda
    addAgendaEvento, updateAgendaEvento, deleteAgendaEvento,
    // biblioteca de treinos
    addBibliotecaTreino, updateBibliotecaTreino, deleteBibliotecaTreino,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within FitProAppProvider');
  return ctx;
}

// ── Auth Context ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function FitProAuthProvider({ children }) {
  const [user, setUser] = useState(getSession);

  const login = useCallback(async (email, password) => {
    const u = await doLogin(email, password);
    if (u) { setUser(u); return true; }
    return false;
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setUser(null);
  }, []);

  const value = {
    user,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isProfessor: user?.role === 'professor',
    isAluno: user?.role === 'aluno',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within FitProAuthProvider');
  return ctx;
}
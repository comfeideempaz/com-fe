// Progresso de quem usa o app, guardado só neste aparelho (localStorage).
// Não há conta: um perfil por aparelho. Para trocar de celular, use
// exportar() e importar() (arquivo de backup em Meu progresso).
// As telas chamam subscribe() para se redesenhar quando o estado muda.

import { STORAGE_KEY, META, SEQUENCIA, MAX_ATIVIDADES } from "./config.js";
import { hojeISO, somaDias, diasEntre } from "./ui.js";

export function blankState() {
  return {
    versao: 1,
    criadoEm: new Date().toISOString(),
    perfil: { nome: "", metaTipo: META.padrao.tipo, metaValor: META.padrao.valor, tema: "auto", tamanhoLetra: 1 },
    sequencia: { atual: 0, recorde: 0, ultimoDia: null, ultimoDescanso: null },
    hoje: { data: hojeISO(), minutos: 0, capitulos: 0 },
    lidos: {},          // "gn.1": "2026-11-02"
    planos: {},         // "biblia-1-ano": { inicio, diasFeitos: [1, 2] }
    favoritos: [],      // "jo.3.16"
    santosVistos: [],
    missaVista: [],
    selos: {},          // id: data em que ganhou
    flags: {},
    atividades: [],     // { tipo, ref, titulo, quando }
  };
}

let state = carregar();
const ouvintes = new Set();

function carregar() {
  try {
    const bruto = localStorage.getItem(STORAGE_KEY);
    if (!bruto) return blankState();
    return mesclar(blankState(), JSON.parse(bruto));
  } catch {
    return blankState();
  }
}

// Garante que campos novos (de versões futuras do app) existam em estados antigos.
function mesclar(base, salvo) {
  const out = { ...base, ...salvo };
  for (const k of ["perfil", "sequencia", "hoje"]) out[k] = { ...base[k], ...(salvo[k] || {}) };
  return out;
}

function salvar() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* armazenamento cheio ou bloqueado */ }
  ouvintes.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });
}

// Zera o contador de "hoje" quando o dia virou.
function virarDia() {
  const h = hojeISO();
  if (state.hoje.data !== h) state.hoje = { data: h, minutos: 0, capitulos: 0 };
}

export function getState() { virarDia(); return state; }

export function subscribe(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); }

export function setPerfil(campos) { state.perfil = { ...state.perfil, ...campos }; salvar(); }

// Sequência mostrada hoje: continua viva se a última atividade foi hoje ou ontem,
// ou anteontem quando ainda há um dia de descanso disponível na semana.
export function sequenciaAtual() {
  const s = state.sequencia;
  if (!s.ultimoDia) return 0;
  const gap = diasEntre(s.ultimoDia, hojeISO());
  if (gap <= 1) return s.atual;
  if (gap === 2 && descansoDisponivel()) return s.atual;
  return 0;
}

function descansoDisponivel() {
  const d = state.sequencia.ultimoDescanso;
  return SEQUENCIA.descansosPorSemana > 0 && (!d || diasEntre(d, hojeISO()) >= 7);
}

// Marca que a pessoa fez algo hoje (leu um capítulo, o evangelho, uma parte da missa...).
function contarDia() {
  const s = state.sequencia, h = hojeISO();
  if (s.ultimoDia === h) return;
  const gap = s.ultimoDia ? diasEntre(s.ultimoDia, h) : null;
  if (gap === 1) s.atual += 1;
  else if (gap === 2 && descansoDisponivel()) { s.atual += 1; s.ultimoDescanso = somaDias(h, -1); }
  else s.atual = 1;
  s.ultimoDia = h;
  s.recorde = Math.max(s.recorde, s.atual);
}

// Registra uma atividade. tipo: "capitulo" | "evangelho" | "missa" | "santo" | "oracao".
export function registrar({ tipo, ref, titulo, minutos = 0 }) {
  virarDia();
  contarDia();
  if (tipo === "capitulo") {
    state.hoje.capitulos += 1;
    state.lidos[ref] = state.lidos[ref] || hojeISO();
  }
  state.hoje.minutos += minutos;
  state.atividades.unshift({ tipo, ref, titulo, quando: new Date().toISOString() });
  state.atividades = state.atividades.slice(0, MAX_ATIVIDADES);
  salvar();
}

export function adicionarMinutos(min) { virarDia(); state.hoje.minutos += min; salvar(); }

// Fração da meta do dia (0 a 1).
export function metaHoje() {
  virarDia();
  const { metaTipo, metaValor } = state.perfil;
  const feito = metaTipo === "minutos" ? Math.floor(state.hoje.minutos) : state.hoje.capitulos;
  return { tipo: metaTipo, valor: metaValor, feito, frac: Math.min(1, feito / metaValor) };
}

// Backup: devolve o texto JSON para salvar em arquivo.
export function exportar() { return JSON.stringify({ app: "catequizando", ...state }, null, 2); }

export function importar(texto) {
  const dados = JSON.parse(texto);
  if (dados.app !== "catequizando") throw new Error("Este arquivo não é um backup do Catequizando.");
  delete dados.app;
  state = mesclar(blankState(), dados);
  salvar();
}

export function apagarTudo() { state = blankState(); salvar(); }

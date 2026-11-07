// Progresso de quem usa o app. Onde ele fica depende de quem está usando:
// - conta (login): cópia no aparelho, por usuário, e na nuvem (js/conta.js sincroniza);
// - visitante: só na memória da aba (sessionStorage), some ao fechar o app;
// - sem nuvem configurada: só no aparelho, como nas versões antigas.
// js/conta.js escolhe o lugar com usarArmazenamento(). Backup em arquivo continua em
// exportar() e importar(). As telas chamam subscribe() para se redesenhar.

import { STORAGE_KEY, META, SEQUENCIA, MAX_ATIVIDADES } from "./config.js";
import { hojeISO, somaDias, diasEntre } from "./ui.js";

export function blankState() {
  return {
    versao: 1,
    criadoEm: new Date().toISOString(),
    atualizadoEm: null, // última mudança feita neste aparelho (usado na sincronização)
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
    lectios: [],        // Lectio Divina: { id, ref, origem, data, titulo, passos: { leitura, meditacao, ... }, criadoEm, atualizadoEm, concluida }
  };
}

// Onde salvar: { area: localStorage | sessionStorage, chave, aoSalvar(state) }.
let destino = { area: safeArea("localStorage"), chave: STORAGE_KEY, aoSalvar: null };
let state = carregar();
const ouvintes = new Set();

function safeArea(nome) { try { return window[nome]; } catch { return null; } }

function carregar() {
  try {
    const bruto = destino.area?.getItem(destino.chave);
    if (!bruto) return blankState();
    return mesclar(blankState(), JSON.parse(bruto));
  } catch {
    return blankState();
  }
}

// Troca o lugar do progresso (login, sair, visitante) e recarrega o estado de lá.
// area: "local" | "sessao"; aoSalvar é chamado depois de cada mudança (sincronizar).
export function usarArmazenamento({ area = "local", chave = STORAGE_KEY, aoSalvar = null } = {}) {
  destino = { area: safeArea(area === "sessao" ? "sessionStorage" : "localStorage"), chave, aoSalvar };
  state = carregar();
  avisar();
}

// Lê um progresso salvo em outra chave do aparelho (ex.: o de antes do login), ou null.
export function lerSalvo(chave) {
  try { const b = localStorage.getItem(chave); return b ? mesclar(blankState(), JSON.parse(b)) : null; } catch { return null; }
}

// Substitui o estado inteiro (veio da nuvem). Não dispara aoSalvar para não reenviar.
export function substituirEstado(novo, { enviar = false } = {}) {
  state = mesclar(blankState(), novo);
  gravar();
  if (enviar) destino.aoSalvar?.(state);
  avisar();
}

export function apagarChave(chave) { try { localStorage.removeItem(chave); } catch { /* bloqueado */ } }

export function estaVazio(st = state) {
  return !Object.keys(st.lidos).length && !Object.keys(st.planos).length && !st.atividades.length &&
    !st.lectios.length && !st.favoritos.length && !st.perfil.nome;
}

// Garante que campos novos (de versões futuras do app) existam em estados antigos.
function mesclar(base, salvo) {
  const out = { ...base, ...salvo };
  for (const k of ["perfil", "sequencia", "hoje"]) out[k] = { ...base[k], ...(salvo[k] || {}) };
  return out;
}

function gravar() {
  try { destino.area?.setItem(destino.chave, JSON.stringify(state)); } catch { /* armazenamento cheio ou bloqueado */ }
}

function avisar() {
  ouvintes.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });
}

function salvar() {
  state.atualizadoEm = new Date().toISOString();
  gravar();
  destino.aoSalvar?.(state);
  avisar();
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

// Backup: devolve o texto JSON para salvar em arquivo. O campo app segue "catequizando"
// (nome antigo) para que backups feitos antes da troca de nome continuem valendo.
export function exportar() { return JSON.stringify({ app: "catequizando", ...state }, null, 2); }

export function importar(texto) {
  const dados = JSON.parse(texto);
  if (dados.app !== "catequizando") throw new Error("Este arquivo não é um backup do app Com Fé!");
  delete dados.app;
  state = mesclar(blankState(), dados);
  salvar();
}

export function apagarTudo() { state = blankState(); salvar(); }

// ---- Marcações de conteúdo (usadas pelas telas e pelos selos) ----

export function jaLido(ref) { return !!state.lidos[ref]; }

// Desmarca um capítulo lido (se a pessoa marcou sem querer).
export function desmarcarLido(ref) { delete state.lidos[ref]; salvar(); }

export function marcarVisto(lista, id, titulo, tipo) {
  if (!state[lista].includes(id)) state[lista].push(id);
  registrar({ tipo, ref: id, titulo });
}

export function setFlag(nome, valor = true) { state.flags[nome] = valor; salvar(); }

export function contarFlag(nome, chave) {
  const atual = state.flags[nome] || [];
  if (!atual.includes(chave)) state.flags[nome] = [...atual, chave];
  salvar();
}

export function alternarFavorito(ref) {
  const i = state.favoritos.indexOf(ref);
  if (i >= 0) state.favoritos.splice(i, 1); else state.favoritos.unshift(ref);
  salvar();
  return i < 0;
}

// Projetos de leitura: { inicio: "2026-11-03", diasFeitos: [1, 2, ...], concluido: data | null }
export function iniciarPlano(id, extra = {}) {
  state.planos[id] = { inicio: hojeISO(), diasFeitos: [], concluido: null, ...extra };
  salvar();
}

export function sairPlano(id) { delete state.planos[id]; salvar(); }

export function marcarDiaPlano(id, dia, totalDias, titulo) {
  const p = state.planos[id];
  if (!p) return;
  if (!p.diasFeitos.includes(dia)) p.diasFeitos.push(dia);
  if (p.diasFeitos.length >= totalDias && !p.concluido) p.concluido = hojeISO();
  registrar({ tipo: "plano", ref: `${id}:${dia}`, titulo });
}

export function desmarcarDiaPlano(id, dia) {
  const p = state.planos[id];
  if (!p) return;
  p.diasFeitos = p.diasFeitos.filter(d => d !== dia);
  p.concluido = null;
  salvar();
}

export function ganharSelo(id) {
  if (state.selos[id]) return false;
  state.selos[id] = hojeISO();
  salvar();
  return true;
}

// ---- Lectio Divina: meditações escritas, guardadas só neste aparelho ----

export const lectio = id => state.lectios.find(l => l.id === id) || null;

// Cria uma Lectio nova para um trecho. ref = { livro, txt, trechos }.
export function novaLectio({ ref, origem = "livre", data = null, titulo = "" }) {
  const agora = new Date().toISOString();
  const l = { id: `l${Date.now().toString(36)}`, ref, origem, data, titulo, passos: {}, criadoEm: agora, atualizadoEm: agora, concluida: null };
  state.lectios.unshift(l);
  salvar();
  return l;
}

// Guarda o que a pessoa escreveu em um passo (chamado enquanto digita, com espera).
export function escreverLectio(id, passo, texto) {
  const l = lectio(id);
  if (!l) return;
  l.passos[passo] = texto;
  l.atualizadoEm = new Date().toISOString();
  salvar();
}

export function concluirLectio(id) {
  const l = lectio(id);
  if (!l) return;
  const primeira = !l.concluida;
  l.concluida = l.concluida || new Date().toISOString();
  if (primeira) registrar({ tipo: "lectio", ref: id, titulo: l.ref.txt, minutos: 10 });
  else salvar();
}

export function apagarLectio(id) {
  state.lectios = state.lectios.filter(l => l.id !== id);
  salvar();
}

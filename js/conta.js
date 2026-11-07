// Conta e sincronização do progresso (Supabase Auth + tabela comfe_progresso).
// Sem biblioteca: fala direto com a API do Supabase por fetch, para o app continuar
// leve e funcionando offline.
//
// Três modos (getModo()):
// - "conta": a pessoa entrou com e-mail e senha. O progresso fica no aparelho
//   (chave por usuário) e é enviado para a nuvem; ao abrir o app em outro aparelho
//   ele volta. Sem internet tudo continua funcionando e é enviado depois.
// - "visitante": usa o app à vontade, mas nada é salvo: o progresso só vale até
//   fechar o app (fica no sessionStorage da aba).
// - "local": a nuvem não está configurada (js/nuvem.js vazio). Igual às versões
//   antigas: tudo só no aparelho, sem tela de login.
// "fora" = ainda não escolheu: o app mostra a tela #/entrar.

import { SUPABASE_URL, SUPABASE_KEY } from "./nuvem.js";
import { STORAGE_KEY } from "./config.js";
import { usarArmazenamento, getState, substituirEstado, lerSalvo, apagarChave, estaVazio, blankState } from "./store.js";

const CHAVE_SESSAO = "comfe:sessao";
const CHAVE_VISITANTE = "comfe:visitante";       // sessionStorage: "1" enquanto a aba estiver aberta
const CHAVE_SYNC = "comfe:sync:";                 // + id: { base, sujo } da última sincronização
const chaveProgresso = id => `comfe:conta:${id}`;
const TABELA = "comfe_progresso";

export const nuvemLigada = () => !!(SUPABASE_URL && SUPABASE_KEY);

let sessao = null;     // { access_token, refresh_token, expires_at, user: { id, email } }
let modo = "fora";
const ouvintes = new Set();
let status = "ok";     // "ok" | "enviando" | "pendente" | "erro"

export const getModo = () => modo;
export const getUsuario = () => sessao?.user || null;
export const getStatusSync = () => status;
export function aoMudarConta(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); }
function avisar() { ouvintes.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }
function setStatus(s) { if (s !== status) { status = s; avisar(); } }

// ---------- armazenamento seguro ----------
function ler(area, chave) { try { const v = window[area].getItem(chave); return v ? JSON.parse(v) : null; } catch { return null; } }
function gravar(area, chave, valor) { try { window[area].setItem(chave, JSON.stringify(valor)); } catch { /* bloqueado */ } }
function remover(area, chave) { try { window[area].removeItem(chave); } catch { /* bloqueado */ } }

// ---------- API do Supabase ----------
class ErroConta extends Error {}

const MENSAGENS = {
  invalid_credentials: "E-mail ou senha incorretos.",
  "Invalid login credentials": "E-mail ou senha incorretos.",
  email_not_confirmed: "Falta confirmar o seu e-mail: abra o link que enviamos.",
  "Email not confirmed": "Falta confirmar o seu e-mail: abra o link que enviamos.",
  user_already_exists: "Já existe uma conta com este e-mail. Tente entrar.",
  "User already registered": "Já existe uma conta com este e-mail. Tente entrar.",
  weak_password: "Senha fraca: use pelo menos 6 caracteres.",
  over_email_send_rate_limit: "Muitos e-mails enviados agora. Espere alguns minutos e tente de novo.",
  over_request_rate_limit: "Muitas tentativas. Espere um pouco e tente de novo.",
  email_address_invalid: "Este e-mail não parece válido.",
  validation_failed: "Confira o e-mail e a senha.",
  same_password: "A nova senha precisa ser diferente da atual.",
};

function traduzir(corpo, http) {
  const cod = corpo?.error_code || corpo?.code;
  const msg = corpo?.msg || corpo?.error_description || corpo?.message || "";
  if (MENSAGENS[cod]) return MENSAGENS[cod];
  if (MENSAGENS[msg]) return MENSAGENS[msg];
  if (/password/i.test(msg) && /6/.test(msg)) return MENSAGENS.weak_password;
  if (http === 429) return MENSAGENS.over_request_rate_limit;
  return "Não deu certo agora. Tente de novo.";
}

async function api(caminho, { metodo = "GET", corpo, token, cabecalhos = {} } = {}) {
  if (!navigator.onLine) throw new ErroConta("Sem internet. Conecte-se para entrar na sua conta.");
  let r;
  try {
    r = await fetch(SUPABASE_URL + caminho, {
      method: metodo,
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...cabecalhos,
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroConta("Não consegui falar com o servidor. Confira a internet.");
  }
  const texto = await r.text();
  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch { dados = null; }
  if (!r.ok) { const e = new ErroConta(traduzir(dados, r.status)); e.http = r.status; throw e; }
  return dados;
}

// Endereço para onde os links dos e-mails (confirmar conta, nova senha) voltam.
const voltarPara = () => location.origin + location.pathname;
const comVolta = caminho => `${caminho}${caminho.includes("?") ? "&" : "?"}redirect_to=${encodeURIComponent(voltarPara())}`;

function guardarSessao(d) {
  if (!d?.access_token) return null;
  sessao = {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: d.expires_at || Math.floor(Date.now() / 1000) + Number(d.expires_in || 3600),
    user: { id: d.user?.id || sessao?.user?.id, email: d.user?.email || sessao?.user?.email },
  };
  gravar("localStorage", CHAVE_SESSAO, sessao);
  return sessao;
}

let renovando = null;
async function tokenValido() {
  if (!sessao) return null;
  if (sessao.expires_at - 60 > Date.now() / 1000) return sessao.access_token;
  if (!navigator.onLine) return null;
  renovando = renovando || api("/auth/v1/token?grant_type=refresh_token", { metodo: "POST", corpo: { refresh_token: sessao.refresh_token } })
    .then(guardarSessao)
    .catch(e => {
      // Sessão revogada ou vencida no servidor: pede login de novo (o progresso do aparelho continua guardado).
      if (e.http === 400 || e.http === 401 || e.http === 403) { encerrarLocal(); location.hash = "#/entrar"; }
      return null;
    })
    .finally(() => { renovando = null; });
  const s = await renovando;
  return s?.access_token || null;
}

// ---------- entrar, criar conta, sair ----------
export async function entrar(email, senha) {
  const d = await api("/auth/v1/token?grant_type=password", { metodo: "POST", corpo: { email, password: senha } });
  guardarSessao(d);
  await abrirConta({ trazerLocal: true });
}

// Devolve "pronto" (já entrou) ou "confirmar" (precisa abrir o link do e-mail).
export async function criarConta(email, senha) {
  const d = await api(comVolta("/auth/v1/signup"), { metodo: "POST", corpo: { email, password: senha } });
  if (d?.access_token) { guardarSessao(d); await abrirConta({ trazerLocal: true }); return "pronto"; }
  // Supabase devolve um usuário sem identidades quando o e-mail já existe (para não revelar contas).
  if (d?.identities && d.identities.length === 0) throw new ErroConta(MENSAGENS.user_already_exists);
  return "confirmar";
}

export async function esqueciSenha(email) {
  await api(comVolta("/auth/v1/recover"), { metodo: "POST", corpo: { email } });
}

export async function trocarSenha(nova) {
  const token = await tokenValido();
  if (!token) throw new ErroConta("Entre de novo para trocar a senha.");
  await api("/auth/v1/user", { metodo: "PUT", token, corpo: { password: nova } });
}

export function entrarComoVisitante() {
  try { sessionStorage.setItem(CHAVE_VISITANTE, "1"); } catch { /* bloqueado */ }
  modo = "visitante";
  usarArmazenamento({ area: "sessao", chave: CHAVE_VISITANTE + ":progresso" });
  avisar();
}

function encerrarLocal() {
  const id = sessao?.user?.id;
  sessao = null;
  remover("localStorage", CHAVE_SESSAO);
  if (id) { apagarChave(chaveProgresso(id)); remover("localStorage", CHAVE_SYNC + id); }
  modo = "fora";
  usarArmazenamento({ area: "sessao", chave: CHAVE_VISITANTE + ":progresso" });
  avisar();
}

// Sai da conta. Antes tenta enviar o que falta; se não der, devolve false
// (a tela pergunta se quer sair mesmo assim) a não ser que forcar = true.
export async function sair({ forcar = false } = {}) {
  if (modo === "visitante") {
    remover("sessionStorage", CHAVE_VISITANTE);
    remover("sessionStorage", CHAVE_VISITANTE + ":progresso");
    modo = "fora";
    avisar();
    return true;
  }
  if (!forcar && lerSync().sujo) {
    const ok = await enviarAgora();
    if (!ok) return false;
  }
  const token = sessao?.access_token;
  if (token && navigator.onLine) api("/auth/v1/logout", { metodo: "POST", token }).catch(() => {});
  encerrarLocal();
  return true;
}

// ---------- sincronização ----------
// base = atualizado_em da nuvem na última vez que os dois lados ficaram iguais.
// sujo = há mudança feita aqui que ainda não subiu.
const lerSync = () => ler("localStorage", CHAVE_SYNC + sessao?.user?.id) || { base: null, sujo: false };
const gravarSync = s => gravar("localStorage", CHAVE_SYNC + sessao?.user?.id, s);

let esperaEnvio = null;
function aoSalvarConta() {
  gravarSync({ ...lerSync(), sujo: true });
  setStatus("pendente");
  clearTimeout(esperaEnvio);
  esperaEnvio = setTimeout(enviarAgora, 2500);
}

let enviando = null;
export function enviarAgora() {
  clearTimeout(esperaEnvio);
  enviando = enviando || (async () => {
    if (modo !== "conta") return true;
    const token = await tokenValido();
    if (!token) { setStatus("pendente"); return false; }
    setStatus("enviando");
    try {
      const linhas = await api(`/rest/v1/${TABELA}?on_conflict=user_id`, {
        metodo: "POST", token,
        cabecalhos: { Prefer: "resolution=merge-duplicates,return=representation" },
        corpo: { user_id: sessao.user.id, dados: getState() },
      });
      gravarSync({ base: linhas?.[0]?.atualizado_em || null, sujo: false });
      setStatus("ok");
      return true;
    } catch (e) {
      console.warn("Envio do progresso falhou:", e);
      setStatus(navigator.onLine ? "erro" : "pendente");
      return false;
    }
  })().finally(() => { enviando = null; });
  return enviando;
}

async function baixar() {
  const token = await tokenValido();
  if (!token) return undefined;
  const linhas = await api(`/rest/v1/${TABELA}?user_id=eq.${sessao.user.id}&select=dados,atualizado_em`, { token });
  return linhas?.[0] || null;
}

// Junta dois progressos quando os dois aparelhos mudaram sem se falar (ex.: offline).
// Soma o que foi feito nos dois; em campos únicos fica o mais recente.
export function juntar(a, b) {
  const [velho, novo] = (a.atualizadoEm || "") > (b.atualizadoEm || "") ? [b, a] : [a, b];
  const out = { ...velho, ...novo };
  const uniao = (x = [], y = []) => [...new Set([...x, ...y])];
  out.perfil = { ...velho.perfil, ...novo.perfil, nome: novo.perfil?.nome || velho.perfil?.nome || "" };
  out.lidos = { ...novo.lidos, ...velho.lidos };
  out.favoritos = uniao(novo.favoritos, velho.favoritos);
  out.santosVistos = uniao(velho.santosVistos, novo.santosVistos);
  out.missaVista = uniao(velho.missaVista, novo.missaVista);
  out.selos = { ...novo.selos, ...velho.selos };
  out.flags = { ...velho.flags, ...novo.flags };
  for (const k of Object.keys(velho.flags || {})) {
    if (Array.isArray(velho.flags[k]) && Array.isArray(novo.flags?.[k])) out.flags[k] = uniao(velho.flags[k], novo.flags[k]);
  }
  out.planos = { ...velho.planos, ...novo.planos };
  for (const id of Object.keys(out.planos)) {
    const pv = velho.planos?.[id], pn = novo.planos?.[id];
    if (pv && pn) out.planos[id] = { ...pn, diasFeitos: uniao(pv.diasFeitos, pn.diasFeitos).sort((x, y) => x - y), concluido: pn.concluido || pv.concluido };
  }
  const lectios = new Map();
  for (const l of [...(velho.lectios || []), ...(novo.lectios || [])]) {
    const ja = lectios.get(l.id);
    if (!ja || (l.atualizadoEm || "") > (ja.atualizadoEm || "")) lectios.set(l.id, l);
  }
  out.lectios = [...lectios.values()].sort((x, y) => (y.criadoEm || "").localeCompare(x.criadoEm || ""));
  const ativ = new Map();
  for (const at of [...(velho.atividades || []), ...(novo.atividades || [])]) ativ.set(at.quando + at.ref, at);
  out.atividades = [...ativ.values()].sort((x, y) => y.quando.localeCompare(x.quando)).slice(0, 50);
  const sv = velho.sequencia || {}, sn = novo.sequencia || {};
  out.sequencia = (sv.ultimoDia || "") > (sn.ultimoDia || "") ? { ...sv } : { ...sn };
  out.sequencia.recorde = Math.max(sv.recorde || 0, sn.recorde || 0, out.sequencia.atual || 0);
  if (velho.hoje?.data === novo.hoje?.data) {
    out.hoje = { data: novo.hoje.data, minutos: Math.max(velho.hoje.minutos, novo.hoje.minutos), capitulos: Math.max(velho.hoje.capitulos, novo.hoje.capitulos) };
  }
  out.atualizadoEm = new Date().toISOString();
  return out;
}

// Traz a nuvem e acerta com o aparelho. Chamado ao entrar, ao abrir o app e ao voltar a internet.
let sincronizando = null;
export function sincronizar() {
  sincronizando = sincronizando || sincronizarJa().finally(() => { sincronizando = null; });
  return sincronizando;
}

async function sincronizarJa() {
  if (modo !== "conta" || !navigator.onLine) return;
  let remoto;
  try { remoto = await baixar(); } catch (e) { console.warn(e); setStatus("erro"); return; }
  if (remoto === undefined) { setStatus("pendente"); return; }
  const sync = lerSync();
  if (!remoto) { await enviarAgora(); return; }                       // conta nova na nuvem
  const mudouLa = remoto.atualizado_em !== sync.base;
  if (!mudouLa) { if (sync.sujo) await enviarAgora(); else setStatus("ok"); return; }
  if (!sync.sujo) {                                                      // só a nuvem mudou
    substituirEstado(remoto.dados);
    gravarSync({ base: remoto.atualizado_em, sujo: false });
    setStatus("ok");
    return;
  }
  substituirEstado(juntar(getState(), remoto.dados));                   // os dois mudaram
  await enviarAgora();
}

// Liga o progresso do usuário logado. trazerLocal: no primeiro login neste aparelho,
// se houver progresso de antes (sem conta) e a conta estiver vazia, ele vai para a conta.
async function abrirConta({ trazerLocal = false } = {}) {
  const id = sessao.user.id;
  // O que a pessoa fez como visitante nesta aba também vai para a conta que ela acabou de abrir.
  const doVisitante = modo === "visitante" ? getState() : null;
  remover("sessionStorage", CHAVE_VISITANTE);
  remover("sessionStorage", CHAVE_VISITANTE + ":progresso");
  modo = "conta";
  const jaTinhaCopia = !!lerSalvo(chaveProgresso(id));
  usarArmazenamento({ area: "local", chave: chaveProgresso(id), aoSalvar: aoSalvarConta });
  avisar();
  if (!trazerLocal || jaTinhaCopia) { await sincronizar(); return; }

  const salvoAqui = lerSalvo(STORAGE_KEY);
  const vale = st => st && !estaVazio(st);
  const antigo = vale(salvoAqui) && vale(doVisitante) ? juntar(salvoAqui, doVisitante) : vale(doVisitante) ? doVisitante : salvoAqui;
  let remoto = null;
  try { remoto = await baixar(); } catch { remoto = null; }
  if (remoto) {
    const nuvem = remoto.dados;
    const juntarAntigo = antigo && !estaVazio(antigo);
    substituirEstado(juntarAntigo ? juntar(nuvem, antigo) : nuvem);
    gravarSync({ base: remoto.atualizado_em, sujo: juntarAntigo });
    if (juntarAntigo) await enviarAgora(); else setStatus("ok");
  } else {
    substituirEstado(antigo && !estaVazio(antigo) ? antigo : blankState());
    gravarSync({ base: null, sujo: true });
    await enviarAgora();
  }
  if (salvoAqui) apagarChave(STORAGE_KEY); // agora mora na conta
}

// Volta de um link de e-mail do Supabase: #access_token=...&type=signup|recovery|magiclink
// ou #error=...&error_description=... Devolve { tipo, erro } ou null.
function lerRetornoDoEmail() {
  const h = location.hash.slice(1);
  if (!/(^|&)(access_token|error)=/.test(h)) return null;
  const p = new URLSearchParams(h);
  history.replaceState(null, "", location.pathname + location.search);
  if (p.get("error")) return { erro: p.get("error_description")?.replace(/\+/g, " ") || "O link do e-mail não vale mais." };
  return { tipo: p.get("type"), dados: { access_token: p.get("access_token"), refresh_token: p.get("refresh_token"), expires_in: p.get("expires_in"), expires_at: Number(p.get("expires_at")) || undefined } };
}

async function buscarUsuario() {
  const u = await api("/auth/v1/user", { token: sessao.access_token });
  sessao.user = { id: u.id, email: u.email };
  gravar("localStorage", CHAVE_SESSAO, sessao);
}

// Começo do app. Devolve a rota para onde ir primeiro (ou null para seguir a do endereço).
export async function iniciarConta() {
  if (!nuvemLigada()) { modo = "local"; return null; }

  const retorno = lerRetornoDoEmail();
  if (retorno?.erro) { modo = "fora"; usarArmazenamento({ area: "sessao", chave: CHAVE_VISITANTE + ":progresso" }); return `#/entrar?aviso=${encodeURIComponent(retorno.erro)}`; }
  if (retorno?.dados?.access_token) {
    guardarSessao(retorno.dados);
    try { await buscarUsuario(); } catch { /* segue com o que tem */ }
    if (sessao?.user?.id) {
      await abrirConta({ trazerLocal: true }).catch(console.warn);
      if (retorno.tipo === "recovery") return "#/entrar/nova-senha";
      return "#/inicio?bemvindo=1";
    }
  }

  sessao = ler("localStorage", CHAVE_SESSAO);
  if (sessao?.user?.id) {
    modo = "conta";
    usarArmazenamento({ area: "local", chave: chaveProgresso(sessao.user.id), aoSalvar: aoSalvarConta });
    if (lerSync().sujo) status = "pendente";
    sincronizar(); // em segundo plano: o app abre na hora, mesmo offline
    return null;
  }
  sessao = null;
  if (ler("sessionStorage", CHAVE_VISITANTE)) { entrarComoVisitante(); return null; }
  modo = "fora";
  usarArmazenamento({ area: "sessao", chave: CHAVE_VISITANTE + ":progresso" });
  return null;
}

// Volta a internet ou a pessoa volta ao app: sincroniza.
addEventListener("online", () => sincronizar());
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") sincronizar();
  else if (lerSync().sujo && modo === "conta") enviarAgora();
});

// Para onde ir depois de entrar: a rota que a pessoa tentou abrir antes do login.
// (Fica aqui e não em app.js: as telas não podem importar app.js, que é carregado com ?v=.)
let depoisDeEntrar = null;
export function lembrarRota(hash) { depoisDeEntrar = hash; }
export function rotaDepoisDeEntrar() { const r = depoisDeEntrar || "#/inicio"; depoisDeEntrar = null; return r; }

// Frase curta sobre onde o progresso fica, para as telas.
export function ondeFicaSalvo() {
  if (modo === "conta") return "Fica salvo na sua conta e volta em qualquer aparelho.";
  if (modo === "visitante") return "Como visitante, nada fica salvo depois que você fechar o app.";
  return "Fica salvo neste aparelho.";
}

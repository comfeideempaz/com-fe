// Início do app: monta o menu, aplica o tema, liga a faixa de offline e
// cuida do roteador por hash (#/inicio, #/biblia/jo/3...).
// Cada rota aponta para um arquivo em js/views/ que exporta render(el, params).

import { APP_NAME } from "./config.js";
import { ic } from "./icons.js";
import { getState, subscribe, setPerfil } from "./store.js";
import { verificar as verificarSelos } from "./selos.js";
import { dia as diaLiturgico, aplicarCor } from "./liturgia.js";
import { hojeISO, controleLetraHTML, ligarControleLetra, toast } from "./ui.js";
import { souAdmin, esquecerAdmin } from "./nuvem-api.js";
import { enviarPendentes } from "./mensagens.js";
import { iniciarConta, getModo, aoMudarConta, lembrarRota } from "./conta.js";
import { conferir as conferirLembrete } from "./lembrete.js";

// Itens do menu. "celular" = aparece na barra inferior (5 itens).
// "computador" = aparece no menu lateral (classe nav-desktop quando não está no celular).
const MENU = [
  { id: "inicio", rota: "#/inicio", rotulo: "Início", icone: "casa", celular: true, computador: true },
  { id: "biblia", rota: "#/biblia", rotulo: "Bíblia", icone: "livro", celular: true, computador: true },
  { id: "terco", rota: "#/terco", rotulo: "Terço", icone: "terco", celular: true, computador: true },
  { id: "liturgia", rota: "#/liturgia", rotulo: "Liturgia", icone: "calendario", celular: true, computador: true },
  { id: "busca", rota: "#/busca", rotulo: "Pesquisar na Bíblia", icone: "busca", computador: true },
  { id: "calendario", rota: "#/calendario", rotulo: "Ano Litúrgico", icone: "roda", computador: true },
  { id: "planos", rota: "#/planos", rotulo: "Projetos de leitura", icone: "planos", computador: true },
  { id: "lectio", rota: "#/lectio", rotulo: "Lectio Divina", icone: "pena", computador: true },
  { id: "favoritos", rota: "#/favoritos", rotulo: "Favoritos", icone: "coracao", computador: true },
  { id: "perguntas", rota: "#/perguntas", rotulo: "Perguntas da Alma", icone: "vela", computador: true },
  { id: "trilha", rota: "#/trilha", rotulo: "Trilha da Lumi", icone: "estrela", computador: true },
  { id: "curso", rota: "#/curso", rotulo: "Curso de Teologia", icone: "selo", computador: true },
  { id: "santos", rota: "#/santos", rotulo: "Santos", icone: "santo", computador: true },
  { id: "missa", rota: "#/missa", rotulo: "Missa explicada", icone: "calice", computador: true },
  { id: "oracoes", rota: "#/oracoes", rotulo: "Orações", icone: "maos", computador: true },
  { id: "sacramentos", rota: "#/sacramentos", rotulo: "Sacramentos", icone: "cruz", computador: true },
  { id: "defesa", rota: "#/defesa", rotulo: "Defesa da Fé", icone: "escudo", computador: true },
  { id: "progresso", rota: "#/progresso", rotulo: "Meu progresso", icone: "progresso", computador: true },
  { id: "voz", rota: "#/voz", rotulo: "Voz da leitura", icone: "volume", computador: true },
  { id: "contato", rota: "#/contato", rotulo: "Fale conosco", icone: "carta", computador: true },
  { id: "admin", rota: "#/admin", rotulo: "Administração", icone: "cadeado", computador: true, soAdmin: true },
  { id: "sobre", rota: "#/sobre", rotulo: "Sobre", icone: "info", computador: true },
  { id: "mais", rota: "#/mais", rotulo: "Mais", icone: "mais", celular: true },
];

// Rotas. nav = item do menu marcado como atual; params = nomes dos grupos da expressão.
const ROUTES = [
  { re: /^\/inicio$/, nav: "inicio", title: "Início", view: "inicio" },
  { re: /^\/biblia$/, nav: "biblia", title: "Bíblia", view: "biblia" },
  { re: /^\/biblia\/([a-z0-9-]+)$/, nav: "biblia", title: "Bíblia", view: "biblia", params: ["livro"] },
  { re: /^\/biblia\/([a-z0-9-]+)\/(\d+)(?:\/(\d+))?$/, nav: "biblia", title: "Bíblia", view: "biblia", params: ["livro", "cap", "v"] },
  { re: /^\/busca$/, nav: "busca", title: "Pesquisar na Bíblia", view: "busca" },
  { re: /^\/planos$/, nav: "planos", title: "Projetos de leitura", view: "planos" },
  { re: /^\/planos\/([a-z0-9-]+)$/, nav: "planos", title: "Projeto de leitura", view: "planos", params: ["plano"] },
  { re: /^\/liturgia$/, nav: "liturgia", title: "Liturgia", view: "liturgia" },
  { re: /^\/liturgia\/(\d{4}-\d{2}-\d{2})$/, nav: "liturgia", title: "Liturgia do dia", view: "liturgia", params: ["data"] },
  { re: /^\/calendario$/, nav: "calendario", title: "Ano Litúrgico", view: "calendario" },
  { re: /^\/calendario\/(\d{4}-\d{2}-\d{2})$/, nav: "calendario", title: "Ano Litúrgico", view: "calendario", params: ["data"] },
  { re: /^\/lectio$/, nav: "lectio", title: "Lectio Divina", view: "lectio" },
  { re: /^\/lectio\/dia\/(\d{4}-\d{2}-\d{2})$/, nav: "lectio", title: "Lectio Divina", view: "lectio", params: ["data"] },
  { re: /^\/lectio\/trecho\/([a-z0-9-]+)\/(\d+)\/(\d+)\/(\d+)$/, nav: "lectio", title: "Lectio Divina", view: "lectio", params: ["livro", "cap", "v1", "v2"] },
  { re: /^\/lectio\/s\/([a-z0-9]+)$/, nav: "lectio", title: "Lectio Divina", view: "lectio", params: ["id"] },
  { re: /^\/santos$/, nav: "santos", title: "Santos", view: "santos" },
  { re: /^\/santos\/([a-z0-9-]+)$/, nav: "santos", title: "Santo", view: "santos", params: ["id"] },
  { re: /^\/missa$/, nav: "missa", title: "Missa explicada", view: "missa" },
  { re: /^\/terco$/, nav: "terco", title: "Terço", view: "terco" },
  { re: /^\/oracoes$/, nav: "oracoes", title: "Orações", view: "oracoes" },
  { re: /^\/oracoes\/([a-z0-9-]+)$/, nav: "oracoes", title: "Orações", view: "oracoes", params: ["id"] },
  { re: /^\/sacramentos$/, nav: "sacramentos", title: "Sacramentos", view: "sacramentos" },
  { re: /^\/sacramentos\/([a-z0-9-]+)$/, nav: "sacramentos", title: "Sacramentos", view: "sacramentos", params: ["id"] },
  { re: /^\/defesa$/, nav: "defesa", title: "Defesa da Fé", view: "defesa" },
  { re: /^\/defesa\/([a-z0-9-]+)$/, nav: "defesa", title: "Defesa da Fé", view: "defesa", params: ["id"] },
  { re: /^\/favoritos$/, nav: "favoritos", title: "Favoritos", view: "favoritos" },
  { re: /^\/confissao$/, nav: "sacramentos", title: "Preparar minha confissão", view: "confissao" },
  { re: /^\/trilha$/, nav: "trilha", title: "Trilha da Lumi", view: "trilha" },
  { re: /^\/trilha\/([a-z0-9-]+)$/, nav: "trilha", title: "Trilha da Lumi", view: "trilha", params: ["id"] },
  { re: /^\/curso$/, nav: "curso", title: "Curso de Teologia", view: "curso" },
  { re: /^\/curso\/([a-z0-9-]+)$/, nav: "curso", title: "Curso de Teologia", view: "curso", params: ["mod"] },
  { re: /^\/curso\/([a-z0-9-]+)\/([a-z0-9-]+)$/, nav: "curso", title: "Curso de Teologia", view: "curso", params: ["mod", "aula"] },
  { re: /^\/perguntas$/, nav: "perguntas", title: "Perguntas da Alma", view: "perguntas" },
  { re: /^\/perguntas\/([a-z0-9-]+)$/, nav: "perguntas", title: "Perguntas da Alma", view: "perguntas", params: ["id"] },
  { re: /^\/contato$/, nav: "contato", title: "Fale conosco", view: "contato" },
  { re: /^\/admin$/, nav: "admin", title: "Administração", view: "admin" },
  { re: /^\/progresso$/, nav: "progresso", title: "Meu progresso", view: "progresso" },
  { re: /^\/voz$/, nav: "voz", title: "Voz da leitura", view: "voz" },
  { re: /^\/sobre$/, nav: "sobre", title: "Sobre", view: "sobre" },
  { re: /^\/mais$/, nav: "mais", title: "Mais", view: "mais" },
  { re: /^\/entrar$/, nav: "", title: "Entrar", view: "entrar", livre: true, semMenu: true },
  { re: /^\/entrar\/(criar|esqueci|nova-senha)$/, nav: "", title: "Entrar", view: "entrar", params: ["etapa"], livre: true, semMenu: true },
];

const MAIS_INCLUI = ["curso", "busca", "favoritos", "perguntas", "trilha", "contato", "admin", "calendario", "planos", "lectio", "santos", "missa", "oracoes", "sacramentos", "defesa", "progresso", "voz", "sobre"];

function montarMenu() {
  document.getElementById("nav-lista").innerHTML = MENU.map(m => {
    const classes = [m.celular ? "nav-celular" : "", m.computador ? "nav-computador" : ""].join(" ");
    return `<li class="${classes}"${m.soAdmin ? " data-so-admin hidden" : ""}><a href="${m.rota}" data-nav="${m.id}">${ic(m.icone)}<span>${m.rotulo}</span></a></li>`;
  }).join("");
}

function marcarMenu(nav) {
  document.querySelectorAll("[data-nav]").forEach(a => {
    const atual = a.dataset.nav === nav || (a.dataset.nav === "mais" && MAIS_INCLUI.includes(nav));
    if (atual) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}

// Tema que está valendo agora: o escolhido ou, em "auto", o do aparelho.
const escuroNoAparelho = matchMedia("(prefers-color-scheme: dark)");
const temaEfetivo = () => { const t = getState().perfil.tema; return t === "auto" || !t ? (escuroNoAparelho.matches ? "escuro" : "claro") : t; };

export function aplicarTema() {
  const { tema, tamanhoLetra } = getState().perfil;
  const raiz = document.documentElement;
  if (tema === "auto") raiz.removeAttribute("data-theme"); else raiz.dataset.theme = tema;
  const efetivo = temaEfetivo();
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.content = efetivo === "escuro" ? "#070F26" : "#0F2257"; });
  const b = document.getElementById("tema-botao");
  if (b) {
    const proximo = efetivo === "escuro" ? "claro" : "escuro";
    b.innerHTML = ic(efetivo === "escuro" ? "sol" : "lua");
    b.setAttribute("aria-label", `Mudar para o modo ${proximo}`);
    b.title = `Modo ${proximo}`;
  }
  raiz.style.setProperty("--escala-texto", tamanhoLetra);
  raiz.style.setProperty("--escala-leitura", getState().perfil.letraLeitura || 1);
}

let limpar = null;

let geracao = 0;

async function rotear() {
  // "#/rota?x=1": a parte depois do ? vira params.query (URLSearchParams).
  const [caminho, busca = ""] = (location.hash || "#/inicio").slice(1).split("?");
  let rota = ROUTES.find(r => r.re.test(caminho));
  // Sem login e sem ter escolhido "visitante": primeiro a tela de entrar.
  if (getModo() === "fora" && !rota?.livre) {
    if (rota && location.hash) lembrarRota(location.hash);
    location.replace("#/entrar");
    return;
  }
  if (!rota) {
    if (!location.hash || caminho === "/") { location.replace("#/inicio"); return; }
    rota = { nav: "", title: "Página não encontrada", view: "nao-encontrada" };
  }
  const params = {};
  const m = rota.re ? caminho.match(rota.re) : null;
  (rota.params || []).forEach((nome, i) => { if (m[i + 1] !== undefined) params[nome] = decodeURIComponent(m[i + 1]); });
  params.query = new URLSearchParams(busca);
  document.body.classList.toggle("sem-menu", !!rota.semMenu);

  const minha = ++geracao;
  if (typeof limpar === "function") { try { limpar(); } catch (e) { console.error(e); } }
  limpar = null;

  const el = document.getElementById("view");
  marcarMenu(rota.nav);
  if (rota.view !== "contato" && rota.view !== "admin") { try { sessionStorage.setItem("comfe:ultimaTela", `${rota.title} (${caminho})`); } catch { /* bloqueado */ } }
  document.title = `${rota.title} · ${APP_NAME}`;
  try {
    const mod = await import(`./views/${rota.view}.js`);
    if (minha !== geracao) return;
    el.innerHTML = "";
    const r = await mod.render(el, params);
    if (minha !== geracao) { if (typeof r === "function") r(); return; }
    limpar = r;
    letraNoLeitor(el);
  } catch (e) {
    console.error(e);
    el.innerHTML = `<section class="cartao"><h1 tabindex="-1">Algo deu errado</h1><p>Não consegui abrir esta tela. Tente de novo.</p></section>`;
  }
  window.scrollTo(0, 0);
  if (!rota.focusless) el.querySelector("h1")?.focus({ preventScroll: true });
}

// Leitor da Bíblia: põe os botões A− / A+ junto de "Ouvir" quando a tela ainda não os tem.
function letraNoLeitor(el) {
  const acoes = el.querySelector(".leitor-acoes");
  if (!acoes || acoes.querySelector(".controle-letra")) return;
  acoes.insertAdjacentHTML("afterbegin", controleLetraHTML());
  ligarControleLetra(acoes, { getState, setPerfil });
}

// Estilos da letra das leituras e do seletor de tradução.
function estilosExtras() {
  if (document.querySelector('link[href^="css/leitura.css"]')) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "css/leitura.css";
  document.head.appendChild(l);
}

function faixaOffline() {
  const f = document.getElementById("offline");
  const TEXTO = {
    conta: "📴 Offline: seu progresso fica no aparelho e vai para a sua conta quando a internet voltar.",
    visitante: "📴 Offline: o app funciona normalmente.",
  };
  const atualizar = () => { f.hidden = navigator.onLine; f.textContent = TEXTO[getModo()] || "📴 Offline: seu progresso fica salvo no aparelho."; };
  aoMudarConta(atualizar);
  addEventListener("online", atualizar);
  addEventListener("offline", atualizar);
  atualizar();
}

async function iniciar() {
  let primeira = null;
  try { primeira = await iniciarConta(); } catch (e) { console.error(e); }
  if (primeira) history.replaceState(null, "", primeira);
  // Ao sair da conta (ou a sessão vencer), volta para a tela de entrar.
  aoMudarConta(() => { if (getModo() === "fora" && !location.hash.startsWith("#/entrar")) location.hash = "#/entrar"; });
  estilosExtras();
  aplicarTema();
  subscribe(aplicarTema);
  escuroNoAparelho.addEventListener?.("change", aplicarTema);
  // Botão de modo claro / escuro (canto de cima, em todas as telas).
  document.getElementById("tema-botao")?.addEventListener("click", () => {
    const novo = temaEfetivo() === "escuro" ? "claro" : "escuro";
    setPerfil({ tema: novo });
    toast(novo === "escuro" ? "Modo escuro ligado." : "Modo claro ligado.");
  });
  montarMenu();
  faixaOffline();
  // Cor litúrgica do dia em todo o app.
  diaLiturgico(hojeISO()).then(d => d && aplicarCor(d.cor)).catch(() => {});
  // Selos: confere depois de cada mudança no progresso (sem travar a tela).
  let espera;
  subscribe(() => { clearTimeout(espera); espera = setTimeout(verificarSelos, 400); });
  addEventListener("hashchange", rotear);
  document.getElementById("carregando").remove();
  document.getElementById("shell").hidden = false;
  rotear();
  registrarSW();
  // Lembrete da sequência: mantém a inscrição deste aparelho em dia na nuvem.
  setTimeout(conferirLembrete, 3000);
  // Administração: mostra o item do menu só para quem é admin; mensagens guardadas sem internet saem agora.
  const conferirAdmin = async () => {
    const admin = await souAdmin().catch(() => false);
    document.querySelectorAll("[data-so-admin]").forEach(li => { li.hidden = !admin; });
    document.body.classList.toggle("eh-admin", admin);
  };
  aoMudarConta(() => { esquecerAdmin(); conferirAdmin(); });
  setTimeout(conferirAdmin, 1500);
  setTimeout(enviarPendentes, 4000);
  addEventListener("online", enviarPendentes);
}

// Offline: registra o service worker (só funciona em https ou localhost).
function registrarSW() {
  if (!("serviceWorker" in navigator)) return;
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(e => console.warn("Service worker não registrado:", e));
  });
}

iniciar();

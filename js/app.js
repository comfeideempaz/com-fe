// Início do app: monta o menu, aplica o tema, liga a faixa de offline e
// cuida do roteador por hash (#/inicio, #/biblia/jo/3...).
// Cada rota aponta para um arquivo em js/views/ que exporta render(el, params).

import { APP_NAME } from "./config.js";
import { ic } from "./icons.js";
import { lumi } from "./lumi.js";
import { getState, subscribe } from "./store.js";
import { verificar as verificarSelos } from "./selos.js";
import { dia as diaLiturgico, aplicarCor } from "./liturgia.js";
import { hojeISO } from "./ui.js";

// Itens do menu. "celular" = aparece na barra inferior (5 itens).
// "computador" = aparece no menu lateral (classe nav-desktop quando não está no celular).
const MENU = [
  { id: "inicio", rota: "#/inicio", rotulo: "Início", icone: "casa", celular: true, computador: true },
  { id: "biblia", rota: "#/biblia", rotulo: "Bíblia", icone: "livro", celular: true, computador: true },
  { id: "planos", rota: "#/planos", rotulo: "Planos", icone: "planos", celular: true, computador: true },
  { id: "liturgia", rota: "#/liturgia", rotulo: "Liturgia", icone: "calendario", celular: true, computador: true },
  { id: "santos", rota: "#/santos", rotulo: "Santos", icone: "santo", computador: true },
  { id: "missa", rota: "#/missa", rotulo: "Missa explicada", icone: "calice", computador: true },
  { id: "oracoes", rota: "#/oracoes", rotulo: "Orações", icone: "maos", computador: true },
  { id: "sacramentos", rota: "#/sacramentos", rotulo: "Sacramentos", icone: "cruz", computador: true },
  { id: "defesa", rota: "#/defesa", rotulo: "Defesa da Fé", icone: "escudo", computador: true },
  { id: "progresso", rota: "#/progresso", rotulo: "Meu progresso", icone: "progresso", computador: true },
  { id: "sobre", rota: "#/sobre", rotulo: "Sobre", icone: "info", computador: true },
  { id: "mais", rota: "#/mais", rotulo: "Mais", icone: "mais", celular: true },
];

// Rotas. nav = item do menu marcado como atual; params = nomes dos grupos da expressão.
const ROUTES = [
  { re: /^\/inicio$/, nav: "inicio", title: "Início", view: "inicio" },
  { re: /^\/biblia$/, nav: "biblia", title: "Bíblia", view: "biblia" },
  { re: /^\/biblia\/([a-z0-9-]+)$/, nav: "biblia", title: "Bíblia", view: "biblia", params: ["livro"] },
  { re: /^\/biblia\/([a-z0-9-]+)\/(\d+)(?:\/(\d+))?$/, nav: "biblia", title: "Bíblia", view: "biblia", params: ["livro", "cap", "v"] },
  { re: /^\/planos$/, nav: "planos", title: "Projetos de leitura", view: "planos" },
  { re: /^\/planos\/([a-z0-9-]+)$/, nav: "planos", title: "Projeto de leitura", view: "planos", params: ["plano"] },
  { re: /^\/liturgia$/, nav: "liturgia", title: "Liturgia", view: "liturgia" },
  { re: /^\/liturgia\/(\d{4}-\d{2}-\d{2})$/, nav: "liturgia", title: "Liturgia do dia", view: "liturgia", params: ["data"] },
  { re: /^\/santos$/, nav: "santos", title: "Santos", view: "santos" },
  { re: /^\/santos\/([a-z0-9-]+)$/, nav: "santos", title: "Santo", view: "santos", params: ["id"] },
  { re: /^\/missa$/, nav: "missa", title: "Missa explicada", view: "missa" },
  { re: /^\/oracoes$/, nav: "oracoes", title: "Orações", view: "oracoes" },
  { re: /^\/oracoes\/([a-z0-9-]+)$/, nav: "oracoes", title: "Orações", view: "oracoes", params: ["id"] },
  { re: /^\/sacramentos$/, nav: "sacramentos", title: "Sacramentos", view: "sacramentos" },
  { re: /^\/sacramentos\/([a-z0-9-]+)$/, nav: "sacramentos", title: "Sacramentos", view: "sacramentos", params: ["id"] },
  { re: /^\/defesa$/, nav: "defesa", title: "Defesa da Fé", view: "defesa" },
  { re: /^\/defesa\/([a-z0-9-]+)$/, nav: "defesa", title: "Defesa da Fé", view: "defesa", params: ["id"] },
  { re: /^\/progresso$/, nav: "progresso", title: "Meu progresso", view: "progresso" },
  { re: /^\/sobre$/, nav: "sobre", title: "Sobre", view: "sobre" },
  { re: /^\/mais$/, nav: "mais", title: "Mais", view: "mais" },
];

const MAIS_INCLUI = ["santos", "missa", "oracoes", "sacramentos", "defesa", "progresso", "sobre"];

function montarMenu() {
  document.getElementById("nav-lista").innerHTML = MENU.map(m => {
    const classes = [m.celular ? "nav-celular" : "", m.computador ? "nav-computador" : ""].join(" ");
    return `<li class="${classes}"><a href="${m.rota}" data-nav="${m.id}">${ic(m.icone)}<span>${m.rotulo}</span></a></li>`;
  }).join("");
  document.querySelector(".nav-marca-lumi").innerHTML = lumi({ tamanho: 36, rotulo: "" });
}

function marcarMenu(nav) {
  document.querySelectorAll("[data-nav]").forEach(a => {
    const atual = a.dataset.nav === nav || (a.dataset.nav === "mais" && MAIS_INCLUI.includes(nav));
    if (atual) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}

export function aplicarTema() {
  const { tema, tamanhoLetra } = getState().perfil;
  const raiz = document.documentElement;
  if (tema === "auto") raiz.removeAttribute("data-theme"); else raiz.dataset.theme = tema;
  raiz.style.setProperty("--escala-texto", tamanhoLetra);
}

let limpar = null;
let geracao = 0;

async function rotear() {
  const caminho = (location.hash || "#/inicio").slice(1);
  let rota = ROUTES.find(r => r.re.test(caminho));
  if (!rota) {
    if (!location.hash || caminho === "/") { location.replace("#/inicio"); return; }
    rota = { nav: "", title: "Página não encontrada", view: "nao-encontrada" };
  }
  const params = {};
  const m = rota.re ? caminho.match(rota.re) : null;
  (rota.params || []).forEach((nome, i) => { if (m[i + 1] !== undefined) params[nome] = decodeURIComponent(m[i + 1]); });

  const minha = ++geracao;
  if (typeof limpar === "function") { try { limpar(); } catch (e) { console.error(e); } }
  limpar = null;

  const el = document.getElementById("view");
  marcarMenu(rota.nav);
  document.title = `${rota.title} · ${APP_NAME}`;
  try {
    const mod = await import(`./views/${rota.view}.js`);
    if (minha !== geracao) return;
    el.innerHTML = "";
    const r = await mod.render(el, params);
    if (minha !== geracao) { if (typeof r === "function") r(); return; }
    limpar = r;
  } catch (e) {
    console.error(e);
    el.innerHTML = `<section class="cartao"><h1 tabindex="-1">Algo deu errado</h1><p>Não consegui abrir esta tela. Tente de novo.</p></section>`;
  }
  window.scrollTo(0, 0);
  if (!rota.focusless) el.querySelector("h1")?.focus({ preventScroll: true });
}

function faixaOffline() {
  const f = document.getElementById("offline");
  const atualizar = () => { f.hidden = navigator.onLine; };
  addEventListener("online", atualizar);
  addEventListener("offline", atualizar);
  atualizar();
}

function iniciar() {
  aplicarTema();
  subscribe(aplicarTema);
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
}

// Offline: registra o service worker (só funciona em https ou localhost).
function registrarSW() {
  if (!("serviceWorker" in navigator)) return;
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(e => console.warn("Service worker não registrado:", e));
  });
}

iniciar();

// Utilitários de tela: escapar texto, números, barras e anéis de progresso,
// datas relativas, plural e o aviso curto (toast).

import { ic } from "./icons.js";

// Sempre passe texto de dados ou do usuário por esc() antes de pôr no HTML.
export function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function formatNumber(n) {
  return new Intl.NumberFormat("pt-BR").format(n || 0);
}

export function plural(n, um, varios) {
  return `${formatNumber(n)} ${n === 1 ? um : varios}`;
}

// Barra de progresso de 0 a 1.
export function progressBar(frac, rotulo = "") {
  const pct = Math.round(Math.max(0, Math.min(1, frac || 0)) * 100);
  return `<div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(rotulo)}"><span style="width:${pct}%"></span></div>`;
}

// Anel de progresso (meta do dia). frac de 0 a 1; o centro recebe HTML pronto.
export function ring(frac, centro = "", rotulo = "") {
  const f = Math.max(0, Math.min(1, frac || 0));
  const r = 42, c = 2 * Math.PI * r;
  return `<div class="anel" role="img" aria-label="${esc(rotulo)}">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="${r}" class="anel-fundo"/>
      <circle cx="50" cy="50" r="${r}" class="anel-valor" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - f)).toFixed(1)}"/>
    </svg>
    <div class="anel-centro">${centro}</div>
  </div>`;
}

// Datas no fuso do aparelho, no formato AAAA-MM-DD.
export function hojeISO(d = new Date()) {
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function somaDias(iso, dias) {
  const [a, m, d] = iso.split("-").map(Number);
  return hojeISO(new Date(a, m - 1, d + dias));
}

export function diasEntre(isoA, isoB) {
  const t = iso => { const [a, m, d] = iso.split("-").map(Number); return Date.UTC(a, m - 1, d); };
  return Math.round((t(isoB) - t(isoA)) / 86400000);
}

export function dataExtenso(d = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(d);
}

export function relativeTime(quando) {
  const seg = Math.round((Date.now() - new Date(quando).getTime()) / 1000);
  if (seg < 60) return "agora há pouco";
  const min = Math.round(seg / 60);
  if (min < 60) return `há ${plural(min, "minuto", "minutos")}`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${plural(h, "hora", "horas")}`;
  const dias = Math.round(h / 24);
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(new Date(quando));
}

// Aviso curto no rodapé. Some sozinho depois de alguns segundos.
let toastTimer;
export function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("visivel");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visivel"), 2800);
}

// Cabeçalho padrão de tela: título (h1 que recebe o foco) e uma linha de apoio.
export function cabecalho(titulo, apoio = "") {
  return `<header class="tela-topo"><h1 tabindex="-1">${esc(titulo)}</h1>${apoio ? `<p class="apoio">${esc(apoio)}</p>` : ""}</header>`;
}

// Cartão de "em breve" usado pelas telas da Fase 1.
export function emBreve(icone, texto, itens = []) {
  return `<section class="cartao em-breve">
    <div class="em-breve-ic">${ic(icone)}</div>
    <p>${esc(texto)}</p>
    ${itens.length ? `<ul class="lista-simples">${itens.map(i => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}
    <span class="chip">Em breve</span>
  </section>`;
}

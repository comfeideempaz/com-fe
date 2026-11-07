// Fotos dos santos: imagens livres do Wikimedia Commons (pinturas antigas, ícones e
// fotos em domínio público ou com licença Creative Commons), sempre com o crédito.
//
// Cada santo tem no santoral o campo "wiki" (título do artigo na Wikipédia em inglês,
// que costuma ter a imagem mais conhecida). Com internet, o app:
//   1. pergunta à Wikipédia qual é a imagem principal do artigo;
//   2. pergunta ao Commons o endereço da miniatura, o autor e a licença;
//   3. só usa a imagem se ela estiver no Commons com licença livre.
// O resultado fica guardado no aparelho (localStorage) e a imagem no cache do
// service worker ("fotos-santos"), então depois aparece também offline.

import { esc } from "./ui.js";
import { COR_HEX } from "./liturgia.js";

const CHAVE = "comfe-fotos-v1";
const VALIDADE = 30 * 86400000;      // 30 dias para uma foto encontrada
const VALIDADE_SEM = 7 * 86400000;   // 7 dias para "sem foto" (tenta de novo depois)
const LIVRE = /(public domain|domínio público|^pd|cc0|cc[ -]by)/i;

let memoria = null;
function ler() {
  if (memoria) return memoria;
  try { memoria = JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { memoria = {}; }
  return memoria;
}
function gravar() { try { localStorage.setItem(CHAVE, JSON.stringify(memoria)); } catch { /* cheio ou bloqueado */ } }

const semTags = html => {
  const d = document.createElement("div");
  d.innerHTML = String(html || "");
  return d.textContent.replace(/\s+/g, " ").trim();
};

async function api(base, params) {
  const url = `${base}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// Segue as normalizações e redirecionamentos que a API devolve.
function seguir(q, titulo) {
  let t = titulo;
  for (const n of q.normalized || []) if (n.from === t) t = n.to;
  for (const n of q.redirects || []) if (n.from === t) t = n.to;
  return t;
}

async function buscarLote(itens) {
  // 1. Nome do arquivo da imagem principal de cada artigo.
  const titulos = itens.map(x => x.wiki);
  const w = await api("https://en.wikipedia.org/w/api.php", { action: "query", redirects: "1", prop: "pageimages", piprop: "name", titles: titulos.join("|") });
  const q = w.query || {};
  const porTitulo = {};
  Object.values(q.pages || {}).forEach(p => { if (p.pageimage) porTitulo[p.title] = p.pageimage; });
  const arquivo = {};
  itens.forEach(x => { const f = porTitulo[seguir(q, x.wiki)]; if (f) arquivo[x.id] = `File:${f}`; });

  // 2. Miniatura, autor e licença no Commons.
  const arquivos = [...new Set(Object.values(arquivo))];
  const info = {};
  if (arquivos.length) {
    const c = await api("https://commons.wikimedia.org/w/api.php", {
      action: "query", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "640",
      iiextmetadatafilter: "Artist|LicenseShortName|ObjectName|DateTimeOriginal", titles: arquivos.join("|"),
    });
    const cq = c.query || {};
    Object.values(cq.pages || {}).forEach(p => { if (!p.missing && p.imageinfo?.[0]) info[p.title] = p.imageinfo[0]; });
    arquivos.forEach(a => { const t = seguir(cq, a); if (t !== a && info[t]) info[a] = info[t]; });
  }

  const agora = Date.now();
  const cache = ler();
  itens.forEach(x => {
    const ii = info[arquivo[x.id]];
    const meta = ii?.extmetadata || {};
    const licenca = meta.LicenseShortName?.value || "";
    if (ii?.thumburl && LIVRE.test(licenca)) {
      cache[x.id] = {
        src: ii.thumburl, pagina: ii.descriptionurl, licenca,
        autor: semTags(meta.Artist?.value).slice(0, 120) || "Autor desconhecido",
        obra: semTags(meta.ObjectName?.value).slice(0, 120), t: agora,
      };
    } else cache[x.id] = { nada: true, t: agora };
  });
  gravar();
}

const valido = f => f && Date.now() - f.t < (f.nada ? VALIDADE_SEM : VALIDADE);

// Recebe [{ id, wiki }] e devolve { id: foto } só com as que têm foto.
export async function fotosDe(lista) {
  const cache = ler();
  const faltam = lista.filter(x => x.wiki && !valido(cache[x.id]));
  if (faltam.length && navigator.onLine !== false) {
    for (let k = 0; k < faltam.length; k += 45) {
      try { await buscarLote(faltam.slice(k, k + 45)); } catch (e) { console.warn("Fotos dos santos:", e); break; }
    }
  }
  const out = {};
  lista.forEach(x => { const f = cache[x.id]; if (f && !f.nada) out[x.id] = f; });
  return out;
}

export async function fotoDe(item) {
  return (await fotosDe([item]))[item.id] || null;
}

// Só o que já está guardado (sem rede), para desenhar a tela na hora.
export function fotoGuardada(id) {
  const f = ler()[id];
  return f && !f.nada ? f : null;
}

// Monograma de reserva: iniciais do nome sobre um medalhão com halo.
export function iniciais(nome) {
  const limpo = nome.replace(/^(São|Santo|Santa|Santos|Beato|Beata|Nossa Senhora( de| do| da| das)?|Sete Santos)\s+/i, "");
  return limpo.split(/[\s,]+/).filter(p => p.length > 2 && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(p)).slice(0, 2).map(p => p[0]).join("") || nome[0];
}

// Retrato redondo: foto (se já guardada) ou monograma com halo; a foto chega depois.
export function retrato(s, classe = "") {
  const f = fotoGuardada(s.id);
  return `<span class="retrato ${classe}" data-foto="${esc(s.id)}" style="--cor:${COR_HEX[s.cor] || COR_HEX.branco}">${f
    ? `<img src="${esc(f.src)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
    : `<span class="monograma">${esc(iniciais(s.nome))}</span>`}</span>`;
}

export function aplicarFotos(el, fotos) {
  el.querySelectorAll("[data-foto]").forEach(r => {
    const f = fotos[r.dataset.foto];
    if (!f || r.querySelector("img")) return;
    const img = new Image();
    img.alt = ""; img.referrerPolicy = "no-referrer"; img.loading = "lazy";
    img.onload = () => { r.innerHTML = ""; r.appendChild(img); r.classList.add("chegou"); };
    img.src = f.src;
  });
}

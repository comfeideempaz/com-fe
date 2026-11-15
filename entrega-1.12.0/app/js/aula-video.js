// Aula animada do Curso de Teologia: palco 1080x1920 com a Lumi, cenas animadas e
// legenda que acompanha a fala palavra por palavra. O mesmo código desenha o player
// do app (sincronizado com o áudio) e os vídeos MP4 (tools/video/render.html).
// criarPalco(elemento, roteiro) -> { render(t), total, ajustar(larg, alt) }

const CSS = `
.av-palco{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:hidden;transform-origin:0 0;
  background:radial-gradient(120% 80% at 50% 20%,#1B3478 0%,#0F2257 45%,#070F26 100%);font-family:Figtree,system-ui,sans-serif;color:#FFF8E6;
  --gold:#E8C268;--cream:#FFF8E6}
.av-palco *{box-sizing:border-box;margin:0}
.av-p{position:absolute;border-radius:50%;background:#E8C268}
.av-topo{position:absolute;top:70px;left:40px;right:40px;text-align:center;font-family:Cinzel,serif;letter-spacing:.18em;font-size:30px;color:#E8C268}
.av-topo small{display:block;font-family:Figtree,sans-serif;letter-spacing:.03em;font-size:26px;color:#A7B1C8;margin-top:8px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.av-cena{position:absolute;inset:0;opacity:0}
.av-abs{position:absolute;left:0;right:0}
.av-titulo{font-family:"Cormorant Garamond",Georgia,serif;font-weight:700;font-size:112px;line-height:1.02;text-align:center;color:#FFF8E6;padding:0 70px}
.av-t2{font-family:"Cormorant Garamond",Georgia,serif;font-weight:700;font-size:92px;line-height:1.05;text-align:center}
.av-rot{font-size:46px;font-weight:700;text-align:center}
.av-grande{font-family:Cinzel,serif;font-weight:700;color:#E8C268;text-align:center}
.av-chip{position:absolute;left:50%;transform:translateX(-50%);padding:14px 34px;border-radius:999px;background:rgba(232,194,104,.16);border:2px solid rgba(232,194,104,.5);color:#E8C268;font-weight:800;font-size:40px;white-space:nowrap}
.av-chips{position:absolute;left:60px;right:60px;display:flex;flex-wrap:wrap;justify-content:center;gap:18px}
.av-chips .av-chip{position:relative;left:auto;transform:none}
.av-leg{position:absolute;left:50px;right:50px;bottom:140px;text-align:center;font-size:50px;line-height:1.32;font-weight:700;color:#fff;min-height:200px;display:flex;align-items:flex-end;justify-content:center}
.av-leg span.l{background:rgba(7,15,38,.66);padding:12px 26px;border-radius:24px;-webkit-box-decoration-break:clone;box-decoration-break:clone;text-shadow:0 3px 12px rgba(0,0,0,.6)}
.av-leg i{font-style:normal;color:rgba(255,255,255,.55)}
.av-leg b{font-weight:800;color:#FFE08A}
.av-lumi{position:absolute;width:230px;height:230px;left:60px;bottom:390px}
.av-rodape{position:absolute;bottom:60px;left:0;right:0;text-align:center;font-size:28px;color:#7F8AA8;font-weight:600;letter-spacing:.04em}
.av-card{position:absolute;left:70px;right:70px;padding:38px 46px;border-radius:38px;background:rgba(255,248,230,.07);border:2px solid rgba(232,194,104,.45);
  box-shadow:0 18px 50px rgba(0,0,0,.25);font-family:"Cormorant Garamond",Georgia,serif;font-weight:700;font-size:80px;line-height:1.06;text-align:center;color:#FFF8E6}
.av-card.longo{font-size:64px}
.av-card.mlongo{font-size:52px}
.av-card .n{display:block;font-family:Cinzel,serif;font-size:28px;letter-spacing:.14em;color:#E8C268;margin-bottom:8px}
.av-kicker{position:absolute;top:220px;left:0;right:0;text-align:center;font-family:Cinzel,serif;font-size:32px;letter-spacing:.2em;color:#E8C268}
.av-dots{position:absolute;top:275px;left:0;right:0;display:flex;justify-content:center;gap:14px}
.av-dots span{width:18px;height:18px;border-radius:50%;background:rgba(232,194,104,.25)}
.av-dots span.on{background:#E8C268}
.av-marca{position:absolute;left:50%;top:760px;width:700px;height:700px;margin:-350px 0 0 -350px;font-size:520px;line-height:700px;text-align:center;opacity:.07;filter:grayscale(.2)}
.av-emoji{width:300px;height:300px;margin:0 auto;border-radius:50%;background:radial-gradient(circle at 40% 35%,rgba(232,194,104,.35),rgba(232,194,104,.08));border:4px solid rgba(232,194,104,.6);display:flex;align-items:center;justify-content:center;font-size:170px}
.av-pal{position:absolute;left:70px;right:70px;padding:34px 40px;border-radius:34px;background:rgba(255,248,230,.07);border:2px solid rgba(232,194,104,.45);text-align:center}
.av-pal .t{font-family:Cinzel,serif;font-weight:700;font-size:70px;color:#E8C268;line-height:1.1}
.av-pal .o{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-weight:600;font-size:50px;color:#D9DEE8;margin-top:12px;line-height:1.15}
.av-pal .s{font-size:40px;font-weight:600;margin-top:14px;line-height:1.3;color:#FFF8E6}
`;

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = x => 1 - Math.pow(1 - x, 3);
const easeInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = x => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function entra(el, t, a, d = .5, dy = 40) { if (!el) return; const k = easeOut(seg(t, a, a + d)); el.style.opacity = k; el.style.transform = `${el.dataset.base || ""} translateY(${(1 - k) * dy}px)`; }
function pop(el, t, a, d = .5) { if (!el) return; const k = seg(t, a, a + d); el.style.opacity = clamp(k * 3); el.style.transform = `${el.dataset.base || ""} scale(${k ? back(k) : 0})`; }
export const util = { clamp, seg, easeOut, easeInOut, back, entra, pop, esc };

function lumiSVG(humor) {
  const olhos = humor === "piscando" ? `<path d="M48 63q4 3 8 0M64 63q4 3 8 0" stroke="#2B2440" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : `<circle cx="52" cy="62" r="4.2" fill="#2B2440"/><circle cx="68" cy="62" r="4.2" fill="#2B2440"/><circle cx="53.4" cy="60.6" r="1.4" fill="#fff"/><circle cx="69.4" cy="60.6" r="1.4" fill="#fff"/>`;
  return `<svg viewBox="0 0 120 120" width="230" height="230"><rect x="40" y="96" width="8" height="16" rx="4" fill="#3A3354"/><rect x="72" y="96" width="8" height="16" rx="4" fill="#3A3354"/>
    <g fill="#FFFDF6" stroke="#E5DCCB" stroke-width="2"><circle cx="34" cy="80" r="16"/><circle cx="86" cy="80" r="16"/><circle cx="46" cy="94" r="15"/><circle cx="74" cy="94" r="15"/><circle cx="60" cy="98" r="14"/></g>
    <ellipse cx="34" cy="58" rx="10" ry="6" transform="rotate(-25 34 58)" fill="#3A3354"/><ellipse cx="86" cy="58" rx="10" ry="6" transform="rotate(25 86 58)" fill="#3A3354"/>
    <ellipse cx="60" cy="66" rx="22" ry="21" fill="#F4E7DA"/><g fill="#FFFDF6" stroke="#E5DCCB" stroke-width="2"><circle cx="46" cy="44" r="10"/><circle cx="60" cy="38" r="11"/><circle cx="74" cy="44" r="10"/></g>
    ${olhos}<circle cx="45" cy="70" r="4" fill="#F2A7A7" opacity=".7"/><circle cx="75" cy="70" r="4" fill="#F2A7A7" opacity=".7"/>
    <path class="av-boca" d="M55 73q5 5 10 0" stroke="#2B2440" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M40 84q20 10 40 0l-3 8q-17 7-34 0z" fill="#2E7D4F"/><path d="M66 89l8 14-11-4z" fill="#2E7D4F"/></svg>`;
}

// Legenda: junta as palavras faladas em blocos curtos (até ~40 letras, quebrando na pontuação).
function blocos(tokens) {
  const out = []; let cur = [];
  const fecha = () => { if (cur.length) out.push(cur); cur = []; };
  for (const tk of tokens) {
    const len = cur.reduce((s, x) => s + x[1].length + 1, 0);
    if (cur.length && len + tk[1].length > 44) fecha();
    cur.push(tk);
    const l2 = len + tk[1].length;
    if (/[.!?:;]["”»)]?$/.test(tk[1]) && l2 > 14) fecha();
    else if (/,["”»]?$/.test(tk[1]) && l2 > 26) fecha();
  }
  fecha();
  return out.map((b, i) => ({ a: b[0][0], fim: b[b.length - 1][0] + .45, palavras: b }));
}

let cssPosto = false;
export async function criarPalco(alvo, rot, opcoes = {}) {
  if (!cssPosto) { const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s); cssPosto = true; }
  const icone = opcoes.icone || "icons/icon-512.png";
  const palco = document.createElement("div"); palco.className = "av-palco";
  const P = [...Array(34)].map((_, i) => { const r = Math.sin(i * 91.7) * 43758.5453; const f = r - Math.floor(r); const g = (Math.sin(i * 12.9) * 9999) % 1; return { x: f * 1080, y: Math.abs(g) * 1920, s: 3 + (i % 5) * 2, v: 8 + (i % 7) * 4, o: .15 + (i % 4) * .08 }; });
  palco.innerHTML = `<div class="av-part">${P.map(p => `<div class="av-p" style="width:${p.s}px;height:${p.s}px;opacity:${p.o}"></div>`).join("")}</div>
    <div class="av-topo">COM FÉ! · CURSO DE TEOLOGIA<small>${esc(rot.piloto ? "Módulo 2 · O mundo da Bíblia" : `Módulo ${rot.n} · ${rot.titulo}`)}</small></div>
    <div class="av-cenas"></div><div class="av-lumi"></div><div class="av-leg"></div><div class="av-rodape"></div>`;
  alvo.appendChild(palco);
  const q = s => palco.querySelector(s);
  const parts = [...palco.querySelectorAll(".av-p")];
  const cenasEl = q(".av-cenas");
  const LUMI = { feliz: lumiSVG("feliz"), piscando: lumiSVG("piscando") }; let humor = "";
  let piloto = null;
  if (rot.piloto) { piloto = await import("./aula-video-piloto.js"); piloto.montar(cenasEl, { icone, util }); }

  // monta as cenas genéricas
  const cenas = rot.cenas.map((c, i) => {
    const el = document.createElement("section"); el.className = "av-cena";
    if (!piloto) el.innerHTML = htmlCena(c, rot, icone);
    else el.appendChild(piloto.secao(c.id) || document.createElement("div"));
    cenasEl.appendChild(el);
    el.querySelectorAll(".av-chip").forEach(e => { if (!e.closest(".av-chips")) e.dataset.base = "translateX(-50%)"; });
    return { ...c, el };
  });
  if (piloto) piloto.preparo();
  if (piloto) cenasEl.querySelectorAll(".av-chip").forEach(e => { if (!e.closest(".av-chips")) e.dataset.base = "translateX(-50%)"; });
  const todas = rot.cenas.flatMap(c => c.tok || []);
  const LEG = blocos(todas);
  const total = rot.total;

  function render(t) {
    parts.forEach((p, i) => { const o = P[i]; p.style.transform = `translate(${o.x + Math.sin(t * .3 + i) * 20}px, ${((o.y - t * o.v) % 1920 + 1920) % 1920}px)`; });
    let atual = null;
    for (let i = 0; i < cenas.length; i++) {
      const c = cenas[i]; const ultima = i === cenas.length - 1;
      const vis = t >= c.a && (t < c.b || (ultima && t >= c.b));
      if (!vis) { if (c.el.style.opacity !== "0") c.el.style.opacity = 0; continue; }
      const op = Math.min(seg(t, c.a, c.a + .4), ultima ? 1 : 1 - seg(t, c.b - .3, c.b));
      c.el.style.opacity = op; atual = c;
      if (piloto) piloto.CENA[c.id]?.(t - c.a, c.b - c.a, t);
      else desenhar(c, t);
    }
    // legenda
    let bl = null;
    for (let i = 0; i < LEG.length; i++) { const b = LEG[i], prox = LEG[i + 1]; const fim = Math.min(b.fim + 1.2, prox ? prox.a : Infinity); if (t >= b.a - .05 && t < fim) { bl = b; break; } }
    const leg = q(".av-leg");
    const html = bl ? `<span class="l">${bl.palavras.map((w, k) => { const prox = bl.palavras[k + 1]; const falando = t >= w[0] && (!prox || t < prox[0]); return t < w[0] ? `<i>${esc(w[1])}</i>` : falando && t < bl.fim ? `<b>${esc(w[1])}</b>` : esc(w[1]); }).join(" ")}</span>` : "";
    if (leg._h !== html) { leg.innerHTML = html; leg._h = html; }
    // Lumi
    const ph = (t % 4.3) > 4.1 ? "piscando" : "feliz";
    if (ph !== humor) { q(".av-lumi").innerHTML = LUMI[ph]; humor = ph; }
    const fala = bl && t < bl.fim ? Math.abs(Math.sin(t * 13)) : 0;
    q(".av-lumi").style.transform = `translateY(${Math.sin(t * 2.2) * 10}px) rotate(${Math.sin(t * 1.3) * 3}deg)`;
    const boca = q(".av-boca"); if (boca) boca.setAttribute("d", `M55 73q5 ${5 + fala * 5} 10 0`);
    const rod = q(".av-rodape");
    const txtRod = piloto ? (atual && /denario|talento|lepto|medidas|horas/.test(atual.id) ? "Valores aproximados" : "") : (atual && atual.tipo === "ponto" && atual.refs?.length ? "Fontes: Bíblia e Catecismo da Igreja Católica" : "");
    if (rod.textContent !== txtRod) rod.textContent = txtRod;
  }

  function ajustar(larg, alt) {
    const s = Math.min(larg / 1080, alt / 1920);
    palco.style.transform = `translate(${(larg - 1080 * s) / 2}px, ${(alt - 1920 * s) / 2}px) scale(${s})`;
  }
  render(0);
  return { render, total, ajustar, palco };
}

// destaques da cena; se o primeiro demora, abre com o começo da frase
function listaDest(c) {
  const d = c.destaques || [];
  const ini = (c.tok || [])[0]?.[0] ?? c.a;
  if (d.length && d[0].t - ini < 4) return d;
  const frase = (c.tok || []).slice(0, 10).map(x => x[1]).join(" ").replace(/[,;:.]$/, "");
  return [{ t: c.a + .3, txt: frase + "…", cit: true }, ...d];
}
function tamCard(txt) { return txt.length > 70 ? "mlongo" : txt.length > 34 ? "longo" : ""; }

function htmlCena(c, rot, icone) {
  if (c.tipo === "abertura") return `
    <div class="av-abs" style="top:330px"><div class="av-emoji" data-k="e">${esc(rot.emoji || "✝️")}</div></div>
    <div class="av-abs av-rot" data-k="m" style="top:690px;color:#E8C268;font-size:42px;padding:0 60px">${esc(c.modulo)}</div>
    <div class="av-abs" data-k="t" style="top:790px"><div class="av-titulo" style="font-size:${c.titulo.length > 40 ? 88 : 108}px">${esc(c.titulo)}</div></div>`;
  if (c.tipo === "ponto") {
    const dest = listaDest(c);
    return `<div class="av-marca" data-k="w">${esc(rot.emoji || "✝️")}</div>
      <div class="av-kicker" data-k="k">PARTE ${c.n} DE ${c.total}</div>
      <div class="av-dots" data-k="d">${Array.from({ length: c.total }, (_, i) => `<span class="${i < c.n ? "on" : ""}"></span>`).join("")}</div>
      ${dest.map((d, i) => `<div class="av-card ${d.cit ? "mlongo" : tamCard(d.txt)}" data-card="${i}" style="opacity:0">${esc(d.txt)}</div>`).join("")}
      <div class="av-chips" data-k="refs" style="top:1190px">${(c.refs || []).map((r, i) => `<span class="av-chip" data-ref="${i}" style="opacity:0">${esc(r.txt)}</span>`).join("")}</div>`;
  }
  if (c.tipo === "palavras") return `
    <div class="av-abs av-t2" data-k="h" style="top:240px">De onde vem<br>a palavra</div>
    ${c.palavras.map((p, i) => `<div class="av-pal" data-pal="${i}" style="top:${500 + i * 380}px;opacity:0"><div class="t">${esc(p.termo)}</div><div class="o">${esc(p.origem)}</div><div class="s">${esc(p.sentido)}</div></div>`).join("")}`;
  if (c.tipo === "biblia") return `
    <div class="av-abs av-t2" data-k="h" style="top:250px">Leia na Bíblia</div>
    <div class="av-abs" data-k="livro" style="top:430px;display:flex;justify-content:center">
      <svg width="420" height="300" viewBox="0 0 140 100"><path d="M70 22 C55 12 30 10 10 14 V88 C30 84 55 86 70 96 Z" fill="#FFF8E6" stroke="#E8C268" stroke-width="3"/><path d="M70 22 C85 12 110 10 130 14 V88 C110 84 85 86 70 96 Z" fill="#F4E7DA" stroke="#E8C268" stroke-width="3"/>
      <g stroke="#C7B9A0" stroke-width="2"><line x1="20" y1="30" x2="60" y2="34"/><line x1="20" y1="42" x2="60" y2="46"/><line x1="20" y1="54" x2="60" y2="58"/><line x1="80" y1="34" x2="120" y2="30"/><line x1="80" y1="46" x2="120" y2="42"/><line x1="80" y1="58" x2="120" y2="54"/></g>
      <path d="M100 8 v30 l6-5 6 5 V8z" fill="#8E1F3A"/></svg></div>
    <div class="av-chips" style="top:800px;gap:24px">${c.refs.map((r, i) => `<span class="av-chip" data-ref="${i}" style="opacity:0;font-size:46px">${esc(r.txt)}</span>`).join("")}</div>`;
  if (c.tipo === "final") return `
    <div class="av-abs" style="top:330px;display:flex;justify-content:center"><img data-k="i" src="${esc(icone)}" width="340" height="340" style="border-radius:70px;box-shadow:0 20px 60px rgba(0,0,0,.5)"></div>
    <div class="av-abs av-titulo" style="top:740px;font-size:96px" data-k="f1">Com Fé!</div>
    <div class="av-abs av-rot" style="top:870px" data-k="f2">Agora faça o quiz<br>desta aula no app</div>
    <div class="av-chip" data-k="f3" style="top:1040px">com-fe-omega.vercel.app</div>`;
  return "";
}

function desenhar(c, t) {
  const lt = t - c.a, el = c.el;
  const k = s => el.querySelector(`[data-k="${s}"]`);
  if (c.tipo === "abertura") {
    pop(k("e"), lt, .1, .7); entra(k("m"), lt, .5); pop(k("t"), lt, .9, .7);
    const e = k("e"); if (e && lt > .8) e.style.transform = `rotate(${Math.sin(t * 1.2) * 4}deg) scale(${1 + Math.sin(t * 2) * .02})`;
  } else if (c.tipo === "ponto") {
    entra(k("k"), lt, .1, .4, 20); entra(k("d"), lt, .25, .4, 20);
    const w = k("w"); if (w) w.style.transform = `rotate(${t * 4 % 360}deg) scale(${1 + Math.sin(t * .7) * .05})`;
    // cartões em pilha: os 3 mais recentes, o mais novo entra por baixo
    const cards = [...el.querySelectorAll("[data-card]")];
    const dest = listaDest(c);
    const ini = dest.map(d => Math.max(d.t, c.a + .35));
    const vis = cards.map((_, i) => i).filter(i => t >= ini[i]);
    const ultimos = vis.slice(-3);
    const alturas = cards.map(x => x.offsetHeight || 120);
    const topo = 380, gap = 40;
    const posDe = lista => { const p = {}; let y = topo; for (const i of lista) { p[i] = y; y += alturas[i] + gap; } return p; };
    const novo = ultimos[ultimos.length - 1];
    const kk = novo === undefined ? 1 : easeOut(seg(t, ini[novo], ini[novo] + .55));
    const antes = posDe(vis.slice(-4, -1).slice(-3)), depois = posDe(ultimos);
    cards.forEach((x, i) => {
      if (!vis.includes(i)) { x.style.opacity = 0; return; }
      if (!ultimos.includes(i)) { // saindo
        const sai = i === vis[vis.length - 4]; const y0 = antes[i] ?? topo;
        x.style.opacity = sai ? 1 - kk : 0; x.style.transform = `translateY(${y0 - kk * 80}px)`; return;
      }
      if (i === novo) { const y = depois[i]; x.style.opacity = kk; x.style.transform = `translateY(${y + (1 - kk) * 70}px) scale(${.96 + .04 * kk})`; return; }
      const y0 = antes[i] ?? depois[i], y1 = depois[i];
      x.style.opacity = 1; x.style.transform = `translateY(${y0 + (y1 - y0) * kk}px)`;
    });
    // fontes: aparecem quando citadas
    el.querySelectorAll("[data-ref]").forEach((x, i) => pop(x, t, Math.max(c.refs[i].t, c.a + .5), .45));
  } else if (c.tipo === "palavras") {
    entra(k("h"), lt, .1);
    el.querySelectorAll("[data-pal]").forEach((x, i) => entra(x, t, Math.max(c.palavras[i].t ?? c.a, c.a + .4), .6, 60));
  } else if (c.tipo === "biblia") {
    entra(k("h"), lt, .1); pop(k("livro"), lt, .3, .6);
    el.querySelectorAll("[data-ref]").forEach((x, i) => pop(x, lt, 1 + i * .35, .45));
  } else if (c.tipo === "final") {
    pop(k("i"), lt, .1, .7); entra(k("f1"), lt, .6); entra(k("f2"), lt, 1.1); pop(k("f3"), lt, 1.8);
  }
}

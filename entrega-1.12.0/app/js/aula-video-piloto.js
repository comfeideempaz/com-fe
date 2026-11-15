// Cenas próprias do piloto "O mundo da Bíblia" (moedas, medidas e horas).
let R = null, ICONE = "icons/icon-512.png", U = null;
const $ = id => R.querySelector("#" + id);
const HTML = {
  "01-abertura": () => `<div class="av-abs" style="top:430px"><div class="av-titulo" id="c1t">O mundo<br>da Bíblia</div></div>
    <div class="av-abs av-rot" id="c1s" style="top:760px;color:var(--gold)">Moedas · Medidas · Horas</div>
    <div class="av-abs" style="top:900px;display:flex;justify-content:center;gap:70px" id="c1i">
      <svg width="190" height="190" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#D9DEE8" stroke="#9AA3B5" stroke-width="5"/><circle cx="50" cy="50" r="32" fill="none" stroke="#9AA3B5" stroke-width="2" stroke-dasharray="3 4"/><text x="50" y="60" font-size="30" text-anchor="middle" font-family="Cinzel" fill="#5B6480">D</text></svg>
      <svg width="190" height="190" viewBox="0 0 100 100"><rect x="8" y="36" width="84" height="28" rx="5" fill="#E8C268" stroke="#B8862B" stroke-width="3"/><g stroke="#7a5a1c" stroke-width="3"><line x1="20" y1="36" x2="20" y2="50"/><line x1="32" y1="36" x2="32" y2="46"/><line x1="44" y1="36" x2="44" y2="50"/><line x1="56" y1="36" x2="56" y2="46"/><line x1="68" y1="36" x2="68" y2="50"/><line x1="80" y1="36" x2="80" y2="46"/></g></svg>
      <svg width="190" height="190" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#FFF8E6" stroke="#E8C268" stroke-width="6"/><line x1="50" y1="50" x2="50" y2="22" stroke="#0F2257" stroke-width="6" stroke-linecap="round"/><line x1="50" y1="50" x2="70" y2="58" stroke="#0F2257" stroke-width="6" stroke-linecap="round"/></svg>
    </div>`,
  "02-denario": () => `<div class="av-abs av-t2" style="top:260px">O denário</div>
    <div class="av-abs" style="top:430px;display:flex;justify-content:center"><div id="moeda" style="width:440px;height:440px">
      <svg width="440" height="440" viewBox="0 0 200 200"><defs><radialGradient id="prata" cx="40%" cy="35%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#D9DEE8"/><stop offset="1" stop-color="#8E97AA"/></radialGradient></defs>
        <circle cx="100" cy="100" r="92" fill="url(#prata)" stroke="#7D8699" stroke-width="6"/>
        <circle cx="100" cy="100" r="74" fill="none" stroke="#7D8699" stroke-width="2.5" stroke-dasharray="4 5"/>
        <path d="M70 128 q2-40 30-52 q26-8 30 18 q4 22-14 30 q10 6 8 16 q-30 4-54-12z" fill="#A6AEC0" stroke="#6E778B" stroke-width="2"/>
        <path d="M86 80 q6-12 20-10" stroke="#6E778B" stroke-width="4" fill="none" stroke-linecap="round"/>
        <text x="100" y="46" font-size="15" text-anchor="middle" font-family="Cinzel" font-weight="700" fill="#5B6480" letter-spacing="2">DENARIUS</text>
      </svg></div></div>
    <div class="av-abs av-rot" id="c2a" style="top:910px">≈ 3,9 g de prata</div>
    <div class="av-abs" id="c2b" style="top:1010px;display:flex;justify-content:center;align-items:center;gap:30px">
      <span class="av-grande" style="font-size:66px">1 denário</span><span style="font-size:70px;font-weight:800">=</span>
      <span class="av-grande" style="font-size:66px">1 dia de trabalho</span></div>
    <div class="av-chip" id="c2c" style="top:1150px">Mt 20,2</div>`,
  "03-talento": () => `<div class="av-abs av-t2" style="top:250px">O talento</div>
    <div class="av-abs av-rot" id="c3a" style="top:370px;color:#A7B1C8">um peso de 26 a 34 kg de prata</div>
    <div class="av-abs" style="top:460px;display:flex;justify-content:center"><div id="grade" style="width:780px;height:330px;display:grid;grid-template-columns:repeat(20,1fr);gap:6px"></div></div>
    <div class="av-abs av-grande" id="c3n" style="top:820px;font-size:110px">0</div>
    <div class="av-abs av-rot" style="top:950px" id="c3m">denários</div>
    <div class="av-abs av-rot" id="c3b" style="top:1030px;color:var(--gold)">≈ 20 anos de trabalho</div>
    <div class="av-abs" id="c3c" style="top:1110px;text-align:center"><span class="av-rot" style="font-size:44px">5 talentos ≈ <b style="color:var(--gold)">100 anos</b> de salário!</span></div>
    <div class="av-abs" id="c3d" style="top:1190px;text-align:center"><span class="av-t2" style="font-size:70px">talento</span><span class="av-rot" style="font-size:60px;margin:0 22px">→</span><span class="av-t2" style="font-size:70px;color:var(--gold)">dom</span></div>
    <div class="av-chip" id="c3e" style="top:1290px">Mt 25,14-30</div>`,
  "04-lepto": () => `<div class="av-abs av-t2" style="top:260px">O lepto</div>
    <div class="av-abs av-rot" id="c4a" style="top:380px;color:#A7B1C8">a menor moeda, de cobre</div>
    <svg class="av-abs" style="top:470px;left:190px" width="700" height="560" viewBox="0 0 700 560">
      <g id="l1"><circle cx="300" cy="80" r="38" fill="#C9773A" stroke="#8A4B1E" stroke-width="6"/><circle cx="300" cy="80" r="22" fill="none" stroke="#8A4B1E" stroke-width="3"/></g>
      <g id="l2"><circle cx="400" cy="80" r="38" fill="#C9773A" stroke="#8A4B1E" stroke-width="6"/><circle cx="400" cy="80" r="22" fill="none" stroke="#8A4B1E" stroke-width="3"/></g>
      <path d="M150 300 h400 l-40 220 h-320z" fill="#6B4A2B" stroke="#E8C268" stroke-width="6"/>
      <rect x="250" y="286" width="200" height="22" rx="8" fill="#2a1a0c" stroke="#E8C268" stroke-width="4"/>
      <text x="350" y="430" text-anchor="middle" font-family="Cinzel" font-size="34" fill="#E8C268">TESOURO</text>
    </svg>
    <div class="av-abs" id="c4b" style="top:1060px;text-align:center"><span class="av-rot">2 leptos = </span><span class="av-grande" style="font-size:56px">tudo o que ela tinha</span></div>
    <div class="av-chip" id="c4c" style="top:1150px">Mc 12,41-44</div>`,
  "05-medidas": () => `<div class="av-abs av-t2" style="top:250px">As medidas</div>
    <div id="m1" class="av-abs" style="top:380px">
      <svg style="display:block;margin:0 auto" width="820" height="260" viewBox="0 0 820 260">
        <path d="M120 170 q40-30 120-30 h360 q50 0 80 -10 l40 -6 q20 2 10 18 l-40 18 q-30 14-90 16 h-360 q-70 4-110 30z" fill="#F4E7DA" stroke="#C7A985" stroke-width="5"/>
        <circle cx="140" cy="170" r="26" fill="#F4E7DA" stroke="#C7A985" stroke-width="5"/>
        <line id="regua" x1="140" y1="235" x2="760" y2="235" stroke="#E8C268" stroke-width="8" stroke-linecap="round"/>
        <line x1="140" y1="215" x2="140" y2="255" stroke="#E8C268" stroke-width="6"/><line x1="760" y1="215" x2="760" y2="255" stroke="#E8C268" stroke-width="6"/>
      </svg>
      <div class="av-rot" style="margin-top:6px"><b class="av-grande" style="font-size:52px">côvado</b> ≈ 45 cm · do cotovelo à ponta dos dedos</div>
    </div>
    <div id="m2" class="av-abs" style="top:720px">
      <svg style="display:block;margin:0 auto" width="880" height="240" viewBox="0 0 880 240">
        <path id="estrada" d="M90 170 C 250 40, 420 220, 600 110 S 790 90, 800 80" fill="none" stroke="#A7B1C8" stroke-width="10" stroke-dasharray="20 16" stroke-linecap="round"/>
        <circle cx="90" cy="170" r="20" fill="#E8C268"/><circle cx="800" cy="80" r="20" fill="#E8C268"/>
        <text x="90" y="225" text-anchor="middle" font-size="34" font-weight="700" fill="#FFF8E6" font-family="Figtree">Jerusalém</text>
        <text x="800" y="40" text-anchor="middle" font-size="34" font-weight="700" fill="#FFF8E6" font-family="Figtree">Emaús</text>
        <circle id="caminhante" r="16" fill="#fff"/>
      </svg>
      <div class="av-rot"><b class="av-grande" style="font-size:52px">60 estádios</b> ≈ 11 km</div><div class="av-chip" style="position:relative;display:inline-block;left:50%;margin-top:14px">Lc 24,13</div>
    </div>
    <div id="m3" class="av-abs" style="top:1080px;display:flex;justify-content:center;align-items:center;gap:40px">
      <svg width="200" height="240" viewBox="0 0 100 120"><defs><clipPath id="jarro"><path d="M30 10 h40 v10 q18 10 18 40 q0 50-38 55 q-38-5-38-55 q0-30 18-40z"/></clipPath></defs>
        <g clip-path="url(#jarro)"><rect x="0" y="0" width="100" height="120" fill="#3A3354"/><rect id="vinho" x="0" y="120" width="100" height="120" fill="#8E1F3A"/></g>
        <path d="M30 10 h40 v10 q18 10 18 40 q0 50-38 55 q-38-5-38-55 q0-30 18-40z" fill="none" stroke="#E8C268" stroke-width="4"/></svg>
      <div><div class="av-grande" style="font-size:56px;text-align:left">80 a 120 L</div><div class="av-rot" style="text-align:left">em cada talha de Caná</div><div class="av-chip" style="position:relative;left:0;transform:none;display:inline-block;margin-top:12px">Jo 2,6</div></div>
    </div>`,
  "06-horas": () => `<div class="av-abs av-t2" style="top:250px">As horas</div>
    <svg class="av-abs" style="top:380px;left:90px" width="900" height="520" viewBox="0 0 900 520">
      <path d="M60 440 A 390 390 0 0 1 840 440" fill="none" stroke="rgba(232,194,104,.35)" stroke-width="6" stroke-dasharray="14 12"/>
      <line x1="20" y1="440" x2="880" y2="440" stroke="#A7B1C8" stroke-width="4"/>
      <g id="marcas" font-family="Figtree" font-weight="800" text-anchor="middle"></g>
      <g id="sol"><circle r="46" fill="#FFD36B"/><circle r="64" fill="none" stroke="#FFD36B" stroke-width="5" stroke-dasharray="6 14"/></g>
    </svg>
    <div class="av-abs" id="h1" style="top:940px;text-align:center"><span class="av-rot">nascer do sol ≈ </span><span class="av-grande" style="font-size:60px">6h</span></div>
    <div class="av-abs" id="hlista" style="top:1030px;display:flex;justify-content:center;gap:34px"></div>
    <div class="av-chip" id="hc" style="top:1230px">Mc 15,25.33-34</div>`,
  "07-final": () => `<div class="av-abs" style="top:330px;display:flex;justify-content:center"><img id="icone" src="${ICONE}" width="340" height="340" style="border-radius:70px;box-shadow:0 20px 60px rgba(0,0,0,.5)"></div>
    <div class="av-abs av-titulo" style="top:740px;font-size:96px" id="f1">Com Fé!</div>
    <div class="av-abs av-rot" style="top:870px" id="f2">Leia a aula completa<br>e faça o quiz no app</div>
    <div class="av-chip" id="f3" style="top:1040px">com-fe-omega.vercel.app</div>`
};
let grade, HORAS, pos;
export function montar(raiz, opc) {
  R = raiz; ICONE = opc.icone; U = opc.util;
}
export function secao(id) {
  const d = document.createElement("div"); d.innerHTML = HTML[id] ? HTML[id]() : "";
  d.style.cssText = "position:absolute;inset:0";
  return d;
}
function preparar(id) {
  if (id === "03-talento" && !grade) { grade = $("grade"); grade.innerHTML = [...Array(120)].map(() => `<svg viewBox="0 0 10 10" style="opacity:0"><circle cx="5" cy="5" r="4.4" fill="#D9DEE8" stroke="#8E97AA" stroke-width=".8"/></svg>`).join(""); }
  if (id === "06-horas" && !HORAS) {
    HORAS = [{ h: 6, n: "nascer" }, { h: 9, n: "hora terceira" }, { h: 12, n: "hora sexta" }, { h: 15, n: "hora nona" }, { h: 18, n: "pôr do sol" }];
    pos = h => { const a = Math.PI * (1 - (h - 6) / 12); return [450 + 390 * Math.cos(a), 440 - 390 * Math.sin(a)]; };
    $("marcas").innerHTML = HORAS.map(({ h }) => { const [x, y] = pos(h); return `<circle cx="${x}" cy="${y}" r="10" fill="#E8C268"/><text x="${x}" y="${y + (h === 6 || h === 18 ? 60 : -26)}" font-size="34" fill="#FFF8E6">${h}h</text>`; }).join("");
    $("hlista").innerHTML = HORAS.slice(1, 4).map((x, i) => `<div id="hl${i}" style="opacity:0;text-align:center;background:rgba(232,194,104,.12);border:2px solid rgba(232,194,104,.4);border-radius:26px;padding:18px 26px"><div class="av-grande" style="font-size:58px">${x.h}h</div><div class="av-rot" style="font-size:32px">${x.n}</div></div>`).join("");
  }
}
export function preparo() { preparar("03-talento"); preparar("06-horas"); }
const entra = (...a) => U.entra(...a), pop = (...a) => U.pop(...a), seg = (...a) => U.seg(...a), easeOut = x => U.easeOut(x), easeInOut = x => U.easeInOut(x);
export const CENA = {
  "01-abertura"(lt, d) { pop($("c1t"), lt, .2, .9); entra($("c1s"), lt, 1.2); entra($("c1i"), lt, 2.0, .8, 80); },
  "02-denario"(lt, d) {
    const m = $("moeda"); const k = easeOut(seg(lt, 0, 1.2)); m.style.transform = `translateX(${(1 - k) * 700}px) rotate(${(1 - k) * 220}deg) scaleX(${Math.abs(Math.cos(lt * 1.1)) * .25 + .75})`; m.style.opacity = k;
    entra($("c2a"), lt, d * .22); entra($("c2b"), lt, d * .55); pop($("c2c"), lt, d * .62);
  },
  "03-talento"(lt, d) {
    entra($("c3a"), lt, .9);
    const kk = easeInOut(seg(lt, d * .18, d * .45)); const n = Math.round(kk * 6000);
    [...grade.children].forEach((s, i) => s.style.opacity = i < kk * 120 ? 1 : 0);
    $("c3n").textContent = n.toLocaleString("pt-BR"); entra($("c3n"), lt, d * .16, .4); entra($("c3m"), lt, d * .16, .4);
    entra($("c3b"), lt, d * .42); entra($("c3c"), lt, d * .55); pop($("c3d"), lt, d * .8); pop($("c3e"), lt, d * .85);
  },
  "04-lepto"(lt, d) {
    entra($("c4a"), lt, .6);
    const q = (el, a) => { const k = seg(lt, a, a + .9); const y = k < 1 ? easeInOut(k) * 230 : 230; el.setAttribute("transform", `translate(${(350 - (el.id === "l1" ? 300 : 400)) * easeInOut(k)} ${y}) scale(${1 - .4 * easeInOut(k)})`); el.style.opacity = k >= 1 ? 0 : 1; };
    q($("l1"), d * .4); q($("l2"), d * .5);
    entra($("c4b"), lt, d * .62); pop($("c4c"), lt, d * .7);
  },
  "05-medidas"(lt, d) {
    entra($("m1"), lt, .3); const r = $("regua"); const kr = easeOut(seg(lt, .8, 2.2)); r.setAttribute("x2", 140 + 620 * kr);
    entra($("m2"), lt, d * .3); const est = $("estrada"); const L = est.getTotalLength(); const kw = easeInOut(seg(lt, d * .35, d * .62)); const p = est.getPointAtLength(L * kw); const c = $("caminhante"); c.setAttribute("cx", p.x); c.setAttribute("cy", p.y);
    entra($("m3"), lt, d * .66); const kv = easeInOut(seg(lt, d * .72, d * .95)); $("vinho").setAttribute("y", 120 - 105 * kv);
  },
  "06-horas"(lt, d) {
    const hh = 6 + 9 * easeInOut(seg(lt, d * .15, d * .85)); const [x, y] = pos(hh); $("sol").setAttribute("transform", `translate(${x} ${y})`);
    entra($("h1"), lt, d * .12); [0, 1, 2].forEach(i => entra($("hl" + i), lt, d * (.38 + i * .14))); pop($("hc"), lt, d * .82);
  },
  "07-final"(lt, d) { pop($("icone"), lt, .1, .8); entra($("f1"), lt, .7); entra($("f2"), lt, 1.4); pop($("f3"), lt, 2.4); },
};

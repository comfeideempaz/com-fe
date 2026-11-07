// Terço interativo (#/terco): um rosário desenhado em SVG que acende conta por conta.
// A pessoa toca no rosário (ou no botão) a cada oração; a conta rezada fica dourada.
// Mostra o mistério do dia com a passagem bíblica e o fruto, lê em voz alta (opcional),
// guarda onde parou (na sessão) e, no fim, registra o terço no progresso.

import { carregar } from "../content.js";
import { trechoHTML } from "../biblia.js";
import { registrar, setFlag, contarFlag, getState } from "../store.js";
import { esc, hojeISO, toast } from "../ui.js";
import { ic } from "../icons.js";
import { falar, parar, temVoz } from "../speech.js";
import { fontesHTML } from "../catecismo.js";

const CHAVE_POS = "comfe-terco-pos";
const ORDINAL = ["1º", "2º", "3º", "4º", "5º"];
const linhas = t => esc(t).replace(/\n/g, "<br>");
const singular = nome => nome.replace("Mistérios ", "").replace(/s$/, "");

// ---------- Desenho do rosário ----------
// Laço: medalha embaixo; depois, em sentido horário, para cada dezena:
// conta grande (Pai-Nosso), 10 contas pequenas (Ave-Maria) e o ponto do Glória.
// Pingente: medalha, ponto do Glória inicial, 3 Ave-Marias, 1 Pai-Nosso e o crucifixo.
function geometria() {
  const cx = 160, cy = 168, r = 128;
  const itens = [];
  for (let k = 1; k <= 5; k++) {
    itens.push({ id: `L${k}`, tipo: "grande", peso: 1.7 });
    for (let a = 1; a <= 10; a++) itens.push({ id: `s${k}-${a}`, tipo: "pequena", peso: 1 });
    itens.push({ id: `g${k}`, tipo: "ponto", peso: 1.2 });
  }
  const folgaMedalha = 2.2;
  const total = itens.reduce((s, x) => s + x.peso, 0) + folgaMedalha * 2;
  let acc = folgaMedalha;
  const pos = {};
  itens.forEach(x => {
    acc += x.peso / 2;
    const ang = Math.PI / 2 + (acc / total) * 2 * Math.PI; // começa embaixo e sobe pela esquerda
    pos[x.id] = { ...x, x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
    acc += x.peso / 2;
  });
  pos.M = { id: "M", tipo: "medalha", x: cx, y: cy + r };
  pos.g0 = { id: "g0", tipo: "ponto", x: cx, y: cy + r + 24 };
  [3, 2, 1].forEach((n, i) => { pos[`S${n}`] = { id: `S${n}`, tipo: "pequena", x: cx, y: cy + r + 42 + i * 17 }; });
  pos.P0 = { id: "P0", tipo: "grande", x: cx, y: cy + r + 98 };
  pos.cruz = { id: "cruz", tipo: "cruz", x: cx, y: cy + r + 140 };
  return { cx, cy, r, pos };
}

function rosarioSVG(G) {
  const { cx, cy, r, pos } = G;
  const conta = p => {
    if (p.tipo === "cruz") return `<g class="conta cruz" data-id="cruz" transform="translate(${p.x} ${p.y})">
      <circle class="aura" r="26"/><path class="cruz-forma" d="M-3.6 -24h7.2v14h11v7.2h-11V24h-7.2V-2.8h-11V-10h11z"/></g>`;
    if (p.tipo === "medalha") return `<g class="conta medalha" data-id="M" transform="translate(${p.x} ${p.y})">
      <circle class="aura" r="20"/><ellipse class="bola" rx="11" ry="13"/><text y="4.5" text-anchor="middle">M</text></g>`;
    const raio = p.tipo === "grande" ? 9.5 : p.tipo === "pequena" ? 6.6 : 2.6;
    return `<g class="conta ${p.tipo}" data-id="${p.id}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">
      <circle class="aura" r="${raio + 9}"/><circle class="bola" r="${raio}"/>${p.tipo !== "ponto" ? `<circle class="brilho" cx="${-raio / 3}" cy="${-raio / 3}" r="${raio / 3}"/>` : ""}</g>`;
  };
  return `<svg class="rosario" viewBox="0 0 320 450" role="img" aria-label="Rosário: toque para rezar a próxima oração">
    <defs>
      <radialGradient id="g-ouro" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFF4C8"/><stop offset=".5" stop-color="#E8C268"/><stop offset="1" stop-color="#A9771F"/></radialGradient>
      <radialGradient id="g-perola" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#E9E4D6"/><stop offset="1" stop-color="#BDB4A0"/></radialGradient>
      <radialGradient id="g-luz"><stop offset="0" stop-color="#FFE7A3" stop-opacity=".95"/><stop offset="1" stop-color="#FFE7A3" stop-opacity="0"/></radialGradient>
    </defs>
    <circle class="corrente" cx="${cx}" cy="${cy}" r="${r}"/>
    <path class="corrente" d="M${cx} ${cy + r}V${pos.cruz.y - 24}"/>
    <g class="centro" transform="translate(${cx} ${cy})">
      <text class="centro-rot" y="-26" text-anchor="middle" id="c-rot"></text>
      <text class="centro-num" y="16" text-anchor="middle" id="c-num"></text>
      <text class="centro-sub" y="40" text-anchor="middle" id="c-sub"></text>
    </g>
    ${Object.values(pos).map(conta).join("")}
  </svg>`;
}

// ---------- Passos do terço ----------
function montarPassos(dados, chave) {
  const o = id => dados.oracoes.find(x => x.id === id);
  const t = dados.terco;
  const m = t.misterios[chave];
  const passos = [];
  const add = (conta, titulo, texto, extra = {}) => passos.push({ conta, titulo, texto, ...extra });
  add("cruz", "Sinal da cruz", o("sinal-da-cruz").texto, { fase: "Início" });
  add("cruz", "Oferecimento", "Divino Jesus, nós vos oferecemos este terço que vamos rezar, contemplando os mistérios da nossa redenção. Concedei-nos, por intercessão de Maria, vossa Mãe Santíssima, a quem nos dirigimos, as virtudes que nos são necessárias para bem rezá-lo e a graça de ganharmos as indulgências desta santa devoção.", { fase: "Início", revisar: true });
  add("cruz", "Creio", o("credo-apostolico").texto, { fase: "Início" });
  add("P0", "Pai-Nosso", o("pai-nosso").texto, { fase: "Início" });
  ["fé", "esperança", "caridade"].forEach((v, i) => add(`S${i + 1}`, "Ave-Maria", o("ave-maria").texto, { fase: "Início", nota: `Pedindo a virtude da ${v}.`, ave: i + 1, de: 3 }));
  add("g0", "Glória", o("gloria").texto, { fase: "Início" });
  m.lista.forEach((mis, i) => {
    const k = i + 1;
    const nomeMis = `${ORDINAL[i]} Mistério ${singular(m.nome)}`;
    add(`L${k}`, nomeMis, mis.titulo, { misterio: mis, dezena: k, anuncio: true });
    add(`L${k}`, "Pai-Nosso", o("pai-nosso").texto, { misterio: mis, dezena: k });
    for (let a = 1; a <= 10; a++) add(`s${k}-${a}`, "Ave-Maria", o("ave-maria").texto, { misterio: mis, dezena: k, ave: a, de: 10 });
    add(`g${k}`, "Glória", o("gloria").texto, { misterio: mis, dezena: k });
    add(`g${k}`, t.jaculatoria.nome, t.jaculatoria.texto, { misterio: mis, dezena: k, nota: t.jaculatoria.sobre });
  });
  add("M", "Salve-Rainha", o("salve-rainha").texto, { fase: "Final" });
  add("cruz", "Sinal da cruz", "Em nome do Pai e do Filho e do Espírito Santo. Amém.", { fase: "Final" });
  return { passos, nome: m.nome };
}

function lerPosicao() { try { return JSON.parse(sessionStorage.getItem(CHAVE_POS)) || null; } catch { return null; } }
function salvarPosicao(p) { try { sessionStorage.setItem(CHAVE_POS, JSON.stringify(p)); } catch { /* sem armazenamento */ } }
function apagarPosicao() { try { sessionStorage.removeItem(CHAVE_POS); } catch { /* sem armazenamento */ } }

export async function render(el) {
  const dados = await carregar("oracoes.json");
  const t = dados.terco;
  const doDia = t.diasDaSemana[new Date().getDay()];
  const salvo = lerPosicao();
  let chave = salvo?.chave && t.misterios[salvo.chave] ? salvo.chave : doDia;
  let { passos, nome } = montarPassos(dados, chave);
  let i = salvo && salvo.chave === chave ? Math.min(salvo.i, passos.length - 1) : 0;
  let intencao = salvo?.intencao || "";
  let vozLigada = false;
  const G = geometria();

  const diasRezados = (getState().flags.tercos || []).length;
  el.innerHTML = `
    <header class="tela-topo terco-topo">
      <p class="kicker">Santo Rosário</p>
      <h1 tabindex="-1">Rezar o terço</h1>
      <p class="apoio">Toque no rosário a cada oração. Hoje a Igreja sugere os <strong>${esc(t.misterios[doDia].nome)}</strong>.${diasRezados ? ` Você já rezou o terço em ${diasRezados} ${diasRezados === 1 ? "dia" : "dias"} pelo app.` : ""}</p>
    </header>

    <div class="misterios-escolha" role="radiogroup" aria-label="Mistérios">
      ${Object.entries(t.misterios).map(([k, v]) => `<button type="button" role="radio" data-k="${k}" aria-checked="${k === chave}">
        <strong>${esc(v.nome.replace("Mistérios ", ""))}</strong><small>${esc(v.dias)}${k === doDia ? " · hoje" : ""}</small></button>`).join("")}
    </div>

    <details class="cartao intencao" ${intencao ? "open" : ""}>
      <summary>${ic("coracao")} <span>${intencao ? "Minha intenção" : "Colocar uma intenção (opcional)"}</span></summary>
      <label class="sr" for="t-intencao">Minha intenção</label>
      <textarea id="t-intencao" rows="2" maxlength="200" placeholder="Ex.: pela saúde da minha mãe; pela paz na minha família…">${esc(intencao)}</textarea>
    </details>

    <section class="terco-palco">
      <div class="terco-rosario">${rosarioSVG(G)}</div>
      <div class="terco-lado">
        <div class="cartao terco-oracao" id="t-oracao" aria-live="polite"></div>
        <div class="terco-botoes">
          <button class="botao secundario redondo" id="t-ant" aria-label="Voltar uma oração">${ic("voltar")}</button>
          <button class="botao dourado" id="t-prox"></button>
          ${temVoz() ? `<button class="botao secundario redondo" id="t-voz" aria-pressed="false" aria-label="Ler em voz alta">${ic("volume")}</button>` : ""}
        </div>
        <div class="terco-barra" aria-hidden="true"><span id="t-barra"></span></div>
        <p class="terco-dica">Dica: você também pode tocar em qualquer lugar do rosário para avançar.</p>
      </div>
    </section>

    <details class="cartao explica"><summary><strong>Sobre o terço</strong></summary><p>${esc(t.sobre)}</p>
      <p>Cada conta grande é um Pai-Nosso e cada conta pequena, uma Ave-Maria. O Glória e o “Ó meu Jesus” são rezados na corrente, depois da décima Ave-Maria.</p>
      ${t.fontes ? `<p class="fontes">Fontes: ${fontesHTML(t.fontes)}</p>` : ""}</details>
    <div class="terco-fim" id="t-fim" hidden></div>`;

  const svg = el.querySelector(".rosario");
  const contas = {};
  svg.querySelectorAll(".conta").forEach(g => { contas[g.dataset.id] = g; });
  const caixa = el.querySelector("#t-oracao");
  const bProx = el.querySelector("#t-prox");
  const bAnt = el.querySelector("#t-ant");
  const bVoz = el.querySelector("#t-voz");

  const primeiraVez = () => {
    const mapa = {};
    passos.forEach((p, k) => { if (!(p.conta in mapa)) mapa[p.conta] = k; });
    return mapa;
  };
  let inicioDaConta = primeiraVez();

  function desenhar(animar = true) {
    const p = passos[i];
    // Contas: rezadas (douradas), a atual (brilhando) e as que faltam (pérola).
    Object.entries(contas).forEach(([id, g]) => {
      const primeira = inicioDaConta[id];
      g.classList.toggle("rezada", primeira !== undefined && primeira < i && id !== p.conta);
      g.classList.toggle("atual", id === p.conta);
    });
    const cr = svg.querySelector("#c-rot"), cn = svg.querySelector("#c-num"), cs = svg.querySelector("#c-sub");
    if (p.dezena) { cr.textContent = `${p.dezena}ª dezena`; cn.textContent = p.ave ? `${p.ave}/10` : "✝"; cs.textContent = p.misterio.fruto; }
    else { cr.textContent = p.fase === "Final" ? "Para concluir" : "Para começar"; cn.textContent = p.ave ? `${p.ave}/3` : "✝"; cs.textContent = nome.replace("Mistérios ", ""); }

    const mis = p.misterio;
    caixa.innerHTML = `
      ${mis ? `<div class="terco-misterio"><span>${ORDINAL[p.dezena - 1]} Mistério ${esc(singular(nome))}</span><strong>${esc(mis.titulo)}</strong></div>` : `<div class="terco-misterio fase"><span>${esc(nome)}</span><strong>${p.fase === "Final" ? "Orações finais" : "Orações iniciais"}</strong></div>`}
      <p class="terco-passo-rot">${p.ave ? `Ave-Maria ${p.ave} de ${p.de}` : `Passo ${i + 1} de ${passos.length}`}</p>
      <h2>${esc(p.anuncio ? "Contemplemos" : p.titulo)}</h2>
      ${p.anuncio ? `<p class="misterio-titulo">${esc(p.texto)}</p>
        <p class="apoio">Fruto do mistério: <strong>${esc(mis.fruto)}</strong>. Faça um instante de silêncio e imagine a cena.</p>
        <details class="misterio-leitura"><summary>${ic("livro")} Ler a passagem (${esc(mis.biblia[0].txt)})</summary><div class="texto-biblia" id="mis-texto">Carregando…</div></details>`
      : `<p class="oracao-texto${animar ? " entra" : ""}">${linhas(p.texto)}</p>`}
      ${p.nota ? `<p class="apoio terco-nota">${esc(p.nota)}</p>` : ""}
      ${intencao && i === 1 ? `<p class="terco-intencao">${ic("coracao")} Pela intenção: <em>${esc(intencao)}</em></p>` : ""}
      ${p.revisar ? `<p class="fontes">Oferecimento tradicional; o texto pode variar conforme a região.</p>` : ""}`;
    const det = caixa.querySelector(".misterio-leitura");
    det?.addEventListener("toggle", async () => { if (det.open) caixa.querySelector("#mis-texto").innerHTML = await trechoHTML(mis.biblia[0]); });

    bAnt.disabled = i === 0;
    bProx.innerHTML = i === passos.length - 1 ? `Amém ${ic("estrela")}` : p.ave ? `Rezei a Ave-Maria ${ic("seta")}` : p.anuncio ? `Começar a dezena ${ic("seta")}` : `Rezei ${ic("seta")}`;
    el.querySelector("#t-barra").style.width = `${Math.round((i / (passos.length - 1)) * 100)}%`;
    salvarPosicao({ chave, i, intencao });
    if (vozLigada) falar(`${p.anuncio ? p.titulo + ". " : ""}${p.texto.replace(/\n/g, " ")}`);
  }

  function avancar() {
    navigator.vibrate?.(12);
    if (i < passos.length - 1) { i++; desenhar(); return; }
    concluir();
  }

  function concluir() {
    parar();
    registrar({ tipo: "oracao", ref: "terco", titulo: `o terço (${nome})`, minutos: 20 });
    setFlag("terco", true);
    contarFlag("tercos", hojeISO());
    apagarPosicao();
    Object.values(contas).forEach(g => { g.classList.add("rezada"); g.classList.remove("atual"); });
    svg.classList.add("completo");
    const fim = el.querySelector("#t-fim");
    fim.hidden = false;
    fim.innerHTML = `<div class="terco-fim-caixa" role="dialog" aria-modal="true" aria-labelledby="t-fim-t">
      <div class="terco-fim-luz" aria-hidden="true"></div>
      <p class="kicker">Ave Maria, cheia de graça</p>
      <h2 id="t-fim-t">Terço concluído!</h2>
      <p>Você rezou os <strong>${esc(nome)}</strong>${intencao ? ` pela intenção: <em>${esc(intencao)}</em>` : ""}.</p>
      <blockquote>“Fazei tudo o que ele vos disser.”<cite>Jo 2,5</cite></blockquote>
      <div class="botoes"><a class="botao dourado" href="#/inicio">${ic("casa")} Voltar ao início</a><button class="botao secundario" id="t-denovo">${ic("reiniciar")} Rezar de novo</button></div>
    </div>`;
    fim.querySelector("#t-denovo").addEventListener("click", () => { fim.hidden = true; svg.classList.remove("completo"); i = 0; desenhar(); });
    fim.querySelector(".botao").focus();
    toast("Amém! Que Nossa Senhora acompanhe o seu dia.");
  }

  bProx.addEventListener("click", avancar);
  svg.addEventListener("click", avancar);
  bAnt.addEventListener("click", () => { if (i > 0) { i--; desenhar(false); } });
  bVoz?.addEventListener("click", () => {
    vozLigada = !vozLigada;
    bVoz.setAttribute("aria-pressed", String(vozLigada));
    bVoz.classList.toggle("ligado", vozLigada);
    if (vozLigada) { toast("Leitura em voz alta ligada"); desenhar(false); } else parar();
  });
  el.querySelectorAll(".misterios-escolha button").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.k === chave) return;
    if (i > 0 && !confirm("Trocar os mistérios recomeça o terço. Continuar?")) return;
    chave = b.dataset.k;
    ({ passos, nome } = montarPassos(dados, chave));
    inicioDaConta = primeiraVez();
    i = 0;
    el.querySelectorAll(".misterios-escolha button").forEach(x => x.setAttribute("aria-checked", String(x.dataset.k === chave)));
    desenhar();
  }));
  const campo = el.querySelector("#t-intencao");
  campo.addEventListener("input", () => {
    intencao = campo.value.trim();
    el.querySelector(".intencao summary span").textContent = intencao ? "Minha intenção" : "Colocar uma intenção (opcional)";
    salvarPosicao({ chave, i, intencao });
  });
  // Teclado: espaço ou seta para a direita avançam; seta para a esquerda volta.
  const tecla = e => {
    if (e.target.closest("textarea, input, select, summary, button, a")) return;
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); avancar(); }
    if (e.key === "ArrowLeft" && i > 0) { i--; desenhar(false); }
  };
  addEventListener("keydown", tecla);

  if (salvo && salvo.chave === chave && i > 0) toast("Continuando de onde você parou.");
  desenhar(false);
  return () => { parar(); removeEventListener("keydown", tecla); };
}

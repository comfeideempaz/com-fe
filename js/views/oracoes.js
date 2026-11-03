// Orações (#/oracoes, #/oracoes/:id) e o terço guiado (#/oracoes/terco),
// com os mistérios do dia, a passagem bíblica de cada mistério e contador de contas.

import { carregar } from "../content.js";
import { refsHTML, trechoHTML } from "../biblia.js";
import { registrar, setFlag } from "../store.js";
import { esc, cabecalho, toast } from "../ui.js";
import { ic } from "../icons.js";
import { falar, parar, temVoz } from "../speech.js";
import { fontesHTML } from "../catecismo.js";

const linhas = t => esc(t).replace(/\n/g, "<br>");

export async function render(el, params) {
  const dados = await carregar("oracoes.json");
  if (params.id === "terco") return terco(el, dados);
  if (params.id) return oracao(el, dados, params.id);
  return indice(el, dados);
}

function indice(el, { categorias, oracoes, terco: t }) {
  const hoje = t.misterios[t.diasDaSemana[new Date().getDay()]];
  el.innerHTML = cabecalho("Orações", "As orações da fé católica, com os textos usados no Brasil, sua origem e base bíblica.") + `
    <a class="cartao continuar terco-card" href="#/oracoes/terco"><span class="tile-ic">${ic("terco")}</span>
      <span><small>Terço guiado · hoje: ${esc(hoje.nome)}</small><strong>Rezar o terço</strong></span>${ic("seta", "seta")}</a>
    ${categorias.map(c => `
      <h2 class="secao">${esc(c.nome)}</h2>
      <ul class="cartao lista-links">${oracoes.filter(o => o.categoria === c.id).map(o =>
        `<li><a href="#/oracoes/${o.id}"><span><strong>${esc(o.nome)}</strong></span>${ic("seta", "seta")}</a></li>`).join("")}</ul>`).join("")}`;
}

function oracao(el, { oracoes }, id) {
  const o = oracoes.find(x => x.id === id);
  if (!o) { el.innerHTML = cabecalho("Oração não encontrada") + `<p><a href="#/oracoes">Voltar</a></p>`; return; }
  el.innerHTML = `<p class="migalha"><a href="#/oracoes">${ic("voltar")} Orações</a></p>` + cabecalho(o.nome) + `
    <article class="cartao oracao-texto"><p>${linhas(o.texto)}</p>
      <div class="botoes">${temVoz() ? `<button class="botao secundario" id="ouvir">${ic("volume")} Ouvir</button>` : ""}<button class="botao" id="rezei">${ic("maos")} Rezei</button></div>
    </article>
    <section class="cartao"><h2>Sobre esta oração</h2><p>${esc(o.sobre)}</p>
      ${o.biblia?.length ? `<p><strong>Na Bíblia:</strong> ${refsHTML(o.biblia)}</p>` : ""}
      ${o.fontes?.length ? `<p class="fontes">Fontes: ${fontesHTML(o.fontes)}</p>` : ""}
      ${o.revisar ? `<p class="fontes">Texto em revisão: confira com o folheto da sua paróquia.</p>` : ""}
    </section>`;
  el.querySelector("#rezei").addEventListener("click", e => {
    registrar({ tipo: "oracao", ref: o.id, titulo: o.nome, minutos: 1 });
    e.currentTarget.disabled = true;
    toast("Amém!");
  });
  el.querySelector("#ouvir")?.addEventListener("click", () => falar(o.texto.replace(/\n/g, " ")));
  return () => parar();
}

// ---------- Terço guiado ----------
function passosDoTerco(dados, chaveMisterios) {
  const o = id => dados.oracoes.find(x => x.id === id);
  const t = dados.terco;
  const m = t.misterios[chaveMisterios];
  const passos = [];
  const add = (titulo, texto, extra = {}) => passos.push({ titulo, texto, ...extra });
  add("Oferecimento", "Divino Jesus, nós vos oferecemos este terço que vamos rezar, contemplando os mistérios da nossa redenção. Concedei-nos, por intercessão de Maria, vossa Mãe Santíssima, a quem nos dirigimos, as virtudes que nos são necessárias para bem rezá-lo e a graça de ganharmos as indulgências desta santa devoção.", { revisar: true });
  add(o("sinal-da-cruz").nome, o("sinal-da-cruz").texto);
  add("Creio", o("credo-apostolico").texto);
  add("Pai-Nosso", o("pai-nosso").texto);
  ["fé", "esperança", "caridade"].forEach((v, i) => add(`Ave-Maria (${i + 1} de 3)`, o("ave-maria").texto, { nota: `Pedindo a virtude da ${v}.` }));
  add("Glória", o("gloria").texto);
  m.lista.forEach((mis, i) => {
    add(`${i + 1}º Mistério ${m.nome.replace("Mistérios ", "").replace(/s$/, "")}`, mis.titulo, { misterio: mis, anuncio: true });
    add("Pai-Nosso", o("pai-nosso").texto, { dezena: i + 1 });
    add("Ave-Maria", o("ave-maria").texto, { dezena: i + 1, contas: 10 });
    add("Glória", o("gloria").texto, { dezena: i + 1 });
    add(t.jaculatoria.nome, t.jaculatoria.texto, { dezena: i + 1, nota: t.jaculatoria.sobre });
  });
  add("Salve-Rainha", o("salve-rainha").texto, { final: true });
  add(o("sinal-da-cruz").nome, "Em nome do Pai e do Filho e do Espírito Santo. Amém.", { final: true });
  return { passos, nome: m.nome };
}

async function terco(el, dados) {
  const t = dados.terco;
  let chave = t.diasDaSemana[new Date().getDay()];
  let { passos, nome } = passosDoTerco(dados, chave);
  let i = 0, conta = 0, terminou = false;

  const desenhar = async () => {
    const p = passos[i];
    const pct = Math.round((i / (passos.length - 1)) * 100);
    el.querySelector("#terco-passo").innerHTML = `
      <div class="terco-progresso" aria-hidden="true"><span style="width:${pct}%"></span></div>
      <p class="apoio">${p.dezena ? `${p.dezena}ª dezena · ` : ""}Passo ${i + 1} de ${passos.length}</p>
      <h2>${esc(p.titulo)}</h2>
      ${p.anuncio ? `<p class="misterio-titulo">${esc(p.texto)}</p><p class="apoio">Fruto do mistério: <strong>${esc(p.misterio.fruto)}</strong></p>
        <details class="misterio-leitura"><summary>Ler a passagem (${esc(p.misterio.biblia[0].txt)})</summary><div id="mis-texto"></div></details>`
      : `<p class="oracao-texto">${linhas(p.texto)}</p>`}
      ${p.nota ? `<p class="apoio">${esc(p.nota)}</p>` : ""}
      ${p.contas ? `<div class="contas" aria-label="Ave-Maria ${conta} de 10">${Array.from({ length: 10 }, (_, k) => `<span class="${k < conta ? "rezada" : ""}"></span>`).join("")}</div>
        <p class="apoio">${conta} de 10</p>` : ""}
      ${p.revisar ? `<p class="fontes">Oferecimento tradicional; o texto pode variar conforme a região.</p>` : ""}`;
    el.querySelector("#t-ant").disabled = i === 0 && conta === 0;
    el.querySelector("#t-prox").innerHTML = p.contas && conta < 10 ? `Rezei uma Ave-Maria ${ic("seta")}` : i === passos.length - 1 ? `Amém ${ic("seta")}` : `Próximo ${ic("seta")}`;
    const det = el.querySelector(".misterio-leitura");
    det?.addEventListener("toggle", async () => { if (det.open) el.querySelector("#mis-texto").innerHTML = await trechoHTML(p.misterio.biblia[0]); });
  };

  el.innerHTML = `<p class="migalha"><a href="#/oracoes">${ic("voltar")} Orações</a></p>` + cabecalho("Terço guiado", "Toque em \"Próximo\" a cada oração. Nas dezenas, toque a cada Ave-Maria.") + `
    <label class="form"><span>Mistérios</span><select id="mis">${Object.entries(t.misterios).map(([k, v]) => `<option value="${k}" ${k === chave ? "selected" : ""}>${esc(v.nome)} (${esc(v.dias)})</option>`).join("")}</select></label>
    <section class="cartao terco" id="terco-passo" aria-live="polite"></section>
    <div class="botoes terco-botoes">
      <button class="botao secundario" id="t-ant">${ic("voltar")} Voltar</button>
      ${temVoz() ? `<button class="botao secundario" id="t-ouvir">${ic("volume")} Ouvir</button>` : ""}
      <button class="botao" id="t-prox"></button>
    </div>
    <details class="cartao explica"><summary><strong>Sobre o terço</strong></summary><p>${esc(t.sobre)}</p>${t.fontes ? `<p class="fontes">Fontes: ${fontesHTML(t.fontes)}</p>` : ""}</details>`;

  el.querySelector("#mis").addEventListener("change", e => { chave = e.target.value; ({ passos, nome } = passosDoTerco(dados, chave)); i = 0; conta = 0; desenhar(); });
  el.querySelector("#t-prox").addEventListener("click", () => {
    const p = passos[i];
    if (p.contas && conta < 10) { conta++; if (conta < 10) return desenhar(); }
    if (i < passos.length - 1) { i++; conta = 0; return desenhar(); }
    if (!terminou) {
      terminou = true;
      registrar({ tipo: "oracao", ref: "terco", titulo: `o terço (${nome})`, minutos: 20 });
      setFlag("terco", true);
    }
    el.querySelector("#terco-passo").innerHTML = `<h2>Terço concluído</h2><p>“Fazei tudo o que ele vos disser” (Jo 2,5). Que Nossa Senhora acompanhe o seu dia.</p>`;
  });
  el.querySelector("#t-ant").addEventListener("click", () => {
    if (passos[i].contas && conta > 0) { conta--; return desenhar(); }
    if (i > 0) { i--; conta = passos[i].contas ? 9 : 0; desenhar(); }
  });
  el.querySelector("#t-ouvir")?.addEventListener("click", () => falar(passos[i].texto.replace(/\n/g, " ")));
  desenhar();
  return () => parar();
}

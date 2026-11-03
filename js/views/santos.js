// Santos: busca no santoral do ano (#/santos) e a vida completa (#/santos/:id),
// separando o que é histórico do que é tradição piedosa.

import { carregar } from "../content.js";
import { refsHTML } from "../biblia.js";
import { getState, subscribe, marcarVisto } from "../store.js";
import { esc, cabecalho, hojeISO, toast } from "../ui.js";
import { ic } from "../icons.js";
import { COR_HEX } from "../liturgia.js";
import { falar, parar, temVoz } from "../speech.js";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const semAcento = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const diaTexto = mmdd => { const [m, d] = mmdd.split("-").map(Number); return `${d} de ${MESES[m - 1]}`; };

export async function render(el, params) {
  return params.id ? vida(el, params.id) : indice(el);
}

async function indice(el) {
  const { santos } = await carregar("santos/indice.json");
  const hoje = hojeISO().slice(5);
  let filtro = "", soVidas = false;
  const desenhar = () => {
    const vistos = new Set(getState().santosVistos);
    const f = semAcento(filtro.trim());
    const lista = santos.filter(s => s.tipo !== "celebracao" && (!soVidas || s.vida) &&
      (!f || semAcento(`${s.nome} ${(s.patrono || []).join(" ")} ${s.titulo || ""}`).includes(f)));
    const proximos = santos.filter(s => s.dia >= hoje && s.tipo !== "celebracao").slice(0, 3);
    el.querySelector("#santos-corpo").innerHTML = `
      ${!f && !soVidas ? `<h2 class="secao">Nos próximos dias</h2><ul class="lista-cartoes">${proximos.map(item).join("")}</ul><h2 class="secao">Todo o ano</h2>` : ""}
      ${lista.length ? `<ul class="lista-santos">${lista.map(s => `<li><a href="${s.vida ? `#/santos/${s.id}` : `#/santos/${s.id}`}" class="${vistos.has(s.id) ? "visto" : ""}">
        <span class="dia-num" style="--cor:${COR_HEX[s.cor] || COR_HEX.branco}">${+s.dia.slice(3)}<small>${MESES[+s.dia.slice(0, 2) - 1].slice(0, 3)}</small></span>
        <span class="santo-nome">${esc(s.nome)}${s.vida ? `<small>${esc((s.patrono || []).slice(0, 2).join(" · ") || s.titulo)}</small>` : `<small>${esc(s.grauNome)}</small>`}</span>
        ${s.vida ? `<span class="chip">Vida</span>` : ""}</a></li>`).join("")}</ul>` : `<p class="cartao vazio">Nenhum santo encontrado.</p>`}`;
  };
  const item = s => `<li class="cartao"><a href="#/santos/${s.id}" class="santo-prox"><strong>${esc(s.nome)}</strong><small>${esc(diaTexto(s.dia))} · ${esc(s.grauNome)}</small></a></li>`;
  const comVida = santos.filter(s => s.vida).length;
  el.innerHTML = cabecalho("Santos", `${santos.filter(s => s.tipo !== "celebracao").length} celebrações do calendário no Brasil, ${comVida} com a vida completa.`) + `
    <label class="busca"><span class="sr">Buscar santo</span>${ic("busca")}<input type="search" id="busca-santo" placeholder="Buscar por nome ou padroeiro (ex.: médicos)" autocomplete="off"></label>
    <label class="alternar"><input type="checkbox" id="so-vidas"> Mostrar só os que têm a vida completa</label>
    <div id="santos-corpo"></div>`;
  el.querySelector("#busca-santo").addEventListener("input", e => { filtro = e.target.value; desenhar(); });
  el.querySelector("#so-vidas").addEventListener("change", e => { soVidas = e.target.checked; desenhar(); });
  desenhar();
  return subscribe(desenhar);
}

async function vida(el, id) {
  const { santos } = await carregar("santos/indice.json");
  const base = santos.find(s => s.id === id);
  if (!base) { el.innerHTML = cabecalho("Santo não encontrado") + `<p><a href="#/santos">Voltar</a></p>`; return; }
  if (!base.vida) {
    el.innerHTML = `<p class="migalha"><a href="#/santos">${ic("voltar")} Santos</a></p>` + cabecalho(base.nome, `${diaTexto(base.dia)} · ${base.grauNome}`) +
      `<div class="cartao vazio"><p>A vida completa deste santo ainda está sendo preparada com cuidado, a partir de fontes seguras. Ela chega numa próxima atualização do app.</p></div>`;
    return;
  }
  const s = await carregar(`santos/${id}.json`);
  const frase = s.frase ? `<blockquote class="cartao frase"><p>“${esc(s.frase.texto)}”</p><cite>${esc(s.frase.fonte)}</cite></blockquote>` : "";
  el.innerHTML = `
    <p class="migalha"><a href="#/santos">${ic("voltar")} Santos</a></p>
    <header class="tela-topo santo-topo" style="--cor-dia:${COR_HEX[s.cor] || COR_HEX.branco}">
      <p class="apoio">${esc(diaTexto(s.dia))} · ${esc(s.grauNome)}</p>
      <h1 tabindex="-1">${esc(s.nome)}</h1>
      <div class="chips"><span class="chip">${esc(s.titulo)}</span><span class="chip">${esc(s.viveu)}</span>${s.local && s.local !== "—" ? `<span class="chip">${esc(s.local)}</span>` : ""}</div>
      ${temVoz() ? `<p><button class="botao secundario" id="ouvir">${ic("volume")} Ouvir a história</button></p>` : ""}
    </header>
    ${s.patrono?.length ? `<p class="patrono"><strong>Padroeiro(a) de:</strong> ${s.patrono.map(esc).join(", ")}</p>` : ""}
    <section class="cartao"><h2>História</h2>${s.historia.map(p => `<p>${esc(p)}</p>`).join("")}</section>
    ${frase}
    ${s.tradicao?.length ? `<section class="cartao tradicao"><h2>Segundo a tradição</h2><p class="apoio">Relatos antigos e piedosos, que não têm a mesma certeza histórica, mas fazem parte da devoção da Igreja.</p>${s.tradicao.map(p => `<p>${esc(p)}</p>`).join("")}</section>` : ""}
    ${s.curiosidades?.length ? `<section class="cartao"><h2>Curiosidades</h2><ul class="lista-simples">${s.curiosidades.map(c => `<li>${esc(c)}</li>`).join("")}</ul></section>` : ""}
    ${s.biblia?.length ? `<section class="cartao"><h2>Na Bíblia</h2><p class="apoio">Passagens ligadas à vida e à missão ${s.tipo === "maria" ? "desta celebração" : "deste santo"}:</p>${refsHTML(s.biblia)}</section>` : ""}
    <p class="fontes">Fontes: ${(s.fontes || []).map(esc).join("; ")}${s.revisar ? " · Algumas informações estão em revisão." : ""}</p>
    <div class="botoes"><button class="botao" id="conheci"></button></div>`;

  const botao = el.querySelector("#conheci");
  const atualizar = () => {
    const visto = getState().santosVistos.includes(id);
    botao.innerHTML = visto ? `${ic("santo")} Você já conheceu esta vida` : `${ic("santo")} Conheci esta vida`;
    botao.classList.toggle("secundario", visto);
  };
  atualizar();
  botao.addEventListener("click", () => {
    if (getState().santosVistos.includes(id)) return;
    marcarVisto("santosVistos", id, s.nome, "santo");
    toast(s.tipo === "maria" ? "Rogai por nós, Santa Mãe de Deus!" : "Rogai por nós!");
    atualizar();
  });
  const ouvir = el.querySelector("#ouvir");
  if (ouvir) {
    let tocando = false;
    ouvir.addEventListener("click", () => {
      if (tocando) { parar(); tocando = false; ouvir.innerHTML = `${ic("volume")} Ouvir a história`; return; }
      tocando = true; ouvir.innerHTML = `${ic("volume")} Parar`;
      falar(`${s.nome}. ${s.historia.join(" ")}`, { aoTerminar: () => { tocando = false; ouvir.innerHTML = `${ic("volume")} Ouvir a história`; } });
    });
  }
  return () => parar();
}

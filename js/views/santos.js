// Santos: busca no santoral do ano (#/santos) e a vida completa (#/santos/:id),
// separando o que é histórico do que é tradição piedosa.

import { carregar } from "../content.js";
import { refsHTML } from "../biblia.js";
import { getState, subscribe, marcarVisto } from "../store.js";
import { esc, cabecalho, hojeISO, toast } from "../ui.js";
import { ic } from "../icons.js";
import { COR_HEX } from "../liturgia.js";
import { falar, parar, temVoz } from "../speech.js";
import { fontesHTML } from "../catecismo.js";
import { fotoDe, fotosDe, retrato, aplicarFotos } from "../fotos.js";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const semAcento = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const diaTexto = mmdd => { const [m, d] = mmdd.split("-").map(Number); return `${d} de ${MESES[m - 1]}`; };

export async function render(el, params) {
  return params.id ? vida(el, params.id) : indice(el);
}

async function indice(el) {
  const { santos } = await carregar("santos/indice.json");
  const hoje = hojeISO().slice(5);
  const visiveis = santos.filter(s => s.tipo !== "celebracao");
  let filtro = "", soVidas = false, fotos = {};
  const desenhar = () => {
    const vistos = new Set(getState().santosVistos);
    const f = semAcento(filtro.trim());
    const lista = visiveis.filter(s => (!soVidas || s.vida) &&
      (!f || semAcento(`${s.nome} ${(s.patrono || []).join(" ")} ${s.titulo || ""}`).includes(f)));
    const deHoje = visiveis.filter(s => s.dia === hoje);
    const proximos = visiveis.filter(s => s.dia > hoje).slice(0, 8);
    let mes = "";
    el.querySelector("#santos-corpo").innerHTML = `
      ${!f && !soVidas ? `
        ${deHoje.length ? `<h2 class="secao">Hoje</h2>${deHoje.map(s => `<a class="cartao santo-hoje" href="#/santos/${s.id}">
          ${retrato(s, "grande")}<span><span class="kicker">${esc(diaTexto(s.dia))} · ${esc(s.grauNome)}</span><strong>${esc(s.nome)}</strong>
          <small>${esc((s.patrono || []).slice(0, 3).join(" · ") || s.titulo || "")}</small></span>${ic("seta", "seta")}</a>`).join("")}` : ""}
        <h2 class="secao">Nos próximos dias</h2>
        <ul class="carrossel-santos">${proximos.map(s => `<li><a href="#/santos/${s.id}" class="cartao santo-card">
          ${retrato(s, "medio")}<strong>${esc(s.nome.split(",")[0])}</strong><small>${esc(diaTexto(s.dia))}</small></a></li>`).join("")}</ul>
        <h2 class="secao">Todo o ano</h2>` : ""}
      ${lista.length ? `<ul class="lista-santos">${lista.map(s => {
        const m = +s.dia.slice(0, 2);
        let cab = "";
        if (!f && MESES[m - 1] !== mes) { mes = MESES[m - 1]; cab = `<li class="mes-titulo">${mes}</li>`; }
        return `${cab}<li><a href="#/santos/${s.id}" class="${vistos.has(s.id) ? "visto" : ""}">
        ${retrato(s)}
        <span class="santo-nome">${esc(s.nome)}<small>${esc(diaTexto(s.dia))} · ${esc((s.patrono || []).slice(0, 2).join(" · ") || s.grauNome)}</small></span>
        ${vistos.has(s.id) ? `<span class="chip chip-visto">${ic("estrela")} Conheci</span>` : ""}</a></li>`;
      }).join("")}</ul>` : `<p class="cartao vazio">Nenhum santo encontrado.</p>`}`;
    aplicarFotos(el, fotos);
  };
  const comVida = visiveis.filter(s => s.vida).length;
  el.innerHTML = `<header class="tela-topo"><p class="kicker">Comunhão dos santos</p><h1 tabindex="-1">Santos</h1>
      <p class="apoio">${visiveis.length} celebrações do calendário no Brasil, ${comVida} com a vida completa. “Rodeados de tão grande nuvem de testemunhas” (Hb 12,1).</p></header>
    <label class="busca"><span class="sr">Buscar santo</span>${ic("busca")}<input type="search" id="busca-santo" placeholder="Buscar por nome ou padroeiro (ex.: médicos)" autocomplete="off"></label>
    <label class="alternar"><input type="checkbox" id="so-vidas"> Mostrar só os que têm a vida completa</label>
    <div id="santos-corpo"></div>
    <p class="fontes">Imagens: Wikimedia Commons (obras em domínio público ou com licença livre; o crédito de cada uma aparece na página do santo).</p>`;
  el.querySelector("#busca-santo").addEventListener("input", e => { filtro = e.target.value; desenhar(); });
  el.querySelector("#so-vidas").addEventListener("change", e => { soVidas = e.target.checked; desenhar(); });
  desenhar();
  // Fotos: primeiro as de hoje e dos próximos dias, depois o resto.
  const ordem = [...visiveis.filter(s => s.dia >= hoje), ...visiveis.filter(s => s.dia < hoje)];
  fotosDe(ordem.slice(0, 12)).then(f => { fotos = { ...fotos, ...f }; aplicarFotos(el, fotos); })
    .then(() => fotosDe(ordem)).then(f => { fotos = f; aplicarFotos(el, fotos); }).catch(() => {});
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
    <header class="santo-capa" style="--cor-dia:${COR_HEX[s.cor] || COR_HEX.branco}">
      <div class="santo-capa-luz" aria-hidden="true"></div>
      ${retrato(s, "capa")}
      <div class="santo-capa-texto">
        <p class="kicker">${esc(diaTexto(s.dia))} · ${esc(s.grauNome)}</p>
        <h1 tabindex="-1">${esc(s.nome)}</h1>
        <div class="chips"><span class="chip">${esc(s.titulo)}</span><span class="chip">${esc(s.viveu)}</span>${s.local && s.local !== "—" ? `<span class="chip">${esc(s.local)}</span>` : ""}</div>
        ${temVoz() ? `<p class="santo-ouvir"><button class="botao secundario pequeno" id="ouvir">${ic("volume")} Ouvir a história</button></p>` : ""}
      </div>
    </header>
    <p class="credito-foto" id="credito" hidden></p>
    ${s.patrono?.length ? `<p class="patrono"><strong>Padroeiro(a) de:</strong> ${s.patrono.map(esc).join(", ")}</p>` : ""}
    <section class="cartao"><h2>História</h2>${s.historia.map(p => `<p>${esc(p)}</p>`).join("")}</section>
    ${frase}
    ${s.tradicao?.length ? `<section class="cartao tradicao"><h2>Segundo a tradição</h2><p class="apoio">Relatos antigos e piedosos, que não têm a mesma certeza histórica, mas fazem parte da devoção da Igreja.</p>${s.tradicao.map(p => `<p>${esc(p)}</p>`).join("")}</section>` : ""}
    ${s.curiosidades?.length ? `<section class="cartao"><h2>Curiosidades</h2><ul class="lista-simples">${s.curiosidades.map(c => `<li>${esc(c)}</li>`).join("")}</ul></section>` : ""}
    ${s.biblia?.length ? `<section class="cartao"><h2>Na Bíblia</h2><p class="apoio">Passagens ligadas à vida e à missão ${s.tipo === "maria" ? "desta celebração" : "deste santo"}:</p>${refsHTML(s.biblia)}</section>` : ""}
    <p class="fontes">Fontes: ${fontesHTML(s.fontes)}${s.revisar ? " · Algumas informações estão em revisão." : ""}</p>
    <div class="botoes"><button class="botao" id="conheci"></button></div>`;

  // Foto (Wikimedia Commons) com crédito e licença.
  fotoDe(base).then(f => {
    if (!f || !el.isConnected) return;
    aplicarFotos(el, { [s.id]: f });
    const cred = el.querySelector("#credito");
    cred.hidden = false;
    cred.innerHTML = `Imagem: ${f.obra ? `<em>${esc(f.obra)}</em>, ` : ""}${esc(f.autor)} · ${esc(f.licenca)} · <a href="${esc(f.pagina)}" target="_blank" rel="noopener">Wikimedia Commons</a>`;
  }).catch(() => {});

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

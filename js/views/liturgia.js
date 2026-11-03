// Liturgia: o dia litúrgico (#/liturgia/AAAA-MM-DD) com tempo, cor, santos,
// leituras (texto de Figueiredo e link para o Lecionário oficial) e dicas do dia;
// e o calendário do mês (#/liturgia), com a cor de cada dia.

import { dia, mes, leiturasDe, dicasDe, explicacoes, COR_HEX, COR_NOME, ANOS, aplicarCor } from "../liturgia.js";
import { trechoHTML, refsHTML } from "../biblia.js";
import { carregar } from "../content.js";
import { getState, registrar, contarFlag } from "../store.js";
import { esc, cabecalho, hojeISO, somaDias, toast } from "../ui.js";
import { ic } from "../icons.js";
import { fontesHTML } from "../catecismo.js";

const TIPO_DICA = { norma: "Norma da Igreja", costume: "Costume", sugestao: "Sugestão" };
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

export async function render(el, params) {
  if (params.data) return paginaDia(el, params.data);
  return calendario(el);
}

export function dataLonga(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(a, m - 1, d));
}

async function nomesSantos(ids = []) {
  if (!ids.length) return [];
  const { santos } = await carregar("santos/indice.json");
  return ids.map(id => santos.find(s => s.id === id)).filter(Boolean);
}

// ---------- Um dia ----------
async function paginaDia(el, iso) {
  const d = await dia(iso);
  if (!d) {
    el.innerHTML = cabecalho("Data fora do calendário", `O app traz o calendário de ${ANOS[0]} a ${ANOS[ANOS.length - 1]}.`) + `<p><a class="botao" href="#/liturgia">Ver o calendário</a></p>`;
    return;
  }
  if (iso === hojeISO()) aplicarCor(d.cor);
  const [{ lt, aviso }, dicas, exp, santos] = await Promise.all([leiturasDe(d), dicasDe(d), explicacoes(), nomesSantos(d.santos)]);
  const tempo = exp.tempos[d.tempo];
  const grau = exp.graus[d.grau];
  const cor = exp.cores[d.cor];
  const ontem = somaDias(iso, -1), amanha = somaDias(iso, 1);
  const leuEv = (getState().flags.evangelhos || []).includes(iso);

  const blocoLeitura = (rotulo, lista, aberto = false) => !lista?.length ? "" : `
    <details class="cartao leitura" ${aberto ? "open" : ""}>
      <summary><span class="leitura-rot">${rotulo}</span><span class="leitura-ref">${lista.map(r => esc(r.txt)).join(" ou ")}</span></summary>
      <div class="leitura-texto" data-refs='${esc(JSON.stringify(lista.map((_, i) => i)))}' data-bloco="${rotulo}"></div>
    </details>`;

  el.innerHTML = `
    <p class="migalha"><a href="#/liturgia">${ic("voltar")} Calendário</a></p>
    <header class="tela-topo dia-topo" style="--cor-dia:${COR_HEX[d.cor] || COR_HEX.verde}">
      <p class="apoio dia-data">${esc(dataLonga(iso))}</p>
      <h1 tabindex="-1">${esc(d.nome)}</h1>
      <div class="chips">
        <span class="chip chip-cor"><i class="bolinha" style="background:${COR_HEX[d.cor]}"></i>${esc(COR_NOME[d.cor] || d.cor)}</span>
        <span class="chip">${esc(d.grauNome)}</span>
        ${tempo ? `<span class="chip">${esc(tempo.nome)}</span>` : ""}
        ${d.preceito ? `<span class="chip chip-preceito">Dia de preceito</span>` : ""}
      </div>
      ${d.diaTempo && d.diaTempo !== d.nome ? `<p class="apoio">${esc(d.diaTempo)}</p>` : ""}
      <p class="apoio">Leituras: Ano ${esc(d.anoA)}${d.tempo === "comum" && d.grau !== "D" && d.grau !== "S" ? ` · ano ${d.anoPar === "I" ? "ímpar (I)" : "par (II)"}` : ""}</p>
    </header>

    ${santos.length || d.facultativas?.length ? `<section class="cartao santos-dia">
      <h2>Santos do dia</h2>
      <ul class="lista-simples">${santos.map(s => `<li>${s.vida ? `<a href="#/santos/${s.id}">${esc(s.nome)}</a>` : esc(s.nome)} <small class="apoio">(${esc(s.grauNome)})</small></li>`).join("")}
      ${(d.facultativas || []).filter(n => !santos.some(s => s.nome === n)).map(n => `<li>${esc(n)} <small class="apoio">(memória facultativa)</small></li>`).join("")}</ul>
    </section>` : ""}

    <h2 class="secao">Leituras da missa</h2>
    ${lt ? `
      ${blocoLeitura("1ª leitura", lt.l1)}
      ${blocoLeitura("Salmo", lt.salmo)}
      ${blocoLeitura("2ª leitura", lt.l2)}
      ${blocoLeitura("Evangelho", lt.ev, true)}
      <div class="botoes">
        <button class="botao ${leuEv ? "secundario" : ""}" id="li-ev">${ic("livro")} ${leuEv ? "Evangelho lido hoje" : "Li o Evangelho"}</button>
        <a class="botao secundario" href="#/lectio/dia/${iso}">${ic("pena")} Rezar com a Lectio Divina</a>
        <a class="botao secundario" href="https://www.cnbb.org.br/liturgia-diaria/" target="_blank" rel="noopener">Texto oficial da CNBB ${ic("seta")}</a>
      </div>
      <p class="aviso-texto">${esc(aviso)} O texto mostrado aqui é da tradução de Figueiredo; na missa se usa a tradução oficial da CNBB.</p>`
    : `<p class="cartao vazio">Não encontrei as leituras deste dia. Confira na <a href="https://www.cnbb.org.br/liturgia-diaria/" target="_blank" rel="noopener">liturgia diária da CNBB</a>.</p>`}

    ${dicas.length ? `<h2 class="secao">Para viver o dia</h2>
      ${dicas.map(x => `<article class="cartao dica dica-${esc(x.tipo)}">
        <p class="dica-tipo">${esc(TIPO_DICA[x.tipo] || "Dica")}</p>
        <h3>${esc(x.titulo)}</h3><p>${esc(x.texto)}</p>
        ${refsHTML(x.biblia)}${x.fontes?.length ? `<p class="fontes">Fonte: ${fontesHTML(x.fontes)}</p>` : ""}
      </article>`).join("")}` : ""}

    <h2 class="secao">Entenda</h2>
    ${tempo ? `<details class="cartao explica"><summary><strong>${esc(tempo.nome)}</strong>: ${esc(tempo.resumo)}</summary>
      ${tempo.texto.map(t => `<p>${esc(t)}</p>`).join("")}${refsHTML(tempo.biblia)}<p class="fontes">Fonte: ${fontesHTML(tempo.fontes)}</p></details>` : ""}
    ${cor ? `<details class="cartao explica"><summary><strong>Cor ${esc(cor.nome.toLowerCase())}</strong></summary><p>${esc(cor.texto)}</p><p class="fontes">Fonte: Instrução Geral do Missal Romano, 346</p></details>` : ""}
    ${grau ? `<details class="cartao explica"><summary><strong>${esc(grau.nome)}</strong></summary><p>${esc(grau.texto)}</p></details>` : ""}
    ${d.preceito ? `<details class="cartao explica"><summary><strong>Dia de preceito</strong></summary><p>${esc(exp.preceito.texto)}</p>${refsHTML(exp.preceito.biblia)}</details>` : ""}
    <details class="cartao explica"><summary><strong>O Ano Litúrgico</strong></summary>${exp.anoLiturgico.texto.map(t => `<p>${esc(t)}</p>`).join("")}<p class="fontes">Fonte: ${fontesHTML(exp.anoLiturgico.fontes)}</p></details>

    <nav class="botoes leitor-nav" aria-label="Outros dias">
      <a class="botao secundario" href="#/liturgia/${ontem}">${ic("voltar")} Dia anterior</a>
      ${iso !== hojeISO() ? `<a class="botao secundario" href="#/liturgia/${hojeISO()}">Hoje</a>` : ""}
      <a class="botao secundario" href="#/liturgia/${amanha}">Próximo dia ${ic("seta")}</a>
    </nav>`;

  // Texto das leituras (carregado quando abre).
  const mapa = { "1ª leitura": lt?.l1, "Salmo": lt?.salmo, "2ª leitura": lt?.l2, "Evangelho": lt?.ev };
  el.querySelectorAll(".leitura").forEach(det => {
    const alvo = det.querySelector(".leitura-texto");
    const carregarTexto = async () => {
      if (alvo.dataset.ok) return;
      alvo.dataset.ok = "1";
      const lista = mapa[alvo.dataset.bloco] || [];
      const partes = await Promise.all(lista.map(async (r, i) =>
        `${lista.length > 1 ? `<p class="leitura-alt">${i === 0 ? "" : "ou "}${esc(r.txt)}</p>` : ""}${await trechoHTML(r)}<p><a href="#/biblia/${r.livro}/${r.trechos[0][0]}/${r.trechos[0][1]}">Abrir na Bíblia</a></p>`));
      alvo.innerHTML = partes.join("");
    };
    if (det.open) carregarTexto();
    det.addEventListener("toggle", () => det.open && carregarTexto());
  });

  el.querySelector("#li-ev")?.addEventListener("click", e => {
    if ((getState().flags.evangelhos || []).includes(iso)) return;
    contarFlag("evangelhos", iso);
    registrar({ tipo: "evangelho", ref: iso, titulo: `Evangelho de ${dataLonga(iso).split(",")[0]} (${lt.ev.map(r => r.txt).join(" ou ")})`, minutos: 3 });
    e.currentTarget.classList.add("secundario");
    e.currentTarget.innerHTML = `${ic("livro")} Evangelho lido hoje`;
    toast("Que a Palavra dê fruto em você hoje.");
  });
}

// ---------- Calendário do mês ----------
async function calendario(el) {
  const hoje = hojeISO();
  let [ano, m] = hoje.split("-").map(Number);
  if (!ANOS.includes(ano)) { ano = ANOS[0]; m = 1; }
  const exp = await explicacoes();

  const desenhar = async () => {
    const dias = await mes(ano, m);
    const primeiro = new Date(ano, m - 1, 1).getDay();
    const celulas = Array(primeiro).fill(`<li aria-hidden="true"></li>`).concat(dias.map(d => {
      const n = +d.data.slice(8);
      const classes = [d.data === hoje ? "hoje" : "", ["S", "D", "FS"].includes(d.grau) ? "forte" : ""].join(" ");
      return `<li><a href="#/liturgia/${d.data}" class="${classes}" style="--cor:${COR_HEX[d.cor]}" aria-label="${n} de ${MESES[m - 1]}: ${esc(d.nome)}, ${esc(COR_NOME[d.cor])}"><span>${n}</span><i></i></a></li>`;
    }));
    const destaques = dias.filter(d => ["S", "F", "FS", "FD"].includes(d.grau) || d.preceito && d.grau !== "D");
    el.querySelector("#cal").innerHTML = `
      <div class="cal-topo">
        <button class="botao secundario" id="mes-ant" aria-label="Mês anterior" ${ano === ANOS[0] && m === 1 ? "disabled" : ""}>${ic("voltar")}</button>
        <h2>${MESES[m - 1]} de ${ano}</h2>
        <button class="botao secundario" id="mes-prox" aria-label="Próximo mês" ${ano === ANOS[ANOS.length - 1] && m === 12 ? "disabled" : ""}>${ic("seta")}</button>
      </div>
      <ul class="cal-semana" aria-hidden="true">${SEMANA.map(s => `<li>${s}</li>`).join("")}</ul>
      <ul class="cal-grade">${celulas.join("")}</ul>
      <ul class="cal-legenda">${Object.entries(COR_NOME).filter(([k]) => k !== "preto").map(([k, v]) => `<li><i class="bolinha" style="background:${COR_HEX[k]}"></i>${v}</li>`).join("")}</ul>
      ${destaques.length ? `<h3 class="grupo-titulo">Celebrações do mês</h3><ul class="lista-destaques">${destaques.map(d =>
        `<li><a href="#/liturgia/${d.data}"><span class="dia-num" style="--cor:${COR_HEX[d.cor]}">${+d.data.slice(8)}</span><span>${esc(d.nome)}<small>${esc(d.grauNome)}${d.preceito ? " · preceito" : ""}</small></span></a></li>`).join("")}</ul>` : ""}`;
    el.querySelector("#mes-ant").onclick = () => { m--; if (m < 1) { m = 12; ano--; } desenhar(); };
    el.querySelector("#mes-prox").onclick = () => { m++; if (m > 12) { m = 1; ano++; } desenhar(); };
  };

  const dHoje = await dia(hoje);
  el.innerHTML = cabecalho("Liturgia", "O calendário da Igreja no Brasil: tempo, cor, santos e leituras de cada dia.") + `
    ${dHoje ? `<a class="cartao continuar hoje-card" href="#/liturgia/${hoje}" style="--cor:${COR_HEX[dHoje.cor]}">
      <span class="tile-ic cor-ic">${ic("calendario")}</span><span><small>Hoje · ${esc(COR_NOME[dHoje.cor])}</small><strong>${esc(dHoje.nome)}</strong></span>${ic("seta", "seta")}</a>` : ""}
    <section class="cartao" id="cal"></section>
    <details class="cartao explica"><summary><strong>O que é o Ano Litúrgico?</strong></summary>${exp.anoLiturgico.texto.map(t => `<p>${esc(t)}</p>`).join("")}</details>
    <details class="cartao explica"><summary><strong>O que significam as cores?</strong></summary>${Object.values(exp.cores).map(c => `<p><i class="bolinha" style="background:${c.hex}"></i> <strong>${esc(c.nome)}:</strong> ${esc(c.texto)}</p>`).join("")}</details>`;
  await desenhar();
}

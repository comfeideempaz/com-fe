// Orações (#/oracoes, #/oracoes/:id). O terço tem tela própria (js/views/terco.js, #/terco).

import { carregar } from "../content.js";
import { refsHTML } from "../biblia.js";
import { registrar } from "../store.js";
import { esc, cabecalho, toast } from "../ui.js";
import { ic } from "../icons.js";
import { falar, parar, temVoz } from "../speech.js";
import { fontesHTML } from "../catecismo.js";

const linhas = t => esc(t).replace(/\n/g, "<br>");

export async function render(el, params) {
  const dados = await carregar("oracoes.json");
  if (params.id === "terco") { location.replace("#/terco"); return; }
  if (params.id) return oracao(el, dados, params.id);
  return indice(el, dados);
}

function indice(el, { categorias, oracoes, terco: t }) {
  const hoje = t.misterios[t.diasDaSemana[new Date().getDay()]];
  el.innerHTML = cabecalho("Orações", "As orações da fé católica, com os textos usados no Brasil, sua origem e base bíblica.") + `
    <a class="cartao continuar terco-card" href="#/terco"><span class="tile-ic">${ic("terco")}</span>
      <span><small>Terço interativo · hoje: ${esc(hoje.nome)}</small><strong>Rezar o terço</strong></span>${ic("seta", "seta")}</a>
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

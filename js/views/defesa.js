// Defesa da Fé: perguntas que outros cristãos e amigos fazem sobre a fé católica,
// respondidas com a Bíblia, o Catecismo e os primeiros cristãos (#/defesa e #/defesa/:id).

import { carregar } from "../content.js";
import { refsHTML } from "../biblia.js";
import { getState, contarFlag, registrar } from "../store.js";
import { esc, cabecalho } from "../ui.js";
import { ic } from "../icons.js";

export async function render(el, params) {
  const d = await carregar("defesa.json");
  return params.id ? tema(el, d, params.id) : indice(el, d);
}

function indice(el, { introducao, categorias, temas }) {
  const estudados = new Set(getState().flags.defesa || []);
  el.innerHTML = cabecalho("Defesa da Fé", "Respostas católicas, com a Bíblia na mão e caridade no coração.") + `
    <section class="cartao">${introducao.texto.map(t => `<p>${esc(t)}</p>`).join("")}${refsHTML(introducao.biblia)}</section>
    <details class="cartao explica"><summary><strong>Dicas para conversar</strong></summary><ul class="lista-simples">${introducao.dicasDialogo.map(t => `<li>${esc(t)}</li>`).join("")}</ul></details>
    ${categorias.map(c => {
      const lista = temas.filter(t => t.categoria === c.id);
      return lista.length ? `<h2 class="secao">${esc(c.nome)}</h2><ul class="cartao lista-links">${lista.map(t =>
        `<li><a href="#/defesa/${t.id}"><span><strong>${esc(t.titulo)}</strong><small>${esc(t.objecao)}</small></span>${estudados.has(t.id) ? `<span class="chip">Lido</span>` : ""}${ic("seta", "seta")}</a></li>`).join("")}</ul>` : "";
    }).join("")}`;
}

function tema(el, { temas }, id) {
  const t = temas.find(x => x.id === id);
  if (!t) { el.innerHTML = cabecalho("Tema não encontrado") + `<p><a href="#/defesa">Voltar</a></p>`; return; }
  const i = temas.indexOf(t);
  const prox = temas[i + 1];
  el.innerHTML = `<p class="migalha"><a href="#/defesa">${ic("voltar")} Defesa da Fé</a></p>` + cabecalho(t.titulo) + `
    <p class="objecao cartao"><strong>Objeção comum:</strong> ${esc(t.objecao)}</p>
    <section class="cartao resposta-curta"><h2>Resposta curta</h2><p>${esc(t.respostaCurta)}</p></section>
    <section class="cartao"><h2>Explicação</h2>${t.explicacao.map(p => `<p>${esc(p)}</p>`).join("")}</section>
    <section class="cartao"><h2>Na Bíblia</h2>${refsHTML(t.biblia)}<p class="fontes">Catecismo e Igreja: ${t.fontes.map(esc).join("; ")}</p></section>
    ${t.padres?.length ? `<h2 class="secao">Os primeiros cristãos</h2>${t.padres.map(p => `
      <blockquote class="cartao frase"><p>“${esc(p.texto)}”</p><cite>${esc(p.autor)}, ${esc(p.obra)}</cite>${p.nota ? `<p class="apoio">${esc(p.nota)}</p>` : ""}</blockquote>`).join("")}
      <p class="fontes">Citações dos Padres da Igreja em tradução livre.</p>` : ""}
    ${t.revisar ? `<p class="fontes">${esc(t.obs || "Tema em revisão.")}</p>` : ""}
    ${prox ? `<p><a class="botao secundario" href="#/defesa/${prox.id}">Próximo tema: ${esc(prox.titulo)} ${ic("seta")}</a></p>` : ""}`;
  if (!(getState().flags.defesa || []).includes(id)) {
    contarFlag("defesa", id);
    registrar({ tipo: "defesa", ref: id, titulo: `"${t.titulo}"` });
  }
}

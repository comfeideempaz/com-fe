// Missa explicada: cada parte da celebração com postura, o que se diz,
// o que acontece, o porquê, base bíblica e fontes (IGMR e Catecismo).
// A pessoa marca as partes que já estudou; o glossário explica objetos, vestes e gestos.

import { carregar } from "../content.js";
import { refsHTML } from "../biblia.js";
import { getState, subscribe, marcarVisto } from "../store.js";
import { esc, cabecalho, progressBar, toast } from "../ui.js";
import { ic } from "../icons.js";
import { fontesHTML } from "../catecismo.js";

const TIPOS = { objeto: "Objetos", veste: "Vestes", gesto: "Gestos e posturas", cor: "Cores" };

export async function render(el) {
  const m = await carregar("missa.json");
  const todas = m.ritos.flatMap(r => r.partes);
  let tipoGlossario = "objeto";
  const abertas = new Set();

  const desenhar = () => {
    const vistas = new Set(getState().missaVista);
    const feitas = todas.filter(p => vistas.has(p.id)).length;
    el.innerHTML = cabecalho("Missa explicada", "Cada parte da Missa: o que acontece, o que se diz e por quê, com a Bíblia e os documentos da Igreja.") + `
      <section class="cartao">
        <p>${esc(m.introducao.texto)}</p>
        ${refsHTML(m.introducao.biblia)}
        <p class="fontes">Fontes: ${fontesHTML(m.introducao.fontes)}</p>
      </section>
      <div class="cartao progresso-biblia"><p><strong>${feitas} de ${todas.length}</strong> partes estudadas</p>${progressBar(feitas / todas.length, "Partes da missa estudadas")}</div>
      ${m.ritos.map((r, i) => `
        <h2 class="secao"><span class="rito-num">${i + 1}</span> ${esc(r.nome)}</h2>
        <p class="apoio">${esc(r.resumo)}</p>
        ${r.partes.map(p => `
          <details class="cartao parte ${vistas.has(p.id) ? "vista" : ""}" data-id="${p.id}" ${abertas.has(p.id) ? "open" : ""}>
            <summary><span>${esc(p.nome)}</span>${vistas.has(p.id) ? `<span class="chip">Estudada</span>` : ""}</summary>
            <div class="parte-corpo">
              <p class="parte-meta"><span><strong>Postura:</strong> ${esc(p.postura)}</span><span><strong>Quem:</strong> ${esc(p.quem)}</span></p>
              ${p.oQueSeDiz ? `<p class="parte-diz">${esc(p.oQueSeDiz)}</p>` : ""}
              <h3>O que acontece</h3><p>${esc(p.oQueAcontece)}</p>
              <h3>Por quê?</h3><p>${esc(p.porque)}</p>
              ${p.curiosidade ? `<p class="curiosidade"><strong>Curiosidade:</strong> ${esc(p.curiosidade)}</p>` : ""}
              ${p.biblia?.length ? `<p class="parte-biblia"><strong>Na Bíblia:</strong> ${refsHTML(p.biblia)}</p>` : ""}
              <p class="fontes">Fonte: ${fontesHTML(p.fontes)}</p>
              ${vistas.has(p.id) ? "" : `<button class="botao secundario marcar" data-id="${p.id}" data-nome="${esc(p.nome)}">${ic("planos")} Entendi esta parte</button>`}
            </div>
          </details>`).join("")}`).join("")}

      <h2 class="secao">Glossário da Missa</h2>
      <div class="abas" role="tablist">${Object.entries(TIPOS).map(([k, v]) => `<button role="tab" aria-selected="${k === tipoGlossario}" data-tipo="${k}">${v}</button>`).join("")}</div>
      <dl class="cartao glossario">${m.glossario.filter(g => g.tipo === tipoGlossario).map(g => `
        <dt>${esc(g.termo)}</dt><dd>${esc(g.explicacao)} ${refsHTML(g.biblia)}${g.fontes?.length ? `<span class="fontes"> (${fontesHTML(g.fontes)})</span>` : ""}</dd>`).join("")}</dl>

      <h2 class="secao">Para participar melhor</h2>
      <ul class="cartao lista-simples dicas-missa">${m.dicasParticipar.map(d => `<li>${esc(d)}</li>`).join("")}</ul>`;

    el.querySelectorAll("details.parte").forEach(d => d.addEventListener("toggle", () => { if (d.open) abertas.add(d.dataset.id); else abertas.delete(d.dataset.id); }));
    el.querySelectorAll(".marcar").forEach(b => b.addEventListener("click", () => {
      marcarVisto("missaVista", b.dataset.id, `a parte da Missa "${b.dataset.nome}"`, "missa");
      toast("Parte estudada.");
    }));
    el.querySelectorAll("[data-tipo]").forEach(b => b.addEventListener("click", () => { tipoGlossario = b.dataset.tipo; const y = scrollY; desenhar(); scrollTo(0, y); }));
  };
  desenhar();
  return subscribe(() => { const y = scrollY; desenhar(); scrollTo(0, y); });
}

// Tela "Mais" (só no celular): atalhos para as áreas que não cabem na barra de baixo.

import { cabecalho } from "../ui.js";
import { ic } from "../icons.js";

const ITENS = [
  { rota: "#/santos", icone: "santo", titulo: "Santos", texto: "Histórias e curiosidades" },
  { rota: "#/missa", icone: "calice", titulo: "Missa explicada", texto: "Cada parte e o porquê" },
  { rota: "#/oracoes", icone: "maos", titulo: "Orações", texto: "Orações e terço guiado" },
  { rota: "#/progresso", icone: "progresso", titulo: "Meu progresso", texto: "Sequência, meta e backup" },
  { rota: "#/sobre", icone: "info", titulo: "Sobre", texto: "Fontes e créditos" },
];

export function render(el) {
  el.innerHTML = cabecalho("Mais") + `
    <ul class="cartao lista-links">
      ${ITENS.map(i => `<li><a href="${i.rota}"><span class="tile-ic">${ic(i.icone)}</span><span><strong>${i.titulo}</strong><small>${i.texto}</small></span>${ic("seta", "seta")}</a></li>`).join("")}
    </ul>`;
}

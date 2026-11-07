// Tela "Mais" (só no celular): atalhos para as áreas que não cabem na barra de baixo.

import { cabecalho } from "../ui.js";
import { ic } from "../icons.js";

const ITENS = [
  { rota: "#/planos", icone: "planos", titulo: "Projetos de leitura", texto: "A Bíblia toda em 1 ano e outros caminhos" },
  { rota: "#/lectio", icone: "pena", titulo: "Lectio Divina", texto: "Leitura orante e minhas meditações" },
  { rota: "#/santos", icone: "santo", titulo: "Santos", texto: "Histórias e curiosidades" },
  { rota: "#/missa", icone: "calice", titulo: "Missa explicada", texto: "Cada parte e o porquê" },
  { rota: "#/oracoes", icone: "maos", titulo: "Orações", texto: "As orações da fé católica" },
  { rota: "#/sacramentos", icone: "cruz", titulo: "Sacramentos", texto: "Confissão e exame de consciência" },
  { rota: "#/defesa", icone: "escudo", titulo: "Defesa da Fé", texto: "Respostas com a Bíblia e o Catecismo" },
  { rota: "#/progresso", icone: "progresso", titulo: "Meu progresso", texto: "Sequência, selos, meta e conta" },
  { rota: "#/sobre", icone: "info", titulo: "Sobre", texto: "Fontes e créditos" },
];

export function render(el) {
  el.innerHTML = cabecalho("Mais") + `
    <ul class="cartao lista-links">
      ${ITENS.map(i => `<li><a href="${i.rota}"><span class="tile-ic">${ic(i.icone)}</span><span><strong>${i.titulo}</strong><small>${i.texto}</small></span>${ic("seta", "seta")}</a></li>`).join("")}
    </ul>`;
}

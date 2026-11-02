// Tela "Missa explicada". Nesta fase mostra só o que vem por aí; o conteúdo real chega nas fases 2 e 3.

import { cabecalho, emBreve } from "../ui.js";

export function render(el) {
  el.innerHTML = cabecalho("Missa explicada", "A missa parte por parte: o que acontece, o que se diz e por quê.") + emBreve("calice", "A missa explicada vai ter os quatro ritos:", [
    "Ritos iniciais",
    "Liturgia da Palavra",
    "Liturgia Eucarística",
    "Ritos finais",
    "Glossário de objetos, vestes e gestos",
  ]);
}

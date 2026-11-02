// Tela "Santos". Nesta fase mostra só o que vem por aí; o conteúdo real chega nas fases 2 e 3.

import { cabecalho, emBreve } from "../ui.js";

export function render(el) {
  el.innerHTML = cabecalho("Santos", "A história completa e as curiosidades dos santos.") + emBreve("santo", "Cada santo vai ter uma página com:", [
    "História completa, separando fatos documentados e tradição",
    "Curiosidades e frases",
    "Padroeiro de quê e de onde",
    "Símbolos na arte e uma oração",
    "Busca e lista por mês",
  ]);
}

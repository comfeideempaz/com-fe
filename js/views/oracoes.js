// Tela "Orações". Nesta fase mostra só o que vem por aí; o conteúdo real chega nas fases 2 e 3.

import { cabecalho, emBreve } from "../ui.js";

export function render(el) {
  el.innerHTML = cabecalho("Orações", "As orações tradicionais da Igreja e o terço guiado.") + emBreve("maos", "Aqui você vai encontrar:", [
    "Pai-Nosso, Ave-Maria, Glória, Credo, Salve-Rainha e outras",
    "Orações da manhã e da noite",
    "Terço guiado com os mistérios do dia",
    "Ouvir a oração com a voz do aparelho",
  ]);
}

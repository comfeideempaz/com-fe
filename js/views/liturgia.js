// Tela "Liturgia". Nesta fase mostra só o que vem por aí; o conteúdo real chega nas fases 2 e 3.

import { cabecalho, emBreve } from "../ui.js";

export function render(el) {
  el.innerHTML = cabecalho("Liturgia", "O ano litúrgico com tempos, cores, festas e as leituras de cada dia.") + emBreve("calendario", "O calendário litúrgico vai mostrar, para cada dia:", [
    "Tempo litúrgico e a semana",
    "Cor litúrgica e o que ela significa",
    "Solenidades, festas e memórias",
    "Ano A, B ou C e ano par ou ímpar",
    "Leituras, salmo e o evangelho do dia",
  ]);
}

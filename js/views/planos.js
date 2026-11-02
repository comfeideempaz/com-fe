// Tela "Projetos de leitura". Nesta fase mostra só o que vem por aí; o conteúdo real chega nas fases 2 e 3.

import { cabecalho, emBreve } from "../ui.js";

export function render(el) {
  el.innerHTML = cabecalho("Projetos de leitura", "Leia a Bíblia com um plano e acompanhe cada dia.") + emBreve("planos", "Os projetos de leitura vão incluir:", [
    "Bíblia toda em 1 ano",
    "Novo Testamento em 90 dias",
    "Os quatro Evangelhos em 30 dias",
    "Salmos e Provérbios em 31 dias",
    "História da Salvação",
    "Plano livre: você escolhe os livros e o prazo",
  ]);
}

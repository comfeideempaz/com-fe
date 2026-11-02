// Tela "Bíblia". Nesta fase mostra só o que vem por aí; o conteúdo real chega nas fases 2 e 3.

import { cabecalho, emBreve } from "../ui.js";

export function render(el) {
  el.innerHTML = cabecalho("Bíblia", "Os 73 livros do cânon católico, para ler mesmo sem internet.") + emBreve("livro", "O leitor da Bíblia chega nas próximas fases, com:", [
    "Antigo e Novo Testamento, livro por livro e capítulo por capítulo",
    "Busca por palavra, sem se preocupar com acentos",
    "Ouvir o capítulo com a voz do aparelho",
    "Marcar capítulos lidos e versículos favoritos",
    "Link para a tradução da CNBB quando houver internet",
  ]);
}

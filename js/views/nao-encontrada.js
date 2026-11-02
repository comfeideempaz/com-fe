// Tela para endereços que não existem no app.

import { cabecalho } from "../ui.js";
import { lumi } from "../lumi.js";

export function render(el) {
  el.innerHTML = cabecalho("Página não encontrada") + `
    <section class="cartao vazio">
      ${lumi({ tamanho: 96, humor: "pensando" })}
      <p>A Lumi procurou, mas não achou esta página.</p>
      <a class="botao" href="#/inicio">Voltar ao início</a>
    </section>`;
}

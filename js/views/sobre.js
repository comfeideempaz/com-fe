// Tela "Sobre": o que é o app, as fontes do conteúdo e a versão.

import { cabecalho } from "../ui.js";
import { APP_VERSION } from "../config.js";
import { lumi } from "../lumi.js";

export function render(el) {
  el.innerHTML = cabecalho("Sobre o Catequizando") + `
    <section class="cartao sobre">
      <div class="sobre-lumi">${lumi({ tamanho: 96, humor: "piscando" })}</div>
      <p>O Catequizando ajuda você a conhecer e viver a fé católica no dia a dia: a Bíblia, a liturgia de cada dia, a missa explicada, os sacramentos, a Defesa da Fé, a vida dos santos e as orações. Funciona sem internet e sem conta.</p>
      <p>A Lumi, nossa ovelhinha, lembra o Bom Pastor, que conhece cada uma das suas ovelhas (Jo 10,14).</p>
    </section>
    <section class="cartao">
      <h2>Fontes</h2>
      <ul class="lista-simples">
        <li>Catecismo da Igreja Católica (citado pelo número, ex.: CIC 1324) e seu Compêndio</li>
        <li>Instrução Geral do Missal Romano (IGMR) e o Missal Romano usado no Brasil</li>
        <li>Martirológio Romano e o calendário litúrgico da CNBB</li>
        <li>Código de Direito Canônico, Ritual da Penitência e documentos dos Papas e Concílios citados em cada página</li>
        <li>Bíblia Sagrada, tradução do Pe. Antônio Pereira de Figueiredo (domínio público), digitalizada de uma edição de 1950 e revisada automaticamente; alguns versículos ainda faltam e estão marcados</li>
        <li>Referências das leituras do Lecionário Romano, com as próprias do Brasil</li>
        <li>Padres da Igreja (Inácio de Antioquia, Justino, Ireneu, Agostinho e outros), em tradução livre</li>
      </ul>
      <p class="apoio">Encontrou algo para corrigir? Avise a sua paróquia ou o responsável pelo app.</p>
    </section>
    <p class="versao">Versão ${APP_VERSION}</p>`;
}

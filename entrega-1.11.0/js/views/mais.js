// Tela "Mais" (só no celular): atalhos para as áreas que não cabem na barra de baixo.

import { cabecalho } from "../ui.js";
import { ic } from "../icons.js";

const ITENS = [
  { rota: "#/curso", icone: "selo", titulo: "Curso de Teologia", texto: "8 módulos com aulas curtas, quiz e certificado" },
  { rota: "#/busca", icone: "busca", titulo: "Pesquisar na Bíblia", texto: "Onde e quantas vezes uma palavra aparece" },
  { rota: "#/favoritos", icone: "coracao", titulo: "Favoritos", texto: "Versículos, marcações coloridas e orações que você guardou" },
  { rota: "#/perguntas", icone: "vela", titulo: "Perguntas da Alma", texto: "Dúvidas difíceis à luz da Bíblia" },
  { rota: "#/trilha", icone: "estrela", titulo: "Trilha da Lumi", texto: "Catequese para crianças, com quiz" },
  { rota: "#/confissao", icone: "cruz", titulo: "Preparar minha confissão", texto: "Exame e guia passo a passo" },
  { rota: "#/calendario", icone: "roda", titulo: "Ano Litúrgico", texto: "A roda do ano da Igreja, interativa" },
  { rota: "#/planos", icone: "planos", titulo: "Projetos de leitura", texto: "A Bíblia toda em 1 ano e outros caminhos" },
  { rota: "#/lectio", icone: "pena", titulo: "Lectio Divina", texto: "Leitura orante e minhas meditações" },
  { rota: "#/santos", icone: "santo", titulo: "Santos", texto: "Histórias e curiosidades" },
  { rota: "#/missa", icone: "calice", titulo: "Missa explicada", texto: "Cada parte e o porquê" },
  { rota: "#/oracoes", icone: "maos", titulo: "Orações", texto: "As orações da fé católica" },
  { rota: "#/sacramentos", icone: "cruz", titulo: "Sacramentos", texto: "Confissão e exame de consciência" },
  { rota: "#/defesa", icone: "escudo", titulo: "Defesa da Fé", texto: "Respostas com a Bíblia e o Catecismo" },
  { rota: "#/progresso", icone: "progresso", titulo: "Meu progresso", texto: "Sequência, selos, meta e conta" },
  { rota: "#/voz", icone: "volume", titulo: "Voz da leitura", texto: "Escolha uma voz mais natural para o Ouvir" },
  { rota: "#/contato", icone: "carta", titulo: "Fale conosco", texto: "Sugestões e erros para o administrador" },
  { rota: "#/admin", icone: "cadeado", titulo: "Administração", texto: "Mensagens e Perguntas da Alma", soAdmin: true },
  { rota: "#/sobre", icone: "info", titulo: "Sobre", texto: "Fontes e créditos" },
];

export function render(el) {
  el.innerHTML = cabecalho("Mais") + `
    <ul class="cartao lista-links">
      ${ITENS.filter(i => !i.soAdmin || document.body.classList.contains("eh-admin")).map(i => `<li><a href="${i.rota}"><span class="tile-ic">${ic(i.icone)}</span><span><strong>${i.titulo}</strong><small>${i.texto}</small></span>${ic("seta", "seta")}</a></li>`).join("")}
    </ul>`;
}

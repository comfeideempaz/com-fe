// Tela de Início: "Hoje na Igreja" (celebração, cor litúrgica, santo e evangelho
// do dia), sequência de dias, meta do dia, atalhos e últimas atividades.

import { getState, subscribe, sequenciaAtual, metaHoje } from "../store.js";
import { esc, ring, plural, dataExtenso, relativeTime, formatNumber } from "../ui.js";
import { ic } from "../icons.js";
import { lumi } from "../lumi.js";
import { dia, leiturasDe, COR_NOME, aplicarCor } from "../liturgia.js";
import { carregar } from "../content.js";
import { hojeISO } from "../ui.js";
import { getModo } from "../conta.js";
import { retrato, aplicarFotos, fotoDe } from "../fotos.js";

const ATALHOS = [
  { rota: "#/terco", icone: "terco", titulo: "Rezar o terço", texto: "Rosário interativo, conta por conta", destaque: true },
  { rota: "#/biblia", icone: "livro", titulo: "Bíblia", texto: "Os 73 livros, offline" },
  { rota: "#/planos", icone: "planos", titulo: "Projetos de leitura", texto: "A Bíblia toda em 1 ano" },
  { rota: "#/lectio", icone: "pena", titulo: "Lectio Divina", texto: "Rezar e escrever com a Palavra" },
  { rota: "#/liturgia", icone: "calendario", titulo: "Liturgia", texto: "Tempo, cor e leituras" },
  { rota: "#/missa", icone: "calice", titulo: "Missa explicada", texto: "Cada parte e o porquê" },
  { rota: "#/santos", icone: "santo", titulo: "Santos", texto: "Histórias e curiosidades" },
  { rota: "#/oracoes", icone: "maos", titulo: "Orações", texto: "Orações da fé católica" },
  { rota: "#/sacramentos", icone: "cruz", titulo: "Sacramentos", texto: "Confissão e exame de consciência" },
  { rota: "#/defesa", icone: "escudo", titulo: "Defesa da Fé", texto: "Respostas com a Bíblia" },
  { rota: "#/progresso", icone: "selo", titulo: "Meu caminho", texto: "Sequência, selos e backup" },
];

const ROTULO_ATIVIDADE = { capitulo: "Leu", evangelho: "Leu o", missa: "Estudou", santo: "Conheceu", oracao: "Rezou", plano: "Projeto:", defesa: "Estudou", sacramento: "Estudou", lectio: "Fez a Lectio Divina com" };

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

async function hojeNaIgreja() {
  try {
    const d = await dia(hojeISO());
    if (!d) return null;
    aplicarCor(d.cor);
    const { lt } = await leiturasDe(d);
    let santo = null;
    if (d.santos?.length) {
      const { santos } = await carregar("santos/indice.json");
      santo = santos.find(x => x.id === d.santos[0]) || null;
    }
    return { d, ev: lt?.ev || [], santo };
  } catch { return null; }
}

function heroHTML(h) {
  if (!h) return `<p class="hero-rotulo">Hoje na Igreja</p><h2 id="hoje-titulo">Liturgia de hoje</h2><p>O calendário deste ano ainda não está no app.</p>`;
  const { d, ev, santo } = h;
  return `<p class="hero-rotulo">Hoje na Igreja</p>
    <h2 id="hoje-titulo">${esc(d.nome)}</h2>
    <p>${d.diaTempo && d.diaTempo !== d.nome ? esc(d.diaTempo) + " · " : ""}Cor ${esc((COR_NOME[d.cor] || d.cor).toLowerCase())}${d.preceito ? " · dia de preceito" : ""}</p>
    <div class="chips">
      ${ev.length ? `<a class="chip" href="#/liturgia/${d.data}">${ic("livro")} Evangelho: ${esc(ev[0].txt)}</a>` : ""}
      <a class="chip" href="#/liturgia/${d.data}">${ic("calendario")} Leituras e dicas</a>
    </div>`;
}

function desenhar(el, hoje) {
  const st = getState();
  const seq = sequenciaAtual();
  const meta = metaHoje();
  const unidade = meta.tipo === "minutos" ? "min" : (meta.valor === 1 ? "capítulo" : "capítulos");
  const lidos = Object.keys(st.lidos).length;
  const nome = st.perfil.nome ? `, ${st.perfil.nome}` : "";

  el.innerHTML = `
    <header class="tela-topo inicio-topo">
      <p class="apoio">${esc(dataExtenso())}</p>
      <h1 tabindex="-1">${esc(saudacao() + nome)}!</h1>
    </header>

    <section class="hero" aria-labelledby="hoje-titulo">
      <div class="hero-faixa" aria-hidden="true"></div>
      <div class="hero-corpo">
        <div class="hero-texto">
          ${heroHTML(hoje)}
        </div>
        <div class="hero-lumi">${lumi({ tamanho: 112 })}</div>
      </div>
    </section>

    ${hoje?.santo && hoje.santo.tipo !== "celebracao" ? `<a class="cartao santo-dia" href="#/santos/${hoje.santo.id}">
      ${retrato(hoje.santo, "grande")}
      <span><span class="kicker">Santo do dia</span><strong>${esc(hoje.santo.nome.split(",")[0])}</strong>
      <small>${esc((hoje.santo.patrono || []).slice(0, 3).join(" · ") || hoje.santo.grauNome)}</small></span>${ic("seta", "seta")}</a>` : ""}

    ${getModo() === "visitante" ? `<section class="cartao faixa-visitante">
      <p><strong>Você está como visitante.</strong> Pode usar tudo, mas o seu progresso some ao fechar o app.</p>
      <a class="botao secundario" href="#/entrar/criar">Criar conta e salvar</a>
    </section>` : ""}

    <section class="painel" aria-label="Sua constância">
      <div class="cartao estat">
        <div class="estat-ic chama">${ic("chama")}</div>
        <div><p class="estat-num">${formatNumber(seq)}</p><p class="estat-rot">${seq === 1 ? "dia seguido" : "dias seguidos"}</p></div>
      </div>
      <div class="cartao estat estat-meta">
        ${ring(meta.frac, `<strong>${formatNumber(meta.feito)}</strong><small>de ${meta.valor}</small>`, `Meta de hoje: ${meta.feito} de ${meta.valor} ${unidade}`)}
        <div><p class="estat-rot">Meta de hoje</p><p class="estat-sub">${meta.valor} ${unidade}${meta.frac >= 1 ? " · cumprida!" : ""}</p></div>
      </div>
      <div class="cartao estat">
        <div class="estat-ic livro">${ic("livro")}</div>
        <div><p class="estat-num">${formatNumber(lidos)}</p><p class="estat-rot">${lidos === 1 ? "capítulo lido" : "capítulos lidos"}</p></div>
      </div>
    </section>

    <h2 class="secao">Para hoje</h2>
    <nav class="tiles" aria-label="Áreas do app">
      ${ATALHOS.map(a => `<a class="tile${a.destaque ? " destaque" : ""}" href="${a.rota}"><span class="tile-ic">${ic(a.icone)}</span><span class="tile-t">${a.titulo}</span><span class="tile-x">${a.texto}</span></a>`).join("")}
    </nav>

    <h2 class="secao">Últimas atividades</h2>
    ${st.atividades.length ? `<ul class="cartao atividades">${st.atividades.slice(0, 5).map(a => `
      <li><span>${esc(ROTULO_ATIVIDADE[a.tipo] || "Fez")} <strong>${esc(a.titulo || a.ref)}</strong></span><time datetime="${esc(a.quando)}">${esc(relativeTime(a.quando))}</time></li>`).join("")}
    </ul>` : `<div class="cartao vazio"><p>Quando você ler um capítulo, o evangelho ou uma parte da missa, aparece aqui. Que tal começar pelo evangelho de hoje?</p></div>`}
  `;
}

export async function render(el) {
  const hoje = await hojeNaIgreja();
  let fotos = {};
  const tudo = () => { desenhar(el, hoje); aplicarFotos(el, fotos); };
  tudo();
  if (hoje?.santo) fotoDe(hoje.santo).then(f => { if (f) { fotos = { [hoje.santo.id]: f }; aplicarFotos(el, fotos); } }).catch(() => {});
  return subscribe(tudo);
}

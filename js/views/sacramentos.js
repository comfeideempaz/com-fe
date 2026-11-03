// Sacramentos (#/sacramentos), cada sacramento (#/sacramentos/:id),
// a confissão passo a passo (#/sacramentos/como-se-confessar)
// e o exame de consciência (#/sacramentos/exame). Nada do exame é salvo.

import { carregar } from "../content.js";
import { refsHTML } from "../biblia.js";
import { registrar, setFlag, getState, contarFlag } from "../store.js";
import { esc, cabecalho, toast } from "../ui.js";
import { ic } from "../icons.js";
import { fontesHTML } from "../catecismo.js";

const fontes = f => f?.length ? `<p class="fontes">Fontes: ${fontesHTML(f)}</p>` : "";

export async function render(el, params) {
  const dados = await carregar("sacramentos.json");
  if (params.id === "como-se-confessar") return confissao(el, dados.confissao);
  if (params.id === "exame") return exame(el, dados.exame);
  if (params.id) return sacramento(el, dados, params.id);
  return indice(el, dados);
}

function indice(el, { introducao, grupos, sacramentos }) {
  el.innerHTML = cabecalho("Sacramentos", "Os sete sinais da graça de Cristo, com a base na Bíblia e no Catecismo.") + `
    <div class="tiles tiles-2">
      <a class="tile destaque-tile" href="#/sacramentos/como-se-confessar"><span class="tile-ic">${ic("cruz")}</span><span class="tile-t">Como se confessar</span><span class="tile-x">Passo a passo, sem medo</span></a>
      <a class="tile destaque-tile" href="#/sacramentos/exame"><span class="tile-ic">${ic("vela")}</span><span class="tile-t">Exame de consciência</span><span class="tile-x">Para adultos, jovens e crianças</span></a>
    </div>
    <section class="cartao">${introducao.texto.map(t => `<p>${esc(t)}</p>`).join("")}${refsHTML(introducao.biblia)}${fontes(introducao.fontes)}</section>
    ${grupos.map(g => `
      <h2 class="secao">Sacramentos de ${esc(g.nome.toLowerCase().startsWith("serviço") ? "serviço da comunhão" : g.nome.toLowerCase())}</h2>
      <p class="apoio">${esc(g.texto)}</p>
      <ul class="cartao lista-links">${sacramentos.filter(s => s.grupo === g.id).map(s =>
        `<li><a href="#/sacramentos/${s.id}"><span><strong>${esc(s.nome)}</strong><small>${esc(s.resumo)}</small></span>${ic("seta", "seta")}</a></li>`).join("")}</ul>`).join("")}`;
}

function sacramento(el, { sacramentos }, id) {
  const s = sacramentos.find(x => x.id === id);
  if (!s) { el.innerHTML = cabecalho("Não encontrado") + `<p><a href="#/sacramentos">Voltar</a></p>`; return; }
  el.innerHTML = `<p class="migalha"><a href="#/sacramentos">${ic("voltar")} Sacramentos</a></p>` + cabecalho(s.nome, s.resumo) + `
    ${s.id === "confissao" ? `<div class="botoes"><a class="botao" href="#/sacramentos/como-se-confessar">${ic("cruz")} Como se confessar</a><a class="botao secundario" href="#/sacramentos/exame">Exame de consciência</a></div>` : ""}
    <section class="cartao"><h2>O que é</h2><p>${esc(s.oQueE)}</p></section>
    <section class="cartao"><h2>O sinal</h2><p>${esc(s.sinal)}</p><h3>Quem celebra</h3><p>${esc(s.ministro)}</p></section>
    <section class="cartao"><h2>O que ele faz em nós</h2><ul class="lista-simples">${s.efeitos.map(e => `<li>${esc(e)}</li>`).join("")}</ul></section>
    <section class="cartao"><h2>Quem pode receber</h2><p>${esc(s.quemPode)}</p><h3>Como se preparar</h3><p>${esc(s.preparacao)}</p></section>
    ${s.curiosidade ? `<p class="curiosidade cartao"><strong>Curiosidade:</strong> ${esc(s.curiosidade)}</p>` : ""}
    <section class="cartao"><h2>Na Bíblia</h2>${refsHTML(s.biblia)}${fontes(s.fontes)}${s.revisar ? `<p class="fontes">${esc(s.obs || "Em revisão.")}</p>` : ""}</section>`;
  if (!(getState().flags.sacramentos || []).includes(s.id)) {
    contarFlag("sacramentos", s.id);
    registrar({ tipo: "sacramento", ref: s.id, titulo: `o sacramento: ${s.nome}` });
  }
}

function confissao(el, c) {
  el.innerHTML = `<p class="migalha"><a href="#/sacramentos">${ic("voltar")} Sacramentos</a></p>` + cabecalho("Como se confessar", "Um guia simples para viver bem o sacramento da Reconciliação.") + `
    <section class="cartao">${c.sobre.map(t => `<p>${esc(t)}</p>`).join("")}${refsHTML(c.biblia)}</section>
    <ol class="passos">${c.passos.map((p, i) => `
      <li class="cartao passo"><span class="passo-num">${i + 1}</span><div>
        <h2>${esc(p.titulo)}</h2><p>${esc(p.texto)}</p>
        ${p.dialogo ? `<dl class="dialogo">${p.dialogo.map(d => `<dt>${esc(d.quem)}</dt><dd>${esc(d.texto)}</dd>`).join("")}</dl>` : ""}
        ${p.oracao ? `<p><a class="botao secundario" href="#/oracoes/${p.oracao}">${ic("maos")} Abrir o Ato de Contrição</a></p>` : ""}
        ${p.biblia?.length ? refsHTML(p.biblia) : ""}${fontes(p.fontes)}
        ${p.revisar ? `<p class="fontes">${esc(p.obs)}</p>` : ""}
        ${i === 1 ? `<p><a href="#/sacramentos/exame">Fazer o exame de consciência agora</a></p>` : ""}
      </div></li>`).join("")}</ol>
    <h2 class="secao">Dúvidas comuns</h2>
    ${c.duvidas.map(d => `<details class="cartao explica"><summary><strong>${esc(d.pergunta)}</strong></summary><p>${esc(d.resposta)}</p>${refsHTML(d.biblia)}${fontes(d.fontes)}</details>`).join("")}`;
}

function exame(el, ex) {
  let versao = ex.versoes[0].id;
  const desenhar = () => {
    const v = ex.versoes.find(x => x.id === versao);
    el.querySelector("#exame-corpo").innerHTML = v.grupos.map(g => `
      <section class="cartao exame-grupo"><h2>${esc(g.titulo)}</h2>${refsHTML(g.biblia)}
        <ul class="exame-lista">${g.perguntas.map((p, i) => `<li><label><input type="checkbox"> <span>${esc(p)}</span></label></li>`).join("")}</ul>
      </section>`).join("");
  };
  el.innerHTML = `<p class="migalha"><a href="#/sacramentos">${ic("voltar")} Sacramentos</a></p>` + cabecalho("Exame de consciência") + `
    <section class="cartao">${ex.sobre.map(t => `<p>${esc(t)}</p>`).join("")}</section>
    <blockquote class="cartao frase"><p>${esc(ex.oracaoInicial)}</p><cite>Oração antes do exame</cite></blockquote>
    <div class="abas" role="tablist">${ex.versoes.map(v => `<button role="tab" data-v="${v.id}" aria-selected="${v.id === versao}">${esc(v.nome)}</button>`).join("")}</div>
    <div id="exame-corpo"></div>
    <section class="cartao"><p>Terminado o exame, reze o Ato de Contrição e procure um padre. Deus espera você de braços abertos (Lc 15,20).</p>
      <div class="botoes"><a class="botao secundario" href="#/oracoes/ato-de-contricao">${ic("maos")} Ato de Contrição</a><a class="botao secundario" href="#/sacramentos/como-se-confessar">Como se confessar</a>
      <button class="botao" id="exame-fim">Terminei o exame</button></div>
      <p class="fontes">As marcas desta página não são salvas: ao sair, tudo é apagado.</p></section>`;
  el.querySelectorAll("[data-v]").forEach(b => b.addEventListener("click", () => {
    versao = b.dataset.v;
    el.querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-selected", x.dataset.v === versao));
    desenhar();
  }));
  el.querySelector("#exame-fim").addEventListener("click", e => {
    el.querySelectorAll(".exame-lista input").forEach(i => { i.checked = false; });
    setFlag("exame", true);
    registrar({ tipo: "oracao", ref: "exame", titulo: "um exame de consciência", minutos: 10 });
    e.currentTarget.disabled = true;
    toast("Marcas apagadas. Vá em paz e procure a confissão.");
  });
  desenhar();
}

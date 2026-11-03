// Lectio Divina: leitura orante da Palavra em 5 passos (leitura, meditação, oração,
// contemplação e ação, como em Verbum Domini 87), sobre o Evangelho do dia ou
// um trecho escolhido da Bíblia. O que a pessoa escreve fica só neste aparelho.
//
// Rotas: #/lectio (início e histórico), #/lectio/dia/AAAA-MM-DD (Evangelho do dia),
// #/lectio/trecho/livro/cap/v1/v2 (trecho escolhido), #/lectio/s/:id (uma meditação).

import { carregar } from "../content.js";
import { livros, livroInfo, trechoHTML, refsHTML } from "../biblia.js";
import { dia, leiturasDe } from "../liturgia.js";
import { getState, subscribe, lectio, novaLectio, escreverLectio, concluirLectio, apagarLectio } from "../store.js";
import { linkCIC, fonteHTML, fontesHTML, CIC_INDICE } from "../catecismo.js";
import { esc, cabecalho, hojeISO, toast, plural } from "../ui.js";
import { ic } from "../icons.js";

export async function render(el, params) {
  const dados = await carregar("lectio.json");
  if (params.id) return sessao(el, dados, params.id);
  if (params.data) return doDia(params.data);
  if (params.livro) return doTrecho(params);
  return inicio(el, dados);
}

const dataCurta = iso => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(new Date(a, m - 1, d));
};
const dataHora = quando => new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(quando));

// Reaproveita uma Lectio ainda aberta, de hoje, sobre o mesmo trecho (evita duplicar ao voltar).
function abrirOuCriar(ref, extra) {
  const hoje = hojeISO();
  const aberta = getState().lectios.find(l => !l.concluida && l.ref.txt === ref.txt && l.criadoEm && hojeISO(new Date(l.criadoEm)) === hoje);
  const l = aberta || novaLectio({ ref, ...extra });
  location.replace(`#/lectio/s/${l.id}`);
}

async function doDia(iso) {
  const d = await dia(iso);
  const lt = d ? (await leiturasDe(d)).lt : null;
  const ev = lt?.ev?.[0];
  if (!ev) { toast("Não encontrei o Evangelho deste dia."); location.replace("#/lectio"); return; }
  abrirOuCriar(ev, { origem: "evangelho", data: iso, titulo: `Evangelho de ${dataCurta(iso)}` });
}

async function doTrecho({ livro, cap, v1, v2 }) {
  const l = await livroInfo(livro);
  const c = +cap;
  if (!l || c < 1 || c > l.capitulos) { toast("Trecho não encontrado."); location.replace("#/lectio"); return; }
  const total = l.versiculos[c - 1] || 999;
  const a = Math.max(1, Math.min(+v1 || 1, total));
  const b = Math.max(a, Math.min(+v2 || total, total));
  const txt = `${l.abrev} ${c},${a}${b > a ? `-${b}` : ""}${livro === "salmos" ? " (Vulgata)" : ""}`;
  abrirOuCriar({ livro, txt, trechos: [[c, a, c, b]] }, { origem: "livre", titulo: l.nome });
}

// ---------- Início: começar, histórico, como fazer e Catecismo ----------
async function inicio(el, dados) {
  const { introducao, passos, catecismo, sugestoes, fontesGerais } = dados;
  const { livros: lista } = await livros();
  const hoje = hojeISO();
  const d = await dia(hoje).catch(() => null);
  const ev = d ? (await leiturasDe(d)).lt?.ev?.[0] : null;
  let filtro = "todas";

  const historicoHTML = () => {
    const todas = getState().lectios.filter(l => Object.values(l.passos).some(t => t?.trim()) || l.concluida);
    const lst = filtro === "concluidas" ? todas.filter(l => l.concluida) : filtro === "rascunhos" ? todas.filter(l => !l.concluida) : todas;
    if (!todas.length) return `<div class="cartao vazio"><p>Suas meditações aparecem aqui. Elas ficam guardadas só neste aparelho (entram no arquivo de backup em <a href="#/progresso">Meu progresso</a>).</p></div>`;
    return `<div class="abas" role="tablist">${[["todas", "Todas"], ["concluidas", "Concluídas"], ["rascunhos", "Em andamento"]].map(([k, v]) =>
      `<button role="tab" aria-selected="${k === filtro}" data-filtro="${k}">${v}</button>`).join("")}</div>
      ${lst.length ? `<ul class="cartao lista-links historico-lectio">${lst.map(l => {
        const trecho = (l.passos.meditacao || l.passos.leitura || l.passos.oracao || l.passos.acao || "").trim();
        return `<li><a href="#/lectio/s/${l.id}"><span class="tile-ic">${ic("pena")}</span><span><strong>${esc(l.ref.txt)}</strong>
          <small>${esc(l.titulo ? l.titulo + " · " : "")}${esc(dataHora(l.criadoEm))}</small>
          ${trecho ? `<small class="lectio-trecho">${esc(trecho.slice(0, 120))}${trecho.length > 120 ? "…" : ""}</small>` : ""}</span>
          ${l.concluida ? `<span class="chip">Concluída</span>` : `<span class="chip chip-rascunho">Em andamento</span>`}${ic("seta", "seta")}</a></li>`;
      }).join("")}</ul>` : `<p class="cartao vazio">Nada aqui ainda.</p>`}`;
  };

  const desenhar = () => {
    const opcoes = lista.map(l => `<option value="${l.id}">${esc(l.nome)}</option>`).join("");
    el.innerHTML = cabecalho("Lectio Divina", "Leitura orante da Palavra: ler, meditar, rezar, contemplar e agir.") + `
      <section class="cartao lectio-comecar">
        <h2>Começar uma Lectio</h2>
        ${ev ? `<a class="cartao continuar hoje-card" href="#/lectio/dia/${hoje}">
          <span class="tile-ic cor-ic">${ic("livro")}</span><span><small>Evangelho de hoje</small><strong>${esc(ev.txt)}</strong></span>${ic("seta", "seta")}</a>` : ""}
        <form class="form" id="escolher">
          <p class="apoio">Ou escolha um trecho da Bíblia:</p>
          <div class="linha">
            <label>Livro<select name="livro">${opcoes}</select></label>
            <label>Capítulo<select name="cap"></select></label>
          </div>
          <div class="linha">
            <label>Do versículo<input name="v1" type="number" inputmode="numeric" min="1" value="1"></label>
            <label>Até o versículo<input name="v2" type="number" inputmode="numeric" min="1"></label>
          </div>
          <button class="botao" type="submit">${ic("pena")} Começar com este trecho</button>
        </form>
        <details class="explica"><summary><strong>Sugestões para começar</strong></summary>
          <p class="apoio">${esc(sugestoes.texto)}</p>
          <ul class="lista-simples sugestoes-lectio">${sugestoes.itens.map(s => {
            const r = s.biblia[0], [c, a, , b] = r.trechos[0];
            return `<li><a href="#/lectio/trecho/${r.livro}/${c}/${a}/${b}">${esc(s.titulo)}</a> <small class="apoio">${esc(r.txt)}</small></li>`;
          }).join("")}</ul>
        </details>
      </section>

      <h2 class="secao">Minhas meditações</h2>
      <div id="historico">${historicoHTML()}</div>

      <h2 class="secao">O que é a Lectio Divina?</h2>
      <section class="cartao">${introducao.texto.map(t => `<p>${fonteHTML(t)}</p>`).join("")}${refsHTML(introducao.biblia)}
        <p class="fontes">Fontes: ${fontesHTML(introducao.fontes)}</p></section>
      <ol class="passos-resumo">${passos.map((p, i) => `<li class="cartao"><span class="lectio-num">${i + 1}</span><span><strong>${esc(p.nome)}</strong> <small class="apoio">${esc(p.latim)}</small><br>${esc(p.pergunta)}</span></li>`).join("")}</ol>

      <h2 class="secao" id="catecismo">No Catecismo da Igreja</h2>
      <section class="cartao catecismo">
        <p class="apoio">${esc(catecismo.texto)}</p>
        <ul class="lista-cic">${catecismo.itens.map(c => `<li>${linkCIC(c.n)}<div><strong>${esc(c.titulo)}</strong><p>${esc(c.resumo)}</p></div></li>`).join("")}</ul>
        <p><a class="botao secundario" href="${CIC_INDICE}" target="_blank" rel="noopener">Catecismo completo no site do Vaticano ${ic("seta")}</a></p>
      </section>
      <p class="fontes">Fontes: ${fontesHTML(fontesGerais)}</p>`;

    // Escolher trecho: capítulos e versículos conforme o livro.
    const form = el.querySelector("#escolher");
    const ult = getState().flags.ultimaLeitura;
    const ajustarCaps = () => {
      const l = lista.find(x => x.id === form.livro.value);
      form.cap.innerHTML = Array.from({ length: l.capitulos }, (_, i) => `<option>${i + 1}</option>`).join("");
    };
    const ajustarVers = () => {
      const l = lista.find(x => x.id === form.livro.value);
      const total = l.versiculos[form.cap.value - 1] || 1;
      form.v1.max = form.v2.max = total;
      form.v1.value = 1; form.v2.value = total;
    };
    form.livro.value = ult?.livro || "lucas";
    ajustarCaps();
    if (ult?.cap) form.cap.value = ult.cap;
    ajustarVers();
    form.livro.addEventListener("change", () => { ajustarCaps(); ajustarVers(); });
    form.cap.addEventListener("change", ajustarVers);
    form.addEventListener("submit", e => {
      e.preventDefault();
      location.hash = `#/lectio/trecho/${form.livro.value}/${form.cap.value}/${form.v1.value || 1}/${form.v2.value || form.v1.max}`;
    });
    ligarFiltros();
  };

  const ligarFiltros = () => el.querySelectorAll("[data-filtro]").forEach(b => b.addEventListener("click", () => {
    filtro = b.dataset.filtro;
    el.querySelector("#historico").innerHTML = historicoHTML();
    ligarFiltros();
  }));

  desenhar();
  return subscribe(() => { const h = el.querySelector("#historico"); if (h) { h.innerHTML = historicoHTML(); ligarFiltros(); } });
}

// ---------- Uma meditação, passo a passo ----------
async function sessao(el, dados, id) {
  const l = lectio(id);
  if (!l) { el.innerHTML = cabecalho("Meditação não encontrada", "Ela pode ter sido apagada neste aparelho.") + `<p><a class="botao" href="#/lectio">Voltar à Lectio Divina</a></p>`; return; }
  const { preparacao, passos, conclusao } = dados;
  const preenchido = () => passos.findIndex(p => !(l.passos[p.id] || "").trim());
  let atual = l.concluida ? 0 : Math.max(0, preenchido());
  const espera = {};

  el.innerHTML = `
    <p class="migalha"><a href="#/lectio">${ic("voltar")} Lectio Divina</a></p>
    <header class="tela-topo">
      <p class="apoio">${esc(l.titulo || "Lectio Divina")} · ${esc(dataHora(l.criadoEm))}</p>
      <h1 tabindex="-1">${esc(l.ref.txt)}</h1>
    </header>
    <details class="cartao explica preparacao" ${Object.keys(l.passos).length ? "" : "open"}>
      <summary><strong>${esc(preparacao.titulo)}</strong></summary>
      <p>${fonteHTML(preparacao.texto)}</p>
      <blockquote class="frase"><p>${esc(preparacao.oracao)}</p></blockquote>
      ${refsHTML(preparacao.biblia)}<p class="fontes">Fontes: ${fontesHTML(preparacao.fontes)}</p>
    </details>
    <details class="cartao leitura palavra" open>
      <summary><span class="leitura-rot">A Palavra</span><span class="leitura-ref">${esc(l.ref.txt)}</span></summary>
      <div class="leitura-texto" id="texto"><p class="apoio">Abrindo o texto…</p></div>
      <p><a href="#/biblia/${l.ref.livro}/${l.ref.trechos[0][0]}/${l.ref.trechos[0][1]}">Abrir na Bíblia, com o contexto</a></p>
    </details>
    <nav class="passos-nav" aria-label="Passos da Lectio Divina"><ol>${passos.map((p, i) =>
      `<li><button type="button" data-passo="${i}"><span class="lectio-num">${i + 1}</span><span class="passo-nome">${esc(p.nome)}</span></button></li>`).join("")}</ol></nav>
    <section class="cartao lectio-passo" id="passo" aria-live="polite"></section>
    <div class="lectio-rodape">
      <p class="salvo apoio" id="salvo" role="status"></p>
      <div class="botoes">
        <button class="botao secundario pequeno" id="copiar">Copiar minha meditação</button>
        <button class="botao secundario pequeno perigo" id="apagar">Apagar</button>
      </div>
    </div>
    <p class="aviso-texto">O que você escreve fica guardado só neste aparelho, sem internet e sem conta. Para não perder, faça o backup em <a href="#/progresso">Meu progresso</a>.</p>`;

  trechoHTML(l.ref).then(h => { const t = el.querySelector("#texto"); if (t) t.innerHTML = h; });

  const marcarNav = () => el.querySelectorAll("[data-passo]").forEach(b => {
    const i = +b.dataset.passo, p = passos[i];
    b.classList.toggle("feito", !!(l.passos[p.id] || "").trim());
    if (i === atual) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
  });

  const desenharPasso = () => {
    const p = passos[atual];
    const ultimo = atual === passos.length - 1;
    el.querySelector("#passo").innerHTML = `
      <p class="passo-rotulo">Passo ${atual + 1} de ${passos.length} · <em>${esc(p.latim)}</em></p>
      <h2>${esc(p.nome)}</h2>
      <p class="passo-pergunta">${esc(p.pergunta)}</p>
      <p>${fonteHTML(p.explicacao)}</p>
      <ul class="lista-simples passo-dicas">${p.dicas.map(t => `<li>${fontesHTML([t])}</li>`).join("")}</ul>
      <label class="campo-meditacao"><span>${esc(p.campo)}</span>
        <textarea id="campo" rows="6" placeholder="Escreva aqui…">${esc(l.passos[p.id] || "")}</textarea></label>
      <p class="passo-biblia"><strong>Na Bíblia:</strong> ${refsHTML(p.biblia)}</p>
      <p class="fontes">Fonte: ${fontesHTML(p.fontes)}</p>
      ${ultimo && l.concluida ? `<blockquote class="frase"><p>${esc(conclusao)}</p><cite>Lectio concluída em ${esc(dataHora(l.concluida))}</cite></blockquote>` : ""}
      <div class="botoes passo-botoes">
        ${atual > 0 ? `<button class="botao secundario" id="ant">${ic("voltar")} ${esc(passos[atual - 1].nome)}</button>` : ""}
        ${ultimo ? `<button class="botao" id="concluir">${ic("planos")} ${l.concluida ? "Salvar" : "Concluir a Lectio"}</button>`
          : `<button class="botao" id="prox">${esc(passos[atual + 1].nome)} ${ic("seta")}</button>`}
      </div>`;
    marcarNav();

    const campo = el.querySelector("#campo");
    campo.addEventListener("input", () => {
      el.querySelector("#salvo").textContent = "Salvando…";
      clearTimeout(espera[p.id]);
      espera[p.id] = setTimeout(() => guardar(p.id, campo.value), 500);
    });
    el.querySelector("#ant")?.addEventListener("click", () => irPara(atual - 1));
    el.querySelector("#prox")?.addEventListener("click", () => irPara(atual + 1));
    el.querySelector("#concluir")?.addEventListener("click", () => {
      guardarAgora();
      const primeira = !l.concluida;
      concluirLectio(id);
      toast(primeira ? "Lectio concluída. Que a Palavra dê fruto na sua vida!" : "Meditação salva.");
      desenharPasso();
    });
  };

  const guardar = (passo, texto) => {
    escreverLectio(id, passo, texto);
    marcarNav();
    const s = el.querySelector("#salvo");
    if (s) s.textContent = "✓ Salvo neste aparelho";
  };
  // Grava na hora o que ainda está esperando (ao trocar de passo ou sair).
  const guardarAgora = () => {
    const campo = el.querySelector("#campo");
    const p = passos[atual];
    if (campo && espera[p.id]) { clearTimeout(espera[p.id]); delete espera[p.id]; guardar(p.id, campo.value); }
  };
  const irPara = i => {
    guardarAgora();
    atual = Math.max(0, Math.min(passos.length - 1, i));
    desenharPasso();
    el.querySelector(".passos-nav").scrollIntoView({ block: "start", behavior: "smooth" });
  };

  el.querySelectorAll("[data-passo]").forEach(b => b.addEventListener("click", () => irPara(+b.dataset.passo)));
  el.querySelector("#copiar").addEventListener("click", async () => {
    guardarAgora();
    const texto = [`Lectio Divina: ${l.ref.txt}`, ...passos.filter(p => (l.passos[p.id] || "").trim()).map(p => `\n${p.nome}:\n${l.passos[p.id].trim()}`)].join("\n");
    try { await navigator.clipboard.writeText(texto); toast("Meditação copiada."); } catch { toast("Não consegui copiar."); }
  });
  el.querySelector("#apagar").addEventListener("click", () => {
    if (!confirm("Apagar esta meditação? Não dá para desfazer.")) return;
    Object.values(espera).forEach(clearTimeout);
    apagarLectio(id);
    toast("Meditação apagada.");
    location.hash = "#/lectio";
  });
  addEventListener("pagehide", guardarAgora);

  desenharPasso();
  if (l.concluida) el.querySelector("#salvo").textContent = `Concluída em ${dataHora(l.concluida)}. Você pode continuar escrevendo.`;
  else {
    const feitos = passos.filter(p => (l.passos[p.id] || "").trim()).length;
    if (feitos) el.querySelector("#salvo").textContent = `Continuando de onde parou: ${plural(feitos, "passo escrito", "passos escritos")}.`;
  }

  // Ao sair da tela: grava o que falta e não deixa no histórico uma Lectio vazia.
  return () => {
    removeEventListener("pagehide", guardarAgora);
    guardarAgora();
    const atualL = lectio(id);
    if (atualL && !atualL.concluida && !Object.values(atualL.passos).some(t => t?.trim())) apagarLectio(id);
  };
}

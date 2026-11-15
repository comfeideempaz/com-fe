// Curso de Teologia (#/curso, #/curso/:modulo, #/curso/:modulo/:aula, #/curso/:modulo/prova,
// #/curso/:modulo/certificado, #/curso/final/certificado, #/curso/dicionario).
// Curso livre, pela fé católica: 8 módulos de aulas curtas, cada uma com texto, Bíblia,
// Catecismo (links para o Vaticano), fontes, origem das palavras e quiz de 3 perguntas.
// Cada módulo tem uma prova de 10 perguntas sorteadas; com 7 acertos sai o certificado.
// O progresso fica em state.curso (aparelho/conta). Conteúdo: data/curso/*.json (tools/make_curso.py).

import { carregar } from "../content.js";
import { refsHTML } from "../biblia.js";
import { fontesHTML, fonteHTML } from "../catecismo.js";
import { getState, subscribe, concluirAulaCurso, registrarProvaCurso, setPerfil } from "../store.js";
import { esc, cabecalho, toast, progressBar, plural } from "../ui.js";
import { ic } from "../icons.js";
import { lumi } from "../lumi.js";
import { falar, parar, temVoz } from "../speech.js";
import { abrirVideo } from "./curso-video.js";

const chave = (m, a) => `${m}/${a}`;
const curso = () => getState().curso || { aulas: {}, provas: {} };
const feita = (m, a) => !!curso().aulas[chave(m, a)];
const aprovado = (m, ind) => (curso().provas[m]?.melhor || 0) >= ind.aprovacao;

function estilos() {
  if (document.querySelector('link[href^="css/curso.css"]')) return;
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = "css/curso.css?v=1.11.0";
  document.head.appendChild(l);
}

// **negrito**, *itálico* e "CIC 123" viram HTML (o texto é escapado antes).
const rico = t => fonteHTML(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+?)\*/g, "<em>$1</em>");
const puro = t => t.replace(/\*\*?/g, "");

function embaralhar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Pergunta com as opções em ordem sorteada: { p, op: [...], c (índice da certa), x }.
function sortear(q) {
  const ordem = embaralhar(q.op.map((o, i) => i));
  return { p: q.p, op: ordem.map(i => q.op[i]), c: ordem.indexOf(q.c), x: q.x };
}

export async function render(el, params) {
  estilos();
  const ind = await carregar("curso/indice.json");
  const { mod, aula } = params;
  if (mod === "dicionario" && !aula) return dicionario(el, params);
  if (mod === "final" && aula === "certificado") return certificado(el, ind, null);
  if (!mod) return inicio(el, ind);
  const m = ind.modulos.find(x => x.id === mod);
  if (!m) { el.innerHTML = cabecalho("Módulo não encontrado") + `<p><a href="#/curso">Voltar ao curso</a></p>`; return; }
  if (!aula) return modulo(el, ind, m);
  const dados = await carregar(`curso/${mod}.json`);
  if (aula === "prova") return prova(el, ind, m, dados);
  if (aula === "certificado") return certificado(el, ind, m);
  return licao(el, ind, m, dados, aula);
}

// ---------- Página inicial do curso ----------
function proximaAula(ind) {
  for (const m of ind.modulos) for (const a of m.aulas) if (!feita(m.id, a.id)) return { m, a };
  return null;
}

function inicio(el, ind) {
  const desenhar = () => {
    const total = ind.modulos.reduce((s, m) => s + m.aulas.length, 0);
    const feitas = ind.modulos.reduce((s, m) => s + m.aulas.filter(a => feita(m.id, a.id)).length, 0);
    const aprovados = ind.modulos.filter(m => aprovado(m.id, ind)).length;
    const prox = proximaAula(ind);
    el.innerHTML = cabecalho("Curso de Teologia", "Formação católica em aulas curtas, com Bíblia, Catecismo e fontes.") + `
      <section class="cartao curso-topo">
        ${lumi({ tamanho: 96, humor: feitas ? "piscando" : "feliz" })}
        <div>
          <p class="balao">${feitas === 0 ? "Que bom que você quer conhecer melhor a fé! São 8 módulos com aulas de poucos minutos. Vamos começar rezando?" : feitas === total ? "Você estudou todas as aulas! Faça as provas que faltam para ganhar os certificados." : `Você já estudou ${feitas} de ${total} aulas. Continue no seu ritmo!`}</p>
          <div class="curso-numeros"><span><strong>${feitas}</strong> de ${total} aulas</span><span><strong>${aprovados}</strong> de ${ind.modulos.length} módulos aprovados</span></div>
          ${progressBar(feitas / total, "Aulas estudadas")}
        </div>
      </section>
      <div class="botoes">
        ${prox ? `<a class="botao" href="#/curso/${prox.m.id}/${prox.a.id}">${ic("play")} ${feitas ? "Continuar" : "Começar"}: ${esc(prox.a.titulo)}</a>` : ""}
        <a class="botao secundario" href="#/curso/dicionario">${ic("livro")} Dicionário Bíblico</a>
        ${aprovados === ind.modulos.length ? `<a class="botao secundario" href="#/curso/final/certificado">${ic("selo")} Certificado do curso</a>` : ""}
      </div>
      <h2 class="secao">Módulos</h2>
      <ol class="curso-modulos">${ind.modulos.map(m => {
        const f = m.aulas.filter(a => feita(m.id, a.id)).length;
        const p = curso().provas[m.id];
        return `<li><a class="cartao curso-modulo${f === m.aulas.length ? " completo" : ""}" href="#/curso/${m.id}">
          <span class="curso-emoji" aria-hidden="true">${m.emoji}</span>
          <span class="curso-modulo-txt"><small>Módulo ${m.n} · ${esc(m.materia)}</small><strong>${esc(m.titulo)}</strong>
            <span class="curso-modulo-desc">${esc(m.descricao)}</span>
            ${progressBar(f / m.aulas.length, `${m.titulo}: ${f} de ${m.aulas.length} aulas`)}
            <span class="curso-modulo-rodape">${f} de ${plural(m.aulas.length, "aula", "aulas")}${p ? ` · prova: ${p.melhor}/${ind.provaPerguntas}${p.melhor >= ind.aprovacao ? " ✓" : ""}` : ""}</span></span>
          ${ic("seta", "seta")}</a></li>`;
      }).join("")}</ol>
      <details class="cartao explica"><summary><strong>Como funciona o curso</strong></summary>
        <p>${esc(ind.sobre)}</p>
        <p>Sugestão para cada aula: comece com uma oração ao Espírito Santo, leia com calma, abra as passagens da Bíblia e o Catecismo, faça o quiz e termine rezando sobre uma frase que tocou o seu coração.</p>
        <p>Para ser aprovado num módulo, acerte pelo menos ${ind.aprovacao} das ${ind.provaPerguntas} perguntas da prova. Pode refazer quantas vezes quiser: fica a melhor nota.</p>
        <p class="fontes">${esc(ind.aviso)}</p></details>`;
  };
  desenhar();
  return subscribe(desenhar);
}

// ---------- Página do módulo ----------
function modulo(el, ind, m) {
  const desenhar = () => {
    const f = m.aulas.filter(a => feita(m.id, a.id)).length;
    const p = curso().provas[m.id];
    const prox = m.aulas.find(a => !feita(m.id, a.id));
    const i = ind.modulos.indexOf(m);
    const seguinte = ind.modulos[i + 1];
    el.innerHTML = `<p class="migalha"><a href="#/curso">${ic("voltar")} Curso de Teologia</a></p>` +
      cabecalho(`${m.emoji} ${m.titulo}`, `Módulo ${m.n} de ${ind.modulos.length} · ${m.materia}`) + `
      <section class="cartao">
        <p>${esc(m.descricao)}</p>
        ${m.frase ? `<blockquote class="curso-frase"><p>“${esc(m.frase)}”</p>${m.frase_ref ? refsHTML([m.frase_ref]) : ""}</blockquote>` : ""}
        ${progressBar(f / m.aulas.length, "Aulas estudadas")}
        <p class="curso-modulo-rodape">${f} de ${plural(m.aulas.length, "aula estudada", "aulas estudadas")}</p>
        ${prox ? `<div class="botoes"><a class="botao" href="#/curso/${m.id}/${prox.id}">${ic("play")} ${f ? "Continuar" : "Começar"}: ${esc(prox.titulo)}</a></div>` : ""}
      </section>
      <ol class="curso-aulas cartao">${m.aulas.map((a, k) => {
        const r = curso().aulas[chave(m.id, a.id)];
        return `<li><a href="#/curso/${m.id}/${a.id}" class="${r ? "feita" : ""}">
          <span class="curso-num" aria-hidden="true">${r ? "✓" : k + 1}</span>
          <span><strong>${esc(a.titulo)}</strong><small>${a.minutos} min${r ? ` · quiz ${r.acertos}/3` : ""}</small></span>${ic("seta", "seta")}</a></li>`;
      }).join("")}</ol>
      <section class="cartao curso-prova-cartao">
        <h2>${ic("alvo")} Prova do módulo</h2>
        <p>${ind.provaPerguntas} perguntas sorteadas das aulas deste módulo. Aprovação com ${ind.aprovacao} acertos.${f < m.aulas.length ? " Recomendamos estudar todas as aulas antes." : ""}</p>
        ${p ? `<p><strong>Sua melhor nota: ${p.melhor}/${ind.provaPerguntas}</strong>${p.melhor >= ind.aprovacao ? " · aprovado(a)!" : ""}</p>` : ""}
        <div class="botoes"><a class="botao${f < m.aulas.length ? " secundario" : ""}" href="#/curso/${m.id}/prova">${ic("alvo")} ${p ? "Refazer a prova" : "Fazer a prova"}</a>
          ${p && p.melhor >= ind.aprovacao ? `<a class="botao secundario" href="#/curso/${m.id}/certificado">${ic("selo")} Ver certificado</a>` : ""}</div>
      </section>
      ${seguinte ? `<p><a class="botao secundario" href="#/curso/${seguinte.id}">Próximo módulo: ${esc(seguinte.titulo)} ${ic("seta")}</a></p>` : ""}`;
  };
  desenhar();
  return subscribe(desenhar);
}

// ---------- Aula ----------
function licao(el, ind, m, dados, aulaId) {
  const k = dados.aulas.findIndex(a => a.id === aulaId);
  const a = dados.aulas[k];
  if (!a) { el.innerHTML = cabecalho("Aula não encontrada") + `<p><a href="#/curso/${m.id}">Voltar ao módulo</a></p>`; return; }
  const prox = dados.aulas[k + 1];
  let fase = "aula", q = 0, acertos = 0, resp = null, perguntas = [];

  const desenhar = () => {
    let corpo = "";
    if (fase === "aula") {
      const r = curso().aulas[chave(m.id, a.id)];
      corpo = `
        <article class="cartao curso-texto">
          <div class="botoes"><button class="botao" id="assistir">${ic("play")} Assistir a aula animada</button>${temVoz() ? `<button class="botao secundario" id="ouvir">${ic("volume")} Ouvir a aula</button>` : ""}</div>
          ${a.texto.map(t => `<p>${rico(t)}</p>`).join("")}
        </article>
        ${a.palavras.length ? `<section class="cartao curso-palavras"><h2>${ic("pena")} De onde vem a palavra</h2><dl>${a.palavras.map(p => `
          <div><dt>${esc(p.termo)}</dt><dd><span class="origem">${esc(p.origem)}</span> ${esc(p.sentido)}</dd></div>`).join("")}</dl></section>` : ""}
        ${a.biblia.length ? `<section class="cartao"><h2>${ic("livro")} Leia na Bíblia</h2>${refsHTML(a.biblia)}</section>` : ""}
        ${a.link ? `<p><a class="botao secundario" href="${esc(a.link.rota)}">${ic("seta")} ${esc(a.link.rotulo)}</a></p>` : ""}
        <section class="cartao"><h2>${ic("info")} Fontes</h2><p class="fontes curso-fontes">${fontesHTML(a.fontes)}</p>
          <p class="fontes">Os números do Catecismo (CIC) abrem o texto oficial no site do Vaticano.</p>
          ${a.revisar ? `<p class="fontes">Aula em revisão: datas e valores podem ser aproximados.</p>` : ""}</section>
        <div class="botoes"><button class="botao" id="ir-quiz">${ic("estrela")} ${r ? `Refazer o quiz (acertou ${r.acertos}/3)` : "Fazer o quiz da aula"}</button>
          ${prox ? `<a class="botao secundario" href="#/curso/${m.id}/${prox.id}">Próxima aula ${ic("seta")}</a>` : `<a class="botao secundario" href="#/curso/${m.id}/prova">${ic("alvo")} Prova do módulo</a>`}</div>`;
    } else if (fase === "quiz") {
      const x = perguntas[q];
      corpo = quizHTML(x, q, perguntas.length, resp, q < perguntas.length - 1 ? "Próxima pergunta" : "Ver resultado");
    } else {
      corpo = `
        <section class="cartao trilha-fim">${lumi({ tamanho: 110, humor: "piscando" })}
          <h2>${acertos === 3 ? "Parabéns, acertou tudo!" : acertos ? "Muito bem!" : "Continue estudando!"}</h2>
          <p class="curso-nota">${acertos} de 3</p>
          <p>Aula concluída. Que tal rezar um instante sobre o que aprendeu?</p>
          <div class="botoes">${prox ? `<a class="botao" href="#/curso/${m.id}/${prox.id}">Próxima aula: ${esc(prox.titulo)} ${ic("seta")}</a>` : `<a class="botao" href="#/curso/${m.id}/prova">${ic("alvo")} Fazer a prova do módulo</a>`}
            <button class="botao secundario" id="refazer">${ic("reiniciar")} Refazer o quiz</button>
            <a class="botao secundario" href="#/curso/${m.id}">Voltar ao módulo</a></div></section>`;
    }
    el.innerHTML = `<p class="migalha"><a href="#/curso/${m.id}">${ic("voltar")} ${esc(m.titulo)}</a></p>` +
      cabecalho(a.titulo, `Módulo ${m.n} · Aula ${k + 1} de ${dados.aulas.length} · ${a.minutos} min`) + corpo;
    el.querySelector("#ouvir")?.addEventListener("click", () => falar([a.titulo, ...a.texto.map(puro)].join(" ")));
    const comecar = () => { parar(); perguntas = a.quiz.map(sortear); fase = "quiz"; q = 0; acertos = 0; resp = null; desenhar(); window.scrollTo(0, 0); };
    el.querySelector("#assistir")?.addEventListener("click", () => abrirVideo(m, a, { aoQuiz: comecar }));
    el.querySelector("#ir-quiz")?.addEventListener("click", comecar);
    el.querySelector("#refazer")?.addEventListener("click", comecar);
    ligarQuiz(el, () => perguntas[q], v => { resp = v; if (v === perguntas[q].c) acertos++; desenhar(); el.querySelector("#quiz-prox")?.focus(); }, () => {
      if (q < perguntas.length - 1) { q++; resp = null; desenhar(); return; }
      fase = "fim";
      concluirAulaCurso(chave(m.id, a.id), acertos, a.titulo);
      desenhar(); window.scrollTo(0, 0);
    });
  };
  desenhar();
  return () => parar();
}

function quizHTML(x, q, total, resp, rotuloProx) {
  return `
    <section class="cartao trilha-quiz" aria-live="polite">
      <p class="quiz-cont">Pergunta ${q + 1} de ${total}</p>
      <h2 class="curso-pergunta">${esc(x.p)}</h2>
      <div class="quiz-opcoes">${x.op.map((o, k) => `<button class="quiz-op ${resp !== null ? (k === x.c ? "certa" : k === resp ? "errada" : "") : ""}" data-op="${k}" ${resp !== null ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
      ${resp !== null ? `<p class="quiz-feedback ${resp === x.c ? "ok" : ""}"><strong>${resp === x.c ? "Certo!" : "Não foi dessa vez. A resposta certa está em verde."}</strong> ${fonteHTML(x.x)}</p>
        <div class="botoes"><button class="botao" id="quiz-prox">${rotuloProx} ${ic("seta")}</button></div>` : ""}
    </section>`;
}

function ligarQuiz(el, atual, responder, proxima) {
  el.querySelectorAll("[data-op]").forEach(b => b.addEventListener("click", () => responder(+b.dataset.op)));
  el.querySelector("#quiz-prox")?.addEventListener("click", proxima);
}

// ---------- Prova do módulo ----------
function prova(el, ind, m, dados) {
  const banco = dados.aulas.flatMap(a => a.quiz.map(x => ({ ...x, aula: a.titulo })));
  let perguntas = [], q = 0, acertos = 0, resp = null, erros = [], fase = "intro";
  const novo = () => { perguntas = embaralhar(banco).slice(0, ind.provaPerguntas).map(x => ({ ...sortear(x), aula: x.aula })); q = 0; acertos = 0; resp = null; erros = []; };

  const desenhar = () => {
    let corpo = "";
    if (fase === "intro") {
      const p = curso().provas[m.id];
      corpo = `<section class="cartao"><p>São ${ind.provaPerguntas} perguntas sorteadas entre as ${banco.length} das aulas deste módulo. Para ser aprovado(a), acerte pelo menos ${ind.aprovacao}.</p>
        ${p ? `<p>Sua melhor nota até agora: <strong>${p.melhor}/${ind.provaPerguntas}</strong>.</p>` : ""}
        <p>Antes de começar, uma pequena oração: <em>Vinde, Espírito Santo, iluminai a minha inteligência.</em></p>
        <div class="botoes"><button class="botao" id="comecar">${ic("alvo")} Começar a prova</button></div></section>`;
    } else if (fase === "quiz") {
      corpo = quizHTML(perguntas[q], q, perguntas.length, resp, q < perguntas.length - 1 ? "Próxima pergunta" : "Ver a nota");
    } else {
      const ok = acertos >= ind.aprovacao;
      corpo = `<section class="cartao trilha-fim">${lumi({ tamanho: 110, humor: ok ? "piscando" : "pensando" })}
          <h2>${ok ? "Aprovado(a)! Parabéns!" : "Quase lá!"}</h2>
          <p class="curso-nota">${acertos} de ${perguntas.length}</p>
          <p>${ok ? "Você concluiu este módulo. O certificado já está disponível." : `Faltaram ${ind.aprovacao - acertos} acerto(s). Revise as aulas e tente de novo: fica a melhor nota.`}</p>
          <div class="botoes">${ok ? `<a class="botao" href="#/curso/${m.id}/certificado">${ic("selo")} Ver certificado</a>` : ""}
            <button class="botao${ok ? " secundario" : ""}" id="comecar">${ic("reiniciar")} Refazer a prova</button>
            <a class="botao secundario" href="#/curso/${m.id}">Voltar ao módulo</a></div></section>
        ${erros.length ? `<section class="cartao"><h2>Para revisar</h2><ul class="curso-erros">${erros.map(e => `<li><strong>${esc(e.p)}</strong><br>Resposta: ${esc(e.op[e.c])}. ${fonteHTML(e.x)} <small>(Aula: ${esc(e.aula)})</small></li>`).join("")}</ul></section>` : ""}`;
    }
    el.innerHTML = `<p class="migalha"><a href="#/curso/${m.id}">${ic("voltar")} ${esc(m.titulo)}</a></p>` +
      cabecalho(`Prova: ${m.titulo}`, `Módulo ${m.n} de ${ind.modulos.length}`) + corpo;
    el.querySelector("#comecar")?.addEventListener("click", () => { novo(); fase = "quiz"; desenhar(); window.scrollTo(0, 0); });
    ligarQuiz(el, () => perguntas[q], v => { resp = v; if (v === perguntas[q].c) acertos++; else erros.push(perguntas[q]); desenhar(); el.querySelector("#quiz-prox")?.focus(); }, () => {
      if (q < perguntas.length - 1) { q++; resp = null; desenhar(); return; }
      fase = "fim";
      registrarProvaCurso(m.id, acertos, m.titulo);
      desenhar(); window.scrollTo(0, 0);
    });
  };
  desenhar();
}

// ---------- Certificado ----------
function certificado(el, ind, m) {
  const st = getState();
  const provas = curso().provas;
  const final = !m;
  const okFinal = ind.modulos.every(x => (provas[x.id]?.melhor || 0) >= ind.aprovacao);
  const p = m ? provas[m.id] : null;
  const voltar = final ? "#/curso" : `#/curso/${m.id}`;
  if (final ? !okFinal : !(p && p.melhor >= ind.aprovacao)) {
    el.innerHTML = `<p class="migalha"><a href="${voltar}">${ic("voltar")} Voltar</a></p>` + cabecalho("Certificado") +
      `<section class="cartao"><p>${final ? "O certificado do curso aparece quando você for aprovado(a) nas provas dos 8 módulos." : `Faça a prova do módulo e acerte pelo menos ${ind.aprovacao} perguntas para liberar o certificado.`}</p>
      <a class="botao" href="${final ? "#/curso" : `#/curso/${m.id}/prova`}">${final ? "Ver os módulos" : "Fazer a prova"}</a></section>`;
    return;
  }
  const datas = final ? ind.modulos.map(x => provas[x.id].data).sort() : [p.data];
  const data = datas[datas.length - 1];
  const dataTxt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(data + "T12:00:00"));
  const horas = Math.round((final ? ind.modulos : [m]).reduce((s, x) => s + x.aulas.reduce((t, a) => t + a.minutos, 0), 0) / 60 * 2) / 2;
  const nome = st.perfil.nome || "";
  el.innerHTML = `<p class="migalha nao-imprimir"><a href="${voltar}">${ic("voltar")} Voltar</a></p>
    <div class="cartao nao-imprimir curso-cert-nome">
      <label for="cert-nome"><strong>Nome no certificado</strong></label>
      <div class="curso-cert-linha"><input id="cert-nome" type="text" maxlength="80" value="${esc(nome)}" placeholder="Seu nome completo">
      <button class="botao secundario" id="salvar-nome">Usar este nome</button></div>
    </div>
    <section class="curso-cert" aria-label="Certificado">
      <img src="icons/icon-192.png" alt="" width="72" height="72">
      <p class="curso-cert-kicker">Com Fé! · Curso de Teologia</p>
      <h1 tabindex="-1">Certificado de conclusão</h1>
      <p>Certificamos que</p>
      <p class="curso-cert-nome-txt">${esc(nome || "________________________")}</p>
      <p>${final ? `concluiu o <strong>Curso de Teologia</strong> do app Com Fé!, com os ${ind.modulos.length} módulos: ${ind.modulos.map(x => esc(x.titulo)).join(", ")}.` : `concluiu o módulo <strong>${esc(m.titulo)}</strong> (${esc(m.materia)}) do Curso de Teologia do app Com Fé!, com aprovação na prova (${p.melhor} de ${ind.provaPerguntas} acertos).`}</p>
      <p>Carga de estudo aproximada: ${String(horas).replace(".", ",")} h · ${esc(dataTxt)}</p>
      <p class="curso-cert-frase">“Crescei na graça e no conhecimento de Nosso Senhor e Salvador Jesus Cristo.” (2Pd 3,18)</p>
      <p class="curso-cert-aviso">Curso livre de formação cristã, sem valor acadêmico.</p>
    </section>
    <div class="botoes nao-imprimir"><button class="botao" id="imprimir">${ic("baixar")} Imprimir ou salvar em PDF</button></div>`;
  el.querySelector("#imprimir").addEventListener("click", () => print());
  el.querySelector("#salvar-nome").addEventListener("click", () => {
    const v = el.querySelector("#cert-nome").value.trim();
    setPerfil({ nome: v });
    el.querySelector(".curso-cert-nome-txt").textContent = v || "________________________";
    toast("Nome salvo.");
  });
}

// ---------- Dicionário Bíblico ----------
const CATS = { todos: "Todos", palavra: "Palavras", moeda: "Moedas", medida: "Medidas", tempo: "Horas e tempo" };
const semAcento = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

async function dicionario(el, params) {
  const { verbetes } = await carregar("curso/dicionario.json");
  let cat = params.query.get("cat") || "todos";
  let busca = params.query.get("q") || "";
  el.innerHTML = `<p class="migalha"><a href="#/curso">${ic("voltar")} Curso de Teologia</a></p>` +
    cabecalho("Dicionário Bíblico", `${verbetes.length} verbetes: a origem das palavras da fé, moedas, medidas e horas da Bíblia.`) + `
    <div class="cartao curso-dic-filtros">
      <label class="curso-oculto" for="dic-busca">Procurar no dicionário</label>
      <input id="dic-busca" type="search" placeholder="Procurar: denário, Igreja, amém..." value="${esc(busca)}" autocomplete="off">
      <div class="seletor-traducao" role="radiogroup" aria-label="Tipo de verbete">${Object.entries(CATS).map(([k, v]) => `<button type="button" role="radio" data-cat="${k}" aria-checked="${k === cat}">${v}</button>`).join("")}</div>
    </div>
    <div id="dic-lista"></div>
    <p class="fontes">Valores de moedas e medidas são aproximados e variam conforme a época e a região.</p>`;
  const lista = el.querySelector("#dic-lista");
  const mostrar = () => {
    const b = semAcento(busca.trim());
    const itens = verbetes.filter(v => (cat === "todos" || v.cat === cat) && (!b || semAcento(`${v.termo} ${v.origem} ${v.sentido}`).includes(b)));
    lista.innerHTML = itens.length ? `<dl class="cartao curso-dic">${itens.map(v => `
      <div><dt>${esc(v.termo)} <span class="chip">${esc(CATS[v.cat] || v.cat)}</span></dt>
        <dd><span class="origem">${esc(v.origem)}</span> ${fonteHTML(v.sentido)}
        ${v.biblia?.length ? refsHTML(v.biblia) : ""}
        ${v.aula ? `<a class="curso-dic-aula" href="#/curso/${v.aula[0]}/${v.aula[1]}">Aula: ${esc(v.aula[2])}</a>` : ""}</dd></div>`).join("")}</dl>`
      : `<div class="cartao vazio"><p>Nenhum verbete encontrado.</p></div>`;
  };
  el.querySelector("#dic-busca").addEventListener("input", e => { busca = e.target.value; mostrar(); });
  el.querySelectorAll("[data-cat]").forEach(bt => bt.addEventListener("click", () => {
    cat = bt.dataset.cat;
    el.querySelectorAll("[data-cat]").forEach(x => x.setAttribute("aria-checked", x === bt));
    mostrar();
  }));
  mostrar();
}

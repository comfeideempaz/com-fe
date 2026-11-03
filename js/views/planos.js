// Projetos de leitura (#/planos) e cada projeto (#/planos/:id).
// O progresso é guardado por dia concluído; os capítulos lidos no leitor
// aparecem marcados aqui e, quando todos os de um dia estão lidos, o dia se conclui sozinho.
// O "plano livre" é montado no aparelho com a mesma regra de divisão dos scripts.

import { carregar } from "../content.js";
import { livros, chaveCap } from "../biblia.js";
import { getState, subscribe, iniciarPlano, sairPlano, marcarDiaPlano, desmarcarDiaPlano } from "../store.js";
import { esc, cabecalho, progressBar, plural, toast, somaDias, dataExtenso, hojeISO } from "../ui.js";
import { ic } from "../icons.js";

export async function render(el, params) {
  const [{ planos }, { livros: lista }] = await Promise.all([carregar("planos.json"), livros()]);
  const porId = Object.fromEntries(lista.map(l => [l.id, l]));
  return params.plano ? plano(el, planos, porId, lista, params.plano) : indice(el, planos, lista);
}

// Mesma regra de tools/make_planos.py: cada capítulo vai para o dia em que cai o seu meio.
function distribuir(caps, dias) {
  const total = caps.reduce((s, c) => s + c[2], 0);
  const blocos = Array.from({ length: dias }, () => []);
  let acc = 0;
  for (const [lid, c, p] of caps) {
    const i = Math.min(dias - 1, Math.floor((acc + p / 2) / total * dias));
    const b = blocos[i], ult = b[b.length - 1];
    if (ult && ult[0] === lid && ult[2] === c - 1) ult[2] = c; else b.push([lid, c, c]);
    acc += p;
  }
  return blocos;
}

function planoLivre(lista, escolha, dias) {
  const ids = escolha === "AT" || escolha === "NT" ? lista.filter(l => l.testamento === escolha).map(l => l.id)
    : escolha === "todos" ? lista.map(l => l.id) : [escolha];
  const caps = ids.flatMap(id => { const l = lista.find(x => x.id === id); return l.versiculos.map((v, i) => [id, i + 1, v || 1]); });
  dias = Math.max(1, Math.min(dias, caps.length * 3));
  const nome = escolha === "AT" ? "Antigo Testamento" : escolha === "NT" ? "Novo Testamento" : escolha === "todos" ? "A Bíblia toda" : lista.find(l => l.id === escolha).nome;
  return { id: "livre", nome: `${nome} em ${dias} dias`, descricao: "Projeto montado por você.", dias: distribuir(caps, dias), totalDias: dias };
}

function obterPlano(planos, id) {
  if (id === "livre") return getState().planos.livre?.def || null;
  return planos.find(p => p.id === id) || null;
}

const trechosDia = d => Array.isArray(d) ? d : d.trechos;
function capsDoDia(d) {
  return trechosDia(d).flatMap(([lid, a, b]) => Array.from({ length: b - a + 1 }, (_, k) => chaveCap(lid, a + k)));
}

function textoTrecho([lid, a, b, txt], porId) {
  if (txt) return txt;
  const l = porId[lid];
  return `${l ? l.nome : lid} ${a}${b > a ? `–${b}` : ""}`;
}

function indice(el, planos, lista) {
  const desenhar = () => {
    const st = getState();
    const todos = [...planos];
    if (st.planos.livre?.def) todos.unshift(st.planos.livre.def);
    const ativos = todos.filter(p => st.planos[p.id]);
    const outros = todos.filter(p => !st.planos[p.id]);
    const cartao = p => {
      const prog = st.planos[p.id];
      const feitos = prog ? prog.diasFeitos.length : 0;
      return `<li class="cartao plano"><a href="#/planos/${p.id}">
        <h3>${esc(p.nome)}</h3><p class="apoio">${esc(p.descricao)}</p>
        ${prog ? `${progressBar(feitos / p.totalDias, `Progresso de ${p.nome}`)}<p class="plano-meta">${prog.concluido ? "Concluído!" : `Dia ${Math.min(feitos + 1, p.totalDias)} de ${p.totalDias}`}</p>` : `<p class="plano-meta">${plural(p.totalDias, "dia", "dias")}</p>`}
      </a></li>`;
    };
    el.innerHTML = cabecalho("Projetos de leitura", "Leia a Bíblia com constância, um pouco por dia.") + `
      ${ativos.length ? `<h2 class="secao">Seus projetos</h2><ul class="lista-planos">${ativos.map(cartao).join("")}</ul>` : ""}
      <h2 class="secao">${ativos.length ? "Outros projetos" : "Escolha um projeto"}</h2>
      <ul class="lista-planos">${outros.map(cartao).join("")}</ul>
      <h2 class="secao">Monte o seu</h2>
      <form class="cartao form" id="form-livre">
        <div class="linha">
          <label>O que ler<select name="escolha">
            <option value="todos">A Bíblia toda</option><option value="AT">Antigo Testamento</option><option value="NT" selected>Novo Testamento</option>
            ${lista.map(l => `<option value="${l.id}">${esc(l.nome)}</option>`).join("")}</select></label>
          <label>Em quantos dias<input name="dias" type="number" min="1" max="1500" value="60" inputmode="numeric"></label>
        </div>
        ${getState().planos.livre ? `<p class="apoio">Criar um novo substitui o seu projeto livre atual.</p>` : ""}
        <button class="botao">${ic("planos")} Criar projeto</button>
      </form>`;
    el.querySelector("#form-livre").addEventListener("submit", e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const def = planoLivre(lista, f.get("escolha"), parseInt(f.get("dias"), 10) || 30);
      iniciarPlano("livre", { def });
      location.hash = "#/planos/livre";
    });
  };
  desenhar();
  return subscribe(desenhar);
}

function plano(el, planos, porId, lista, id) {
  let mostrarTodos = false;
  const desenhar = () => {
    const p = obterPlano(planos, id);
    if (!p) { el.innerHTML = cabecalho("Projeto não encontrado") + `<p><a href="#/planos">Voltar</a></p>`; return; }
    const st = getState();
    const prog = st.planos[id];
    const topo = `<p class="migalha"><a href="#/planos">${ic("voltar")} Projetos</a></p>` + cabecalho(p.nome, p.descricao);
    if (!prog) {
      el.innerHTML = topo + `<section class="cartao"><p>${plural(p.totalDias, "dia", "dias")} de leitura. Você pode começar hoje e seguir no seu ritmo: se perder um dia, é só continuar de onde parou.</p>
        <button class="botao" id="comecar">${ic("planos")} Começar hoje</button></section>
        <h2 class="secao">Como é o caminho</h2>
        <ol class="dias-plano">${p.dias.slice(0, 7).map((d, i) => `<li class="cartao"><strong>Dia ${i + 1}</strong>${d.titulo ? ` · ${esc(d.titulo)}` : ""}<br><span class="apoio">${trechosDia(d).map(t => esc(textoTrecho(t, porId))).join(" · ") || "Dia livre"}</span></li>`).join("")}</ol>`;
      el.querySelector("#comecar").addEventListener("click", () => { iniciarPlano(id); toast("Projeto começado. Bom caminho!"); });
      return;
    }
    // Conclui sozinho os dias cujos capítulos já foram todos lidos depois do início.
    p.dias.forEach((d, i) => {
      const caps = capsDoDia(d);
      if (caps.length && !prog.diasFeitos.includes(i + 1) && caps.every(c => st.lidos[c] && st.lidos[c] >= prog.inicio)) {
        marcarDiaPlano(id, i + 1, p.totalDias, `${p.nome}, dia ${i + 1}`);
      }
    });
    const feitos = new Set(prog.diasFeitos);
    const proximo = p.dias.findIndex((_, i) => !feitos.has(i + 1));
    const previsao = proximo >= 0 ? somaDias(hojeISO(), p.totalDias - feitos.size - 1) : null;
    const diaHTML = (d, i, destaque) => {
      const n = i + 1, feito = feitos.has(n);
      const tre = trechosDia(d);
      return `<li class="cartao dia-plano ${feito ? "feito" : ""} ${destaque ? "destaque" : ""}" id="dia-${n}">
        <div class="dia-plano-topo"><strong>Dia ${n}</strong>${d.titulo ? `<span>${esc(d.titulo)}</span>` : ""}${feito ? `<span class="chip">Feito</span>` : ""}</div>
        ${tre.length ? `<ul class="trechos">${tre.map(t => {
          const lidosT = Array.from({ length: t[2] - t[1] + 1 }, (_, k) => st.lidos[chaveCap(t[0], t[1] + k)]).every(Boolean);
          return `<li><a href="#/biblia/${t[0]}/${t[1]}" class="${lidosT ? "lido" : ""}">${esc(textoTrecho(t, porId))}</a></li>`;
        }).join("")}</ul>` : `<p class="apoio">Dia livre: aproveite para pôr a leitura em dia ou reler algo que tocou você.</p>`}
        <button class="botao ${feito ? "secundario" : ""} pequeno" data-dia="${n}">${feito ? "Desfazer" : "Concluí este dia"}</button>
      </li>`;
    };
    const janela = mostrarTodos ? p.dias.map((d, i) => [d, i]) : p.dias.map((d, i) => [d, i]).filter(([, i]) => proximo < 0 ? i >= p.totalDias - 3 : i >= proximo - 1 && i <= proximo + 5);
    el.innerHTML = topo + `
      <section class="cartao">
        ${progressBar(feitos.size / p.totalDias, "Progresso do projeto")}
        <p class="plano-meta">${prog.concluido ? `Concluído em ${esc(prog.concluido.split("-").reverse().join("/"))}. Graças a Deus!` : `${feitos.size} de ${p.totalDias} dias · no seu ritmo, termina por volta de ${esc(dataExtenso(new Date(previsao + "T12:00:00")).split(", ")[1] || previsao)}`}</p>
        <p class="apoio">Toque num trecho para ler. Ao marcar os capítulos como lidos no leitor, o dia se conclui sozinho.</p>
      </section>
      <ol class="dias-plano">${janela.map(([d, i]) => diaHTML(d, i, i === proximo)).join("")}</ol>
      <div class="botoes"><button class="botao secundario" id="todos">${mostrarTodos ? "Mostrar só os próximos dias" : `Ver todos os ${p.totalDias} dias`}</button>
      <button class="link-perigo" id="sair">Sair deste projeto</button></div>`;
    el.querySelectorAll("[data-dia]").forEach(b => b.addEventListener("click", () => {
      const n = +b.dataset.dia;
      if (feitos.has(n)) desmarcarDiaPlano(id, n);
      else { marcarDiaPlano(id, n, p.totalDias, `${p.nome}, dia ${n}`); toast(n === p.totalDias ? "Projeto concluído!" : "Dia concluído. Até amanhã!"); }
    }));
    el.querySelector("#todos").addEventListener("click", () => { mostrarTodos = !mostrarTodos; desenhar(); });
    el.querySelector("#sair").addEventListener("click", () => {
      if (confirm("Sair deste projeto? O progresso dele será apagado (os capítulos lidos continuam marcados na Bíblia).")) { sairPlano(id); location.hash = "#/planos"; }
    });
  };
  desenhar();
  return subscribe(desenhar);
}

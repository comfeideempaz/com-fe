// Bíblia: lista dos 73 livros (#/biblia), capítulos de um livro (#/biblia/joao)
// e o leitor (#/biblia/joao/3 ou #/biblia/joao/3/16 para destacar um versículo).
// No leitor: ouvir (voz do aparelho), marcar como lido, favoritar e copiar versículos.

import { livros, livroInfo, livroTexto, chaveCap, minutosLeitura } from "../biblia.js";
import { getState, subscribe, registrar, desmarcarLido, alternarFavorito, setFlag } from "../store.js";
import { esc, cabecalho, progressBar, toast, plural } from "../ui.js";
import { ic } from "../icons.js";
import { falar, parar, temVoz } from "../speech.js";

const AVISO = "Texto do Pe. Antônio Pereira de Figueiredo (domínio público), digitalizado de uma edição antiga e revisado automaticamente. Pode haver pequenos erros: na dúvida, confira na sua Bíblia.";

export async function render(el, params) {
  if (params.cap) return leitor(el, params);
  if (params.livro) return capitulos(el, params.livro);
  return indice(el);
}

// ---------- Índice dos livros ----------
async function indice(el) {
  const { livros: lista } = await livros();
  let filtro = "";
  const desenhar = () => {
    const st = getState();
    const ultima = st.flags.ultimaLeitura;
    const ultimaLivro = ultima && lista.find(l => l.id === ultima.livro);
    const f = filtro.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const visiveis = lista.filter(l => !f || (l.nome + " " + l.abrev).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(f));
    const grupos = [];
    for (const l of visiveis) {
      const chave = `${l.testamento}|${l.grupo}`;
      let g = grupos.find(x => x.chave === chave);
      if (!g) grupos.push(g = { chave, test: l.testamento, grupo: l.grupo, itens: [] });
      g.itens.push(l);
    }
    const lidosLivro = l => { let n = 0; for (let c = 1; c <= l.capitulos; c++) if (st.lidos[chaveCap(l.id, c)]) n++; return n; };
    const totalLidos = Object.keys(st.lidos).length;
    const totalCaps = lista.reduce((s, l) => s + l.capitulos, 0);
    el.querySelector("#biblia-corpo").innerHTML = `
      ${ultimaLivro && !f ? `<a class="cartao continuar" href="#/biblia/${ultima.livro}/${ultima.cap}">
        <span class="tile-ic">${ic("livro")}</span><span><small>Continuar de onde parou</small><strong>${esc(ultimaLivro.nome)} ${ultima.cap}</strong></span>${ic("seta", "seta")}</a>` : ""}
      ${!f ? `<div class="cartao progresso-biblia"><p><strong>${plural(totalLidos, "capítulo lido", "capítulos lidos")}</strong> de ${totalCaps}</p>${progressBar(totalLidos / totalCaps, "Bíblia lida")}</div>` : ""}
      ${st.favoritos.length && !f ? `<p><a href="#/biblia/favoritos" class="botao secundario">${ic("selo")} Meus versículos favoritos (${st.favoritos.length})</a></p>` : ""}
      ${grupos.map((g, i) => `
        ${i === 0 || grupos[i - 1].test !== g.test ? `<h2 class="secao">${g.test === "AT" ? "Antigo Testamento" : "Novo Testamento"}</h2>` : ""}
        <h3 class="grupo-titulo">${esc(g.grupo)}</h3>
        <ul class="livros">${g.itens.map(l => {
          const n = lidosLivro(l);
          return `<li><a href="#/biblia/${l.id}" class="${n === l.capitulos ? "completo" : ""}"><span class="livro-abrev">${esc(l.abrev)}</span><span class="livro-nome">${esc(l.nome)}</span>${n ? `<span class="livro-pct">${Math.round(n / l.capitulos * 100)}%</span>` : ""}</a></li>`;
        }).join("")}</ul>`).join("") || `<p class="vazio cartao">Nenhum livro com esse nome.</p>`}`;
  };
  el.innerHTML = cabecalho("Bíblia Sagrada", "Os 73 livros da Bíblia católica, para ler mesmo sem internet.") + `
    <label class="busca"><span class="sr">Buscar livro</span>${ic("busca")}<input type="search" id="busca-livro" placeholder="Buscar livro (ex.: Salmos, Jo)" autocomplete="off"></label>
    <div id="biblia-corpo"></div>
    <p class="aviso-texto">${esc(AVISO)}</p>`;
  el.querySelector("#busca-livro").addEventListener("input", e => { filtro = e.target.value; desenhar(); });
  desenhar();
  return subscribe(desenhar);
}

// ---------- Capítulos de um livro ----------
async function capitulos(el, id) {
  if (id === "favoritos") return favoritos(el);
  const l = await livroInfo(id);
  if (!l) { el.innerHTML = cabecalho("Livro não encontrado") + `<p><a href="#/biblia">Voltar à Bíblia</a></p>`; return; }
  const desenhar = () => {
    const st = getState();
    el.innerHTML = `<p class="migalha"><a href="#/biblia">${ic("voltar")} Bíblia</a></p>` + cabecalho(l.nome, `${l.grupo} · ${plural(l.capitulos, "capítulo", "capítulos")}`) + `
      <ul class="grade-caps">${Array.from({ length: l.capitulos }, (_, i) => i + 1).map(c =>
        `<li><a href="#/biblia/${l.id}/${c}" class="${st.lidos[chaveCap(l.id, c)] ? "lido" : ""}" aria-label="Capítulo ${c}${st.lidos[chaveCap(l.id, c)] ? ", lido" : ""}">${c}</a></li>`).join("")}</ul>
      ${l.id === "salmos" ? `<p class="aviso-texto">Os Salmos seguem a numeração da Vulgata, usada nesta tradução. Na maioria das Bíblias atuais, do Salmo 10 ao 147 o número é um a mais: o Salmo 22 daqui é o 23 delas.</p>` : ""}`;
    el.querySelector("h1").focus({ preventScroll: true });
  };
  desenhar();
  return subscribe(desenhar);
}

// ---------- Favoritos ----------
async function favoritos(el) {
  const st = getState();
  const { livros: lista } = await livros();
  const itens = await Promise.all(st.favoritos.map(async ref => {
    const [livro, cap, v] = ref.split(".");
    const l = lista.find(x => x.id === livro);
    if (!l) return "";
    const dados = await livroTexto(livro);
    const verso = dados.capitulos.find(c => c.n === +cap)?.v.find(x => x[0] === +v);
    return `<li class="cartao"><a href="#/biblia/${livro}/${cap}/${v}"><strong>${esc(l.abrev)} ${cap},${v}</strong></a><p class="texto-biblia">${esc(verso ? verso[1] : "")}</p></li>`;
  }));
  el.innerHTML = `<p class="migalha"><a href="#/biblia">${ic("voltar")} Bíblia</a></p>` + cabecalho("Versículos favoritos", "Toque num versículo no leitor para guardá-lo aqui.") +
    (itens.length ? `<ul class="lista-cartoes">${itens.join("")}</ul>` : `<p class="cartao vazio">Você ainda não guardou nenhum versículo.</p>`);
}

// ---------- Leitor ----------
async function leitor(el, { livro, cap, v }) {
  const l = await livroInfo(livro);
  const c = +cap;
  if (!l || c < 1 || c > l.capitulos) { el.innerHTML = cabecalho("Capítulo não encontrado") + `<p><a href="#/biblia">Voltar à Bíblia</a></p>`; return; }
  const dados = await livroTexto(livro);
  const capitulo = dados.capitulos.find(x => x.n === c);
  const versos = capitulo ? capitulo.v : [];
  const total = l.versiculos[c - 1] || 0;
  const chave = chaveCap(livro, c);
  const anterior = c > 1 ? `#/biblia/${livro}/${c - 1}` : null;
  const proximo = c < l.capitulos ? `#/biblia/${livro}/${c + 1}` : null;
  setFlag("ultimaLeitura", { livro, cap: c });

  // Monta a lista com lacunas visíveis (versículos que a fonte digital perdeu).
  const presentes = new Map(versos.map(([n, t]) => [n, t]));
  const linhas = [];
  for (let n = 1; n <= Math.max(total, versos.length ? versos[versos.length - 1][0] : 0); n++) {
    if (presentes.has(n)) linhas.push(`<span class="vers" data-v="${n}" tabindex="0"><sup>${n}</sup>${esc(presentes.get(n))} </span>`);
    else linhas.push(`<span class="vers falta" data-v="${n}"><sup>${n}</sup>[versículo ausente nesta edição digital] </span>`);
  }

  el.innerHTML = `
    <p class="migalha"><a href="#/biblia/${livro}">${ic("voltar")} ${esc(l.nome)}</a></p>
    <header class="tela-topo leitor-topo"><h1 tabindex="-1">${esc(l.nome)} ${c}</h1>
      <div class="leitor-acoes">
        ${temVoz() ? `<button class="botao secundario" id="ouvir">${ic("volume")} Ouvir</button>` : ""}
      </div>
    </header>
    <article class="cartao leitor" lang="pt-BR"><p class="texto-biblia">${linhas.join("")}</p></article>
    <div class="barra-verso" id="barra-verso" hidden>
      <span id="verso-sel"></span>
      <button class="botao secundario" id="fav">${ic("selo")} Favoritar</button>
      <button class="botao secundario" id="copiar">Copiar</button>
    </div>
    <div class="leitor-fim">
      <button class="botao" id="lido"></button>
      <nav class="botoes leitor-nav" aria-label="Capítulos">
        ${anterior ? `<a class="botao secundario" href="${anterior}">${ic("voltar")} Capítulo ${c - 1}</a>` : ""}
        ${proximo ? `<a class="botao secundario" href="${proximo}">Capítulo ${c + 1} ${ic("seta")}</a>` : ""}
      </nav>
    </div>
    <p class="aviso-texto">${esc(AVISO)}${livro === "salmos" ? " Os Salmos seguem a numeração da Vulgata (do 10 ao 147, um a menos que nas Bíblias atuais)." : ""}</p>`;

  const botaoLido = el.querySelector("#lido");
  const atualizarLido = () => {
    const lido = !!getState().lidos[chave];
    botaoLido.innerHTML = lido ? `${ic("planos")} Lido · desfazer` : `${ic("planos")} Marcar como lido`;
    botaoLido.classList.toggle("secundario", lido);
  };
  atualizarLido();
  botaoLido.addEventListener("click", () => {
    if (getState().lidos[chave]) { desmarcarLido(chave); toast("Marcação desfeita."); }
    else {
      registrar({ tipo: "capitulo", ref: chave, titulo: `${l.nome} ${c}`, minutos: minutosLeitura(versos) });
      toast(proximo ? "Capítulo lido! Siga para o próximo quando quiser." : "Você terminou este livro. Graças a Deus!");
    }
    atualizarLido();
  });

  // Destaque do versículo pedido na rota.
  if (v) {
    const alvo = el.querySelector(`.vers[data-v="${+v}"]`);
    if (alvo) { alvo.classList.add("destaque"); setTimeout(() => alvo.scrollIntoView({ block: "center" }), 50); }
  }

  // Selecionar versículo: favoritar ou copiar.
  let selecionado = null;
  const barra = el.querySelector("#barra-verso");
  const selecionar = alvo => {
    el.querySelectorAll(".vers.sel").forEach(x => x.classList.remove("sel"));
    if (!alvo || alvo === selecionado) { selecionado = null; barra.hidden = true; return; }
    selecionado = alvo;
    alvo.classList.add("sel");
    const ref = `${livro}.${c}.${alvo.dataset.v}`;
    el.querySelector("#verso-sel").textContent = `${l.abrev} ${c},${alvo.dataset.v}`;
    el.querySelector("#fav").innerHTML = `${ic("selo")} ${getState().favoritos.includes(ref) ? "Tirar dos favoritos" : "Favoritar"}`;
    barra.hidden = false;
  };
  el.querySelector(".leitor").addEventListener("click", e => selecionar(e.target.closest(".vers:not(.falta)")));
  el.querySelector(".leitor").addEventListener("keydown", e => { if (e.key === "Enter") selecionar(e.target.closest(".vers")); });
  el.querySelector("#fav").addEventListener("click", () => {
    if (!selecionado) return;
    const ok = alternarFavorito(`${livro}.${c}.${selecionado.dataset.v}`);
    toast(ok ? "Versículo guardado nos favoritos." : "Tirado dos favoritos.");
    selecionar(null);
  });
  el.querySelector("#copiar").addEventListener("click", async () => {
    if (!selecionado) return;
    const texto = `${presentes.get(+selecionado.dataset.v)} (${l.abrev} ${c},${selecionado.dataset.v})`;
    try { await navigator.clipboard.writeText(texto); toast("Copiado."); } catch { toast("Não consegui copiar."); }
    selecionar(null);
  });

  // Ouvir o capítulo.
  const ouvir = el.querySelector("#ouvir");
  if (ouvir) {
    let tocando = false;
    ouvir.addEventListener("click", () => {
      if (tocando) { parar(); tocando = false; ouvir.innerHTML = `${ic("volume")} Ouvir`; return; }
      tocando = true;
      ouvir.innerHTML = `${ic("volume")} Parar`;
      falar(`${l.nome}, capítulo ${c}. ` + versos.map(([, t]) => t).join(" "), {
        aoTerminar: () => { tocando = false; ouvir.innerHTML = `${ic("volume")} Ouvir`; },
      });
    });
  }
  return () => parar();
}

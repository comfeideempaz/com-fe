// Tela "Meu progresso": sequência e recorde, meta do dia, aparência (tema e letra)
// e o backup do progresso (exportar e importar arquivo), já que não há conta.

import { getState, subscribe, setPerfil, sequenciaAtual, exportar, importar, apagarTudo } from "../store.js";
import { cabecalho, esc, formatNumber, toast, hojeISO } from "../ui.js";
import { META } from "../config.js";
import { ic } from "../icons.js";

function opcoes(lista, atual) {
  return lista.map(v => `<option value="${v}" ${String(v) === String(atual) ? "selected" : ""}>${v}</option>`).join("");
}

function desenhar(el) {
  const st = getState();
  const p = st.perfil;
  el.innerHTML = cabecalho("Meu progresso", "Tudo fica salvo neste aparelho.") + `
    <section class="painel tres">
      <div class="cartao estat"><div class="estat-ic chama">${ic("chama")}</div><div><p class="estat-num">${formatNumber(sequenciaAtual())}</p><p class="estat-rot">sequência atual</p></div></div>
      <div class="cartao estat"><div class="estat-ic ouro">${ic("selo")}</div><div><p class="estat-num">${formatNumber(st.sequencia.recorde)}</p><p class="estat-rot">maior sequência</p></div></div>
      <div class="cartao estat"><div class="estat-ic livro">${ic("livro")}</div><div><p class="estat-num">${formatNumber(Object.keys(st.lidos).length)}</p><p class="estat-rot">capítulos lidos</p></div></div>
    </section>

    <form class="cartao form" id="f-perfil" aria-labelledby="t-perfil">
      <h2 id="t-perfil">Você e sua meta</h2>
      <label>Como quer ser chamado(a)?<input name="nome" maxlength="30" value="${esc(p.nome)}" autocomplete="given-name" placeholder="Seu nome (opcional)"></label>
      <div class="linha">
        <label>Meta diária em
          <select name="metaTipo"><option value="capitulos" ${p.metaTipo === "capitulos" ? "selected" : ""}>capítulos</option><option value="minutos" ${p.metaTipo === "minutos" ? "selected" : ""}>minutos</option></select>
        </label>
        <label>Quantidade
          <select name="metaValor">${opcoes(META.opcoes[p.metaTipo], p.metaValor)}</select>
        </label>
      </div>
      <p class="apoio">Um dia de descanso por semana não quebra a sua sequência.</p>
    </form>

    <form class="cartao form" id="f-aparencia" aria-labelledby="t-ap">
      <h2 id="t-ap">Aparência</h2>
      <div class="linha">
        <label>Tema
          <select name="tema"><option value="auto" ${p.tema === "auto" ? "selected" : ""}>Igual ao aparelho</option><option value="claro" ${p.tema === "claro" ? "selected" : ""}>Claro</option><option value="escuro" ${p.tema === "escuro" ? "selected" : ""}>Escuro</option></select>
        </label>
        <label>Tamanho da letra
          <select name="tamanhoLetra">${[["0.9", "Menor"], ["1", "Normal"], ["1.15", "Maior"], ["1.3", "Bem grande"]].map(([v, r]) => `<option value="${v}" ${String(p.tamanhoLetra) === v ? "selected" : ""}>${r}</option>`).join("")}</select>
        </label>
      </div>
    </form>

    <section class="cartao" aria-labelledby="t-bk">
      <h2 id="t-bk">Backup do progresso</h2>
      <p>Como o app não usa conta, salve um arquivo de backup para não perder nada ao trocar de celular.</p>
      <div class="botoes">
        <button class="botao" id="b-exportar">${ic("baixar")} Salvar backup</button>
        <label class="botao secundario">${ic("subir")} Restaurar backup<input type="file" id="b-importar" accept="application/json,.json" hidden></label>
      </div>
      <button class="link-perigo" id="b-apagar">Apagar todo o progresso deste aparelho</button>
    </section>`;

  el.querySelector("#f-perfil").addEventListener("change", e => {
    const f = e.currentTarget.elements;
    const metaTipo = f.metaTipo.value;
    let metaValor = Number(f.metaValor.value);
    if (!META.opcoes[metaTipo].includes(metaValor)) metaValor = META.opcoes[metaTipo][0];
    const mudouTipo = metaTipo !== p.metaTipo;
    setPerfil({ nome: f.nome.value.trim().slice(0, 30), metaTipo, metaValor });
    toast("Salvo.");
    if (mudouTipo) { desenhar(el); el.querySelector("[name=metaValor]").focus(); }
  });
  el.querySelector("#f-aparencia").addEventListener("change", e => {
    const f = e.currentTarget.elements;
    setPerfil({ tema: f.tema.value, tamanhoLetra: Number(f.tamanhoLetra.value) });
  });
  el.querySelector("#b-exportar").addEventListener("click", () => {
    const blob = new Blob([exportar()], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `catequizando-backup-${hojeISO()}.json` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Backup salvo.");
  });
  el.querySelector("#b-importar").addEventListener("change", async e => {
    const arq = e.target.files[0];
    if (!arq) return;
    try { importar(await arq.text()); toast("Progresso restaurado."); }
    catch (err) { toast(err.message.startsWith("Este arquivo") ? err.message : "Não consegui ler este arquivo."); }
  });
  el.querySelector("#b-apagar").addEventListener("click", () => {
    if (confirm("Apagar todo o progresso deste aparelho? Isso não pode ser desfeito.")) { apagarTudo(); toast("Progresso apagado."); }
  });
}

export function render(el) {
  desenhar(el);
  // Redesenha só quando algo mudou fora desta tela (ex.: restaurar backup), mantendo o foco.
  return subscribe(() => { if (!el.contains(document.activeElement) || document.activeElement.type === "file") desenhar(el); });
}

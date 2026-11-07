// Tela "Meu progresso": sequência e recorde, selos, números do caminho, meta do dia, aparência (tema e letra)
// a conta (e-mail, sincronização, sair) ou o aviso de visitante, e o backup em arquivo.

import { getState, subscribe, setPerfil, sequenciaAtual, exportar, importar, apagarTudo } from "../store.js";
import { cabecalho, esc, formatNumber, toast, hojeISO } from "../ui.js";
import { META } from "../config.js";
import { ic } from "../icons.js";
import { definicoes } from "../selos.js";
import { refsHTML } from "../biblia.js";
import { getModo, getUsuario, getStatusSync, aoMudarConta, sair, enviarAgora, ondeFicaSalvo } from "../conta.js";

const SYNC_TEXTO = {
  ok: "✓ Tudo salvo na sua conta.",
  enviando: "Enviando para a sua conta…",
  pendente: "Guardado no aparelho. Vai para a sua conta quando houver internet.",
  erro: "Não consegui enviar agora. Tento de novo sozinho.",
};

function contaHTML() {
  const modo = getModo();
  if (modo === "conta") {
    const st = getStatusSync();
    return `<section class="cartao" aria-labelledby="t-conta">
      <h2 id="t-conta">Sua conta</h2>
      <p class="conta-linha"><span class="conta-email">${esc(getUsuario()?.email || "")}</span></p>
      <p class="sync ${st === "erro" ? "erro" : ""}" id="sync" role="status">${SYNC_TEXTO[st]}</p>
      <div class="botoes">
        ${st !== "ok" ? `<button class="botao secundario" id="b-enviar">Enviar agora</button>` : ""}
        <a class="botao secundario" href="#/entrar/nova-senha">Trocar senha</a>
        <button class="botao secundario" id="b-sair">Sair da conta</button>
      </div>
    </section>`;
  }
  if (modo === "visitante") {
    return `<section class="cartao faixa-visitante" aria-labelledby="t-conta">
      <p><strong id="t-conta">Você está como visitante.</strong> O que aparece aqui some ao fechar o app. Crie uma conta para guardar o seu caminho.</p>
      <div class="botoes"><a class="botao" href="#/entrar/criar">Criar conta</a><a class="botao secundario" href="#/entrar">Entrar</a><button class="botao secundario" id="b-sair">Sair do modo visitante</button></div>
    </section>`;
  }
  return "";
}

let selosDef = null;

function opcoes(lista, atual) {
  return lista.map(v => `<option value="${v}" ${String(v) === String(atual) ? "selected" : ""}>${v}</option>`).join("");
}

function desenhar(el) {
  const st = getState();
  const p = st.perfil;
  el.innerHTML = cabecalho("Meu progresso", ondeFicaSalvo()) + contaHTML() + `
    <section class="painel tres">
      <div class="cartao estat"><div class="estat-ic chama">${ic("chama")}</div><div><p class="estat-num">${formatNumber(sequenciaAtual())}</p><p class="estat-rot">sequência atual</p></div></div>
      <div class="cartao estat"><div class="estat-ic ouro">${ic("selo")}</div><div><p class="estat-num">${formatNumber(st.sequencia.recorde)}</p><p class="estat-rot">maior sequência</p></div></div>
      <div class="cartao estat"><div class="estat-ic livro">${ic("livro")}</div><div><p class="estat-num">${formatNumber(Object.keys(st.lidos).length)}</p><p class="estat-rot">capítulos lidos</p></div></div>
    </section>

    <section class="cartao" aria-labelledby="t-selos">
      <h2 id="t-selos">Selos do caminho</h2>
      ${selosDef ? `<p class="apoio">${esc(selosDef.sobre)}</p>
      <ul class="selos">${selosDef.selos.map(s => {
        const quando = st.selos[s.id];
        return `<li class="selo ${quando ? "ganho" : ""}"><span class="selo-ic">${ic(quando ? "selo" : "alvo")}</span>
          <span><strong>${esc(s.nome)}</strong><small>${esc(s.descricao)}</small>
          ${quando ? `<em>“${esc(s.frase)}” ${refsHTML(s.biblia)}</em><small>Recebido em ${esc(quando.split("-").reverse().join("/"))}</small>` : ""}</span></li>`;
      }).join("")}</ul>` : ""}
    </section>

    <section class="cartao" aria-labelledby="t-numeros">
      <h2 id="t-numeros">Seu caminho em números</h2>
      <ul class="numeros">
        <li><strong>${formatNumber((st.flags.evangelhos || []).length)}</strong> evangelhos do dia</li>
        <li><strong>${formatNumber(st.santosVistos.length)}</strong> vidas de santos</li>
        <li><strong>${formatNumber(st.missaVista.length)}</strong> partes da missa</li>
        <li><strong>${formatNumber((st.flags.defesa || []).length)}</strong> temas da Defesa da Fé</li>
        <li><strong>${formatNumber(st.favoritos.length)}</strong> versículos favoritos</li>
        <li><strong>${formatNumber(Object.values(st.planos).filter(p => p.concluido).length)}</strong> projetos concluídos</li>
      </ul>
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
      <p>${getModo() === "conta" ? "Sua conta já guarda tudo. Se quiser, salve também uma cópia em arquivo." : getModo() === "visitante" ? "Quer levar o que fez agora? Salve um arquivo e restaure depois de criar a sua conta." : "Salve um arquivo de backup para não perder nada ao trocar de celular."}</p>
      <div class="botoes">
        <button class="botao" id="b-exportar">${ic("baixar")} Salvar backup</button>
        <label class="botao secundario">${ic("subir")} Restaurar backup<input type="file" id="b-importar" accept="application/json,.json" hidden></label>
      </div>
      <button class="link-perigo" id="b-apagar">${getModo() === "conta" ? "Apagar todo o meu progresso (aqui e na conta)" : "Apagar todo o progresso"}</button>
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
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `com-fe-backup-${hojeISO()}.json` });
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
    if (confirm("Apagar todo o progresso? Isso não pode ser desfeito.")) { apagarTudo(); toast("Progresso apagado."); }
  });
  el.querySelector("#b-enviar")?.addEventListener("click", async () => { toast((await enviarAgora()) ? "Enviado." : "Ainda sem conexão."); });
  el.querySelector("#b-sair")?.addEventListener("click", async () => {
    if (getModo() === "visitante") {
      if (confirm("Sair do modo visitante? O que você fez agora será apagado.")) await sair();
      return;
    }
    if (await sair()) { toast("Você saiu da conta."); return; }
    if (confirm("Ainda há progresso que não chegou à sua conta (sem internet). Se sair agora, ele se perde. Sair mesmo assim?")) await sair({ forcar: true });
  });
}

export async function render(el) {
  try { selosDef = await definicoes(); } catch { selosDef = null; }
  desenhar(el);
  // Redesenha só quando algo mudou fora desta tela (ex.: restaurar backup), mantendo o foco.
  const redesenhar = () => { if (!el.contains(document.activeElement) || document.activeElement.type === "file" || document.activeElement.tagName === "BUTTON") desenhar(el); };
  const a = subscribe(redesenhar);
  // O status da sincronização muda sozinho: atualiza só a linha dele, sem perder o foco.
  const b = aoMudarConta(() => {
    const s = el.querySelector("#sync");
    if (s && getModo() === "conta") { s.textContent = SYNC_TEXTO[getStatusSync()]; s.classList.toggle("erro", getStatusSync() === "erro"); }
  });
  return () => { a(); b(); };
}

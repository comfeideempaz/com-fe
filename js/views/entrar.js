// Tela de entrada: entrar com e-mail e senha, criar conta, esqueci a senha,
// nova senha (volta do e-mail) e "entrar como visitante" (usa tudo, mas não salva).
// Aparece sem o menu, em tela cheia: céu noturno com raios de luz dourada,
// o ícone do app com um halo e um versículo que muda sozinho (Bíblia de Figueiredo).
// Etapas: #/entrar, #/entrar/criar, #/entrar/esqueci, #/entrar/nova-senha.

import { entrar, criarConta, esqueciSenha, trocarSenha, entrarComoVisitante, getModo, rotaDepoisDeEntrar } from "../conta.js";
import { esc, toast } from "../ui.js";
import { ic } from "../icons.js";
import { APP_NAME } from "../config.js";

const TITULOS = {
  entrar: ["Que bom ter você aqui!", "Entre para guardar o seu caminho de fé: leituras, terços, sequência, selos e meditações."],
  criar: ["Comece o seu caminho", "Com uma conta, o seu progresso fica salvo e volta em qualquer aparelho."],
  esqueci: ["Esqueci a senha", "Digite o seu e-mail. Enviamos um link para você criar uma senha nova."],
  "nova-senha": ["Nova senha", "Escolha a sua senha nova."],
};

// Versículos da Bíblia de Figueiredo (domínio público), conferidos com data/biblia.
const VERSICULOS = [
  ["Eu sou o caminho, e a verdade, e a vida.", "Jo 14,6"],
  ["Vinde a mim todos os que andais em trabalho, e vos achais carregados, e eu vos aliviarei.", "Mt 11,28"],
  ["O Senhor me governa, e nada me faltará.", "Sl 22(23),1"],
  ["Eu sou a luz do mundo: o que me segue não anda em trevas.", "Jo 8,12"],
  ["Tudo posso naquele que me conforta.", "Fl 4,13"],
  ["Deus é Caridade.", "1Jo 4,16"],
  ["Eis aqui a escrava do Senhor, faça-se em mim segundo a tua palavra.", "Lc 1,38"],
  ["Eu estou convosco todos os dias, até à consumação do século.", "Mt 28,20"],
];

const BOTAO = { entrar: "Entrar", criar: "Criar minha conta", esqueci: "Enviar o link", "nova-senha": "Salvar senha nova" };

function campos(etapa) {
  const email = `<label class="campo">${ic("carta")}<span class="sr">E-mail</span>
    <input name="email" type="email" required autocomplete="email" inputmode="email" placeholder="Seu e-mail"></label>`;
  const senha = (rotulo, auto) => `<label class="campo">${ic("cadeado")}<span class="sr">${rotulo}</span>
    <input name="senha" type="password" required minlength="6" autocomplete="${auto}" placeholder="${rotulo} (mínimo 6 caracteres)">
    <button type="button" class="ver-senha" aria-label="Mostrar senha" aria-pressed="false">${ic("olho")}</button></label>`;
  if (etapa === "entrar") return email + senha("Senha", "current-password");
  if (etapa === "criar") return email + senha("Crie uma senha", "new-password");
  if (etapa === "esqueci") return email;
  return senha("Senha nova", "new-password");
}

// Brilhos dourados que sobem devagar pelo céu (posições fixas, sem sorteio a cada tela).
const BRILHOS = Array.from({ length: 22 }, (_, i) => {
  const x = (i * 37) % 100, d = 9 + (i * 7) % 11, a = -((i * 13) % 17), t = 2 + (i % 3);
  return `<i style="--x:${x}%;--d:${d}s;--a:${a}s;--t:${t}px"></i>`;
}).join("");

export function render(el, { etapa = "entrar", query }) {
  const aviso = query?.get("aviso");
  const [titulo, apoio] = TITULOS[etapa];
  const abas = etapa === "entrar" || etapa === "criar";
  el.innerHTML = `
    <section class="login">
      <div class="login-ceu" aria-hidden="true"><div class="login-raios"></div><div class="login-brilhos">${BRILHOS}</div></div>
      <div class="login-conteudo">
        <div class="login-topo">
          <div class="login-halo"><img src="icons/icon-384.png" alt="" width="132" height="132"></div>
          <p class="login-marca">${esc(APP_NAME)}</p>
          <p class="login-lema">A sua fé, todos os dias</p>
        </div>

        <figure class="login-versiculo" aria-live="off">
          <blockquote id="versiculo">“${esc(VERSICULOS[0][0])}”</blockquote>
          <figcaption id="versiculo-ref">${esc(VERSICULOS[0][1])}</figcaption>
        </figure>

        <div class="login-cartao">
          ${abas ? `<nav class="login-abas" aria-label="Entrar ou criar conta">
            <a href="#/entrar" ${etapa === "entrar" ? 'aria-current="page"' : ""}>Entrar</a>
            <a href="#/entrar/criar" ${etapa === "criar" ? 'aria-current="page"' : ""}>Criar conta</a>
          </nav>` : `<p class="login-voltar"><a href="#/entrar">${ic("voltar")} Voltar</a></p>`}
          <h1 tabindex="-1">${esc(titulo)}</h1>
          <p class="login-apoio">${esc(apoio)}</p>
          ${aviso ? `<p class="entrar-msg erro" role="alert">${esc(aviso)}</p>` : ""}
          <form class="login-form" id="f-entrar" novalidate>
            ${campos(etapa)}
            <p class="entrar-msg" id="msg" role="status" hidden></p>
            <button class="botao dourado entrar-botao" type="submit">${BOTAO[etapa]} ${ic("seta")}</button>
          </form>
          ${etapa === "entrar" ? `<p class="login-links"><a href="#/entrar/esqueci">Esqueci a senha</a></p>` : ""}
        </div>

        ${etapa !== "nova-senha" ? `
        <div class="login-ou"><span>ou</span></div>
        <button class="login-visitante" id="b-visitante">
          ${ic("porta")}<span><strong>Entrar como visitante</strong><small>Use tudo agora. O progresso some ao fechar o app.</small></span>${ic("seta", "seta")}
        </button>` : ""}

        <p class="login-rodape">✝ Paz e bem · Bíblia, liturgia, terço e santos, mesmo sem internet</p>
      </div>
    </section>`;

  // Versículo que muda a cada 7 segundos, com troca suave.
  const bq = el.querySelector("#versiculo"), ref = el.querySelector("#versiculo-ref");
  let n = Math.floor(Date.now() / 86400000) % VERSICULOS.length;
  const mostrarVersiculo = () => { bq.textContent = `“${VERSICULOS[n][0]}”`; ref.textContent = VERSICULOS[n][1]; };
  mostrarVersiculo();
  const troca = setInterval(() => {
    const fig = bq.parentElement;
    fig.classList.add("trocando");
    setTimeout(() => { n = (n + 1) % VERSICULOS.length; mostrarVersiculo(); fig.classList.remove("trocando"); }, 450);
  }, 7000);

  const form = el.querySelector("#f-entrar");
  const msg = el.querySelector("#msg");
  const botao = form.querySelector("button[type=submit]");
  const mostrar = (texto, erro = true) => { msg.hidden = false; msg.textContent = texto; msg.classList.toggle("erro", erro); };

  form.querySelectorAll(".ver-senha").forEach(b => b.addEventListener("click", () => {
    const campo = b.parentElement.querySelector("input");
    const ver = campo.type === "password";
    campo.type = ver ? "text" : "password";
    b.setAttribute("aria-pressed", String(ver));
    b.setAttribute("aria-label", ver ? "Esconder senha" : "Mostrar senha");
    b.innerHTML = ic(ver ? "olho-fechado" : "olho");
  }));

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const email = form.elements.email?.value.trim().toLowerCase();
    const senha = form.elements.senha?.value || "";
    if (form.elements.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { mostrar("Digite um e-mail válido."); form.elements.email.focus(); return; }
    if (form.elements.senha && senha.length < 6) { mostrar("A senha precisa ter pelo menos 6 caracteres."); form.elements.senha.focus(); return; }
    botao.disabled = true;
    const rotulo = botao.innerHTML;
    botao.innerHTML = `<span class="girando" aria-hidden="true"></span> Aguarde…`;
    try {
      if (etapa === "entrar") {
        await entrar(email, senha);
        toast("Bem-vindo(a) de volta! Paz e bem.");
        location.hash = rotaDepoisDeEntrar();
      } else if (etapa === "criar") {
        const r = await criarConta(email, senha);
        if (r === "pronto") { toast("Conta criada! Que Deus abençoe o seu caminho."); location.hash = rotaDepoisDeEntrar(); return; }
        form.innerHTML = `<p class="entrar-msg ok" role="status">Quase lá! Enviamos um link para <strong>${esc(email)}</strong>. Abra o e-mail (olhe também o spam) e toque no link para confirmar a sua conta.</p>`;
      } else if (etapa === "esqueci") {
        await esqueciSenha(email);
        form.innerHTML = `<p class="entrar-msg ok" role="status">Se houver uma conta com <strong>${esc(email)}</strong>, o link para a senha nova chega em alguns minutos.</p>`;
      } else {
        await trocarSenha(senha);
        toast("Senha nova salva.");
        location.hash = "#/inicio";
      }
    } catch (err) {
      mostrar(err.message || "Não deu certo agora. Tente de novo.");
    } finally {
      if (botao.isConnected) { botao.disabled = false; botao.innerHTML = rotulo; }
    }
  });

  el.querySelector("#b-visitante")?.addEventListener("click", () => {
    entrarComoVisitante();
    location.hash = rotaDepoisDeEntrar();
  });

  // Já entrou e abriu #/entrar de novo: manda para o início (menos na troca de senha).
  if (getModo() === "conta" && etapa !== "nova-senha") location.replace("#/inicio");
  return () => clearInterval(troca);
}

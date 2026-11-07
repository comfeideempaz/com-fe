// Tela de entrada: entrar com e-mail e senha, criar conta, esqueci a senha,
// nova senha (volta do e-mail) e "entrar como visitante" (usa tudo, mas não salva).
// Aparece sem o menu. Etapas: #/entrar, #/entrar/criar, #/entrar/esqueci, #/entrar/nova-senha.

import { entrar, criarConta, esqueciSenha, trocarSenha, entrarComoVisitante, getModo, rotaDepoisDeEntrar } from "../conta.js";
import { esc, toast } from "../ui.js";
import { lumi } from "../lumi.js";
import { APP_NAME } from "../config.js";

const TITULOS = {
  entrar: ["Que bom ter você aqui!", "Entre para guardar o seu caminho: leituras, sequência, selos e meditações."],
  criar: ["Criar conta", "Com uma conta, o seu progresso fica salvo e volta em qualquer aparelho."],
  esqueci: ["Esqueci a senha", "Digite o seu e-mail. Enviamos um link para você criar uma senha nova."],
  "nova-senha": ["Nova senha", "Escolha a sua senha nova."],
};

function campos(etapa) {
  const email = `<label>E-mail<input name="email" type="email" required autocomplete="email" inputmode="email" placeholder="voce@email.com"></label>`;
  const senha = (rotulo, auto) => `<label>${rotulo}<input name="senha" type="password" required minlength="6" autocomplete="${auto}" placeholder="Pelo menos 6 caracteres"></label>`;
  if (etapa === "entrar") return email + senha("Senha", "current-password");
  if (etapa === "criar") return email + senha("Crie uma senha", "new-password");
  if (etapa === "esqueci") return email;
  return senha("Senha nova", "new-password");
}

const BOTAO = { entrar: "Entrar", criar: "Criar minha conta", esqueci: "Enviar o link", "nova-senha": "Salvar senha nova" };

export function render(el, { etapa = "entrar", query }) {
  const aviso = query?.get("aviso");
  const [titulo, apoio] = TITULOS[etapa];
  el.innerHTML = `
    <section class="entrar">
      <div class="entrar-topo">
        ${lumi({ tamanho: 88, humor: etapa === "entrar" ? "feliz" : "piscando", rotulo: "Lumi, a ovelhinha" })}
        <p class="entrar-marca">${esc(APP_NAME)}</p>
      </div>
      <div class="cartao">
        <h1 tabindex="-1">${esc(titulo)}</h1>
        <p class="apoio">${esc(apoio)}</p>
        ${aviso ? `<p class="entrar-msg erro" role="alert">${esc(aviso)}</p>` : ""}
        <form class="form" id="f-entrar" novalidate>
          ${campos(etapa)}
          <p class="entrar-msg" id="msg" role="status" hidden></p>
          <button class="botao entrar-botao" type="submit">${BOTAO[etapa]}</button>
        </form>
        <p class="entrar-links">
          ${etapa === "entrar" ? `<a href="#/entrar/esqueci">Esqueci a senha</a> · <a href="#/entrar/criar">Criar conta</a>` : ""}
          ${etapa === "criar" || etapa === "esqueci" ? `<a href="#/entrar">Já tenho conta: entrar</a>` : ""}
        </p>
      </div>
      ${etapa !== "nova-senha" ? `
      <div class="cartao entrar-visitante">
        <h2>Só quer conhecer?</h2>
        <p>Use o app inteiro como visitante. Só não salvamos o seu progresso: ao fechar o app, ele some.</p>
        <button class="botao secundario" id="b-visitante">Entrar como visitante</button>
      </div>` : ""}
    </section>`;

  const form = el.querySelector("#f-entrar");
  const msg = el.querySelector("#msg");
  const botao = form.querySelector("button[type=submit]");
  const mostrar = (texto, erro = true) => { msg.hidden = false; msg.textContent = texto; msg.classList.toggle("erro", erro); };

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const email = form.elements.email?.value.trim().toLowerCase();
    const senha = form.elements.senha?.value || "";
    if (form.elements.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { mostrar("Digite um e-mail válido."); form.elements.email.focus(); return; }
    if (form.elements.senha && senha.length < 6) { mostrar("A senha precisa ter pelo menos 6 caracteres."); form.elements.senha.focus(); return; }
    botao.disabled = true;
    const rotulo = botao.textContent;
    botao.textContent = "Aguarde…";
    try {
      if (etapa === "entrar") {
        await entrar(email, senha);
        toast("Bem-vindo(a) de volta!");
        location.hash = rotaDepoisDeEntrar();
      } else if (etapa === "criar") {
        const r = await criarConta(email, senha);
        if (r === "pronto") { toast("Conta criada!"); location.hash = rotaDepoisDeEntrar(); return; }
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
      if (botao.isConnected) { botao.disabled = false; botao.textContent = rotulo; }
    }
  });

  el.querySelector("#b-visitante")?.addEventListener("click", () => {
    entrarComoVisitante();
    location.hash = rotaDepoisDeEntrar();
  });

  // Já entrou e abriu #/entrar de novo: manda para o início (menos na troca de senha).
  if (getModo() === "conta" && etapa !== "nova-senha") location.replace("#/inicio");
}

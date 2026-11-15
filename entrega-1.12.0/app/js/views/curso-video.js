// Player da aula animada (Curso de Teologia): áudio narrado + palco animado da Lumi,
// legenda palavra por palavra e controle de velocidade.
import { criarPalco } from "../aula-video.js";
import { parar } from "../speech.js";

const VELOCIDADES = [0.75, 1, 1.25, 1.5];
const CHAVE_VEL = "comfe:video-vel";
const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const lerVel = () => { try { const v = parseFloat(localStorage.getItem(CHAVE_VEL)); return VELOCIDADES.includes(v) ? v : 1; } catch { return 1; } };
const salvarVel = v => { try { localStorage.setItem(CHAVE_VEL, String(v)); } catch { /* sem armazenamento */ } };

const CSS = `
.avp{position:fixed;inset:0;z-index:2000;background:#070F26;display:flex;flex-direction:column;color:#FFF8E6;font-family:Figtree,system-ui,sans-serif}
.avp-area{position:relative;flex:1;overflow:hidden}
.avp-msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;font-size:18px;font-weight:600;z-index:3}
.avp-msg button,.avp-fim button{font:inherit;font-weight:700;border:0;border-radius:999px;padding:12px 22px;margin:6px;cursor:pointer}
.avp-play{position:absolute;inset:0;margin:auto;width:92px;height:92px;border-radius:50%;border:0;background:rgba(232,194,104,.92);color:#0F2257;font-size:40px;z-index:4;cursor:pointer;box-shadow:0 10px 40px rgba(0,0,0,.5)}
.avp-fim{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(7,15,38,.72);gap:4px}
.avp-fim .p{background:#E8C268;color:#0F2257}.avp-fim .s{background:rgba(255,255,255,.14);color:#FFF8E6}
.avp-barra{display:flex;align-items:center;gap:10px;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:#0B1838}
.avp-barra button{flex:none;border:0;background:rgba(255,255,255,.1);color:#FFF8E6;border-radius:12px;min-width:44px;height:44px;font:inherit;font-weight:800;font-size:16px;cursor:pointer}
.avp-barra button.vel{min-width:62px;color:#E8C268}
.avp-barra input{flex:1;min-width:60px;accent-color:#E8C268}
.avp-tempo{flex:none;font-size:13px;font-variant-numeric:tabular-nums;color:#A7B1C8;min-width:84px;text-align:center}
.avp-fechar{position:absolute;top:calc(10px + env(safe-area-inset-top));right:10px;z-index:5;width:44px;height:44px;border-radius:50%;border:0;background:rgba(7,15,38,.6);color:#fff;font-size:22px;cursor:pointer}
`;
let cssPosto = false;

export function abrirVideo(modulo, aula, { aoQuiz } = {}) {
  parar();
  if (!cssPosto) { const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s); cssPosto = true; }
  const chave = `${modulo.id}-${aula.id}`;
  const ov = document.createElement("div"); ov.className = "avp"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", `Aula animada: ${aula.titulo}`);
  ov.innerHTML = `<div class="avp-area"><div class="avp-msg">Carregando a aula animada…</div><button class="avp-fechar" aria-label="Fechar">✕</button></div>
    <div class="avp-barra"><button class="pp" aria-label="Tocar ou pausar">▶</button>
      <input type="range" min="0" max="1000" value="0" aria-label="Posição na aula">
      <span class="avp-tempo">0:00 / 0:00</span>
      <button class="vel" aria-label="Velocidade">1×</button></div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = "hidden";
  const area = ov.querySelector(".avp-area"), msg = ov.querySelector(".avp-msg");
  const pp = ov.querySelector(".pp"), barra = ov.querySelector("input"), tempo = ov.querySelector(".avp-tempo"), velBtn = ov.querySelector(".vel");

  // o áudio é criado e tocado já no toque do botão (exigência dos celulares)
  const audio = new Audio(); audio.preload = "auto"; audio.src = `audio/curso/${chave}.mp3`;
  let vel = lerVel(); audio.playbackRate = vel; velBtn.textContent = `${String(vel).replace(".", ",")}×`;
  audio.play().catch(() => { });
  let palco = null, raf = 0, fechado = false, arrastando = false;

  const quadro = () => {
    if (fechado) return;
    if (palco) palco.render(audio.currentTime);
    const tot = audio.duration || palco?.total || 0;
    if (!arrastando && tot) barra.value = Math.round(1000 * audio.currentTime / tot);
    tempo.textContent = `${fmt(audio.currentTime)} / ${fmt(tot)}`;
    pp.textContent = audio.paused ? "▶" : "❚❚";
    raf = requestAnimationFrame(quadro);
  };
  const ajustar = () => palco?.ajustar(area.clientWidth, area.clientHeight);

  fetch(`data/curso/video/${chave}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(async rot => {
    if (fechado) return;
    palco = await criarPalco(area, rot);
    msg.remove(); ajustar();
    if (audio.paused && audio.currentTime === 0) mostrarPlay();
  }).catch(() => { msg.innerHTML = `<div>Não foi possível abrir a aula animada.<br>Ela precisa de internet.<br><button class="p" style="background:#E8C268;color:#0F2257">Fechar</button></div>`; msg.querySelector("button").onclick = fechar; });
  audio.addEventListener("error", () => { if (!palco) return; msg.textContent = "Sem internet para carregar o áudio da aula."; area.appendChild(msg); });

  function mostrarPlay() {
    if (area.querySelector(".avp-play")) return;
    const b = document.createElement("button"); b.className = "avp-play"; b.setAttribute("aria-label", "Tocar"); b.textContent = "▶";
    b.onclick = () => { b.remove(); audio.play(); };
    area.appendChild(b);
  }
  audio.addEventListener("play", () => area.querySelector(".avp-play")?.remove());
  audio.addEventListener("ended", () => {
    const f = document.createElement("div"); f.className = "avp-fim";
    f.innerHTML = `<button class="p q">Fazer o quiz da aula</button><button class="s r">Assistir de novo</button><button class="s x">Fechar</button>`;
    f.querySelector(".q").onclick = () => { fechar(); aoQuiz?.(); };
    f.querySelector(".r").onclick = () => { f.remove(); audio.currentTime = 0; audio.play(); };
    f.querySelector(".x").onclick = fechar;
    area.appendChild(f);
  });

  pp.onclick = () => { if (audio.paused) { area.querySelector(".avp-fim")?.remove(); audio.play(); } else audio.pause(); };
  velBtn.onclick = () => { vel = VELOCIDADES[(VELOCIDADES.indexOf(vel) + 1) % VELOCIDADES.length]; audio.playbackRate = vel; salvarVel(vel); velBtn.textContent = `${String(vel).replace(".", ",")}×`; };
  barra.addEventListener("input", () => { arrastando = true; const tot = audio.duration || palco?.total || 0; audio.currentTime = tot * barra.value / 1000; });
  barra.addEventListener("change", () => { arrastando = false; });
  area.addEventListener("click", e => { if (e.target === area || e.target.closest(".av-palco")) pp.click(); });

  const tecla = e => { if (e.key === "Escape") fechar(); else if (e.key === " " && e.target === document.body) { e.preventDefault(); pp.click(); } };
  const aoHash = () => fechar();
  addEventListener("keydown", tecla); addEventListener("resize", ajustar); addEventListener("hashchange", aoHash);
  if ("mediaSession" in navigator) { try { navigator.mediaSession.metadata = new MediaMetadata({ title: aula.titulo, artist: "Com Fé! · Curso de Teologia", artwork: [{ src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }] }); } catch { /* opcional */ } }
  ov.querySelector(".avp-fechar").onclick = fechar;
  raf = requestAnimationFrame(quadro);

  function fechar() {
    if (fechado) return; fechado = true;
    cancelAnimationFrame(raf); audio.pause(); audio.removeAttribute("src"); audio.load();
    removeEventListener("keydown", tecla); removeEventListener("resize", ajustar); removeEventListener("hashchange", aoHash);
    document.body.style.overflow = ""; ov.remove();
  }
  return fechar;
}

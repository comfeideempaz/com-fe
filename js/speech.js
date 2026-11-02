// Voz do aparelho (Web Speech API), grátis e offline na maioria dos celulares.
// Escolhe a voz pt-BR mais natural disponível. Um arquivo de áudio gravado,
// quando existir, tem prioridade (falar(texto, { audio: "img/..mp3" })).

let vozEscolhida = null;
let audioAtual = null;

export const temVoz = () => "speechSynthesis" in window;

function escolherVoz() {
  if (!temVoz()) return null;
  const vozes = speechSynthesis.getVoices();
  const br = vozes.filter(v => /pt[-_]BR/i.test(v.lang));
  const pt = br.length ? br : vozes.filter(v => /^pt/i.test(v.lang));
  // Vozes "naturais"/"neurais"/do Google costumam soar melhor.
  const nota = v => (/natural|neural|online/i.test(v.name) ? 3 : 0) + (/google/i.test(v.name) ? 2 : 0) + (v.localService ? 1 : 0);
  return pt.sort((a, b) => nota(b) - nota(a))[0] || null;
}

if (temVoz()) {
  vozEscolhida = escolherVoz();
  speechSynthesis.addEventListener?.("voiceschanged", () => { vozEscolhida = escolherVoz(); });
}

export function parar() {
  if (temVoz()) speechSynthesis.cancel();
  if (audioAtual) { audioAtual.pause(); audioAtual = null; }
}

export function falar(texto, { audio, velocidade = 0.95, aoTerminar } = {}) {
  parar();
  if (audio) {
    audioAtual = new Audio(audio);
    audioAtual.onended = () => aoTerminar?.();
    audioAtual.play().catch(() => falar(texto, { velocidade, aoTerminar }));
    return;
  }
  if (!temVoz()) return;
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "pt-BR";
  if (vozEscolhida) u.voice = vozEscolhida;
  u.rate = velocidade;
  u.onend = () => aoTerminar?.();
  speechSynthesis.speak(u);
}

export const falando = () => (temVoz() && speechSynthesis.speaking) || !!audioAtual;

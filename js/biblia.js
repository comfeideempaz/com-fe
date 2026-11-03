// Acesso à Bíblia do app (data/biblia/*.json) e às referências no padrão da CNBB.
// Uma referência pronta (gerada pelos scripts) tem a forma
// { livro: "joao", txt: "Jo 3,16-18", trechos: [[3, 16, 3, 18]] }.

import { carregar } from "./content.js";
import { esc } from "./ui.js";

export const livros = () => carregar("biblia/livros.json");

export async function livroInfo(id) {
  const { livros: lista } = await livros();
  return lista.find(l => l.id === id) || null;
}

export const livroTexto = id => carregar(`biblia/${id}.json`);

// Chave de capítulo usada no progresso: "joao.3".
export const chaveCap = (livro, cap) => `${livro}.${cap}`;

// Endereço do leitor para uma referência (abre no primeiro versículo).
export function linkRef(r) {
  const [c, v] = r.trechos[0];
  return v > 1 ? `#/biblia/${r.livro}/${c}/${v}` : `#/biblia/${r.livro}/${c}`;
}

// Links das referências: "Jo 3,16 · Rm 8,28"
export function refsHTML(lista = []) {
  if (!lista.length) return "";
  return `<span class="refs">${lista.map(r => `<a href="${linkRef(r)}" class="ref">${esc(r.txt)}</a>`).join("")}</span>`;
}

// Versículos de uma referência: [{ cap, v, t }]. Salmos já vêm na numeração do app.
// Versículos que a edição digital perdeu vêm com t = null.
export async function versiculosDe(r) {
  const [dados, info] = await Promise.all([livroTexto(r.livro), livroInfo(r.livro)]);
  const saida = [];
  for (const [c1, v1, c2, v2] of r.trechos) {
    for (let c = c1; c <= c2; c++) {
      const cap = dados.capitulos.find(x => x.n === c);
      const textos = new Map(cap ? cap.v : []);
      const total = info?.versiculos[c - 1] || 0;
      const fim = c < c2 ? total : Math.min(v2, total || v2);
      for (let n = c > c1 ? 1 : v1; n <= fim; n++) saida.push({ cap: c, v: n, t: textos.get(n) ?? null });
    }
  }
  return saida;
}

// HTML corrido de uma referência, com números de versículo.
export async function trechoHTML(r) {
  try {
    const vs = await versiculosDe(r);
    if (!vs.length) return `<p class="apoio">Texto indisponível nesta edição.</p>`;
    let capAtual = null;
    const faltam = vs.filter(x => x.t === null).length;
    return `<p class="texto-biblia">${vs.map(x => {
      const marca = x.cap !== capAtual && vs.length > 1 && r.trechos.some(t => t[0] !== t[2]) ? `<b class="cap-num">${x.cap}</b>` : "";
      capAtual = x.cap;
      return x.t === null ? `${marca}<sup>${x.v}</sup><span class="vers falta">[ausente nesta edição] </span>` : `${marca}<sup>${x.v}</sup>${esc(x.t)} `;
    }).join("")}</p>${faltam ? `<p class="aviso-texto">${faltam === 1 ? "Um versículo deste trecho falta" : `${faltam} versículos deste trecho faltam`} na edição digital de Figueiredo. Leia o texto completo na sua Bíblia ou na <a href="https://www.cnbb.org.br/liturgia-diaria/" target="_blank" rel="noopener">liturgia da CNBB</a>.</p>` : ""}`;
  } catch {
    return `<p class="apoio">Não consegui abrir o texto agora.</p>`;
  }
}

// Minutos estimados de leitura (≈ 180 palavras por minuto).
export function minutosLeitura(versos) {
  const palavras = versos.reduce((s, [, t]) => s + t.split(/\s+/).length, 0);
  return Math.max(1, Math.round(palavras / 180));
}

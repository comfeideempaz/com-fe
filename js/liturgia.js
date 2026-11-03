// Calendário litúrgico já calculado (data/calendario/AAAA.json), leituras e dicas do dia.

import { carregar } from "./content.js";

export const ANOS = [2026, 2027, 2028, 2029, 2030];

// Cor de tela para cada cor litúrgica (a faixa e os detalhes do app usam --liturgia).
export const COR_HEX = { verde: "#2E7D4F", roxo: "#6A3D9A", branco: "#C9A227", vermelho: "#B3261E", rosa: "#D46A9A", preto: "#333333" };
export const COR_NOME = { verde: "Verde", roxo: "Roxo", branco: "Branco", vermelho: "Vermelho", rosa: "Rosa", preto: "Preto" };

export async function dia(iso) {
  const ano = +iso.slice(0, 4);
  if (!ANOS.includes(ano)) return null;
  const cal = await carregar(`calendario/${ano}.json`);
  const d = cal.dias[iso];
  return d ? { ...d, data: iso } : null;
}

export async function mes(ano, m) {
  if (!ANOS.includes(ano)) return null;
  const cal = await carregar(`calendario/${ano}.json`);
  const prefixo = `${ano}-${String(m).padStart(2, "0")}-`;
  return Object.entries(cal.dias).filter(([k]) => k.startsWith(prefixo)).map(([k, v]) => ({ ...v, data: k }));
}

export async function leiturasDe(d) {
  const { leituras, aviso } = await carregar("leituras.json");
  return { lt: leituras[d.chave] || null, aviso };
}

export async function dicasDe(d) {
  if (!d.dicas?.length) return [];
  const todas = await carregar("dicas.json");
  return d.dicas.map(id => ({ id, ...todas[id] })).filter(x => x.titulo);
}

export const explicacoes = () => carregar("liturgia.json");

// Pinta o app com a cor litúrgica do dia.
export function aplicarCor(cor) {
  document.documentElement.style.setProperty("--liturgia", COR_HEX[cor] || COR_HEX.verde);
}

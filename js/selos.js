// Selos do caminho: confere as condições de data/selos.json com o progresso
// guardado no aparelho e entrega os novos (com um aviso discreto).

import { carregar } from "./content.js";
import { getState, ganharSelo, sequenciaAtual } from "./store.js";
import { livros, chaveCap } from "./biblia.js";
import { toast } from "./ui.js";

export const definicoes = () => carregar("selos.json");

async function contexto() {
  const [{ livros: lista }, missa] = await Promise.all([livros(), carregar("missa.json")]);
  return { lista, partesMissa: missa.ritos.flatMap(r => r.partes.map(p => p.id)) };
}

function livroCompleto(st, l) {
  for (let c = 1; c <= l.capitulos; c++) if (!st.lidos[chaveCap(l.id, c)]) return false;
  return true;
}

export function cumpre(cond, st, ctx) {
  const v = cond.valor;
  switch (cond.tipo) {
    case "atividades": return st.atividades.length >= v || Object.keys(st.lidos).length >= v;
    case "sequencia": return Math.max(st.sequencia.recorde, sequenciaAtual()) >= v;
    case "capitulos": return Object.keys(st.lidos).length >= v;
    case "livros": return v.every(id => { const l = ctx.lista.find(x => x.id === id); return l && livroCompleto(st, l); });
    case "testamento": return ctx.lista.filter(l => v === "todos" || l.testamento === v).every(l => livroCompleto(st, l));
    case "planos": return Object.values(st.planos).filter(p => p.concluido).length >= v;
    case "evangelhos": return (st.flags.evangelhos || []).length >= v;
    case "missa": return ctx.partesMissa.every(id => st.missaVista.includes(id));
    case "santos": return st.santosVistos.length >= v;
    case "oracao": return v === "terco" ? !!st.flags.terco : false;
    case "flag": return !!st.flags[v];
    case "defesa": return (st.flags.defesa || []).length >= v;
    default: return false;
  }
}

let ocupado = false;
export async function verificar() {
  if (ocupado) return;
  ocupado = true;
  try {
    const [{ selos }, ctx] = await Promise.all([definicoes(), contexto()]);
    const st = getState();
    const novos = selos.filter(s => !st.selos[s.id] && cumpre(s.condicao, st, ctx));
    for (const s of novos) ganharSelo(s.id);
    if (novos.length) toast(`Novo selo: ${novos[novos.length - 1].nome}`);
  } catch (e) { console.error(e); } finally { ocupado = false; }
}

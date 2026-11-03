// Catecismo da Igreja Católica (CIC): o app não copia o texto (direitos reservados),
// mas transforma cada citação "CIC 1234" em link para a página oficial do Vaticano
// (em português) que contém aquele número.

import { esc } from "./ui.js";

const BASE = "https://www.vatican.va/archive/cathechism_po/index_new/";

// Páginas do CIC no site do Vaticano: [primeiro número, último número, arquivo].
const PAGINAS = [
  [1, 25, "prologo%201-25_po.html"],
  [26, 49, "p1s1c1_26-49_po.html"],
  [50, 141, "p1s1c2_50-141_po.html"],
  [142, 184, "p1s1c3_142-184_po.html"],
  [185, 197, "p1s2_185-197_po.html"],
  [198, 421, "p1s2c1_198-421_po.html"],
  [422, 682, "p1s2cap2_422-682_po.html"],
  [683, 1065, "p1s2cap3_683-1065_po.html"],
  [1066, 1075, "p2s1cap1_1066-1075_po.html"],
  [1076, 1134, "p2s1cap1_1076-1134_po.html"],
  [1135, 1209, "p2s1cap2_1135-1209_po.html"],
  [1210, 1419, "p2s2cap1_1210-1419_po.html"],
  [1420, 1532, "p2s2cap1_1420-1532_po.html"],
  [1533, 1666, "p2s2cap3_1533-1666_po.html"],
  [1667, 1690, "p2s2cap4_1667-1690_po.html"],
  [1691, 1698, "p3-intr_1691-1698_po.html"],
  [1699, 1876, "p3s1cap1_1699-1876_po.html"],
  [1877, 1948, "p3s1cap2_1877-1948_po.html"],
  [1949, 2051, "p3s1cap3_1949-2051_po.html"],
  [2052, 2082, "p3s2-intr_2052-2082_po.html"],
  [2083, 2195, "p3s2cap1_2083-2195_po.html"],
  [2196, 2557, "p3s2cap2_2196-2557_po.html"],
  [2558, 2565, "p4-intr_2558-2565_po.html"],
  [2566, 2649, "p4s1cap1_2566-2649_po.html"],
  [2650, 2696, "p4s1cap2_2650-2696_po.html"],
  [2697, 2758, "p4s1cap3_2697-2758_po.html"],
  [2759, 2865, "p4s2_2759-2865_po.html"],
];

export const CIC_INDICE = BASE + "prima-pagina-cic_po.html";

// Endereço oficial da página que contém o número n do Catecismo.
export function urlCIC(n) {
  const p = PAGINAS.find(([a, b]) => n >= a && n <= b);
  return p ? BASE + p[2] : CIC_INDICE;
}

// Link para "2705-2708" ou "1177".
export function linkCIC(numeros, rotulo = `CIC ${numeros}`) {
  const n = parseInt(numeros, 10);
  return `<a class="cic" href="${urlCIC(n)}" target="_blank" rel="noopener" title="Abrir o Catecismo no site do Vaticano">${esc(rotulo)}</a>`;
}

// Texto de fonte com as citações "CIC 123" ou "CIC 123-125" viradas em link.
// Recebe texto puro; devolve HTML já escapado.
export function fonteHTML(texto) {
  return esc(texto).replace(/\b(CIC|Catecismo da Igreja Católica) (\d{1,4}(?:[-–]\d{1,4})?)/g, (_, nome, nums) => linkCIC(nums, `${nome} ${nums}`));
}

export const fontesHTML = (lista = []) => lista.map(fonteHTML).join("; ");

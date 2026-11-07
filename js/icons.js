// Ícones SVG de traço desenhados no próprio código (sem biblioteca).
// Uso: ic("livro") devolve o <svg> pronto, com stroke="currentColor".

const P = {
  casa: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  livro: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M12 6.5v6M9 9h6"/>',
  planos: '<rect x="4" y="4" width="16" height="17" rx="3"/><path d="M8 2.5v3M16 2.5v3M4 9h16"/><path d="m8.5 14.5 2 2 4.5-4.5"/>',
  calendario: '<rect x="3.5" y="4.5" width="17" height="16" rx="3"/><path d="M8 2.5v4M16 2.5v4M3.5 10h17"/><circle cx="12" cy="15" r="2"/>',
  mais: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>',
  santo: '<ellipse cx="12" cy="4" rx="4" ry="1.4"/><circle cx="12" cy="9.5" r="3.2"/><path d="M5.5 21c.6-4.2 3.2-6.5 6.5-6.5s5.9 2.3 6.5 6.5"/>',
  calice: '<path d="M7 3h10c0 5-2.2 8-5 8s-5-3-5-8z"/><path d="M12 11v6"/><path d="M8 21h8M9.5 17h5"/>',
  maos: '<path d="M12 21V9.5c0-1.6-.8-3.3-2-4.5L8.5 3.5 6 9l-1.5 6 4 6"/><path d="M12 21V9.5c0-1.6.8-3.3 2-4.5l1.5-1.5L18 9l1.5 6-4 6"/>',
  progresso: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  chama: '<path d="M12 22c4 0 7-2.7 7-6.8 0-3.6-2.5-5.8-4-8.7-.7 1.8-1.7 3-3 3.5.3-3.2-1-6.2-3-8-.4 3.6-4 6.3-4 11.2C5 19.3 8 22 12 22z"/><path d="M12 22c-1.7 0-3-1.2-3-3 0-1.9 1.6-3 3-5 1.4 2 3 3.1 3 5 0 1.8-1.3 3-3 3z"/>',
  alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  selo: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14 -1.5 8 5-3 5 3-1.5-8"/>',
  cruz: '<path d="M12 2.5v19M7 8h10"/>',
  volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  seta: '<path d="M9 5l7 7-7 7"/>',
  voltar: '<path d="M15 5l-7 7 7 7"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  lua: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  baixar: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  escudo: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="M12 8v8M9 11h6"/>',
  vela: '<path d="M10 10h4v11h-4z"/><path d="M12 3.5c1.3 1.5 1.8 2.6 1.8 3.5a1.8 1.8 0 0 1-3.6 0c0-.9.5-2 1.8-3.5z"/><path d="M8 21h8"/>',
  terco: '<circle cx="12" cy="2.6" r="1.1"/><circle cx="7.4" cy="4" r="1.1"/><circle cx="16.6" cy="4" r="1.1"/><circle cx="4.4" cy="7.6" r="1.1"/><circle cx="19.6" cy="7.6" r="1.1"/><circle cx="5.6" cy="11.8" r="1.1"/><circle cx="18.4" cy="11.8" r="1.1"/><path d="M6.7 12.8 12 14.6l5.3-1.8"/><circle cx="12" cy="14.6" r="1.4"/><path d="M12 16v6M9.6 18.4h4.8"/>',
  carta: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  cadeado: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2.5"/>',
  olho: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  "olho-fechado": '<path d="M3 3l18 18"/><path d="M10.6 6A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.8 3.6M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.3-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  porta: '<path d="M14 3.5H6.5v17H14"/><path d="M10.5 12H21M17.5 8.5 21 12l-3.5 3.5"/>',
  coracao: '<path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/>',
  reiniciar: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 3.5v5h5"/>',
  estrela: '<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  pena: '<path d="M20 4c-6 0-11.5 4.5-13 12l-2 4"/><path d="M20 4c0 6-4 11-11 12"/><path d="M9.5 12.5 13 9"/>',
  subir: '<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14"/>',
};

export function ic(nome, extra = "") {
  const d = P[nome] || P.info;
  return `<svg class="ic ${extra}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
}

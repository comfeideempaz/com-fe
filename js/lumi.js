// Lumi, a ovelhinha do Catequizando (lembra o Bom Pastor, Jo 10,11).
// Desenhada em SVG no código. O lenço usa a cor litúrgica do dia (--liturgia).
// lumi({ tamanho, humor }) devolve o SVG; humor: "feliz" | "piscando" | "pensando".

export function lumi({ tamanho = 120, humor = "feliz", rotulo = "Lumi, a ovelhinha" } = {}) {
  const olhos = humor === "piscando"
    ? `<path d="M48 63q4 3 8 0M64 63q4 3 8 0" stroke="#2B2440" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : `<circle cx="52" cy="62" r="4.2" fill="#2B2440"/><circle cx="68" cy="62" r="4.2" fill="#2B2440"/>
       <circle cx="53.4" cy="60.6" r="1.4" fill="#fff"/><circle cx="69.4" cy="60.6" r="1.4" fill="#fff"/>`;
  const boca = humor === "pensando"
    ? `<path d="M56 75h8" stroke="#2B2440" stroke-width="2.4" stroke-linecap="round"/>`
    : `<path d="M55 73q5 5 10 0" stroke="#2B2440" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  return `<svg class="lumi" viewBox="0 0 120 120" width="${tamanho}" height="${tamanho}" role="img" aria-label="${rotulo}">
    <g class="lumi-corpo">
      <rect x="40" y="96" width="8" height="16" rx="4" fill="#3A3354"/>
      <rect x="72" y="96" width="8" height="16" rx="4" fill="#3A3354"/>
      <g fill="#FFFDF6" stroke="#E5DCCB" stroke-width="2">
        <circle cx="34" cy="80" r="16"/><circle cx="86" cy="80" r="16"/>
        <circle cx="46" cy="94" r="15"/><circle cx="74" cy="94" r="15"/>
        <circle cx="60" cy="98" r="14"/>
      </g>
    </g>
    <g class="lumi-cabeca">
      <ellipse cx="34" cy="58" rx="10" ry="6" transform="rotate(-25 34 58)" fill="#3A3354"/>
      <ellipse cx="86" cy="58" rx="10" ry="6" transform="rotate(25 86 58)" fill="#3A3354"/>
      <ellipse cx="60" cy="66" rx="22" ry="21" fill="#F4E7DA"/>
      <g fill="#FFFDF6" stroke="#E5DCCB" stroke-width="2">
        <circle cx="46" cy="44" r="10"/><circle cx="60" cy="38" r="11"/><circle cx="74" cy="44" r="10"/>
      </g>
      ${olhos}
      <circle cx="45" cy="70" r="4" fill="#F2A7A7" opacity=".7"/><circle cx="75" cy="70" r="4" fill="#F2A7A7" opacity=".7"/>
      ${boca}
    </g>
    <path class="lumi-lenco" d="M40 84q20 10 40 0l-3 8q-17 7-34 0z" fill="var(--liturgia, #2E7D4F)"/>
    <path class="lumi-lenco" d="M66 89l8 14-11-4z" fill="var(--liturgia, #2E7D4F)"/>
  </svg>`;
}

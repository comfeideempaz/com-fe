// Gera os ícones do app (PWA, apple-touch, favicon) a partir do desenho da Lumi em js/lumi.js.
// Uso (na raiz do projeto): node tools/make_icons.mjs
// Precisa do Playwright com Chromium instalado só na máquina de quem gera; o app não depende disso.

import { createRequire } from "node:module";
import { lumi } from "../js/lumi.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pasta = path.join(raiz, "icons");

// cantos: raio do fundo (0 = quadrado inteiro, para maskable); escala: tamanho da Lumi.
const ALVOS = [
  ...[72, 96, 128, 144, 152, 192, 384, 512].map(t => ({ nome: `icon-${t}.png`, t, cantos: 0.22, escala: 0.78 })),
  { nome: "maskable-512.png", t: 512, cantos: 0, escala: 0.6 },
  { nome: "apple-touch-icon.png", t: 180, cantos: 0, escala: 0.74 },
  { nome: "favicon.png", t: 64, cantos: 0.22, escala: 0.86 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const a of ALVOS) {
  await page.setViewportSize({ width: a.t, height: a.t });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">
    <div style="--liturgia:#C9A227;width:${a.t}px;height:${a.t}px;border-radius:${a.cantos * 100}%;
      background:radial-gradient(circle at 50% 35%, #3A5FC8 0%, #1F3A93 55%, #142A6E 100%);
      display:grid;place-content:center;overflow:hidden">
      ${lumi({ tamanho: Math.round(a.t * a.escala), rotulo: "" })}
    </div></body></html>`);
  await page.screenshot({ path: path.join(pasta, a.nome), omitBackground: true });
  console.log("ok", a.nome);
}
await browser.close();
console.log(`${ALVOS.length} ícones gerados em icons/`);

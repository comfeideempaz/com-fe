// Versão em Node do montar.py, para rodar no PC (sem Python).
// Junta roteiros + narração (um .mp3 e um .json de palavras por cena) e gera, por aula:
//   <app>/data/curso/video/<chave>.json   (cenas, tempos e legenda palavra por palavra)
//   <app>/audio/curso/<chave>.mp3         (áudio leve para o app, 48 kbps mono)
//   <hq>/<chave>.m4a                      (áudio melhor, para os MP4)
// Uso: node montar-pc.mjs --ffmpeg CAMINHO --roteiros PASTA --narr PASTA --app PASTA --hq PASTA [chave ...]
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";

const arg = n => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : null; };
const FF = arg("ffmpeg"), ROT = arg("roteiros"), NARR = arg("narr"), APP = arg("app"), HQ = arg("hq");
const chavesArg = process.argv.slice(2).filter((a, i, v) => !a.startsWith("--") && !(v[i - 1] || "").startsWith("--"));
const LEAD = .15, GAP = .55, FIM = 2.2;
const r3 = x => Math.round(x * 1000) / 1000;
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

function duracao(f) {
  const r = spawnSync(FF, ["-hide_banner", "-i", f], { encoding: "utf8" });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr || "");
  if (!m) throw new Error("sem duração: " + f);
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
}
function falsos(fala, total) {
  const toks = fala.split(/\s+/).filter(Boolean); const tot = toks.reduce((s, t) => s + t.length + 1, 0); let t = 0; const b = [];
  for (const tk of toks) { b.push([t * total / tot, 0, tk.replace(/[^\p{L}\p{N}-]/gu, "")]); t += tk.length + 1; }
  return b;
}
function alinhar(fala, bnd, total) {
  const toks = fala.split(/\s+/).filter(Boolean); const out = []; let j = 0;
  const B = bnd.map(([o, , w]) => [o, norm(w)]).filter(x => x[1]);
  for (const tk of toks) {
    const n = norm(tk); let t = null;
    if (n) {
      for (let k = j; k < Math.min(j + 4, B.length); k++) {
        const w = B[k][1];
        if (w && (n.startsWith(w) || w.startsWith(n) || n.includes(w))) {
          t = B[k][0]; j = k + 1;
          let resto = n.startsWith(w) ? n.slice(w.length) : "";
          while (resto && j < B.length && B[j][1] && resto.startsWith(B[j][1])) { resto = resto.slice(B[j][1].length); j++; }
          break;
        }
      }
    }
    out.push([t, tk]);
  }
  out.forEach((x, i) => {
    if (x[0] !== null) return;
    let prev = 0, nxt = total;
    for (let k = i - 1; k >= 0; k--) if (out[k][0] !== null) { prev = out[k][0]; break; }
    for (let k = i + 1; k < out.length; k++) if (out[k][0] !== null) { nxt = out[k][0]; break; }
    x[0] = i ? prev + (nxt - prev) * .5 : prev;
  });
  for (let i = 1; i < out.length; i++) out[i][0] = Math.max(out[i][0], out[i - 1][0]);
  return out;
}
function tempoEm(tokens, fala, pos) {
  const toks = fala.split(/\s+/).filter(Boolean); let acc = 0;
  for (let i = 0; i < toks.length; i++) { acc = fala.indexOf(toks[i], acc); if (acc >= pos) return tokens[i][0]; acc += toks[i].length; }
  return tokens.length ? tokens[tokens.length - 1][0] : 0;
}

function montar(chave) {
  const rot = JSON.parse(fs.readFileSync(path.join(ROT, chave + ".json"), "utf8"));
  let t = 0; const cenas = [], partes = [];
  rot.cenas.forEach((c, i) => {
    const fala = c.fala;
    const mp3 = path.join(NARR, chave, c.id + ".mp3");
    const d = duracao(mp3);
    let bnd = JSON.parse(fs.readFileSync(path.join(NARR, chave, c.id + ".json"), "utf8"));
    if (!bnd.length) bnd = falsos(fala, d);
    const ini = t + LEAD; const toks = alinhar(fala, bnd, d);
    const ultima = i === rot.cenas.length - 1; const fim = ini + d + (ultima ? FIM : GAP);
    const cc = { ...c }; delete cc.fala;
    cc.a = r3(t); cc.b = r3(fim); cc.tok = toks.map(([x, w]) => [r3(ini + x), w]);
    if (c.tipo === "ponto") {
      cc.destaques = (c.destaques || []).map(dst => { const k = fala.toLowerCase().indexOf(dst.txt.toLowerCase().slice(0, 25)); return { txt: dst.txt, t: r3(tempoEm(cc.tok, fala, k >= 0 ? k : dst.pos)) }; });
      cc.refs = (c.refs || []).map(r => ({ txt: r.txt, t: r3(tempoEm(cc.tok, fala, Math.max(0, r.pos - 2))) }));
    }
    if (c.tipo === "palavras") cc.palavras = c.palavras.map(p => ({ ...p, t: r3(tempoEm(cc.tok, fala, Math.max(fala.indexOf("A palavra " + p.termo), 0))) }));
    if (c.tipo === "biblia") cc.refs = c.refs.map(r => ({ txt: r }));
    cenas.push(cc); partes.push([mp3, d, fim - t]); t = fim;
  });
  const { cenas: _, ...resto } = rot;
  const saida = { ...resto, total: r3(t), cenas };
  fs.mkdirSync(path.join(APP, "data/curso/video"), { recursive: true });
  fs.writeFileSync(path.join(APP, "data/curso/video", chave + ".json"), JSON.stringify(saida));
  // áudio
  fs.mkdirSync(path.join(APP, "audio/curso"), { recursive: true }); fs.mkdirSync(HQ, { recursive: true });
  const ins = [], flt = [];
  partes.forEach(([mp3, d, tot], k) => {
    ins.push("-i", mp3);
    flt.push(`[${k}:a]aresample=24000,aformat=channel_layouts=mono,adelay=${Math.round(LEAD * 1000)}:all=1,apad=whole_dur=${tot.toFixed(3)},atrim=0:${tot.toFixed(3)}[a${k}]`);
  });
  flt.push(partes.map((_, k) => `[a${k}]`).join("") + `concat=n=${partes.length}:v=0:a=1[o]`);
  const hq = path.join(HQ, chave + ".m4a");
  let r = spawnSync(FF, ["-y", "-v", "error", ...ins, "-filter_complex", flt.join(";"), "-map", "[o]", "-c:a", "aac", "-b:a", "128k", hq], { encoding: "utf8" });
  if (r.status) throw new Error("ffmpeg hq: " + r.stderr);
  r = spawnSync(FF, ["-y", "-v", "error", "-i", hq, "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "48k", path.join(APP, "audio/curso", chave + ".mp3")], { encoding: "utf8" });
  if (r.status) throw new Error("ffmpeg mp3: " + r.stderr);
  return saida.total;
}

const chaves = chavesArg.length ? chavesArg : fs.readdirSync(ROT).filter(f => f.endsWith(".json")).map(f => f.slice(0, -5)).sort();
let erros = 0;
for (const ch of chaves) {
  try { console.log(ch, montar(ch).toFixed(1), "s"); } catch (e) { erros++; console.log(ch, "ERRO", e.message); }
}
console.log("AULAS:", chaves.length, "ERROS:", erros);

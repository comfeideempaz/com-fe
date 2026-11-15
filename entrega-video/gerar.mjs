// Gera a narração de todas as aulas do Curso de Teologia (voz pt-BR-FranciscaNeural, -15%)
// com as marcas de tempo de cada palavra (para a legenda acompanhar a fala).
// Uso: node gerar.mjs tts.json pasta-de-saida
import fs from "node:fs"; import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
const [, , entrada, saida] = process.argv;
const itens = JSON.parse(fs.readFileSync(entrada, "utf8"));
const VOZ = "pt-BR-FranciscaNeural", RATE = "-15%";
async function um(item) {
  const mp3 = path.join(saida, item.a + ".mp3"), js = path.join(saida, item.a + ".json");
  if (fs.existsSync(mp3) && fs.existsSync(js) && fs.statSync(mp3).size > 1000) return "ok(já)";
  fs.mkdirSync(path.dirname(mp3), { recursive: true });
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOZ, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });
  const { audioStream, metadataStream } = tts.toStream(item.t, { rate: RATE });
  const partes = [], palavras = [];
  metadataStream?.on("data", (b) => {
    try { for (const m of JSON.parse(b.toString()).Metadata || []) if (m.Type === "WordBoundary") palavras.push([m.Data.Offset / 1e7, m.Data.Duration / 1e7, m.Data.text?.Text ?? ""]); } catch (e) { }
  });
  await new Promise((ok, erro) => { audioStream.on("data", (d) => partes.push(d)); audioStream.on("end", ok); audioStream.on("close", ok); audioStream.on("error", erro); });
  await new Promise((r) => setTimeout(r, 300));
  tts.close?.();
  const buf = Buffer.concat(partes);
  if (buf.length < 1000) throw new Error("áudio vazio");
  fs.writeFileSync(mp3, buf); fs.writeFileSync(js, JSON.stringify(palavras));
  return `${(buf.length / 1024).toFixed(0)} KB, ${palavras.length} palavras`;
}
let i = 0, falhas = [];
for (const item of itens) {
  i++;
  for (let tent = 1; tent <= 4; tent++) {
    try { const r = await um(item); console.log(`${i}/${itens.length} ${item.a}: ${r}`); break; }
    catch (e) { console.log(`${i}/${itens.length} ${item.a}: erro ${e.message} (tentativa ${tent})`); if (tent === 4) falhas.push(item.a); await new Promise((r) => setTimeout(r, 2000 * tent)); }
  }
}
console.log("FALHAS:", falhas.length, falhas.join(", "));

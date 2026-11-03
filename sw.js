// Service worker do Com Fé!. GERADO por tools/make_sw.py: não edite à mão.
const VERSAO = "1.2.0-5d7dbae731";
const CACHE = "comfe-" + VERSAO;
const ESSENCIAIS = ["./", "manifest.json", "css/app.css", "js/app.js", "js/biblia.js", "js/catecismo.js", "js/config.js", "js/content.js", "js/icons.js", "js/liturgia.js", "js/lumi.js", "js/selos.js", "js/speech.js", "js/store.js", "js/ui.js", "js/views/biblia.js", "js/views/defesa.js", "js/views/inicio.js", "js/views/lectio.js", "js/views/liturgia.js", "js/views/mais.js", "js/views/missa.js", "js/views/nao-encontrada.js", "js/views/oracoes.js", "js/views/planos.js", "js/views/progresso.js", "js/views/sacramentos.js", "js/views/santos.js", "js/views/sobre.js", "icons/apple-touch-icon.png", "icons/favicon.png", "icons/icon-128.png", "icons/icon-144.png", "icons/icon-152.png", "icons/icon-192.png", "icons/icon-384.png", "icons/icon-512.png", "icons/icon-72.png", "icons/icon-96.png", "icons/maskable-512.png", "data/defesa.json", "data/dicas.json", "data/lectio.json", "data/leituras.json", "data/liturgia.json", "data/missa.json", "data/oracoes.json", "data/planos.json", "data/sacramentos.json", "data/selos.json", "data/calendario/2026.json", "data/calendario/2027.json", "data/calendario/2028.json", "data/calendario/2029.json", "data/calendario/2030.json", "data/biblia/livros.json", "data/santos/indice.json", "index.html"];
const EXTRAS = ["data/biblia/1-corintios.json", "data/biblia/1-cronicas.json", "data/biblia/1-joao.json", "data/biblia/1-macabeus.json", "data/biblia/1-pedro.json", "data/biblia/1-reis.json", "data/biblia/1-samuel.json", "data/biblia/1-tessalonicenses.json", "data/biblia/1-timoteo.json", "data/biblia/2-corintios.json", "data/biblia/2-cronicas.json", "data/biblia/2-joao.json", "data/biblia/2-macabeus.json", "data/biblia/2-pedro.json", "data/biblia/2-reis.json", "data/biblia/2-samuel.json", "data/biblia/2-tessalonicenses.json", "data/biblia/2-timoteo.json", "data/biblia/3-joao.json", "data/biblia/abdias.json", "data/biblia/ageu.json", "data/biblia/amos.json", "data/biblia/apocalipse.json", "data/biblia/atos.json", "data/biblia/baruc.json", "data/biblia/cantico.json", "data/biblia/colossenses.json", "data/biblia/daniel.json", "data/biblia/deuteronomio.json", "data/biblia/eclesiastes.json", "data/biblia/eclesiastico.json", "data/biblia/efesios.json", "data/biblia/esdras.json", "data/biblia/ester.json", "data/biblia/exodo.json", "data/biblia/ezequiel.json", "data/biblia/filemom.json", "data/biblia/filipenses.json", "data/biblia/galatas.json", "data/biblia/genesis.json", "data/biblia/habacuc.json", "data/biblia/hebreus.json", "data/biblia/isaias.json", "data/biblia/jeremias.json", "data/biblia/jo.json", "data/biblia/joao.json", "data/biblia/joel.json", "data/biblia/jonas.json", "data/biblia/josue.json", "data/biblia/judas.json", "data/biblia/judite.json", "data/biblia/juizes.json", "data/biblia/lamentacoes.json", "data/biblia/levitico.json", "data/biblia/lucas.json", "data/biblia/malaquias.json", "data/biblia/marcos.json", "data/biblia/mateus.json", "data/biblia/miqueias.json", "data/biblia/naum.json", "data/biblia/neemias.json", "data/biblia/numeros.json", "data/biblia/oseias.json", "data/biblia/proverbios.json", "data/biblia/romanos.json", "data/biblia/rute.json", "data/biblia/sabedoria.json", "data/biblia/salmos.json", "data/biblia/sofonias.json", "data/biblia/tiago.json", "data/biblia/tito.json", "data/biblia/tobias.json", "data/biblia/zacarias.json", "data/santos/agostinho.json", "data/santos/antonio-de-padua.json", "data/santos/aparecida.json", "data/santos/arcanjos.json", "data/santos/benedito.json", "data/santos/bento.json", "data/santos/bras.json", "data/santos/catarina-de-sena.json", "data/santos/cecilia.json", "data/santos/clara.json", "data/santos/cosme-e-damiao.json", "data/santos/dulce-dos-pobres.json", "data/santos/estevao.json", "data/santos/faustina.json", "data/santos/filipe-neri.json", "data/santos/francisco-de-assis.json", "data/santos/francisco-de-sales.json", "data/santos/francisco-xavier.json", "data/santos/frei-galvao.json", "data/santos/inacio-de-loyola.json", "data/santos/ines.json", "data/santos/joao-batista-nascimento.json", "data/santos/joao-bosco.json", "data/santos/joao-maria-vianney.json", "data/santos/joao-paulo-ii.json", "data/santos/joaquim-e-ana.json", "data/santos/jorge.json", "data/santos/jose-de-anchieta.json", "data/santos/josefina-bakhita.json", "data/santos/lourenco.json", "data/santos/luis-gonzaga.json", "data/santos/luzia.json", "data/santos/maria-goretti.json", "data/santos/maria-madalena.json", "data/santos/maximiliano-kolbe.json", "data/santos/monica.json", "data/santos/nicolau.json", "data/santos/patricio.json", "data/santos/paulina.json", "data/santos/pedro-e-paulo.json", "data/santos/perpetua-e-felicidade.json", "data/santos/pio-de-pietrelcina.json", "data/santos/policarpo.json", "data/santos/rita-de-cassia.json", "data/santos/sao-jose.json", "data/santos/sebastiao.json", "data/santos/simao-e-judas.json", "data/santos/teresa-de-avila.json", "data/santos/teresinha.json", "data/santos/tiago-maior.json", "data/santos/tomas-de-aquino.json", "data/santos/tome.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ESSENCIAIS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => (n.startsWith("comfe-") || n.startsWith("catequizando-")) && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
  // Em segundo plano: o resto do conteúdo, para o app inteiro funcionar offline.
  baixarExtras();
});

async function baixarExtras() {
  const c = await caches.open(CACHE);
  for (const url of EXTRAS) {
    try { if (!(await c.match(url))) { const r = await fetch(url); if (r.ok) await c.put(url, r); } } catch { /* sem rede: tenta de novo na próxima vez */ }
  }
}

self.addEventListener("message", e => { if (e.data === "baixar-tudo") e.waitUntil(baixarExtras()); });

function comLimite(promessa, ms) {
  return new Promise((ok, falha) => { const t = setTimeout(() => falha(new Error("tempo")), ms); promessa.then(r => { clearTimeout(t); ok(r); }, err => { clearTimeout(t); falha(err); }); });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(CACHE).then(async c => {
      const salvo = await c.match(req);
      const rede = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => salvo);
      return salvo || rede;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  const conteudo = url.pathname.includes("/data/") || url.pathname.includes("/icons/");
  if (conteudo) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const salvo = await c.match(req, { ignoreSearch: true });
      if (salvo) return salvo;
      const r = await fetch(req);
      if (r.ok) c.put(req, r.clone());
      return r;
    }));
    return;
  }
  // App: rede primeiro (4 s), depois cache.
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const r = await comLimite(fetch(req), 4000);
      if (r.ok) c.put(req, r.clone());
      return r;
    } catch {
      return (await c.match(req, { ignoreSearch: true })) || (req.mode === "navigate" ? c.match("index.html") : Response.error());
    }
  })());
});

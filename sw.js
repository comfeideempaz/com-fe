// Service worker do Com Fé!. GERADO por tools/make_sw.py: não edite à mão.
const VERSAO = "1.4.0-f377b10297";
const CACHE = "comfe-" + VERSAO;
const ESSENCIAIS = ["./", "manifest.json", "css/app.css", "js/app.js", "js/biblia.js", "js/catecismo.js", "js/config.js", "js/conta.js", "js/content.js", "js/fotos.js", "js/icons.js", "js/liturgia.js", "js/lumi.js", "js/nuvem.js", "js/selos.js", "js/speech.js", "js/store.js", "js/ui.js", "js/views/biblia.js", "js/views/defesa.js", "js/views/entrar.js", "js/views/inicio.js", "js/views/lectio.js", "js/views/liturgia.js", "js/views/mais.js", "js/views/missa.js", "js/views/nao-encontrada.js", "js/views/oracoes.js", "js/views/planos.js", "js/views/progresso.js", "js/views/sacramentos.js", "js/views/santos.js", "js/views/sobre.js", "js/views/terco.js", "icons/apple-touch-icon.png", "icons/favicon.png", "icons/icon-128.png", "icons/icon-144.png", "icons/icon-152.png", "icons/icon-192.png", "icons/icon-384.png", "icons/icon-512.png", "icons/icon-72.png", "icons/icon-96.png", "icons/maskable-512.png", "data/defesa.json", "data/dicas.json", "data/lectio.json", "data/leituras.json", "data/liturgia.json", "data/missa.json", "data/oracoes.json", "data/planos.json", "data/sacramentos.json", "data/selos.json", "data/calendario/2026.json", "data/calendario/2027.json", "data/calendario/2028.json", "data/calendario/2029.json", "data/calendario/2030.json", "data/biblia/livros.json", "data/santos/indice.json", "index.html"];
const EXTRAS = ["data/biblia/1-corintios.json", "data/biblia/1-cronicas.json", "data/biblia/1-joao.json", "data/biblia/1-macabeus.json", "data/biblia/1-pedro.json", "data/biblia/1-reis.json", "data/biblia/1-samuel.json", "data/biblia/1-tessalonicenses.json", "data/biblia/1-timoteo.json", "data/biblia/2-corintios.json", "data/biblia/2-cronicas.json", "data/biblia/2-joao.json", "data/biblia/2-macabeus.json", "data/biblia/2-pedro.json", "data/biblia/2-reis.json", "data/biblia/2-samuel.json", "data/biblia/2-tessalonicenses.json", "data/biblia/2-timoteo.json", "data/biblia/3-joao.json", "data/biblia/abdias.json", "data/biblia/ageu.json", "data/biblia/amos.json", "data/biblia/apocalipse.json", "data/biblia/atos.json", "data/biblia/baruc.json", "data/biblia/cantico.json", "data/biblia/colossenses.json", "data/biblia/daniel.json", "data/biblia/deuteronomio.json", "data/biblia/eclesiastes.json", "data/biblia/eclesiastico.json", "data/biblia/efesios.json", "data/biblia/esdras.json", "data/biblia/ester.json", "data/biblia/exodo.json", "data/biblia/ezequiel.json", "data/biblia/filemom.json", "data/biblia/filipenses.json", "data/biblia/galatas.json", "data/biblia/genesis.json", "data/biblia/habacuc.json", "data/biblia/hebreus.json", "data/biblia/isaias.json", "data/biblia/jeremias.json", "data/biblia/jo.json", "data/biblia/joao.json", "data/biblia/joel.json", "data/biblia/jonas.json", "data/biblia/josue.json", "data/biblia/judas.json", "data/biblia/judite.json", "data/biblia/juizes.json", "data/biblia/lamentacoes.json", "data/biblia/levitico.json", "data/biblia/lucas.json", "data/biblia/malaquias.json", "data/biblia/marcos.json", "data/biblia/mateus.json", "data/biblia/miqueias.json", "data/biblia/naum.json", "data/biblia/neemias.json", "data/biblia/numeros.json", "data/biblia/oseias.json", "data/biblia/proverbios.json", "data/biblia/romanos.json", "data/biblia/rute.json", "data/biblia/sabedoria.json", "data/biblia/salmos.json", "data/biblia/sofonias.json", "data/biblia/tiago.json", "data/biblia/tito.json", "data/biblia/tobias.json", "data/biblia/zacarias.json", "data/santos/adalberto.json", "data/santos/afonso-de-ligorio.json", "data/santos/agostinho-de-cantuaria.json", "data/santos/agostinho-zhao-rong.json", "data/santos/agostinho.json", "data/santos/agueda.json", "data/santos/alberto-magno.json", "data/santos/ambrosio.json", "data/santos/andre-dung-lac.json", "data/santos/andre-kim.json", "data/santos/andre.json", "data/santos/angela-merici.json", "data/santos/anjos-da-guarda.json", "data/santos/anselmo.json", "data/santos/antao.json", "data/santos/antonio-de-padua.json", "data/santos/antonio-maria-claret.json", "data/santos/antonio-maria-zaccaria.json", "data/santos/anunciacao.json", "data/santos/aparecida.json", "data/santos/apolinario.json", "data/santos/apresentacao-de-maria.json", "data/santos/arcanjos.json", "data/santos/assuncao.json", "data/santos/atanasio.json", "data/santos/barnabe.json", "data/santos/bartolomeu.json", "data/santos/basilio-e-gregorio.json", "data/santos/beda.json", "data/santos/benedito.json", "data/santos/bento.json", "data/santos/bernardino-de-sena.json", "data/santos/bernardo.json", "data/santos/boaventura.json", "data/santos/bonifacio.json", "data/santos/bras.json", "data/santos/brigida.json", "data/santos/bruno.json", "data/santos/caetano.json", "data/santos/calisto.json", "data/santos/camilo-de-lellis.json", "data/santos/carlos-borromeu.json", "data/santos/carlos-lwanga.json", "data/santos/casimiro.json", "data/santos/catarina-de-alexandria.json", "data/santos/catarina-de-sena.json", "data/santos/cecilia.json", "data/santos/cirilo-de-alexandria.json", "data/santos/cirilo-de-jerusalem.json", "data/santos/cirilo-e-metodio.json", "data/santos/clara.json", "data/santos/clemente-i.json", "data/santos/columbano.json", "data/santos/cornelio-e-cipriano.json", "data/santos/cosme-e-damiao.json", "data/santos/cristovao-magallanes.json", "data/santos/damaso.json", "data/santos/dionisio.json", "data/santos/domingos.json", "data/santos/dulce-dos-pobres.json", "data/santos/edwiges.json", "data/santos/efrem.json", "data/santos/escolastica.json", "data/santos/estanislau.json", "data/santos/estevao-da-hungria.json", "data/santos/estevao.json", "data/santos/eusebio-de-vercelli.json", "data/santos/fabiano.json", "data/santos/faustina.json", "data/santos/fidelis.json", "data/santos/filipe-e-tiago.json", "data/santos/filipe-neri.json", "data/santos/francisca-romana.json", "data/santos/francisco-de-assis.json", "data/santos/francisco-de-paula.json", "data/santos/francisco-de-sales.json", "data/santos/francisco-xavier.json", "data/santos/frei-galvao.json", "data/santos/fundadores-servitas.json", "data/santos/gertrudes.json", "data/santos/gregorio-de-narek.json", "data/santos/gregorio-magno.json", "data/santos/gregorio-vii.json", "data/santos/guadalupe.json", "data/santos/henrique.json", "data/santos/hilario.json", "data/santos/hildegarda.json", "data/santos/imaculada-conceicao.json", "data/santos/inacio-de-antioquia.json", "data/santos/inacio-de-azevedo.json", "data/santos/inacio-de-loyola.json", "data/santos/ines.json", "data/santos/ireneu.json", "data/santos/isabel-da-hungria.json", "data/santos/isabel-de-portugal.json", "data/santos/isidoro.json", "data/santos/januario.json", "data/santos/jeronimo-emiliani.json", "data/santos/jeronimo.json", "data/santos/joana-de-chantal.json", "data/santos/joao-batista-de-la-salle.json", "data/santos/joao-batista-nascimento.json", "data/santos/joao-bosco.json", "data/santos/joao-cancio.json", "data/santos/joao-crisostomo.json", "data/santos/joao-da-cruz.json", "data/santos/joao-damasceno.json", "data/santos/joao-de-avila.json", "data/santos/joao-de-capistrano.json", "data/santos/joao-de-deus.json", "data/santos/joao-eudes.json", "data/santos/joao-evangelista.json", "data/santos/joao-fisher-e-tomas-moro.json", "data/santos/joao-i.json", "data/santos/joao-leonardi.json", "data/santos/joao-maria-vianney.json", "data/santos/joao-paulo-ii.json", "data/santos/joao-xxiii.json", "data/santos/joaquim-e-ana.json", "data/santos/jorge.json", "data/santos/josafa.json", "data/santos/jose-de-anchieta.json", "data/santos/jose-de-calasanz.json", "data/santos/jose-operario.json", "data/santos/josefina-bakhita.json", "data/santos/juan-diego.json", "data/santos/justino.json", "data/santos/leao-magno.json", "data/santos/lourenco-de-brindisi.json", "data/santos/lourenco-ruiz.json", "data/santos/lourenco.json", "data/santos/lucas.json", "data/santos/luis-de-franca.json", "data/santos/luis-de-montfort.json", "data/santos/luis-gonzaga.json", "data/santos/luzia.json", "data/santos/marcelino-e-pedro.json", "data/santos/marcos.json", "data/santos/margarida-da-escocia.json", "data/santos/margarida-maria-alacoque.json", "data/santos/maria-goretti.json", "data/santos/maria-madalena-de-pazzi.json", "data/santos/maria-madalena.json", "data/santos/maria-mae-de-deus.json", "data/santos/marta-maria-lazaro.json", "data/santos/martinho-de-porres.json", "data/santos/martinho-de-tours.json", "data/santos/martinho-i.json", "data/santos/martires-de-cunhau-e-uruacu.json", "data/santos/martires-norte-americanos.json", "data/santos/martirio-joao-batista.json", "data/santos/mateus.json", "data/santos/matias.json", "data/santos/maximiliano-kolbe.json", "data/santos/monica.json", "data/santos/natividade-de-maria.json", "data/santos/nereu-e-aquileu.json", "data/santos/nicolau.json", "data/santos/nome-de-maria.json", "data/santos/norberto.json", "data/santos/nossa-senhora-das-dores.json", "data/santos/nossa-senhora-de-fatima.json", "data/santos/nossa-senhora-de-loreto.json", "data/santos/nossa-senhora-de-lourdes.json", "data/santos/nossa-senhora-do-carmo.json", "data/santos/nossa-senhora-do-rosario.json", "data/santos/nossa-senhora-rainha.json", "data/santos/oscar.json", "data/santos/pancracio.json", "data/santos/patricio.json", "data/santos/paulina.json", "data/santos/paulino-de-nola.json", "data/santos/paulo-da-cruz.json", "data/santos/paulo-miki.json", "data/santos/paulo-vi.json", "data/santos/pedro-canisio.json", "data/santos/pedro-chanel.json", "data/santos/pedro-claver.json", "data/santos/pedro-crisologo.json", "data/santos/pedro-damiao.json", "data/santos/pedro-de-alcantara.json", "data/santos/pedro-e-paulo.json", "data/santos/pedro-juliao-eymard.json", "data/santos/perpetua-e-felicidade.json", "data/santos/pio-de-pietrelcina.json", "data/santos/pio-v.json", "data/santos/pio-x.json", "data/santos/policarpo.json", "data/santos/ponciano-e-hipolito.json", "data/santos/protomartires-de-roma.json", "data/santos/raimundo-de-penyafort.json", "data/santos/rita-de-cassia.json", "data/santos/roberto-belarmino.json", "data/santos/romualdo.json", "data/santos/roque-gonzalez.json", "data/santos/rosa-de-lima.json", "data/santos/santos-inocentes.json", "data/santos/sao-jose.json", "data/santos/sebastiao.json", "data/santos/sharbel.json", "data/santos/silvestre.json", "data/santos/simao-e-judas.json", "data/santos/sisto-ii.json", "data/santos/teresa-benedita-da-cruz.json", "data/santos/teresa-de-avila.json", "data/santos/teresinha.json", "data/santos/tiago-maior.json", "data/santos/timoteo-e-tito.json", "data/santos/tomas-becket.json", "data/santos/tomas-de-aquino.json", "data/santos/tome.json", "data/santos/turibio.json", "data/santos/venceslau.json", "data/santos/vicente-de-paulo.json", "data/santos/vicente-diacono.json", "data/santos/vicente-ferrer.json", "data/santos/visitacao.json"];

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
  // Fotos dos santos (Wikimedia Commons): guardadas num cache próprio, que não some
  // quando o app atualiza, para aparecerem também sem internet depois da primeira vez.
  if (url.hostname === "upload.wikimedia.org") {
    e.respondWith(caches.open("fotos-santos").then(async c => {
      const salvo = await c.match(req);
      if (salvo) return salvo;
      const r = await fetch(req);
      if (r.ok || r.type === "opaque") c.put(req, r.clone());
      return r;
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

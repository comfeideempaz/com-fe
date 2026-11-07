"""Gera sw.js (service worker) com a lista de arquivos do app e uma versão de cache
calculada pelo conteúdo: qualquer mudança em arquivo gera um cache novo.

Estratégia:
- Arquivos do app (html, css, js, manifest): rede primeiro com limite de 4 s; sem rede, cache.
- Conteúdo (data/), ícones e imagens: cache primeiro (já baixado = abre na hora, offline).
- Fontes do Google: devolve o cache e atualiza em segundo plano.
- Na instalação baixa o essencial; logo depois, em segundo plano, o resto (Bíblia e vidas
  dos santos), para que todo o app funcione sem internet.
Rode depois de qualquer mudança: python3 -I tools/make_sw.py
"""
import hashlib
import json
import pathlib
import re

RAIZ = pathlib.Path(__file__).resolve().parent.parent

def listar(padroes):
    arqs = []
    for p in padroes:
        arqs += sorted(x for x in RAIZ.glob(p) if x.is_file())
    return arqs

ESSENCIAIS = listar(["index.html", "manifest.json", "css/*.css", "js/*.js", "js/views/*.js", "icons/*.png",
                     "data/*.json", "data/calendario/*.json", "data/biblia/livros.json", "data/santos/indice.json"])
EXTRAS = [x for x in listar(["data/biblia/*.json", "data/santos/*.json"]) if x not in ESSENCIAIS]

versao_app = re.search(r'APP_VERSION = "([^"]+)"', (RAIZ / "js" / "config.js").read_text()).group(1)
h = hashlib.sha256()
for a in ESSENCIAIS + EXTRAS:
    h.update(a.relative_to(RAIZ).as_posix().encode())
    h.update(a.read_bytes())
VERSAO = f"{versao_app}-{h.hexdigest()[:10]}"

rel = lambda xs: [("./" if x.name == "index.html" else "") + x.relative_to(RAIZ).as_posix() for x in xs]
ess = ["./"] + [r for r in rel(ESSENCIAIS) if r != "./index.html"] + ["index.html"]

SW = f"""// Service worker do Com Fé!. GERADO por tools/make_sw.py: não edite à mão.
const VERSAO = "{VERSAO}";
const CACHE = "comfe-" + VERSAO;
const ESSENCIAIS = {json.dumps(ess, ensure_ascii=False)};
const EXTRAS = {json.dumps(rel(EXTRAS), ensure_ascii=False)};

self.addEventListener("install", e => {{
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ESSENCIAIS)).then(() => self.skipWaiting()));
}});

self.addEventListener("activate", e => {{
  e.waitUntil((async () => {{
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => (n.startsWith("comfe-") || n.startsWith("catequizando-")) && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  }})());
  // Em segundo plano: o resto do conteúdo, para o app inteiro funcionar offline.
  baixarExtras();
}});

async function baixarExtras() {{
  const c = await caches.open(CACHE);
  for (const url of EXTRAS) {{
    try {{ if (!(await c.match(url))) {{ const r = await fetch(url); if (r.ok) await c.put(url, r); }} }} catch {{ /* sem rede: tenta de novo na próxima vez */ }}
  }}
}}

self.addEventListener("message", e => {{ if (e.data === "baixar-tudo") e.waitUntil(baixarExtras()); }});

function comLimite(promessa, ms) {{
  return new Promise((ok, falha) => {{ const t = setTimeout(() => falha(new Error("tempo")), ms); promessa.then(r => {{ clearTimeout(t); ok(r); }}, err => {{ clearTimeout(t); falha(err); }}); }});
}}

self.addEventListener("fetch", e => {{
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {{
    e.respondWith(caches.open(CACHE).then(async c => {{
      const salvo = await c.match(req);
      const rede = fetch(req).then(r => {{ if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }}).catch(() => salvo);
      return salvo || rede;
    }}));
    return;
  }}
  // Fotos dos santos (Wikimedia Commons): guardadas num cache próprio, que não some
  // quando o app atualiza, para aparecerem também sem internet depois da primeira vez.
  if (url.hostname === "upload.wikimedia.org") {{
    e.respondWith(caches.open("fotos-santos").then(async c => {{
      const salvo = await c.match(req);
      if (salvo) return salvo;
      const r = await fetch(req);
      if (r.ok || r.type === "opaque") c.put(req, r.clone());
      return r;
    }}));
    return;
  }}
  if (url.origin !== location.origin) return;

  const conteudo = url.pathname.includes("/data/") || url.pathname.includes("/icons/");
  if (conteudo) {{
    e.respondWith(caches.open(CACHE).then(async c => {{
      const salvo = await c.match(req, {{ ignoreSearch: true }});
      if (salvo) return salvo;
      const r = await fetch(req);
      if (r.ok) c.put(req, r.clone());
      return r;
    }}));
    return;
  }}
  // App: rede primeiro (4 s), depois cache.
  e.respondWith((async () => {{
    const c = await caches.open(CACHE);
    try {{
      const r = await comLimite(fetch(req), 4000);
      if (r.ok) c.put(req, r.clone());
      return r;
    }} catch {{
      return (await c.match(req, {{ ignoreSearch: true }})) || (req.mode === "navigate" ? c.match("index.html") : Response.error());
    }}
  }})());
}});
"""
(RAIZ / "sw.js").write_text(SW, encoding="utf-8")
print(f"sw.js: versão {VERSAO}; {len(ess)} essenciais, {len(EXTRAS)} extras")

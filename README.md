# Catequizando

App católico em português do Brasil para viver a fé no dia a dia: a Bíblia inteira com projetos de leitura, a liturgia de cada dia (tempo, cor, celebração e evangelho), a missa explicada parte por parte, a história e as curiosidades dos santos e as orações tradicionais.

Funciona **sem internet** e **sem conta**: o progresso fica salvo no celular de cada pessoa (com backup em arquivo).

## Padrão técnico

- Site estático: HTML + CSS + JavaScript puro (ES modules), sem framework e sem etapa de build.
- PWA instalável e 100% offline (`manifest.json` + `sw.js`).
- Conteúdo em `data/*.json`, gerado e validado pelos scripts Python em `tools/`.
- Hospedagem no GitHub Pages (`.nojekyll`).
- Supabase só no futuro, se houver login.

## Estrutura

```
index.html            casca do app (carregamento, menu, área principal #view, faixa offline, toast)
manifest.json         PWA
sw.js                 service worker (versão e lista geradas por tools/make_sw.py)
css/app.css           visual inteiro, variáveis no :root
js/app.js             inicialização, menu e roteador por hash (ROUTES)
js/config.js          APP_NAME, APP_VERSION, regras de sequência, meta e selos
js/store.js           progresso no localStorage, exportar/importar
js/content.js         leitura dos JSON de data/
js/liturgia.js        dia litúrgico a partir do calendário gerado
js/speech.js          voz pt-BR do aparelho
js/lumi.js            mascote (ovelhinha Lumi)
js/ui.js, js/icons.js utilitários e ícones SVG
js/views/*.js         uma tela por arquivo
data/                 JSON lidos pelo app (gerados, não editar à mão)
tools/                scripts make_*.py e fontes do conteúdo (*_src/); make_icons.mjs gera os ícones
icons/, img/          ícones PWA e imagens
```

## Rodar no computador

```
python3 -m http.server 8000
```

Abra http://localhost:8000 (o app usa ES modules, então não funciona abrindo o arquivo direto).

Para refazer os ícones a partir do desenho da Lumi: `node tools/make_icons.mjs` (precisa do Playwright).

## Áreas

| Rota | Tela |
| --- | --- |
| `#/inicio` | Hoje na Igreja |
| `#/biblia` | Bíblia |
| `#/planos` | Projetos de leitura |
| `#/liturgia` | Calendário e dia litúrgico |
| `#/santos` | Santos |
| `#/missa` | Missa explicada |
| `#/oracoes` | Orações e terço |
| `#/progresso` | Meu progresso |
| `#/mais`, `#/sobre` | Atalhos e créditos |

## Cuidados de conteúdo

- Base no Catecismo (com o número, ex.: CIC 1213), Compêndio, IGMR, Martirológio Romano e textos litúrgicos oficiais do Brasil.
- Texto bíblico: tradução do Pe. Antônio Pereira de Figueiredo (domínio público), com link para a tradução da CNBB.
- Tudo que não tiver certeza leva `"revisar": true` e entra na lista de revisão da fase.
- Calendário litúrgico calculado por script a partir da Páscoa, com as regras do Brasil.

## Fases

- [x] Fase 0: planejamento
- [x] Fase 1: estrutura e esqueleto
- [ ] Fase 2: conteúdo (Bíblia, liturgia, orações, missa, primeiro lote de santos)
- [ ] Fase 3: telas e experiência
- [ ] Fase 4: constância (sequência, meta, selos, backup)
- [ ] Fase 5: offline (service worker)
- [ ] Fase 6: revisão final
- [ ] Fase 7: subir (GitHub Pages)

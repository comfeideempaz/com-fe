# Com Fé!

Com Fé! (antes chamado Catequizando) é um app católico em português do Brasil para viver a fé no dia a dia: a Bíblia inteira com projetos de leitura, a liturgia de cada dia (tempo, cor, celebração e evangelho), a missa explicada parte por parte, a história e as curiosidades dos santos e as orações tradicionais.

Funciona **sem internet**. A pessoa entra com e-mail e senha (Supabase) e o progresso fica salvo na conta, ou usa o app como **visitante**, sem salvar nada depois de fechar.

## Padrão técnico

- Site estático: HTML + CSS + JavaScript puro (ES modules), sem framework e sem etapa de build.
- PWA instalável e 100% offline (`manifest.json` + `sw.js`).
- Conteúdo em `data/*.json`, gerado e validado pelos scripts Python em `tools/`.
- Hospedagem na Vercel (site estático, sem build). Também funciona no GitHub Pages (`.nojekyll`).
- Login e progresso na nuvem: Supabase Auth + tabela `comfe_progresso` (ver abaixo).

## Estrutura

```
index.html            casca do app (carregamento, menu, área principal #view, faixa offline, toast)
manifest.json         PWA
sw.js                 service worker (versão e lista geradas por tools/make_sw.py)
css/app.css           visual inteiro, variáveis no :root
js/app.js             inicialização, menu e roteador por hash (ROUTES)
js/config.js          APP_NAME, APP_VERSION, regras de sequência, meta e selos
js/store.js           progresso (aparelho, conta ou só a sessão do visitante), exportar/importar
js/conta.js           login, visitante e sincronização com o Supabase (fetch puro, sem biblioteca)
js/nuvem.js           URL e chave pública (publishable) do Supabase
supabase/schema.sql   tabela comfe_progresso com RLS (rodar uma vez no SQL Editor)
js/content.js         leitura dos JSON de data/
js/liturgia.js        dia litúrgico a partir do calendário gerado
js/speech.js          voz pt-BR do aparelho
js/lumi.js            mascote (ovelhinha Lumi)
js/ui.js, js/icons.js utilitários e ícones SVG
js/views/*.js         uma tela por arquivo
data/                 JSON lidos pelo app (gerados, não editar à mão)
tools/                scripts make_*.py e fontes do conteúdo (*_src/); make_icons.py gera os ícones
icons/, img/          ícones PWA e imagens
```

## Rodar no computador

```
python3 -m http.server 8000
```

Abra http://localhost:8000 (o app usa ES modules, então não funciona abrindo o arquivo direto).

Para refazer os ícones a partir da arte "Com Fé!" (`tools/icone_src/com-fe.jpeg`): `python3 -I tools/make_icons.py` e depois `python3 -I tools/make_sw.py`.

## Áreas

| Rota | Tela |
| --- | --- |
| `#/inicio` | Hoje na Igreja |
| `#/biblia` | Bíblia |
| `#/planos` | Projetos de leitura |
| `#/liturgia` | Calendário e dia litúrgico |
| `#/lectio` | Lectio Divina: 5 passos sobre o Evangelho do dia ou um trecho, meditações escritas salvas no aparelho, com histórico |
| `#/terco` | Terço interativo (rosário em SVG que acende conta por conta) |
| `#/santos` | Santos (217 vidas, com foto do Wikimedia Commons) |
| `#/missa` | Missa explicada |
| `#/oracoes` | Orações (o antigo `#/oracoes/terco` leva ao `#/terco`) |
| `#/sacramentos` | Sacramentos, como se confessar, exame de consciência |
| `#/defesa` | Defesa da Fé |
| `#/progresso` | Meu progresso |
| `#/mais`, `#/sobre` | Atalhos e créditos |

## Cuidados de conteúdo

- Base no Catecismo (com o número, ex.: CIC 1213; toda citação "CIC nº" vira link para a página oficial do Vaticano, em `js/catecismo.js`, sem copiar o texto, que tem direitos reservados), Compêndio, IGMR, Martirológio Romano e textos litúrgicos oficiais do Brasil.
- Texto bíblico: tradução do Pe. Antônio Pereira de Figueiredo (domínio público), digitalizada por OCR (repositório ronaldomelofz/abibliasagrada) e revisada por script. Cerca de 3,7% dos versículos faltam na fonte digital e aparecem marcados como ausentes; as leituras do dia têm link para o texto oficial da CNBB.
- Régua de alinhamento: `tools/biblia_src/referencia_tamanhos.json` guarda só o tamanho de cada versículo da Douay-Rheims (MIT, isaacronan/douay-rheims-json), usado para separar versículos juntados e cortar notas de rodapé misturadas. O texto inglês não entra no app.
- Tudo que não tiver certeza leva `"revisar": true` e entra na lista de revisão da fase.
- Calendário litúrgico calculado por script a partir da Páscoa, com as regras do Brasil.

## Gerar o conteúdo

Sempre com `python3 -I`, a partir da raiz:

```
python3 -I tools/make_biblia.py      # data/biblia/ (+ tools/relatorios/biblia.txt)
python3 -I tools/make_liturgia.py    # data/calendario/, leituras.json, dicas.json
python3 -I tools/make_conteudo.py    # oracoes, missa, sacramentos, defesa, liturgia, selos, lectio
python3 -I tools/make_santos.py      # data/santos/ (vidas em tools/conteudo_src/santos/*.json; foto: título da Wikipédia em tools/liturgia_src/santos_wiki.json)
python3 -I tools/make_planos.py      # data/planos.json
python3 -I tools/make_sw.py          # sw.js (rode por último, a cada mudança)
```

Os itens com `"revisar": true` são listados em `tools/relatorios/*.txt`.

## Fases

- [x] Fase 0: planejamento
- [x] Fase 1: estrutura e esqueleto
- [x] Fase 2: conteúdo (Bíblia, liturgia, orações, missa, sacramentos, Defesa da Fé, santos, projetos)
- [x] Fase 3: telas e experiência
- [x] Fase 4: constância (sequência, meta, selos, backup)
- [x] Fase 5: offline (service worker)
- [x] Fase 6: revisão final
- [ ] Fase 7: subir (GitHub Pages)


## Login e sincronização

- `#/entrar`: entrar, criar conta (`/criar`), esqueci a senha (`/esqueci`) e nova senha (`/nova-senha`, volta do e-mail). Sem login e sem escolher visitante, qualquer rota leva para lá.
- **Conta:** o progresso fica no aparelho (`comfe:conta:<id>`) e sobe para `comfe_progresso` 2,5 s depois de cada mudança. Ao abrir o app, ao voltar a internet e ao voltar para a aba, baixa da nuvem. Se os dois lados mudaram (dois aparelhos offline), `juntar()` soma os dois.
- **Visitante:** progresso só no `sessionStorage` da aba; some ao fechar. Se criar conta depois, o que fez vai para a conta.
- No primeiro login, o progresso de antes do login (`catequizando:v1`) vai para a conta.
- No Supabase, em Authentication → URL Configuration, o **Site URL** e as **Redirect URLs** precisam ter o endereço do app (ex.: `https://com-fe.vercel.app`), senão os links de confirmação e de senha nova voltam para o lugar errado.
- `js/nuvem.js` vazio = app sem login, tudo só no aparelho (como até a versão 1.2).

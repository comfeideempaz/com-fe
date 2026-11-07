"""Gera o santoral do app.

Entradas: tools/liturgia_src/santoral.txt (dia, id, nome, grau, cor) e
tools/conteudo_src/santos/*.json (vidas completas, por id).
Saídas: data/santos/indice.json (lista para busca) e data/santos/<id>.json (uma vida por arquivo).
Relatório: tools/relatorios/santos.txt.
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import make_conteudo as mc  # noqa: E402

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "data" / "santos"
GRAUS = {"S": "Solenidade", "FS": "Festa do Senhor", "F": "Festa", "M": "Memória",
         "m": "Memória facultativa", "FD": "Comemoração"}
# Celebrações que não são de santos (mistérios do Senhor e da Igreja).
DO_SENHOR = {"nome-de-jesus", "apresentacao-do-senhor", "transfiguracao", "exaltacao-da-cruz",
             "latrao", "basilicas-pedro-paulo", "santa-maria-maior", "finados", "todos-os-santos",
             "catedra-de-sao-pedro", "conversao-de-sao-paulo"}
MARIA = {"maria-mae-de-deus", "anunciacao", "visitacao", "assuncao", "natividade-de-maria",
         "imaculada-conceicao", "apresentacao-de-maria", "nome-de-maria", "aparecida", "guadalupe"}


def tipo(sid, nome):
    if sid in MARIA or nome.startswith("Nossa Senhora") or "Virgem Maria" in nome:
        return "maria"
    if sid in DO_SENHOR:
        return "celebracao"
    return "santo"


def main():
    santoral = []
    for linha in (RAIZ / "tools" / "liturgia_src" / "santoral.txt").read_text(encoding="utf-8").splitlines():
        if not linha.strip() or linha.startswith("#"):
            continue
        campos = [c.strip() for c in linha.split("|")]
        dia, sid, nome, grau, cor = campos[:5]
        santoral.append({"id": sid, "nome": nome, "dia": dia, "grau": grau,
                         "grauNome": GRAUS.get(grau, grau), "cor": cor, "tipo": tipo(sid, nome)})
    por_id = {s["id"]: s for s in santoral}
    # Título do artigo na Wikipédia (en) de cada santo: o app busca a foto livre no Commons.
    wiki = json.loads((RAIZ / "tools" / "liturgia_src" / "santos_wiki.json").read_text(encoding="utf-8"))
    for sid, titulo in wiki.items():
        if sid.startswith("_"):
            continue
        if sid not in por_id:
            mc.erros.append(f"santos_wiki.json: id '{sid}' não está no santoral")
            continue
        por_id[sid]["wiki"] = titulo

    vidas = {}
    for arq in sorted((RAIZ / "tools" / "conteudo_src" / "santos").glob("*.json")):
        for sid, vida in json.loads(arq.read_text(encoding="utf-8")).items():
            if sid.startswith("_"):
                continue
            if sid not in por_id:
                mc.erros.append(f"{arq.name}: id '{sid}' não está no santoral")
                continue
            if sid in vidas:
                mc.erros.append(f"{arq.name}: id '{sid}' repetido")
            vidas[sid] = mc.processar(vida, f"santos.{sid}")

    SAIDA.mkdir(parents=True, exist_ok=True)
    for velho in SAIDA.glob("*.json"):
        velho.unlink()
    indice = []
    for s in santoral:
        item = dict(s)
        v = vidas.get(s["id"])
        if v:
            item["vida"] = True
            item["titulo"] = v.get("titulo", "")
            item["patrono"] = v.get("patrono", [])
            (SAIDA / f"{s['id']}.json").write_text(
                json.dumps({**s, **v}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        indice.append(item)
    (SAIDA / "indice.json").write_text(
        json.dumps({"santos": indice}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    sem = [s["nome"] for s in santoral if s["id"] not in vidas and s["tipo"] == "santo"]
    rel = [f"Santoral: {len(santoral)} celebrações; vidas completas: {len(vidas)}; santos sem vida: {len(sem)}",
           "", "ERROS:"] + mc.erros + ["", "REVISAR:"] + mc.revisar + ["", "SEM VIDA AINDA:"] + sem
    (RAIZ / "tools" / "relatorios" / "santos.txt").write_text("\n".join(rel) + "\n", encoding="utf-8")
    print("\n".join(rel[:3 + len(mc.erros) + 2 + len(mc.revisar)]))
    sys.exit(1 if mc.erros else 0)


if __name__ == "__main__":
    main()

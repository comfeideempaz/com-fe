"""Gera data/<nome>.json a partir de tools/conteudo_src/<nome>.json.

Para cada fonte:
- toda chave "biblia" (lista de citações no padrão CNBB) vira lista de objetos
  {livro, txt, trechos}, validados contra a Bíblia do app (tools/refs.py);
- chaves que começam com "_" (comentários) são removidas;
- itens com "revisar": true são listados no relatório tools/relatorios/conteudo.txt.
Uso: python3 -I tools/make_conteudo.py [nome ...]   (sem nomes = todas as fontes)
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from refs import ref  # noqa: E402

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SRC = RAIZ / "tools" / "conteudo_src"
erros, revisar = [], []


def rotulo(no, caminho):
    for k in ("titulo", "nome", "pergunta", "autor", "id"):
        if isinstance(no, dict) and isinstance(no.get(k), str):
            return f"{caminho} · {no[k]}"
    return caminho


def processar(no, caminho):
    if isinstance(no, dict):
        if no.get("revisar"):
            revisar.append(rotulo(no, caminho))
        saida = {}
        for k, v in no.items():
            if k.startswith("_"):
                continue
            if k == "biblia":
                lista = [v] if isinstance(v, str) else v
                objs = []
                for c in lista:
                    try:
                        objs.append(ref(c))
                    except Exception as e:  # citação inválida
                        erros.append(f"{rotulo(no, caminho)}: '{c}' -> {e}")
                saida[k] = objs
            else:
                saida[k] = processar(v, f"{caminho}.{k}")
        return saida
    if isinstance(no, list):
        return [processar(x, f"{caminho}[{i}]") for i, x in enumerate(no)]
    return no


def main():
    nomes = sys.argv[1:] or sorted(p.stem for p in SRC.glob("*.json"))
    linhas = []
    for nome in nomes:
        dados = json.loads((SRC / f"{nome}.json").read_text(encoding="utf-8"))
        antes_e, antes_r = len(erros), len(revisar)
        saida = processar(dados, nome)
        destino = RAIZ / "data" / f"{nome}.json"
        destino.write_text(json.dumps(saida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        linhas.append(f"{nome}: {destino.stat().st_size // 1024} KB, "
                      f"{len(erros) - antes_e} erro(s), {len(revisar) - antes_r} a revisar")
    rel = linhas + ["", "ERROS:"] + erros + ["", "REVISAR:"] + revisar
    (RAIZ / "tools" / "relatorios" / "conteudo.txt").write_text("\n".join(rel) + "\n", encoding="utf-8")
    print("\n".join(rel))
    sys.exit(1 if erros else 0)


if __name__ == "__main__":
    main()

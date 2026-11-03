"""Importa o texto da Bíblia de Figueiredo (domínio público) para tools/biblia_src/figueiredo/.

Origem: o texto extraído por OCR dos 16 volumes da edição de 1950 no repositório
https://github.com/ronaldomelofz/abibliasagrada (pasta web/data/livros).
Guardamos SÓ o texto dos versículos (a tradução do Pe. Antônio Pereira de Figueiredo,
falecido em 1797). Notas e títulos da edição de 1950 ficam de fora.

Uso (uma vez, ou para atualizar a fonte):
    git clone --depth 1 https://github.com/ronaldomelofz/abibliasagrada /tmp/fig
    python3 tools/importar_figueiredo.py /tmp/fig
Depois rode tools/make_biblia.py, que limpa o texto e gera data/biblia/.
"""
import json
import pathlib
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parent
DESTINO = RAIZ / "biblia_src" / "figueiredo"


def main(origem):
    pasta = pathlib.Path(origem) / "web" / "data" / "livros"
    arquivos = sorted(pasta.glob("*.json"))
    if len(arquivos) != 73:
        sys.exit(f"Esperava 73 livros em {pasta}, achei {len(arquivos)}.")
    DESTINO.mkdir(parents=True, exist_ok=True)
    total = 0
    for arq in arquivos:
        d = json.loads(arq.read_text(encoding="utf-8"))
        caps = [{"n": c["n"], "v": [[v["n"], v["t"]] for v in c["versiculos"]]} for c in d["capitulos"]]
        total += sum(len(c["v"]) for c in caps)
        (DESTINO / f"{d['id']}.json").write_text(
            json.dumps({"id": d["id"], "capitulos": caps}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    try:
        commit = subprocess.run(["git", "-C", str(origem), "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
    except OSError:
        commit = "?"
    (DESTINO / "ORIGEM.txt").write_text(
        "Texto: Bíblia Sagrada, trad. Pe. Antônio Pereira de Figueiredo (domínio público), edição de 1950.\n"
        f"Extração OCR: https://github.com/ronaldomelofz/abibliasagrada (commit {commit}).\n"
        "Só o texto dos versículos foi importado; notas e títulos de capítulo ficaram de fora.\n", encoding="utf-8")
    print(f"{len(arquivos)} livros, {total} versículos importados em {DESTINO}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "/tmp/fig")

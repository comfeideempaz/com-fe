"""Referências bíblicas no padrão da CNBB ("Jo 3,16", "Lc 7,36–8,3", "Sl 23(22),1-4", "Sl 148").

ref("Jo 3,16-18") -> {"livro": "joao", "txt": "Jo 3,16-18", "trechos": [[3, 16, 3, 18]]}
trechos = [capítulo inicial, versículo inicial, capítulo final, versículo final].
Salmos: o texto segue a numeração hebraica (como no Lecionário); os trechos usam
a numeração grega/Vulgata, que é a da Bíblia de Figueiredo do app.
Também valida: livro existente, capítulo existente e versículo dentro do capítulo.
"""
import json
import pathlib
import re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
_LIVROS = None


def livros():
    global _LIVROS
    if _LIVROS is None:
        dados = json.loads((RAIZ / "data" / "biblia" / "livros.json").read_text(encoding="utf-8"))
        _LIVROS = {l["abrev"]: l for l in dados["livros"]}
    return _LIVROS


def salmo_grego(n, v=None):
    """Numeração hebraica -> grega/Vulgata."""
    if n <= 8 or n >= 148:
        return n
    if n in (9, 10):
        return 9
    if 11 <= n <= 113:
        return n - 1
    if n in (114, 115):
        return 113
    if n == 116:
        return 114 if (v or 1) <= 9 else 115
    if 117 <= n <= 146:
        return n - 1
    if n == 147:
        return 146 if (v or 1) <= 11 else 147
    return n


def ref(texto):
    m = re.match(r"^(\d?[A-ZÁÉÍÓÚ][a-záéíóúê]*)\s+(.+)$", texto.strip())
    if not m:
        raise ValueError(f"referência inválida: {texto!r}")
    ab, resto = m.group(1), m.group(2)
    lv = livros().get(ab)
    if not lv:
        raise ValueError(f"livro desconhecido em {texto!r} (use as abreviações da CNBB)")
    lid = lv["id"]
    trechos = []
    cap = None
    if re.fullmatch(r"\d+(\(\d+\))?", resto):  # capítulo inteiro
        c = int(re.match(r"\d+", resto).group())
        trechos.append([c, 1, c, 999])
    else:
        for bloco in resto.split(";"):
            bloco = bloco.strip().replace("–", "-")
            mc = None if re.match(r"^\d+[a-z]*-\d+,", bloco) else re.match(r"^(\d+)(?:\(\d+\))?,(.+)$", bloco)
            if mc:
                cap, vs = int(mc.group(1)), mc.group(2)
            else:
                vs = bloco
            for p in vs.split("."):
                p = p.strip()
                mx = re.match(r"^(\d+)[a-z]*-(\d+),(\d+)[a-z]*$", p)
                if mx:
                    trechos.append([cap, int(mx.group(1)), int(mx.group(2)), int(mx.group(3))])
                    cap = int(mx.group(2))
                    continue
                mm = re.match(r"^(\d+)[a-z]*(?:-(\d+)[a-z]*)?$", p)
                if not mm or cap is None:
                    raise ValueError(f"trecho inválido {p!r} em {texto!r}")
                trechos.append([cap, int(mm.group(1)), cap, int(mm.group(2) or mm.group(1))])
    if lid == "salmos":
        trechos = [[salmo_grego(a, b), b, salmo_grego(c, d), d] for a, b, c, d in trechos]
    for a, b, c, d in trechos:
        if not (1 <= a <= lv["capitulos"] and 1 <= c <= lv["capitulos"]):
            raise ValueError(f"capítulo fora do livro em {texto!r}")
    return {"livro": lid, "txt": texto.strip(), "trechos": trechos}


def refs(lista):
    return [ref(x) for x in lista]

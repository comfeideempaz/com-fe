"""Gera o calendário litúrgico e as leituras do dia.

Saída:
  data/calendario/<ano>.json   um registro por dia (tempo, semana, cor, celebração, santos, chave das leituras)
  data/leituras.json           chave do Lecionário -> leituras (1ª leitura, salmo, 2ª leitura, evangelho)
  tools/relatorios/liturgia.txt pontos para revisar

O calendário é CALCULADO por tools/calendario.py a partir da data da Páscoa
(nada digitado à mão além do santoral em liturgia_src/santoral.txt).

As leituras: as referências bíblicas do Lecionário Romano (Ordo Lectionum Missae)
são as mesmas no mundo todo. Usamos como fonte as citações publicadas pela USCCB
(compiladas em https://github.com/westhong/catholic-daily-readings, só referências,
sem texto bíblico) para 2023-2027, e as associamos às nossas chaves pelo número
do Lecionário. Assim conseguimos as leituras de qualquer ano. O Lecionário do
Brasil pode ter pequenas diferenças nos versículos: conferir na liturgia diária da CNBB.
Leituras próprias do Brasil (ex.: Aparecida) estão em liturgia_src/leituras_brasil.json.

Uso: python3 tools/make_liturgia.py [caminho/readings.json]
"""
import collections
import datetime as dt
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import refs  # noqa: E402
from calendario import Calendario, carregar_santoral, pascoa, ciclo_dominical, ciclo_ferial, GRAU_NOME  # noqa: E402

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SRC = RAIZ / "tools" / "liturgia_src"
SAIDA = RAIZ / "data"
REL = RAIZ / "tools" / "relatorios" / "liturgia.txt"
ANOS = [2026, 2027, 2028, 2029, 2030]
USCCB_PADRAO = SRC / "usccb_readings.json"

# Nome do livro (como aparece nas citações em inglês) -> (id do livro no app, abreviação em português)
LIVRO_EN = {
    "gn": "genesis", "genesis": "genesis", "ex": "exodo", "exodus": "exodo", "lv": "levitico", "leviticus": "levitico",
    "nm": "numeros", "numbers": "numeros", "dt": "deuteronomio", "deuteronomy": "deuteronomio",
    "jos": "josue", "joshua": "josue", "jgs": "juizes", "judges": "juizes", "ru": "rute", "ruth": "rute",
    "1 sm": "1-samuel", "1 samuel": "1-samuel", "2 sm": "2-samuel", "2 samuel": "2-samuel",
    "1 kgs": "1-reis", "1 kings": "1-reis", "2 kgs": "2-reis", "2 kings": "2-reis",
    "1 chr": "1-cronicas", "1 chronicles": "1-cronicas", "2 chr": "2-cronicas", "2 chronicles": "2-cronicas",
    "ezr": "esdras", "ezra": "esdras", "neh": "neemias", "nehemiah": "neemias", "tb": "tobias", "tobit": "tobias",
    "jdt": "judite", "judith": "judite", "est": "ester", "esther": "ester",
    "1 mc": "1-macabeus", "1 maccabees": "1-macabeus", "2 mc": "2-macabeus", "2 maccabees": "2-macabeus",
    "jb": "jo", "job": "jo", "ps": "salmos", "psalm": "salmos", "psalms": "salmos", "prv": "proverbios", "proverbs": "proverbios",
    "eccl": "eclesiastes", "ecclesiastes": "eclesiastes", "sg": "cantico", "sgs": "cantico", "song of songs": "cantico",
    "wis": "sabedoria", "wisdom": "sabedoria", "sir": "eclesiastico", "sirach": "eclesiastico", "sirarch": "eclesiastico",
    "is": "isaias", "isaiah": "isaias", "jer": "jeremias", "jeremiah": "jeremias", "lam": "lamentacoes", "lamentations": "lamentacoes",
    "bar": "baruc", "baruch": "baruc", "ez": "ezequiel", "ezekiel": "ezequiel", "dn": "daniel", "daniel": "daniel",
    "hos": "oseias", "hosea": "oseias", "jl": "joel", "joel": "joel", "am": "amos", "amos": "amos", "ob": "abdias",
    "jon": "jonas", "jonah": "jonas", "mi": "miqueias", "micah": "miqueias", "na": "naum", "nahum": "naum",
    "hb": "habacuc", "hab": "habacuc", "habakkuk": "habacuc", "zep": "sofonias", "zephaniah": "sofonias",
    "hg": "ageu", "haggai": "ageu", "zec": "zacarias", "zechariah": "zacarias", "mal": "malaquias", "malachi": "malaquias",
    "mt": "mateus", "matthew": "mateus", "mk": "marcos", "mark": "marcos", "lk": "lucas", "luke": "lucas",
    "jn": "joao", "john": "joao", "acts": "atos", "rom": "romanos", "romans": "romanos",
    "1 cor": "1-corintios", "1 corinthians": "1-corintios", "2 cor": "2-corintios", "2 corinthians": "2-corintios",
    "gal": "galatas", "galatians": "galatas", "eph": "efesios", "ephesians": "efesios",
    "phil": "filipenses", "philippians": "filipenses", "phiippians": "filipenses", "phippians": "filipenses",
    "col": "colossenses", "colossians": "colossenses",
    "1 thes": "1-tessalonicenses", "1 thessalonians": "1-tessalonicenses", "2 thes": "2-tessalonicenses", "2 thessalonians": "2-tessalonicenses",
    "1 tm": "1-timoteo", "1 timothy": "1-timoteo", "2 tm": "2-timoteo", "2 timothy": "2-timoteo", "ti": "tito", "titus": "tito",
    "phlm": "filemom", "philemon": "filemom", "heb": "hebreus", "hebrews": "hebreus", "jas": "tiago", "james": "tiago",
    "1 pt": "1-pedro", "1 peter": "1-pedro", "2 pt": "2-pedro", "2 peter": "2-pedro",
    "1 jn": "1-joao", "1 john": "1-joao", "2 jn": "2-joao", "2 john": "2-joao", "3 jn": "3-joao", "3 john": "3-joao",
    "jude": "judas", "rv": "apocalipse", "rev": "apocalipse", "revelation": "apocalipse",
}
ABREV = {}  # id -> abreviação, lido de data/biblia/livros.json


def salmo_grego(n, v=None):
    """Numeração hebraica (usada no Lecionário) -> numeração grega/Vulgata (usada na Figueiredo)."""
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


def converter_citacao(cit, slot):
    """'Ps 67:2-3, 5, 6 and 8' -> {'livro': 'salmos', 'cap': 66, 'txt': 'Sl 67(66),2-3.5.6.8', 'trechos': [...]}"""
    s = cit.strip().rstrip(".")
    s = re.sub(r"^(see|cf\.?)\s+", "", s, flags=re.I)
    s = re.sub(r"^M (\d)", r"Mk \1", s)
    s = re.sub(r"\s+(and|AND|&)\s+", ", ", s)
    s = re.sub(r"\s+-\s+", "-", s)
    s = re.sub(r"(\d)([A-D]{1,2})\b", lambda m: m.group(1) + m.group(2).lower(), s)
    s = re.sub(r":\s+", ":", s)
    s = re.sub(r"(\d)\s+([a-d]{1,2})\b", r"\1\2", s)
    s = re.sub(r"(\d+[a-d]?)-(\d+)-(\d+)-(\d+)", r"\1-\4", s)
    s = re.sub(r"(\d[a-d]?)(\d)", r"\1\2", s)
    m = re.match(r"^((?:[123]\s?)?[A-Za-z][A-Za-z ]*?)\.?\s*(\d.*)$", s)
    if m:
        nome, resto = m.group(1).strip().lower(), m.group(2)
        nome = re.sub(r"^([123])\s?", r"\1 ", nome)
    elif slot == "responsorial_psalm" and re.match(r"^\d", s):
        nome, resto = "ps", s
    else:
        return None
    lid = LIVRO_EN.get(nome)
    if not lid:
        return None
    resto = resto.replace("—", "-").replace("–", "-").replace(" and ", ", ").replace(";", ",")
    trechos = []  # [cap_ini, v_ini, cap_fim, v_fim]
    cap = None
    txt_partes = []
    for parte in [p.strip() for p in resto.split(",") if p.strip()]:
        mm = re.match(r"^(?:(\d+):)?(\d+)[a-zA-Z]*(?:-(?:(\d+):)?(\d+)[a-zA-Z]*)?$", parte)
        if not mm:
            continue
        c1 = int(mm.group(1)) if mm.group(1) else cap
        if c1 is None:
            continue
        v1 = int(mm.group(2))
        c2 = int(mm.group(3)) if mm.group(3) else c1
        v2 = int(mm.group(4)) if mm.group(4) else v1
        trechos.append([c1, v1, c2, v2])
        cap = c2
        txt_partes.append(parte)
    if not trechos:
        return None
    ab = ABREV.get(lid, lid)
    c0 = trechos[0][0]
    # Texto à brasileira: "Jo 6,37-40"; vários trechos separados por ponto.
    t = ""
    ultimo_cap = None
    for p in txt_partes:
        mm = re.match(r"^(?:(\d+):)?(.+)$", p)
        c_txt, vs = mm.group(1), mm.group(2).replace(":", ",")
        if c_txt and c_txt != str(ultimo_cap):
            t += (("; " if t else "") + f"{c_txt},{vs}")
            ultimo_cap = c_txt
        else:
            t += f".{vs}"
    if lid == "salmos":
        cap_txt = f"{c0}({salmo_grego(c0, trechos[0][1])})"
        t = re.sub(r"^\d+", cap_txt, t)
        trechos = [[salmo_grego(a, b), b, salmo_grego(c, d), d] for a, b, c, d in trechos]
    return {"livro": lid, "txt": f"{ab} {t}", "trechos": trechos}


def _nao_usado_carregar_usccb(caminho):
    dados = json.loads(pathlib.Path(caminho).read_text(encoding="utf-8"))
    por_data = {}
    por_numero = collections.defaultdict(list)
    for data, entradas in dados.items():
        principal = next((e for e in entradas if e["mass"] in ("default", "Day", "Supper")), entradas[0])
        por_data[data] = principal
        for e in entradas:
            if e.get("lectionary_number"):
                por_numero[e["lectionary_number"]].append(e)
    return por_data, por_numero


def leituras_da_entrada(e, rel, data):
    out = {}
    for slot, nome in (("first_reading", "l1"), ("responsorial_psalm", "salmo"), ("second_reading", "l2"), ("gospel", "ev")):
        opcoes = []
        for r in e["readings"].get(slot, []):
            partes = re.split(r"\s+or\s+", r["citation"])
            livro = re.match(r"^((?:see\s+|cf\.?\s+)?(?:[123]\s?)?[A-Za-z][A-Za-z ]*?)\.?\s*\d", partes[0], re.I)
            for i, parte in enumerate(partes):
                if i and livro and re.match(r"^\d", parte.strip()):
                    parte = livro.group(1) + " " + parte.strip()
                c = converter_citacao(parte, slot)
                if c and c["txt"] not in [o["txt"] for o in opcoes]:
                    if i:
                        c["forma"] = "breve"
                    opcoes.append(c)
                elif not c:
                    rel.append(f"{data}: não entendi a citação {r['citation']!r}")
        if opcoes:
            out[nome] = opcoes
    return out


PRECEITO_SEMANA = {"NATAL", "S:maria-mae-de-deus", "S:imaculada-conceicao"}


def eh_preceito(d, dia):
    return d.weekday() == 6 or dia["chave"] in PRECEITO_SEMANA or dia["chave"].startswith("CORPUS")


def regra_vale(regra, d, dia):
    dow = (d.weekday() + 1) % 7
    solene = dia["grau"] in ("S",)
    if regra == "domingo":
        return dow == 0
    if regra == "domingo-rosa":
        return dia["cor"] == "rosa"
    if regra == "preceito-semana":
        return dow != 0 and eh_preceito(d, dia)
    if regra == "sexta-comum":
        return dow == 5 and dia["tempo"] != "quaresma" and dia["tempo"] != "triduo" and not solene
    if regra == "sexta-quaresma":
        return dow == 5 and dia["tempo"] == "quaresma" and not solene
    if regra == "sabado-comum":
        return dow == 6 and dia["tempo"] == "comum" and dia["grau"] == "f" and not dia.get("memoria")
    if regra == "primeira-sexta":
        return dow == 5 and d.day <= 7
    if regra == "primeiro-sabado":
        return dow == 6 and d.day <= 7
    if regra == "oitava-finados":
        return d.month == 11 and 1 <= d.day <= 8 and dia["chave"] != "S:finados"
    raise ValueError(f"regra desconhecida: {regra}")


def dicas_do_dia(d, dia, dicas):
    """Devolve os ids das dicas do dia, das mais específicas para as mais gerais."""
    ordem = {"santo": 0, "chave": 0, "regra": 1, "tempo": 2, "mes": 3}
    achadas = []
    for dc in dicas:
        for q in dc["quando"]:
            tipo, valor = q.split(":", 1)
            ok = (tipo == "santo" and (valor in dia.get("santos", []) or dia["chave"] == f"S:{valor}" or dia.get("santo") == valor)) \
                or (tipo == "chave" and dia["chave"].startswith(valor)) \
                or (tipo == "tempo" and dia["tempo"] == valor) \
                or (tipo == "mes" and d.month == int(valor)) \
                or (tipo == "regra" and regra_vale(valor, d, dia))
            if ok:
                achadas.append((ordem[tipo], dc["id"]))
                break
    return [i for _, i in sorted(achadas)]


def main():
    usccb = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else USCCB_PADRAO
    livros = json.loads((SAIDA / "biblia" / "livros.json").read_text(encoding="utf-8"))
    ABREV.update({l["id"]: l["abrev"] for l in livros["livros"]})
    santoral = carregar_santoral(SRC / "santoral.txt")
    rel = []

    # 1) Associa nossas chaves aos números do Lecionário usando as datas da USCCB.
    #    Para isso o calendário roda "à americana": Ascensão na quinta e sem as transferências do Brasil.
    eua = Calendario(santoral, brasil=True, ascensao_domingo=False, transferir=False, corpus_domingo=True)
    eua.santoral = {k: [s for s in v if not s["brasil"]] for k, v in santoral.items()}
    dados = json.loads(usccb.read_text(encoding="utf-8"))
    por_chave = collections.defaultdict(list)
    for data, entradas in dados.items():
        e = next((e for e in entradas if e["mass"] in ("default", "Day", "Supper")), entradas[0])
        d = dt.date.fromisoformat(data)
        l = leituras_da_entrada(e, rel, data)
        if l.get("ev"):
            dia_eua = eua.dia(d)
            # Dia de semana com memória: a fonte às vezes traz as leituras próprias do santo; vale menos no voto.
            festa = e.get("feast", "")
            l["_peso"] = 0.3 if dia_eua["grau"] == "f" and re.search(r"Memorial|Feast|Solemnity|Saint|St\.|Blessed", festa) else 1
            por_chave[dia_eua["chave"]].append(l)
    # Evangelho que aparece em muitas semanas diferentes é próprio de um santo (ex.: Jo 19,25-27, Nossa Senhora das Dores).
    chaves_por_ev = collections.defaultdict(set)
    for chave, lista in por_chave.items():
        if re.match(r"^(TC|ADV|PAS|QUA)\d+-[1-6]", chave):
            for l in lista:
                chaves_por_ev[l["ev"][0]["txt"]].add(re.sub(r"-(I|II)$", "", chave))
    leituras = {}
    for chave, lista in por_chave.items():
        cont = collections.Counter()
        for l in lista:
            ev = l["ev"][0]["txt"]
            cont[ev] += l["_peso"] * (0.3 if len(chaves_por_ev[ev]) >= 3 else 1)
        top, n = cont.most_common(1)[0]
        if len(cont) > 1:
            rel.append(f"Chave {chave}: evangelhos diferentes nas fontes {dict(cont)} (usado {top}; os outros costumam ser de memória de santo)")
        escolhidas = [l for l in lista if l["ev"][0]["txt"] == top]
        junto = {}
        for slot in ("l1", "salmo", "l2", "ev"):
            for l in escolhidas:
                if l.get(slot):
                    junto[slot] = l[slot]
                    break
        leituras[chave] = junto

    # Leituras próprias do Brasil e complementos escritos à mão.
    proprias = json.loads((SRC / "leituras_brasil.json").read_text(encoding="utf-8"))
    for chave, l in proprias.items():
        if chave.startswith("_"):
            continue
        conv = {}
        for slot in ("l1", "salmo", "l2", "ev"):
            if slot in l:
                conv[slot] = [converter_ref_pt(x) for x in l[slot]]
        leituras[chave] = dict(conv, fonte=l.get("fonte", ""), revisar=l.get("revisar", False))

    # Dicas práticas do dia.
    dicas = json.loads((SRC / "dicas.json").read_text(encoding="utf-8"))["dicas"]
    ids = [x["id"] for x in dicas]
    assert len(ids) == len(set(ids)), "id de dica repetido"
    for dc in dicas:
        for campo in ("id", "quando", "tipo", "titulo", "texto"):
            assert dc.get(campo), f"dica {dc.get('id')} sem {campo}"
        dc["biblia"] = [converter_ref_pt(r) for r in dc.get("biblia", [])]
    (SAIDA / "dicas.json").write_text(json.dumps({x["id"]: {k: v for k, v in x.items() if k not in ("id", "quando")} for x in dicas},
                                                 ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    # 2) Calendário do Brasil.
    br = Calendario(santoral)
    (SAIDA / "calendario").mkdir(parents=True, exist_ok=True)
    sem_leitura = collections.Counter()
    resumo = collections.Counter()
    for ano in ANOS:
        dias = {}
        for d, dia in sorted(br.ano(ano).items()):
            if dia["chave"] not in leituras:
                sem_leitura[dia["chave"]] += 1
            reg = {k: v for k, v in dia.items() if v not in (None, [], "")}
            reg["dicas"] = dicas_do_dia(d, dia, dicas)
            if eh_preceito(d, dia):
                reg["preceito"] = True
            reg["grauNome"] = GRAU_NOME.get(dia["grau"], "")
            reg["anoA"] = ciclo_dominical(d)
            reg["anoPar"] = ciclo_ferial(d)
            dias[d.isoformat()] = reg
            resumo[dia["grau"]] += 1
            if dia.get("revisar"):
                rel.append(f"{d.isoformat()}: {dia.get('memoria') or dia['nome']} (celebração própria do Brasil, conferir grau e data no Diretório da CNBB)")
        (SAIDA / "calendario" / f"{ano}.json").write_text(json.dumps(
            {"ano": ano, "pascoa": pascoa(ano).isoformat(), "dias": dias}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    for chave, n in sorted(sem_leitura.items()):
        rel.append(f"Sem leituras para a chave {chave} ({n} dias)")
    (SAIDA / "leituras.json").write_text(json.dumps(
        {"fonte": "Referências do Lecionário Romano (citações da USCCB via westhong/catholic-daily-readings) + próprias do Brasil",
         "aviso": "Os versículos podem diferir um pouco do Lecionário da CNBB. Salmos: numeração hebraica e, entre parênteses, a da Vulgata.",
         "leituras": leituras}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    REL.parent.mkdir(parents=True, exist_ok=True)
    REL.write_text("Pontos da liturgia para revisar (gerado por make_liturgia.py)\n\n" + "\n".join(rel) + "\n", encoding="utf-8")
    total_dias = sum(resumo.values())
    print(f"Calendário: {len(ANOS)} anos ({ANOS[0]}-{ANOS[-1]}), {total_dias} dias")
    print("  por grau: " + ", ".join(f"{GRAU_NOME.get(k, k)} {v}" for k, v in resumo.most_common()))
    print(f"Dicas: {len(dicas)}")
    print(f"Leituras: {len(leituras)} chaves; dias sem leitura: {sum(sem_leitura.values())} ({len(sem_leitura)} chaves)")
    print(f"  relatório: {REL.relative_to(RAIZ)} ({len(rel)} linhas)")


def converter_ref_pt(texto):
    return refs.ref(texto)


if __name__ == "__main__":
    main()

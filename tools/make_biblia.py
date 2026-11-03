"""Gera data/biblia/ a partir de tools/biblia_src/figueiredo/ (texto em domínio público).

O texto veio de OCR, então este script faz uma limpeza automática e conservadora:
  1. separa versículos que o OCR grudou no anterior (número lido como "Z", "IO", "q"...);
  2. junta palavras quebradas pela hifenização da página ("ver dade" -> "verdade");
  3. tira símbolos soltos do OCR (*, |, €, £...) e letras perdidas no fim do versículo;
  4. atualiza a ortografia de 1943 para a atual (êle -> ele, sôbre -> sobre, vêem -> veem).
O que não dá para corrigir com segurança vai para tools/relatorios/biblia.txt
(versículos que continuam faltando, versículos curtos demais, palavras suspeitas).

Uso: python3 tools/make_biblia.py
Saída: data/biblia/livros.json e data/biblia/<livro>.json
"""
import collections
import unicodedata
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import alinhar  # noqa: E402

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FONTE = RAIZ / "tools" / "biblia_src" / "figueiredo"
SAIDA = RAIZ / "data" / "biblia"
RELATORIO = RAIZ / "tools" / "relatorios" / "biblia.txt"

# Ordem do cânon católico, nomes e abreviações como na Bíblia da CNBB.
# id = nome do arquivo na fonte. Os Salmos seguem a numeração da Vulgata (grega),
# usada pela tradução de Figueiredo; veja SALMOS_HEBRAICO em make_liturgia.py.
LIVROS = [
    # id, nome, abreviação, testamento, grupo
    ("genesis", "Gênesis", "Gn", "AT", "Pentateuco"),
    ("exodo", "Êxodo", "Ex", "AT", "Pentateuco"),
    ("levitico", "Levítico", "Lv", "AT", "Pentateuco"),
    ("numeros", "Números", "Nm", "AT", "Pentateuco"),
    ("deuteronomio", "Deuteronômio", "Dt", "AT", "Pentateuco"),
    ("josue", "Josué", "Js", "AT", "Históricos"),
    ("juizes", "Juízes", "Jz", "AT", "Históricos"),
    ("rute", "Rute", "Rt", "AT", "Históricos"),
    ("1-samuel", "1 Samuel", "1Sm", "AT", "Históricos"),
    ("2-samuel", "2 Samuel", "2Sm", "AT", "Históricos"),
    ("1-reis", "1 Reis", "1Rs", "AT", "Históricos"),
    ("2-reis", "2 Reis", "2Rs", "AT", "Históricos"),
    ("1-cronicas", "1 Crônicas", "1Cr", "AT", "Históricos"),
    ("2-cronicas", "2 Crônicas", "2Cr", "AT", "Históricos"),
    ("esdras", "Esdras", "Esd", "AT", "Históricos"),
    ("neemias", "Neemias", "Ne", "AT", "Históricos"),
    ("tobias", "Tobias", "Tb", "AT", "Históricos"),
    ("judite", "Judite", "Jt", "AT", "Históricos"),
    ("ester", "Ester", "Est", "AT", "Históricos"),
    ("1-macabeus", "1 Macabeus", "1Mc", "AT", "Históricos"),
    ("2-macabeus", "2 Macabeus", "2Mc", "AT", "Históricos"),
    ("jo", "Jó", "Jó", "AT", "Sapienciais"),
    ("salmos", "Salmos", "Sl", "AT", "Sapienciais"),
    ("proverbios", "Provérbios", "Pr", "AT", "Sapienciais"),
    ("eclesiastes", "Eclesiastes", "Ecl", "AT", "Sapienciais"),
    ("cantico", "Cântico dos Cânticos", "Ct", "AT", "Sapienciais"),
    ("sabedoria", "Sabedoria", "Sb", "AT", "Sapienciais"),
    ("eclesiastico", "Eclesiástico (Sirácida)", "Eclo", "AT", "Sapienciais"),
    ("isaias", "Isaías", "Is", "AT", "Proféticos"),
    ("jeremias", "Jeremias", "Jr", "AT", "Proféticos"),
    ("lamentacoes", "Lamentações", "Lm", "AT", "Proféticos"),
    ("baruc", "Baruc", "Br", "AT", "Proféticos"),
    ("ezequiel", "Ezequiel", "Ez", "AT", "Proféticos"),
    ("daniel", "Daniel", "Dn", "AT", "Proféticos"),
    ("oseias", "Oseias", "Os", "AT", "Proféticos"),
    ("joel", "Joel", "Jl", "AT", "Proféticos"),
    ("amos", "Amós", "Am", "AT", "Proféticos"),
    ("abdias", "Abdias", "Ab", "AT", "Proféticos"),
    ("jonas", "Jonas", "Jn", "AT", "Proféticos"),
    ("miqueias", "Miqueias", "Mq", "AT", "Proféticos"),
    ("naum", "Naum", "Na", "AT", "Proféticos"),
    ("habacuc", "Habacuc", "Hab", "AT", "Proféticos"),
    ("sofonias", "Sofonias", "Sf", "AT", "Proféticos"),
    ("ageu", "Ageu", "Ag", "AT", "Proféticos"),
    ("zacarias", "Zacarias", "Zc", "AT", "Proféticos"),
    ("malaquias", "Malaquias", "Ml", "AT", "Proféticos"),
    ("mateus", "Mateus", "Mt", "NT", "Evangelhos"),
    ("marcos", "Marcos", "Mc", "NT", "Evangelhos"),
    ("lucas", "Lucas", "Lc", "NT", "Evangelhos"),
    ("joao", "João", "Jo", "NT", "Evangelhos"),
    ("atos", "Atos dos Apóstolos", "At", "NT", "Atos dos Apóstolos"),
    ("romanos", "Romanos", "Rm", "NT", "Cartas de São Paulo"),
    ("1-corintios", "1 Coríntios", "1Cor", "NT", "Cartas de São Paulo"),
    ("2-corintios", "2 Coríntios", "2Cor", "NT", "Cartas de São Paulo"),
    ("galatas", "Gálatas", "Gl", "NT", "Cartas de São Paulo"),
    ("efesios", "Efésios", "Ef", "NT", "Cartas de São Paulo"),
    ("filipenses", "Filipenses", "Fl", "NT", "Cartas de São Paulo"),
    ("colossenses", "Colossenses", "Cl", "NT", "Cartas de São Paulo"),
    ("1-tessalonicenses", "1 Tessalonicenses", "1Ts", "NT", "Cartas de São Paulo"),
    ("2-tessalonicenses", "2 Tessalonicenses", "2Ts", "NT", "Cartas de São Paulo"),
    ("1-timoteo", "1 Timóteo", "1Tm", "NT", "Cartas de São Paulo"),
    ("2-timoteo", "2 Timóteo", "2Tm", "NT", "Cartas de São Paulo"),
    ("tito", "Tito", "Tt", "NT", "Cartas de São Paulo"),
    ("filemom", "Filêmon", "Fm", "NT", "Cartas de São Paulo"),
    ("hebreus", "Hebreus", "Hb", "NT", "Cartas de São Paulo"),
    ("tiago", "Tiago", "Tg", "NT", "Cartas católicas"),
    ("1-pedro", "1 Pedro", "1Pd", "NT", "Cartas católicas"),
    ("2-pedro", "2 Pedro", "2Pd", "NT", "Cartas católicas"),
    ("1-joao", "1 João", "1Jo", "NT", "Cartas católicas"),
    ("2-joao", "2 João", "2Jo", "NT", "Cartas católicas"),
    ("3-joao", "3 João", "3Jo", "NT", "Cartas católicas"),
    ("judas", "Judas", "Jd", "NT", "Cartas católicas"),
    ("apocalipse", "Apocalipse", "Ap", "NT", "Apocalipse"),
]

# Letras que o OCR costuma confundir com algarismos.
OCR_DIGITO = {
    "I": "1", "l": "1", "|": "1", "!": "1", "]": "1", "i": "1",
    "Z": "2", "z": "2",
    "S": "5", "s": "5", "$": "5",
    "O": "0", "o": "0", "Q": "0", "D": "0",
    "B": "8", "G": "6", "b": "6", "g": "9", "q": "9", "A": "4", "T": "7",
}
SIMBOLOS_SOLTOS = re.compile(r"(?<!\S)[*|€£+=<>$%\[\]&/#~^]+(?!\S)")
PALAVRA = re.compile(r"[A-Za-zÀ-ÿ]+")
VOGAIS = "aeiouáéíóúâêôãõàüy"


def como_numero(tok):
    """Lê um token como número, aceitando confusões de OCR ("IO" -> "10")."""
    if not tok or len(tok) > 3:
        return None
    s = "".join(OCR_DIGITO.get(ch, ch) for ch in tok)
    return int(s) if s.isdigit() else None


def separar_grudados(versos):
    """Recebe [[n, texto]] de um capítulo e separa versículos grudados."""
    saida = []
    fila = list(versos)
    while fila:
        n, t = fila.pop(0)
        proximo_real = fila[0][0] if fila else None
        esperado = n + 1
        if proximo_real is not None and proximo_real > esperado:
            corte = achar_corte(t, esperado)
            if corte:
                antes, depois = corte
                saida.append([n, antes])
                fila.insert(0, [esperado, depois])
                continue
        elif proximo_real is None:
            corte = achar_corte(t, esperado)  # último versículo pode ter o seguinte grudado
            if corte and len(corte[1]) > 25:
                saida.append([n, corte[0]])
                fila.insert(0, [esperado, corte[1]])
                continue
        saida.append([n, t])
    return saida


LETRA_NUMERO = {"S", "Z", "I", "B", "G", "T", "Q", "D", "IS", "IO", "II", "Il", "lI", "SI", "ZI"}


def achar_corte(texto, numero):
    # Número grudado na palavra seguinte: "6Eo Senhor" -> corte antes de "Eo".
    for m in re.finditer(r"(?<!\S)(\d{1,3})(?=[A-ZÀ-Ý«“])", texto):
        if int(m.group(1)) == numero and m.start() >= 12:
            antes = texto[:m.start()].rstrip()
            depois = re.sub(r"^E([oa]s?) ", r"E \1 ", texto[m.end():].strip())
            if len(depois) >= 8:
                return antes, depois
    toks = list(re.finditer(r"\S+", texto))
    for i, m in enumerate(toks):
        if m.start() < 12 or i + 1 >= len(toks):
            continue
        if como_numero(m.group()) != numero:
            continue
        seguinte = toks[i + 1].group()
        if not re.match(r"[«\"“(]?[A-ZÀ-Ý]", seguinte) and m.group() not in LETRA_NUMERO and not m.group().isdigit():
            continue
        # Um "a", "e" ou "o" sozinho nunca é tomado como número.
        if m.group() in ("a", "e", "o", "A", "E", "O", "é", "s"):
            continue
        antes = texto[:m.start()].rstrip()
        depois = texto[toks[i + 1].start():].strip()
        antes = re.sub(r"\s+[^\saeoéàóAEOÉÀÓ]$", "", antes)  # sobra de OCR antes do número ("mundo: q")
        if len(depois) < 8:
            continue
        return antes, depois
    return None


NOTA_EDITOR = re.compile(r"\s*[“\"]?\s*[A-ZÀ-Ý]{3,}(?:[ ,-]+[A-ZÀ-Ý]{2,})*\s+—\s.*$")


def tirar_nota(t):
    """Corta comentário da edição de 1950 que o OCR misturou ao versículo ("PARAÍSO DAS DELÍCIAS — ...")."""
    novo = NOTA_EDITOR.sub("", t)
    return novo if len(novo) >= 12 else t, novo != t


def limpar_simbolos(t):
    t = SIMBOLOS_SOLTOS.sub(" ", t)
    t = re.sub(r"(\w)-\s+-?(\w)", r"\1-\2", t)                        # "Respondeu- -lhe" -> "Respondeu-lhe"
    t = re.sub(r"([.:;!?])\s*[A-ZÀ-Ýa-z]$", r"\1", t)          # letra perdida no fim
    t = re.sub(r"(?<=[a-zà-ÿ])\.(?=[a-zà-ÿ]{2,})", " ", t)       # "crêem.no" -> "crêem no"
    t = re.sub(r"(?<![\wÀ-ÿ])c (?=[a-zà-ú])", "e ", t)                # "c da tarde" -> "e da tarde" (OCR)
    t = re.sub(r"\b([Pp])rincipio", r"\1rincípio", t)
    t = re.sub(r"\s+([,.;:!?])", r"\1", t)
    t = re.sub(r"\s{2,}", " ", t)
    return t.strip()


def juntar_quebradas(t, vocab):
    """Junta duas metades de palavra quando a junção é uma palavra conhecida e uma das metades não é."""
    toks = t.split(" ")
    out = []
    i = 0
    while i < len(toks):
        a = toks[i]
        if i + 1 < len(toks):
            b = toks[i + 1]
            ma = re.fullmatch(r"([«\"“(]?)([a-zà-ÿ]+)", a, re.I)
            mb = re.fullmatch(r"([a-zà-ÿ]+)([,.;:!?»\"”)]*)", b)
            if ma and mb:
                junto = (ma.group(2) + mb.group(1)).lower()
                ca, cb = vocab[ma.group(2).lower()], vocab[mb.group(1).lower()]
                menor = min(ca, cb)
                if vocab[junto] >= 3 and menor < 200 and vocab[junto] * 2 >= menor:
                    out.append(ma.group(1) + ma.group(2) + mb.group(1) + mb.group(2))
                    i += 2
                    continue
        out.append(a)
        i += 1
    return " ".join(out)


# Palavras que mantêm o circunflexo/agudo na ortografia atual mesmo sendo paroxítonas.
MANTER = {"pôde", "têm", "vêm", "pôr", "contêm", "detêm", "mantêm", "retêm", "obtêm", "provêm", "convêm", "intervêm"}
HIATO_EEM = {"vêem": "veem", "crêem": "creem", "lêem": "leem", "dêem": "deem", "relêem": "releem", "descrêem": "descreem"}


def modernizar_palavra(p):
    base = p.lower()
    if base in MANTER or not re.search("[êôèò]", base):
        return p
    if base in HIATO_EEM:
        nova = HIATO_EEM[base]
        return nova.capitalize() if p[0].isupper() else nova
    q = p.replace("è", "e").replace("ò", "o").replace("È", "E").replace("Ò", "O")
    if base.endswith("mente"):
        return tirar_acento(q)
    pos = max(q.lower().rfind("ê"), q.lower().rfind("ô"))
    if pos < 0:
        return q
    resto = q.lower()[pos + 1:]
    grupos_depois = len(re.findall(f"[{VOGAIS}]+", resto))
    fim = tirar_acento(q.lower())
    if grupos_depois == 0:  # monossílabo tônico ou oxítona
        return q if re.search(r"(a|e|o|as|es|os|em|ens)$", fim) else tirar_acento(q)
    if grupos_depois >= 2:  # proparoxítona: mantém
        return q
    # paroxítona
    if re.search(r"(l|n|r|x|ps|i|is|us|um|uns|ão|ãos|ã|ãs|on|ons)$", fim):
        return q
    if re.search(r"[aeiou][aeiou]s?$", fim):  # termina em ditongo crescente (ciência, Babilônia)
        return q
    return tirar_acento(q)


def tirar_acento(p):
    return p.translate(str.maketrans("êôÊÔ", "eoEO"))


def modernizar(t):
    t = t.replace("ôó", "o").replace("êé", "e").replace("óô", "o")
    t = re.sub(r"[A-Za-zÀ-ÿ]+", lambda m: modernizar_palavra(m.group()), t)
    t = re.sub(r"\b([Ff])reqü", r"\1requ", t).replace("qüe", "que").replace("güe", "gue").replace("qüi", "qui").replace("güi", "gui")
    return t


def mapa_acentos(vocab):
    """Palavras que o OCR escreveu sem acento ("principio") quando a forma acentuada é muito mais comum."""
    sem = collections.defaultdict(list)
    for w, n in vocab.items():
        base = unicodedata.normalize("NFD", w)
        base = "".join(ch for ch in base if unicodedata.category(ch) != "Mn")
        if base != w:
            sem[base].append((n, w))
    mapa = {}
    for base, formas in sem.items():
        n, w = max(formas)
        if len(base) >= 6 and n >= 10 * max(1, vocab.get(base, 0)) and vocab.get(base, 0) <= 5:
            mapa[base] = w
    return mapa


def acentuar(t, mapa):
    def troca(m):
        p = m.group()
        nova = mapa.get(p.lower())
        if not nova:
            return p
        return nova.capitalize() if p[0].isupper() else nova
    return re.sub(r"[A-Za-zÀ-ÿ]+", troca, t)


def main():
    if not FONTE.exists():
        sys.exit("Fonte não encontrada. Rode antes: python3 tools/importar_figueiredo.py <pasta do clone>")
    brutos = {}
    vocab = collections.Counter()
    for lid, *_ in LIVROS:
        arq = FONTE / f"{lid}.json"
        if not arq.exists():
            sys.exit(f"Falta o livro {lid} em {FONTE}")
        brutos[lid] = json.loads(arq.read_text(encoding="utf-8"))
        for c in brutos[lid]["capitulos"]:
            for _, t in c["v"]:
                vocab.update(w.lower() for w in PALAVRA.findall(t))

    acentos = mapa_acentos(vocab)
    referencia = alinhar.carregar_referencia([l[0] for l in LIVROS[46:]])
    if referencia is None:
        print("  aviso: sem tools/biblia_src/referencia_tamanhos.json, alinhamento desligado")

    SAIDA.mkdir(parents=True, exist_ok=True)
    RELATORIO.parent.mkdir(parents=True, exist_ok=True)
    indice = []
    rel = []
    tot = collections.Counter()
    for ordem, (lid, nome, abrev, test, grupo) in enumerate(LIVROS, 1):
        caps_out = []
        for c in brutos[lid]["capitulos"]:
            antes = len(c["v"])
            versos = separar_grudados(c["v"])
            tot["separados"] += len(versos) - antes
            limpos = []
            for n, t in versos:
                t, cortou = tirar_nota(t)
                if cortou:
                    tot["notas"] += 1
                    rel.append(f"{abrev} {c['n']},{n}: comentário da edição removido; conferir se o versículo ficou completo")
                t2 = acentuar(modernizar(juntar_quebradas(limpar_simbolos(t), vocab)), acentos)
                limpos.append([n, t2])
                if len(t2) < 12:
                    rel.append(f"{abrev} {c['n']},{n}: versículo muito curto: {t2!r}")
                    tot["curtos"] += 1
            if referencia:
                ref_livro = referencia[lid]
                if c["n"] == 1:
                    razao = alinhar.razao_livro(brutos[lid]["capitulos"], ref_livro)
                antes_al = len(rel)
                limpos = alinhar.alinhar_capitulo(limpos, ref_livro.get(c["n"]), razao, rel, f"{abrev} {c['n']}")
                tot["alinhados"] += len(rel) - antes_al
                faltam_ref = len(ref_livro.get(c["n"], {}))
            ns = [n for n, _ in limpos]
            faltam = [k for k in range(1, max(max(ns), faltam_ref if referencia else 0) + 1) if k not in ns]
            if faltam:
                tot["faltando"] += len(faltam)
                rel.append(f"{abrev} {c['n']}: faltam os versículos {', '.join(map(str, faltam))}")
            if len(set(ns)) != len(ns):
                rel.append(f"{abrev} {c['n']}: número de versículo repetido")
            caps_out.append({"n": c["n"], "v": limpos, "total": max(max(ns), faltam_ref if referencia else 0)})
            tot["versiculos"] += len(limpos)
        tot["capitulos"] += len(caps_out)
        (SAIDA / f"{lid}.json").write_text(json.dumps(
            {"id": lid, "nome": nome, "abrev": abrev,
             "capitulos": [{"n": c["n"], "v": c["v"]} for c in caps_out]}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        indice.append({"id": lid, "nome": nome, "abrev": abrev, "testamento": test, "grupo": grupo,
                       "capitulos": len(caps_out), "versiculos": [c["total"] for c in caps_out], "ordem": ordem})

    ids = [l["id"] for l in indice]
    abrevs = [l["abrev"] for l in indice]
    assert len(set(ids)) == len(ids) and len(set(abrevs)) == len(abrevs), "id ou abreviação repetida"
    (SAIDA / "livros.json").write_text(json.dumps({
        "traducao": "Pe. Antônio Pereira de Figueiredo (domínio público)",
        "nota": "Texto obtido por OCR da edição de 1950 e revisado automaticamente; ortografia atualizada. Pode conter erros.",
        "salmos": "numeração da Vulgata (grega)",
        "livros": indice}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    RELATORIO.write_text("Pontos da Bíblia para revisar (gerado por make_biblia.py)\n\n" + "\n".join(rel) + "\n", encoding="utf-8")
    print(f"Bíblia: {len(indice)} livros, {tot['capitulos']} capítulos, {tot['versiculos']} versículos")
    print(f"  versículos separados do anterior: {tot['separados']}")
    print(f"  comentários da edição removidos: {tot['notas']}")
    print(f"  ajustes pelo alinhamento (separados ou notas cortadas): {tot['alinhados']}")
    print(f"  versículos ainda faltando: {tot['faltando']} | muito curtos: {tot['curtos']}")
    print(f"  relatório: {RELATORIO.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()

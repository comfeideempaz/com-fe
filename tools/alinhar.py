"""Alinhamento do texto de Figueiredo com uma Bíblia de referência da mesma base (Vulgata).

A edição de Figueiredo que temos veio de OCR e às vezes:
  - junta dois versículos num só (o número do segundo se perdeu);
  - mistura ao versículo notas de rodapé da edição de 1950.
Como a Douay-Rheims (inglês, domínio público, também traduzida da Vulgata) tem a mesma
divisão de capítulos e versículos, usamos o TAMANHO de cada versículo dela como régua:
um versículo muito maior que o esperado foi juntado com o seguinte ou recebeu uma nota.
O texto da Douay-Rheims NÃO entra no app; serve só de medida.
"""
import json
import pathlib
import re
import statistics

REF = pathlib.Path(__file__).resolve().parent / "biblia_src" / "referencia_tamanhos.json"
# Ordem dos livros na Douay-Rheims -> ids do app.
ORDEM_AT = ["genesis", "exodo", "levitico", "numeros", "deuteronomio", "josue", "juizes", "rute",
            "1-samuel", "2-samuel", "1-reis", "2-reis", "1-cronicas", "2-cronicas", "esdras", "neemias",
            "tobias", "judite", "ester", "jo", "salmos", "proverbios", "eclesiastes", "cantico",
            "sabedoria", "eclesiastico", "isaias", "jeremias", "lamentacoes", "baruc", "ezequiel",
            "daniel", "oseias", "joel", "amos", "abdias", "jonas", "miqueias", "naum", "habacuc",
            "sofonias", "ageu", "zacarias", "malaquias", "1-macabeus", "2-macabeus"]

FIM_FRASE = re.compile(r"[.:;!?»”'\"]\s+(?=\S)")


def carregar_referencia(ids_nt):
    """Devolve {livro: {capítulo: {versículo: tamanho}}} ou None se a referência não existir."""
    if not REF.exists():
        return None
    dados = json.loads(REF.read_text(encoding="utf-8"))["livros"]
    ids = ORDEM_AT + list(ids_nt)
    ref = {}
    for num, caps in dados.items():
        ref[ids[int(num) - 1]] = {int(c): dict(vs) for c, vs in caps.items()}
    return ref


def razao_livro(caps, ref_livro):
    r = [len(t) / ref_livro[c["n"]][n] for c in caps for n, t in c["v"]
         if ref_livro.get(c["n"], {}).get(n)]
    return statistics.median(r) if r else 1.0


def _cortes(t, minimo, maximo, so_maiuscula):
    for m in FIM_FRASE.finditer(t):
        if minimo <= m.end() <= maximo:
            if so_maiuscula and not re.match(r"[A-ZÀ-Ý«“\"]", t[m.end():]):
                continue
            yield m.end()


def melhor_corte(t, alvo, so_maiuscula):
    opcoes = list(_cortes(t, int(alvo * 0.6), int(alvo * 1.6) + 10, so_maiuscula))
    return min(opcoes, key=lambda p: abs(p - alvo)) if opcoes else None


def alinhar_capitulo(versos, ref_cap, razao, avisos, rotulo):
    """versos: [[n, texto]]. Separa versículos juntados e corta notas. Devolve a nova lista."""
    if not ref_cap:
        return versos
    esperado = lambda n: razao * ref_cap.get(n, 0)  # noqa: E731
    presentes = {n for n, _ in versos}
    saida = []
    fila = [list(v) for v in versos]
    while fila:
        n, t = fila.pop(0)
        e = esperado(n)
        prox = n + 1
        # 1) Versículo seguinte faltando e este grande demais: separa.
        if e and prox in ref_cap and prox not in presentes and len(t) > 1.5 * e + 20:
            p = melhor_corte(t, e, True)
            if p:
                cauda = t[p:].strip()
                if len(cauda) >= 0.5 * esperado(prox):
                    saida.append([n, t[:p].strip()])
                    presentes.add(prox)
                    fila.insert(0, [prox, cauda])
                    avisos.append(f"{rotulo},{prox}: separado do versículo {n} (conferir)")
                    continue
        # 2) Grande demais sem versículo faltando: nota de rodapé misturada.
        if e and len(t) > 1.8 * e + 40:
            p = melhor_corte(t, e, False)
            if p and len(t) - p >= 40:
                avisos.append(f"{rotulo},{n}: cortado texto estranho ao versículo: «{t[p:p + 60].strip()}…»")
                t = t[:p].strip()
        saida.append([n, t])
    return saida

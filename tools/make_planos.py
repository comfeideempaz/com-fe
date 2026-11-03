"""Gera data/planos.json: projetos de leitura da Bíblia.

Cada dia é uma lista de trechos [livroId, capítuloInicial, capítuloFinal].
Os planos sequenciais distribuem capítulos inteiros pelos dias equilibrando
o número de versículos (para cada dia ter mais ou menos o mesmo tempo de leitura).
O "plano livre" é montado no próprio aparelho com a mesma regra (js/planos.js).
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from refs import ref  # noqa: E402

RAIZ = pathlib.Path(__file__).resolve().parent.parent
LIVROS = json.loads((RAIZ / "data" / "biblia" / "livros.json").read_text(encoding="utf-8"))["livros"]
POR_ID = {l["id"]: l for l in LIVROS}
POR_ABREV = {l["abrev"]: l for l in LIVROS}


def capitulos(ids):
    return [(lid, c, POR_ID[lid]["versiculos"][c - 1]) for lid in ids for c in range(1, POR_ID[lid]["capitulos"] + 1)]


def distribuir(caps, dias):
    """Divide a lista de capítulos em `dias` blocos contíguos com peso parecido.
    Cada capítulo vai para o dia em que cai o meio dele na soma acumulada de versículos.
    Se houver mais dias que capítulos, alguns dias ficam vazios (lista vazia)."""
    total = sum(p for *_, p in caps)
    blocos = [[] for _ in range(dias)]
    acumulado = 0
    for lid, c, p in caps:
        meio = acumulado + p / 2
        blocos[min(dias - 1, int(meio / total * dias))].append((lid, c))
        acumulado += p
    return [compactar(b) for b in blocos]


def compactar(bloco):
    trechos = []
    for lid, c in bloco:
        if trechos and trechos[-1][0] == lid and trechos[-1][2] == c - 1:
            trechos[-1][2] = c
        else:
            trechos.append([lid, c, c])
    return trechos


def ids_de(*abrevs):
    return [POR_ABREV[a]["id"] for a in abrevs]


AT = [l["id"] for l in LIVROS if l["testamento"] == "AT"]
NT = [l["id"] for l in LIVROS if l["testamento"] == "NT"]


def plano_1_ano():
    # Todo dia um pouco do Antigo e um pouco do Novo Testamento (com Salmos à parte),
    # para não passar meses só em leis e genealogias.
    sem_salmos = [x for x in AT if x != "salmos"]
    at = distribuir(capitulos(sem_salmos), 365)
    nt = distribuir(capitulos(NT), 365)
    sl = distribuir(capitulos(["salmos"]), 365)
    return [a + s + n for a, s, n in zip(at, sl, nt)]


def salmos_proverbios():
    sl = distribuir(capitulos(["salmos"]), 31)
    return [s + [["proverbios", d, d]] for d, s in enumerate(sl, 1)]


# História da Salvação: os grandes passos de Deus com seu povo, em 60 dias.
HISTORIA = [
    ("A criação", "Gn 1-2"), ("O pecado e a promessa", "Gn 3"), ("Caim e Abel", "Gn 4"),
    ("O dilúvio e a aliança com Noé", "Gn 6-9"), ("A torre de Babel", "Gn 11"),
    ("O chamado de Abraão", "Gn 12"), ("A aliança com Abraão", "Gn 15"),
    ("O sacrifício de Isaac", "Gn 22"), ("Jacó e a escada", "Gn 28"),
    ("José vendido pelos irmãos", "Gn 37"), ("José no Egito", "Gn 41"),
    ("José perdoa os irmãos", "Gn 45"), ("Moisés e a sarça ardente", "Ex 3"),
    ("A Páscoa", "Ex 12"), ("A passagem do Mar Vermelho", "Ex 14-15"),
    ("O maná no deserto", "Ex 16"), ("Os Dez Mandamentos", "Ex 19-20"),
    ("O bezerro de ouro", "Ex 32"), ("Ouve, Israel", "Dt 6"),
    ("Josué e a terra prometida", "Js 1"), ("A queda de Jericó", "Js 6"),
    ("Gedeão", "Jz 6-7"), ("Rute", "Rt 1-4"), ("O chamado de Samuel", "1Sm 3"),
    ("Davi é ungido", "1Sm 16"), ("Davi e Golias", "1Sm 17"),
    ("A promessa a Davi", "2Sm 7"), ("O pecado e o arrependimento de Davi", "2Sm 11-12"),
    ("A sabedoria de Salomão", "1Rs 3"), ("A dedicação do Templo", "1Rs 8"),
    ("Elias no monte Carmelo", "1Rs 18"), ("Elias no Horeb", "1Rs 19"),
    ("A queda de Jerusalém", "2Rs 25"), ("O chamado de Isaías", "Is 6"),
    ("O Emanuel", "Is 7"), ("O Messias prometido", "Is 9; 11"),
    ("O Servo sofredor", "Is 52,13–53,12"), ("O chamado de Jeremias", "Jr 1"),
    ("A Nova Aliança", "Jr 31"), ("Os ossos secos", "Ez 37"),
    ("O Filho do Homem", "Dn 7"), ("A volta do exílio", "Esd 1; 3"),
    ("Os mártires macabeus", "2Mc 7"), ("A Anunciação", "Lc 1"),
    ("O nascimento de Jesus", "Lc 2"), ("O Batismo de Jesus", "Mt 3-4"),
    ("O Sermão da Montanha", "Mt 5-7"), ("As parábolas da misericórdia", "Lc 15"),
    ("O Pão da Vida", "Jo 6"), ("A ressurreição de Lázaro", "Jo 11"),
    ("A Última Ceia", "Jo 13-14"), ("A Paixão", "Jo 18-19"), ("A Ressurreição", "Jo 20-21"),
    ("A Ascensão e Pentecostes", "At 1-2"), ("A conversão de Paulo", "At 9"),
    ("O Concílio de Jerusalém", "At 15"), ("A vida no Espírito", "Rm 8"),
    ("O hino da caridade", "1Cor 13"), ("A Ressurreição dos mortos", "1Cor 15"),
    ("O novo céu e a nova terra", "Ap 21-22"),
]


def plano_historia():
    dias = []
    for titulo, citacao in HISTORIA:
        partes = []
        for pedaco in citacao.split(";"):
            pedaco = pedaco.strip()
            if not pedaco[0].isdigit() and " " not in pedaco:
                continue
            if " " not in pedaco:  # "11" depois de "Is 9;"
                pedaco = f"{livro_anterior} {pedaco}"
            livro_anterior = pedaco.split(" ")[0]
            if "-" in pedaco and "," not in pedaco:
                ab, caps = pedaco.split(" ")
                a, b = caps.split("-")
                partes.append([POR_ABREV[ab]["id"], int(a), int(b)])
            else:
                r = ref(pedaco)
                partes.append([r["livro"], r["trechos"][0][0], r["trechos"][-1][2]] +
                              ([r["txt"]] if "," in pedaco else []))
        dias.append({"titulo": titulo, "ref": citacao, "trechos": partes})
    return dias


def main():
    planos = [
        {"id": "biblia-1-ano", "nome": "A Bíblia toda em 1 ano",
         "descricao": "Todos os 73 livros, com um pouco do Antigo Testamento, um salmo e um pouco do Novo Testamento por dia. Cerca de 15 minutos diários.",
         "dias": plano_1_ano()},
        {"id": "biblia-2-anos", "nome": "A Bíblia toda em 2 anos",
         "descricao": "O mesmo caminho, com metade da leitura por dia: bom para quem está começando.",
         "dias": distribuir(capitulos([l["id"] for l in LIVROS]), 730)},
        {"id": "nt-90", "nome": "Novo Testamento em 90 dias",
         "descricao": "Os Evangelhos, os Atos, as Cartas e o Apocalipse em três meses.",
         "dias": distribuir(capitulos(NT), 90)},
        {"id": "evangelhos-30", "nome": "Os quatro Evangelhos em 30 dias",
         "descricao": "Mateus, Marcos, Lucas e João: a vida de Jesus em um mês.",
         "dias": distribuir(capitulos(ids_de("Mt", "Mc", "Lc", "Jo")), 30)},
        {"id": "salmos-proverbios-31", "nome": "Salmos e Provérbios em 31 dias",
         "descricao": "Cinco salmos e um capítulo de Provérbios por dia: oração e sabedoria para cada dia do mês.",
         "dias": salmos_proverbios()},
        {"id": "historia-salvacao", "nome": "A História da Salvação em 60 dias",
         "descricao": "Os grandes momentos da Bíblia, da Criação ao Apocalipse, para entender o fio que liga tudo.",
         "dias": plano_historia()},
    ]
    for p in planos:
        p["totalDias"] = len(p["dias"])
    saida = RAIZ / "data" / "planos.json"
    saida.write_text(json.dumps({"planos": planos}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for p in planos:
        print(f"{p['id']}: {p['totalDias']} dias; dia 1 = {p['dias'][0]}")


if __name__ == "__main__":
    main()

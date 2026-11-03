"""Motor do calendário litúrgico (rito romano, regras do Brasil).

Calcula, para qualquer data, o tempo litúrgico, a semana, a cor, a celebração
que prevalece (pela Tabela dos dias litúrgicos das Normas Universais do Ano
Litúrgico e do Calendário, NUALC 59-61), os santos do dia e a chave das
leituras no Lecionário. Usado por make_liturgia.py.

Regras próprias do Brasil (CNBB), ligadas por padrão (brasil=True):
  - Epifania no domingo entre 2 e 8 de janeiro;
  - Ascensão no 7º domingo da Páscoa;
  - São Pedro e São Paulo (1º domingo de julho), Assunção (3º domingo de agosto)
    e Todos os Santos (1º domingo de novembro) quando a data não cair num domingo;
  - Nossa Senhora Aparecida (12/10) é solenidade.
"""
import datetime as dt
import pathlib

D = dt.date
UM = dt.timedelta(days=1)
SEMANA = dt.timedelta(days=7)
DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
ORDINAL = {1: "1º", 2: "2º", 3: "3º", 4: "4º", 5: "5º", 6: "6º", 7: "7º", 8: "8º", 9: "9º"}

# Precedência (NUALC 59): número menor vence.
P_TRIDUO, P_GRANDES, P_SOLENIDADE, P_FINADOS, P_SOL_PROPRIA, P_FESTA_SENHOR, P_DOMINGO, P_FESTA, \
    P_FERIA_PRIV, P_MEMORIA, P_MEMORIA_FAC, P_FERIA = 1, 2, 3, 3.5, 4, 5, 6, 7, 9, 10, 12, 13

GRAU_NOME = {"S": "Solenidade", "FS": "Festa do Senhor", "F": "Festa", "M": "Memória", "m": "Memória facultativa",
             "FD": "Comemoração", "D": "Domingo", "f": "Dia de semana", "T": "Tríduo Pascal", "c": "Comemoração"}


def pascoa(ano):
    """Data da Páscoa (algoritmo gregoriano anônimo, de Meeus/Jones/Butcher)."""
    a, b, c = ano % 19, ano // 100, ano % 100
    d, e = b // 4, b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = c // 4, c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    mes = (h + l - 7 * m + 114) // 31
    dia = ((h + l - 7 * m + 114) % 31) + 1
    return D(ano, mes, dia)


def domingo_antes(d):
    """Domingo estritamente anterior a d."""
    return d - dt.timedelta(days=(d.weekday() + 1) % 7 or 7)


def domingo_em_ou_antes(d):
    return d - dt.timedelta(days=(d.weekday() + 1) % 7)


def domingo_em_ou_depois(d):
    return d + dt.timedelta(days=(6 - d.weekday()) % 7)


def advento1(ano):
    return domingo_antes(D(ano, 12, 25)) - 3 * SEMANA


def epifania(ano, brasil=True):
    return domingo_em_ou_depois(D(ano, 1, 2)) if brasil else D(ano, 1, 6)


def batismo(ano, brasil=True):
    ep = epifania(ano, brasil)
    if ep.day in (7, 8):
        return ep + UM
    return domingo_em_ou_depois(ep + UM)


def sagrada_familia(ano):
    natal = D(ano, 12, 25)
    if natal.weekday() == 6:
        return D(ano, 12, 30)
    return domingo_em_ou_depois(D(ano, 12, 26))


def ano_liturgico(d):
    """Ano civil que dá nome ao ano litúrgico de d (o ano que começa no Advento anterior)."""
    return d.year + 1 if d >= advento1(d.year) else d.year


def ciclo_dominical(d):
    return {1: "A", 2: "B", 0: "C"}[ano_liturgico(d) % 3]


def ciclo_ferial(d):
    return "I" if ano_liturgico(d) % 2 else "II"


def carregar_santoral(caminho):
    """Lê liturgia_src/santoral.txt -> {(mes, dia): [registro, ...]}."""
    tabela = {}
    for linha in pathlib.Path(caminho).read_text(encoding="utf-8").splitlines():
        if not linha.strip() or linha.startswith("#"):
            continue
        partes = [p.strip() for p in linha.split("|")]
        mmdd, sid, nome, grau, cor = partes[:5]
        obs = partes[5] if len(partes) > 5 else ""
        m, dd = map(int, mmdd.split("-"))
        tabela.setdefault((m, dd), []).append(
            {"id": sid, "nome": nome, "grau": grau, "cor": cor, "brasil": "brasil" in obs, "revisar": "revisar" in obs, "obs": obs})
    return tabela


class Calendario:
    def __init__(self, santoral, brasil=True, ascensao_domingo=None, transferir=None, corpus_domingo=False):
        self.corpus_domingo = corpus_domingo
        self.santoral = santoral
        self.brasil = brasil
        self.ascensao_domingo = brasil if ascensao_domingo is None else ascensao_domingo
        self.transferir = brasil if transferir is None else transferir
        self._anos = {}

    # ---------- tempo litúrgico ----------
    def tempo(self, d):
        y = d.year
        E = pascoa(y)
        cinzas, adv = E - dt.timedelta(days=46), advento1(y)
        bat = batismo(y, self.brasil)
        if d >= D(y, 12, 25):
            return "natal", None
        if d >= adv:
            return "advento", (d - adv).days // 7 + 1
        if d <= bat:
            return "natal", None
        if d < cinzas:
            return "comum", (d - domingo_em_ou_antes(bat)).days // 7 + 1
        if d < E - dt.timedelta(days=3):
            return "quaresma", (0 if d < cinzas + dt.timedelta(days=4) else (d - (cinzas + dt.timedelta(days=4))).days // 7 + 1)
        if d < E:
            return "triduo", None
        if d <= E + dt.timedelta(days=49):
            return "pascoa", (d - E).days // 7 + 1
        return "comum", 34 - (adv - UM - d).days // 7

    def temporal(self, d):
        """Dia do Próprio do Tempo: nome, precedência, cor, chave das leituras."""
        y, dow = d.year, (d.weekday() + 1) % 7  # 0 = domingo
        E = pascoa(y)
        t, sem = self.tempo(d)
        c, cf = ciclo_dominical(d), ciclo_ferial(d)
        dom = dow == 0
        nome_dia = DIAS[dow]
        R = lambda nome, prec, cor, chave, grau="f", **kw: dict(nome=nome, prec=prec, cor=cor, chave=chave, grau=grau, tempo=t, semana=sem, **kw)

        if t == "advento":
            cor = "rosa" if dom and sem == 3 else "roxo"
            if dom:
                return R(f"{ORDINAL[sem]} Domingo do Advento", P_GRANDES, cor, f"ADV{sem}-D-{c}", "D")
            if d.month == 12 and d.day >= 17:
                return R(f"{nome_dia} da {sem}ª Semana do Advento ({d.day} de dezembro)", P_FERIA_PRIV, cor, f"ADV-12{d.day:02d}")
            return R(f"{nome_dia} da {sem}ª Semana do Advento", P_FERIA, cor, f"ADV{sem}-{dow}")

        if t == "natal":
            if d == D(y, 12, 25):
                return R("Natal do Senhor", P_GRANDES, "branco", "NATAL", "S")
            if d == sagrada_familia(y):
                return R("Sagrada Família de Jesus, Maria e José", P_FESTA_SENHOR, "branco", f"SFAM-{c}", "FS")
            if d.month == 12:
                return R(f"{d.day} de dezembro, Oitava do Natal", P_FERIA_PRIV, "branco", f"NAT-12{d.day:02d}")
            ep, bat = epifania(y, self.brasil), batismo(y, self.brasil)
            if d == D(y, 1, 1):
                return R("Santa Maria, Mãe de Deus (Oitava do Natal)", P_SOLENIDADE, "branco", "S:maria-mae-de-deus", "S")
            if d == ep:
                return R("Epifania do Senhor", P_GRANDES, "branco", "EPIFANIA", "S")
            if d == bat:
                return R("Batismo do Senhor", P_FESTA_SENHOR, "branco", f"BATISMO-{c}", "FS")
            if d < ep:
                return R(f"{nome_dia} do Tempo do Natal ({d.day} de janeiro)", P_FERIA, "branco", f"NAT-01{d.day:02d}")
            return R(f"{nome_dia} depois da Epifania", P_FERIA, "branco", f"POSEPI-{dow}")

        if t == "comum":
            if dom:
                if sem == 34:
                    return R("Nosso Senhor Jesus Cristo, Rei do Universo", P_SOLENIDADE, "branco", f"CRISTO-REI-{c}", "S")
                return R(f"{sem}º Domingo do Tempo Comum", P_DOMINGO, "verde", f"TC{sem}-D-{c}", "D")
            return R(f"{nome_dia} da {sem}ª Semana do Tempo Comum", P_FERIA, "verde", f"TC{sem}-{dow}-{cf}")

        if t == "quaresma":
            cinzas = E - dt.timedelta(days=46)
            if d == cinzas:
                return R("Quarta-feira de Cinzas", P_GRANDES, "roxo", "CINZAS", "f")
            if sem == 0:
                return R(f"{nome_dia} depois das Cinzas", P_FERIA_PRIV, "roxo", f"CINZAS-{dow}")
            if d == E - SEMANA:
                return R("Domingo de Ramos e da Paixão do Senhor", P_GRANDES, "vermelho", f"RAMOS-{c}", "D")
            if d > E - SEMANA:
                return R(f"{nome_dia} Santa", P_GRANDES, "roxo", f"SANTA-{dow}")
            if dom:
                return R(f"{ORDINAL[sem]} Domingo da Quaresma", P_GRANDES, "rosa" if sem == 4 else "roxo", f"QUA{sem}-D-{c}", "D")
            return R(f"{nome_dia} da {sem}ª Semana da Quaresma", P_FERIA_PRIV, "roxo", f"QUA{sem}-{dow}")

        if t == "triduo":
            if dow == 4:
                return R("Quinta-feira Santa: Missa da Ceia do Senhor", P_TRIDUO, "branco", "QUINTA-SANTA", "T", obs="De manhã, a cor é roxa; à noite começa o Tríduo Pascal com a Missa da Ceia do Senhor.")
            if dow == 5:
                return R("Sexta-feira da Paixão do Senhor", P_TRIDUO, "vermelho", "SEXTA-SANTA", "T")
            return R("Sábado Santo: Vigília Pascal", P_TRIDUO, "branco", f"VIGILIA-{c}", "T", obs="Durante o dia não há Missa; a Vigília Pascal, à noite, já é a celebração da Páscoa.")

        # Páscoa
        k = (d - E).days
        if k == 0:
            return R("Domingo da Páscoa da Ressurreição do Senhor", P_TRIDUO, "branco", "PASCOA", "S")
        if k < 7:
            return R(f"{nome_dia} da Oitava da Páscoa", P_GRANDES, "branco", f"PAS1-{dow}", "S")
        if k == 49:
            return R("Domingo de Pentecostes", P_GRANDES, "vermelho", "PENTECOSTES", "S")
        if self.ascensao_domingo and k == 42:
            return R("Ascensão do Senhor", P_GRANDES, "branco", f"ASCENSAO-{c}", "S")
        if not self.ascensao_domingo and k == 39:
            return R("Ascensão do Senhor", P_GRANDES, "branco", f"ASCENSAO-{c}", "S")
        if dom:
            return R(f"{ORDINAL[sem]} Domingo da Páscoa", P_GRANDES, "branco", f"PAS{sem}-D-{c}", "D")
        return R(f"{nome_dia} da {sem}ª Semana da Páscoa", P_FERIA, "branco", f"PAS{sem}-{dow}")

    # ---------- celebrações móveis do santoral ----------
    def moveis(self, y):
        E = pascoa(y)
        out = {
            E + dt.timedelta(days=56): dict(id="trindade", nome="Santíssima Trindade", grau="S", cor="branco", chave="TRINDADE-{c}"),
            E + dt.timedelta(days=63 if self.corpus_domingo else 60): dict(id="corpus-christi", nome="Santíssimo Corpo e Sangue de Cristo (Corpus Christi)", grau="S", cor="branco", chave="CORPUS-{c}"),
            E + dt.timedelta(days=68): dict(id="sagrado-coracao", nome="Sagrado Coração de Jesus", grau="S", cor="branco", chave="SAGRADO-CORACAO-{c}"),
            E + dt.timedelta(days=69): dict(id="imaculado-coracao", nome="Imaculado Coração de Maria", grau="M", cor="branco", chave="S:imaculado-coracao"),
            E + dt.timedelta(days=50): dict(id="maria-mae-da-igreja", nome="Bem-aventurada Virgem Maria, Mãe da Igreja", grau="M", cor="branco", chave="S:maria-mae-da-igreja"),
        }
        return out

    def fixos(self, d):
        """Celebrações de data fixa do santoral para o dia d, já com as transferências do Brasil."""
        y = d.year
        itens = [dict(s) for s in self.santoral.get((d.month, d.day), [])]
        if self.transferir:
            # Diretório Litúrgico da CNBB: Pedro e Paulo no 1º domingo de julho; Assunção no 3º domingo
            # de agosto; Todos os Santos no 1º domingo de novembro (se a data já não for domingo).
            regras = (((6, 29), "pedro-e-paulo", D(y, 7, 1)), ((8, 15), "assuncao", D(y, 8, 15)), ((11, 1), "todos-os-santos", D(y, 11, 1)))
            for (m, dd), alvo, base in regras:
                orig = D(y, m, dd)
                dom = orig if orig.weekday() == 6 else domingo_em_ou_depois(base)
                if orig != dom:
                    itens = [s for s in itens if s["id"] != alvo] if d == orig else itens
                    if d == dom:
                        s = next(s for s in self.santoral[(m, dd)] if s["id"] == alvo)
                        itens.append(dict(s, transferida=f"Transferida de {dd:02d}/{m:02d} para o domingo (CNBB)."))
            # Se Todos os Santos cair em 2/11 (domingo), Finados passa para 3/11.
            if D(y, 11, 1).weekday() == 5:
                if d == D(y, 11, 2):
                    itens = [s for s in itens if s["id"] != "finados"]
                elif d == D(y, 11, 3):
                    f = next(s for s in self.santoral[(11, 2)] if s["id"] == "finados")
                    itens.append(dict(f, transferida="Transferida para 3/11 porque Todos os Santos foi celebrado no domingo, 2/11.", revisar=True))
        if not self.brasil:
            itens = [s for s in itens if not s["brasil"]]
        return itens

    # ---------- o dia ----------
    def ano(self, y):
        """Calcula o ano civil inteiro, resolvendo transferências de solenidades impedidas."""
        if y in self._anos:
            return self._anos[y]
        dias = {}
        pendentes = []
        d = D(y, 1, 1)
        moveis = self.moveis(y)
        while d.year == y:
            tp = self.temporal(d)
            cands = []
            for s in self.fixos(d):
                cands.append(s)
            if d in moveis:
                cands.append(dict(moveis[d]))
            dias[d] = (tp, cands)
            d += UM
        # Solenidades impedidas vão para o próximo dia livre (NUALC 60).
        for d in sorted(dias):
            tp, cands = dias[d]
            for s in list(cands):
                if s["grau"] == "S" and tp["prec"] <= P_GRANDES and tp["chave"] != "S:maria-mae-de-deus":
                    cands.remove(s)
                    alvo = self._dia_livre(d, dias, s)
                    s = dict(s, transferida=f"Transferida de {d.day:02d}/{d.month:02d} por coincidir com {tp['nome']}.")
                    if alvo:
                        dias[alvo][1].append(s)
        for d in sorted(dias):
            dias[d] = self._resolver(d, *dias[d])
        self._anos[y] = dias
        return dias

    def _dia_livre(self, d, dias, s):
        E = pascoa(d.year)
        if s["id"] == "sao-jose" and E - SEMANA <= d <= E + SEMANA:
            return E - dt.timedelta(days=8)  # sábado antes do Domingo de Ramos
        if s["id"] == "anunciacao" and E - SEMANA <= d <= E + SEMANA:
            return E + dt.timedelta(days=8)  # segunda-feira depois do 2º Domingo da Páscoa
        x = d + UM
        while x in dias and (dias[x][0]["prec"] <= P_GRANDES or any(c["grau"] == "S" for c in dias[x][1])):
            x += UM
        return x if x in dias else None

    def _resolver(self, d, tp, cands):
        prec_s = {"S": P_SOLENIDADE, "FS": P_FESTA_SENHOR, "F": P_FESTA, "M": P_MEMORIA, "m": P_MEMORIA_FAC, "FD": P_FINADOS}
        for s in cands:
            s["prec"] = prec_s[s["grau"]]
            if s["grau"] == "S" and s.get("brasil"):
                s["prec"] = P_SOL_PROPRIA
            if s["id"] == "maria-mae-de-deus":
                s["prec"] = P_SOLENIDADE
        # Dois ou mais santos com memória obrigatória no mesmo dia: todos ficam facultativos.
        if sum(1 for s in cands if s["grau"] == "M") > 1:
            for s in cands:
                if s["grau"] == "M":
                    s["grau"], s["prec"] = "m", P_MEMORIA_FAC
        vencedor = None
        fortes = [s for s in cands if s["grau"] in ("S", "FS", "F", "FD")]
        if fortes:
            melhor = min(fortes, key=lambda s: s["prec"])
            if melhor["prec"] < tp["prec"]:
                vencedor = melhor
        celebrados, comemoracoes = [], []
        for s in cands:
            if s is vencedor or s["grau"] not in ("M", "m"):
                continue
            if vencedor is not None or tp["prec"] <= P_DOMINGO:
                continue  # memória omitida em domingo, solenidade, festa ou dia privilegiado
            if tp["prec"] == P_FERIA_PRIV:
                comemoracoes.append(dict(s, grau="c"))
            else:
                celebrados.append(s)
        if vencedor:
            chave = vencedor.get("chave", f"S:{vencedor['id']}").replace("{c}", ciclo_dominical(d))
            if vencedor["id"] == "transfiguracao":
                chave += "-" + ciclo_dominical(d)  # evangelho de Mt, Mc ou Lc conforme o ano
            dia = dict(nome=vencedor["nome"], grau=vencedor["grau"], cor=vencedor["cor"], chave=chave,
                       santo=vencedor["id"] if "chave" not in vencedor or vencedor["chave"].startswith("S:") else None)
            if vencedor.get("transferida"):
                dia["transferida"] = vencedor["transferida"]
            if vencedor.get("revisar"):
                dia["revisar"] = True
        else:
            dia = dict(nome=tp["nome"], grau=tp["grau"], cor=tp["cor"], chave=tp["chave"], santo=None)
            obrig = [s for s in celebrados if s["grau"] == "M"]
            if obrig:
                dia["memoria"] = obrig[0]["nome"]
                dia["cor"] = obrig[0]["cor"]
                if obrig[0]["id"] in ("imaculado-coracao", "maria-mae-da-igreja"):
                    dia["chave"] = f"S:{obrig[0]['id']}"
        dia.update(tempo=tp["tempo"], semana=tp["semana"], corTempo=tp["cor"], diaTempo=tp["nome"],
                   santos=[s["id"] for s in ([vencedor] if vencedor and "chave" not in vencedor else []) + celebrados + comemoracoes],
                   facultativas=[s["nome"] for s in celebrados if s["grau"] == "m"],
                   comemoracoes=[s["nome"] for s in comemoracoes])
        if tp.get("obs"):
            dia["obs"] = tp["obs"]
        if any(s.get("revisar") for s in celebrados + comemoracoes):
            dia["revisar"] = True
        return dia

    def dia(self, d):
        return self.ano(d.year)[d]

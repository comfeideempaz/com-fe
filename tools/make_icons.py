"""Gera os ícones do app (PWA, maskable, apple-touch, favicon) a partir da arte do
ícone "Com Fé!" em tools/icone_src/com-fe.jpeg.

A arte veio como foto de um ícone de cantos arredondados sobre fundo branco. O script
recorta o quadrado, preenche os cantos brancos com a cor vizinha (difusão simples) e
gera cada tamanho. Uso (na raiz do projeto): python3 -I tools/make_icons.py
Depois rode tools/make_sw.py para o cache novo.
"""
import pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FONTE = RAIZ / "tools" / "icone_src" / "com-fe.jpeg"
PASTA = RAIZ / "icons"
CAIXA = (33, 23, 309, 309)  # recorte do ícone dentro da foto (sem a borda e a sombra)

def base_quadrada(lado=1024):
    im = Image.open(FONTE).convert("RGB").crop(CAIXA)
    a = np.asarray(im).astype(float)
    h, w, _ = a.shape
    sat = a.max(axis=2) - a.min(axis=2)
    claro = (sat < 40) & (a.max(axis=2) > 110)
    # Fundo = pixels claros ligados aos cantos (flood fill a partir dos quatro cantos).
    fundo = np.zeros((h, w), bool)
    pilha = [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]
    while pilha:
        y, x = pilha.pop()
        if 0 <= y < h and 0 <= x < w and claro[y, x] and not fundo[y, x]:
            fundo[y, x] = True
            pilha += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    # Folga de 2 px para engolir a borda clara antialiasada.
    for _ in range(2):
        f = fundo.copy()
        f[1:] |= fundo[:-1]; f[:-1] |= fundo[1:]; f[:, 1:] |= fundo[:, :-1]; f[:, :-1] |= fundo[:, 1:]
        fundo = f
    # Preenche o fundo pela média dos vizinhos conhecidos, repetidas vezes.
    conhecido = ~fundo
    a[fundo] = 0
    for _ in range(400):
        p = np.pad(a * conhecido[..., None], ((1, 1), (1, 1), (0, 0)), mode="edge")
        k = np.pad(conhecido.astype(float), 1, mode="edge")
        soma = p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]
        n = k[:-2, 1:-1] + k[2:, 1:-1] + k[1:-1, :-2] + k[1:-1, 2:]
        novo = fundo & ~conhecido & (n > 0)
        if not novo.any():
            break
        a[novo] = soma[novo] / n[novo][:, None]
        conhecido = conhecido | novo
    # Suaviza só a área preenchida.
    img = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    borrado = img.filter(ImageFilter.GaussianBlur(4))
    mascara = Image.fromarray((fundo * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    img = Image.composite(borrado, img, mascara)
    return img.resize((lado, lado), Image.LANCZOS)

def arredondar(img, raio):
    m = Image.new("L", (img.width * 4, img.height * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, m.width - 1, m.height - 1), radius=raio * m.width, fill=255)
    out = img.convert("RGBA")
    out.putalpha(m.resize(img.size, Image.LANCZOS))
    return out

base = base_quadrada()
salvar = lambda im, nome, t: im.resize((t, t), Image.LANCZOS).save(PASTA / nome, optimize=True)

for t in [72, 96, 128, 144, 152, 192, 384, 512]:
    salvar(arredondar(base, 0.2), f"icon-{t}.png", t)
salvar(arredondar(base, 0.2), "favicon.png", 64)
salvar(base, "apple-touch-icon.png", 180)  # o iOS arredonda sozinho
# Maskable: o sistema pode cortar em círculo; a arte inteira fica na zona segura (80%),
# sobre um degradê com as cores do topo (dourado) e da base (azul-noite) da própria arte.
arr = np.asarray(base).astype(float)
topo, pe = arr[:40].mean(axis=(0, 1)), arr[-40:].mean(axis=(0, 1))
t = np.linspace(0, 1, 1024)[:, None, None]
fundo = Image.fromarray((topo * (1 - t) + pe * t).repeat(1024, axis=1).clip(0, 255).astype(np.uint8))
miolo = arredondar(base.resize((780, 780), Image.LANCZOS), 0.12)
fundo.paste(miolo, (122, 122), miolo)
salvar(fundo, "maskable-512.png", 512)
print("ícones gerados em icons/")

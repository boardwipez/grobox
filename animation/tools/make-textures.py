#!/usr/bin/env python3
"""
Generates the tileable paper textures used by the GROBOX animation.

    python3 tools/make-textures.py

Writes PNGs into assets/paper-textures/. Every texture is seeded, so running
the script again gives byte-identical results. Edit the constants below to
change how rough / fibrous the paper looks.
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'paper-textures')
os.makedirs(OUT, exist_ok=True)


def tile_noise(size, scale, rng):
    """Smooth tileable value noise in [0,1]."""
    n = max(2, size // scale)
    grid = rng.random((n, n))
    img = Image.fromarray((grid * 255).astype(np.uint8)).resize((size, size), Image.BICUBIC)
    # wrap-blur to hide the seam
    a = np.asarray(img).astype(np.float32) / 255.0
    return a


def fbm(size, rng, octaves=((64, .5), (24, .3), (8, .2))):
    acc = np.zeros((size, size), np.float32)
    for scale, w in octaves:
        acc += tile_noise(size, scale, rng) * w
    return acc


def wrap_lines(draw, size, pts, **kw):
    for ox in (-size, 0, size):
        for oy in (-size, 0, size):
            draw.line([(x + ox, y + oy) for x, y in pts], **kw)


def wrap_poly(draw, size, pts, **kw):
    for ox in (-size, 0, size):
        for oy in (-size, 0, size):
            draw.polygon([(x + ox, y + oy) for x, y in pts], **kw)


def wrap_ellipse(draw, size, box, **kw):
    x0, y0, x1, y1 = box
    for ox in (-size, 0, size):
        for oy in (-size, 0, size):
            draw.ellipse((x0 + ox, y0 + oy, x1 + ox, y1 + oy), **kw)


def fibres(draw, size, rng, count, length, colour_fn, width=1):
    for _ in range(count):
        x, y = rng.random() * size, rng.random() * size
        ang = rng.random() * np.pi * 2
        pts = [(x, y)]
        L = length * (0.4 + rng.random())
        steps = 6
        for _ in range(steps):
            ang += (rng.random() - .5) * .7
            x += np.cos(ang) * L / steps
            y += np.sin(ang) * L / steps
            pts.append((x, y))
        wrap_lines(draw, size, pts, fill=colour_fn(), width=width)


def paper_background():
    """Warm off-white watercolour-paper sheet for the stage."""
    rng = np.random.default_rng(11)
    S = 1024
    n = fbm(S, rng, ((128, .45), (48, .3), (12, .15), (3, .10)))
    base = np.array([244, 241, 234], np.float32)
    shade = (n - .5) * 16
    rgb = np.clip(base[None, None, :] + shade[..., None], 0, 255).astype(np.uint8)
    img = Image.fromarray(rgb, 'RGB')
    d = ImageDraw.Draw(img, 'RGBA')
    fibres(d, S, rng, 900, 26, lambda: (255, 255, 255, int(40 + rng.random() * 60)))
    fibres(d, S, rng, 500, 22, lambda: (170, 155, 130, int(10 + rng.random() * 22)))
    img = img.filter(ImageFilter.GaussianBlur(.5))
    img.save(os.path.join(OUT, 'paper-bg.jpg'), quality=90)


def fibre_overlay():
    """Transparent fibre/fleck overlay laid on every paper shape."""
    rng = np.random.default_rng(23)
    S = 512
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, 'RGBA')
    n = fbm(S, rng, ((64, .5), (16, .3), (4, .2)))
    mottle = Image.fromarray((np.clip((n - .5) * 2, -1, 1) * 0 + 0).astype(np.uint8))
    # mottled light/dark blotches
    alpha = (np.abs(n - .5) * 70).astype(np.uint8)
    dark = n < .5
    arr = np.zeros((S, S, 4), np.uint8)
    arr[..., 0:3] = np.where(dark[..., None], np.array([60, 45, 30]), np.array([255, 255, 255]))
    arr[..., 3] = alpha
    img = Image.alpha_composite(img, Image.fromarray(arr, 'RGBA'))
    d = ImageDraw.Draw(img, 'RGBA')
    fibres(d, S, rng, 260, 20, lambda: (255, 255, 255, int(70 + rng.random() * 80)))
    fibres(d, S, rng, 200, 16, lambda: (70, 50, 30, int(18 + rng.random() * 30)))
    for _ in range(900):
        x, y = rng.random() * S, rng.random() * S
        r = .4 + rng.random() * .9
        c = (60, 45, 30, int(20 + rng.random() * 40)) if rng.random() < .5 else (255, 255, 255, int(60 + rng.random() * 80))
        wrap_ellipse(d, S, (x - r, y - r, x + r, y + r), fill=c)
    img.save(os.path.join(OUT, 'fibre.png'))
    del mottle


def grain():
    """Fine neutral grain multiplied over the whole frame (camera/paper grain)."""
    rng = np.random.default_rng(5)
    S = 512
    n = rng.normal(0, 1, (S, S))
    n = (n - n.min()) / (n.max() - n.min())
    v = (215 + n * 40).clip(0, 255).astype(np.uint8)
    Image.fromarray(v, 'L').convert('RGB').save(os.path.join(OUT, 'grain.png'))


def chips_texture(name, base, chip_cols, white=0, threads=0, seed=1, S=512, n_chips=420, chip_len=(9, 30), bg_alpha=255):
    """Hemp hurd chips (optionally with white mycelium flecks / curls)."""
    rng = np.random.default_rng(seed)
    img = Image.new('RGBA', (S, S), base + (bg_alpha,))
    d = ImageDraw.Draw(img, 'RGBA')
    for _ in range(n_chips):
        x, y = rng.random() * S, rng.random() * S
        L = chip_len[0] + rng.random() * (chip_len[1] - chip_len[0])
        W = L * (.18 + rng.random() * .22)
        a = rng.random() * np.pi
        ca, sa = np.cos(a), np.sin(a)
        pts = []
        for px, py in ((-L / 2, -W / 2), (L / 2, -W / 2 + rng.normal() * W * .2), (L / 2 + rng.normal() * 2, W / 2), (-L / 2, W / 2)):
            pts.append((x + px * ca - py * sa, y + px * sa + py * ca))
        c = chip_cols[int(rng.random() * len(chip_cols))]
        shade = int(rng.normal() * 8)
        col = tuple(int(np.clip(v + shade, 0, 255)) for v in c) + (255,)
        # small shadow
        wrap_poly(d, S, [(px + 1.2, py + 1.6) for px, py in pts], fill=(70, 50, 30, 60))
        wrap_poly(d, S, pts, fill=col)
        # grain line
        wrap_lines(d, S, [((pts[0][0] + pts[3][0]) / 2, (pts[0][1] + pts[3][1]) / 2), ((pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2)], fill=(120, 90, 55, 90), width=1)
    for _ in range(white):
        x, y = rng.random() * S, rng.random() * S
        r = 1.0 + rng.random() * 2.0
        wrap_ellipse(d, S, (x - r + 1, y - r + 1.5, x + r + 1, y + r + 1.5), fill=(80, 60, 40, 50))
        wrap_ellipse(d, S, (x - r, y - r, x + r, y + r), fill=(250, 248, 242, 255))
    for _ in range(threads):
        x, y = rng.random() * S, rng.random() * S
        ang = rng.random() * np.pi * 2
        pts = [(x, y)]
        for _ in range(8):
            ang += (rng.random() - .5) * 1.6
            x += np.cos(ang) * 4
            y += np.sin(ang) * 4
            pts.append((x, y))
        wrap_lines(d, S, pts, fill=(252, 250, 244, 230), width=2)
    img.save(os.path.join(OUT, name))


def grobox_material():
    """Beige moulded hemp-mycelium composite skin."""
    rng = np.random.default_rng(31)
    S = 512
    n = fbm(S, rng, ((48, .5), (12, .3), (4, .2)))
    base = np.array([226, 210, 178], np.float32)
    rgb = np.clip(base[None, None, :] + (n[..., None] - .5) * 20, 0, 255).astype(np.uint8)
    img = Image.fromarray(rgb, 'RGB').convert('RGBA')
    d = ImageDraw.Draw(img, 'RGBA')
    for _ in range(1500):
        x, y = rng.random() * S, rng.random() * S
        L = 3 + rng.random() * 10
        a = rng.random() * np.pi
        W = 1 + rng.random() * 2.2
        col = [(196, 162, 112), (210, 180, 132), (180, 146, 98), (236, 224, 198)][int(rng.random() * 4)]
        pts = [(x - np.cos(a) * L / 2, y - np.sin(a) * L / 2), (x + np.cos(a) * L / 2, y + np.sin(a) * L / 2)]
        wrap_lines(d, S, pts, fill=col + (int(120 + rng.random() * 110),), width=int(W))
    for _ in range(500):
        x, y = rng.random() * S, rng.random() * S
        r = .5 + rng.random() * 1.2
        wrap_ellipse(d, S, (x - r, y - r, x + r, y + r), fill=(250, 246, 236, int(120 + rng.random() * 100)))
    fibres(d, S, rng, 120, 10, lambda: (250, 247, 240, int(60 + rng.random() * 90)))
    img.convert('RGB').save(os.path.join(OUT, 'grobox-material.png'))


def eps_foam():
    """Expanded polystyrene beads."""
    rng = np.random.default_rng(41)
    S = 256
    img = Image.new('RGBA', (S, S), (246, 246, 243, 255))
    d = ImageDraw.Draw(img, 'RGBA')
    for _ in range(520):
        x, y = rng.random() * S, rng.random() * S
        r = 3 + rng.random() * 4
        wrap_ellipse(d, S, (x - r, y - r, x + r, y + r), outline=(205, 207, 210, 70), width=1)
        wrap_ellipse(d, S, (x - r * .5, y - r * .7, x, y - r * .2), fill=(255, 255, 255, 160))
    img.save(os.path.join(OUT, 'eps-foam.png'))


def soil():
    rng = np.random.default_rng(51)
    S = 384
    img = Image.new('RGBA', (S, S), (92, 66, 44, 255))
    d = ImageDraw.Draw(img, 'RGBA')
    for _ in range(1600):
        x, y = rng.random() * S, rng.random() * S
        r = .8 + rng.random() * 3.5
        c = [(70, 50, 34), (110, 80, 54), (58, 42, 30), (128, 96, 64), (84, 60, 40)][int(rng.random() * 5)]
        wrap_ellipse(d, S, (x - r, y - r * .8, x + r, y + r * .8), fill=c + (int(150 + rng.random() * 100),))
    img.save(os.path.join(OUT, 'soil.png'))


if __name__ == '__main__':
    paper_background()
    fibre_overlay()
    grain()
    KRAFT = [(201, 165, 116), (216, 184, 134), (184, 143, 92), (224, 197, 151), (196, 158, 104)]
    chips_texture('hurds.png', (150, 115, 76), KRAFT, seed=3, n_chips=1500)
    chips_texture('mix.png', (150, 115, 76), KRAFT, white=420, threads=110, seed=4, n_chips=1400)
    chips_texture('mix-grown.png', (226, 214, 190), KRAFT, white=700, threads=520, seed=6, n_chips=900)
    grobox_material()
    eps_foam()
    soil()
    print('textures written to', os.path.abspath(OUT))

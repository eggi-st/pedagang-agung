#!/usr/bin/env python3
"""
tools/make-sprite.py — post-process sprite AI menjadi aset game.

    python3 tools/make-sprite.py <input.png> <sprite-id> [--outdir DIR]

Langkah: flood-fill hapus background putih dari sudut -> transparan,
crop ke bounding box, simpan ke <outdir>/<sprite-id>.png
(atau <outdir>/<sprite-id>-<State>.png bila --state dipakai),
update <outdir>/manifest.json (w/h otomatis; state tercatat di
manifest[<base-id>]["states"][State]).

Jalankan dari root repo. Lihat ASSET-PIPELINE.md di workspace.
"""
import json
import os
import sys
from collections import deque
from PIL import Image

sys.setrecursionlimit(10000000)

TYPE_BY_PREFIX = {
    "companion-": "character",
    "monster-": "monster",
    "npc-": "npc",
    "item-": "item",
    "player-": "character",
    "pedagang-": "character",
}


def infer_type(sprite_id):
    for prefix, t in TYPE_BY_PREFIX.items():
        if sprite_id.startswith(prefix):
            return t
    return "misc"


def near_white(p):
    return p[0] > 225 and p[1] > 225 and p[2] > 225


def clear_white_pockets(img, thresh=255, min_area=250):
    """Hapus kantong putih TERJEPIT (mis. di dalam lengkung busur) yang tidak
    terjangkau flood-fill tepi. Hanya menyentuh piksel PUTIH MURNI (255)
    karena background generator selalu #FFFFFF, sedangkan detail putih
    (baju, mata) selalu punya shading (<255). Pelajaran 2026-11-03:
    thresh 242 ikut memakan hanbok putih tabib; 255 aman (terukur)."""
    w, h = img.size
    px = img.load()
    # masker piksel putih-buram
    white = bytearray(w * h)
    for y in range(h):
        base = y * w
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 128 and r >= thresh and g >= thresh and b >= thresh:
                white[base + x] = 1
    seen = bytearray(w * h)
    cleared = 0
    for i in range(w * h):
        if not white[i] or seen[i]:
            continue
        # BFS satu komponen putih
        comp = [i]
        seen[i] = 1
        q = deque([i])
        while q:
            c = q.popleft()
            cx, cy = c % w, c // w
            for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                if 0 <= nx < w and 0 <= ny < h:
                    ni = ny * w + nx
                    if white[ni] and not seen[ni]:
                        seen[ni] = 1
                        q.append(ni)
                        comp.append(ni)
        if len(comp) >= min_area:
            for c in comp:
                r, g, b, _a = px[c % w, c // w]
                px[c % w, c // w] = (r, g, b, 0)
            cleared += len(comp)
    return cleared


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src, sprite_id = sys.argv[1], sys.argv[2]
    outdir = "public/assets/sprites"
    state = None
    args = sys.argv[3:]
    for i, a in enumerate(args):
        if a == "--outdir" and i + 1 < len(args):
            outdir = args[i + 1]
        if a == "--state" and i + 1 < len(args):
            state = args[i + 1]
    os.makedirs(outdir, exist_ok=True)
    # --state Walk: base id "goblin-hutan", file "goblin-hutan-Walk.png".
    base_id = sprite_id
    file_name = sprite_id + ".png"
    if state:
        if sprite_id.endswith("-" + state):
            base_id = sprite_id[: -(len(state) + 1)]
        file_name = base_id + "-" + state + ".png"

    img = Image.open(src).convert("RGBA")
    w, h = img.size
    px = img.load()
    seen = set()
    for sx, sy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if (sx, sy) in seen or not near_white(px[sx, sy]):
            continue
        q = deque([(sx, sy)])
        seen.add((sx, sy))
        while q:
            x, y = q.popleft()
            r, g, b, _a = px[x, y]
            px[x, y] = (r, g, b, 0)
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and near_white(px[nx, ny]):
                    seen.add((nx, ny))
                    q.append((nx, ny))

    # Pass 2: bersihkan kantong putih terjepit (tidak terhubung ke tepi).
    pockets = clear_white_pockets(img)

    bbox = img.getbbox()
    if not bbox:
        print("GAGAL: tidak ada konten non-transparan")
        sys.exit(2)
    crop = img.crop(bbox)
    out_path = os.path.join(outdir, file_name)
    crop.save(out_path)

    manifest_path = os.path.join(outdir, "manifest.json")
    manifest = {}
    if os.path.exists(manifest_path):
        with open(manifest_path) as f:
            manifest = json.load(f)
    entry = manifest.get(base_id, {
        "file": base_id + ".png",
        "type": infer_type(base_id),
        "w": crop.size[0],
        "h": crop.size[1],
    })
    if state:
        states = entry.get("states", {})
        # Idle selalu menunjuk file dasar.
        states.setdefault("Idle", entry["file"])
        states[state] = file_name
        entry["states"] = states
    else:
        entry["file"] = file_name
        entry["w"] = crop.size[0]
        entry["h"] = crop.size[1]
        # Jaga konsistensi: Idle = file dasar.
        if "states" in entry:
            entry["states"]["Idle"] = file_name
    manifest[base_id] = entry
    # Daftarkan juga sprite lama yang belum ada di manifest.
    legacy = {"pedagang-a": "character", "goblin-hutan": "monster"}
    for lid, ltype in legacy.items():
        lp = os.path.join(outdir, lid + ".png")
        if lid not in manifest and os.path.exists(lp):
            li = Image.open(lp)
            manifest[lid] = {"file": lid + ".png", "type": ltype, "w": li.size[0], "h": li.size[1]}
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"OK: {out_path} ({crop.size[0]}x{crop.size[1]}) bbox={bbox} pockets={pockets}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Build AVIF/WebP siblings for case-study images, matching /work/images/opt.

Two widths when the source is wide enough: ~640 and the source width (capped
at 1280). Never upscales. Writes work/images/opt/manifest.json.
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "work" / "images"
OUT = SRC / "opt"
OUT.mkdir(parents=True, exist_ok=True)

WIDTHS_PREF = (640, 1280)


def probe(path: Path):
    raw = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height", "-of", "csv=p=0", str(path),
        ],
        text=True,
    ).strip()
    w, h = raw.split(",")
    return int(w), int(h)


def even(n: int) -> int:
    n = max(2, int(n))
    return n if n % 2 == 0 else n - 1


def encode(src: Path, dest: Path, width: int):
    if dest.exists() and dest.stat().st_size > 0:
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    vf = f"scale={width}:-2:flags=lanczos"
    if dest.suffix == ".webp":
        cmd = [
            "ffmpeg", "-y", "-i", str(src), "-vf", vf,
            "-c:v", "libwebp", "-quality", "76", "-compression_level", "5",
            str(dest),
        ]
    else:
        cmd = [
            "ffmpeg", "-y", "-i", str(src), "-vf", vf,
            "-c:v", "libsvtav1", "-svtav1-params", "preset=10:crf=30",
            "-still-picture", "1", "-frames:v", "1", "-pix_fmt", "yuv420p",
            str(dest),
        ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    files = sorted(
        [p for p in SRC.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg"}],
        key=lambda p: p.name.lower(),
    )
    manifest = {}
    for src in files:
        sw, sh = probe(src)
        widths = []
        for w in WIDTHS_PREF:
            target = even(min(w, sw))
            if target < 320:
                continue
            if widths and abs(target - widths[-1]) < 80:
                continue
            widths.append(target)
        if not widths:
            widths = [even(sw)]
        stem = src.stem.lower().replace(" ", "-")
        entry = {"file": src.name, "width": sw, "height": sh, "variants": []}
        for w in widths:
            h = even(round(sh * (w / sw)))
            webp = OUT / f"{stem}-{w}.webp"
            avif = OUT / f"{stem}-{w}.avif"
            print(f"{src.name} -> {w}px", flush=True)
            encode(src, webp, w)
            encode(src, avif, w)
            entry["variants"].append({
                "w": w,
                "h": h,
                "webp": f"/work/images/opt/{webp.name}",
                "avif": f"/work/images/opt/{avif.name}",
            })
        manifest[src.name] = entry
        manifest[src.name.lower()] = entry
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"wrote {len(files)} images", flush=True)


if __name__ == "__main__":
    main()

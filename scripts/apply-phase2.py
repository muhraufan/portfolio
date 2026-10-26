#!/usr/bin/env python3
"""Apply phase-2 case HTML: optimized images, gates, endings, headings, video."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / "work/images/opt/manifest.json").read_text())

INK_BORDER = "color-mix(in srgb, var(--text) 28%, transparent)"
INK_WASH = "color-mix(in srgb, var(--text) 14%, transparent)"
INK_WASH_SOFT = "color-mix(in srgb, var(--text) 8%, transparent)"

def lookup(name):
    if name in MANIFEST:
        return MANIFEST[name]
    low = name.lower()
    if low in MANIFEST:
        return MANIFEST[low]
    return None

def srcset(variants, key):
    return ", ".join(f"{v[key]} {v['w']}w" for v in variants)

def rewrite_img(tag):
    m = re.search(r'src="(/work/images/([^"]+\.(?:png|PNG|jpe?g)))"', tag)
    if not m:
        return tag
    meta = lookup(m.group(2))
    if not meta:
        return tag
    vs = meta["variants"]
    largest = vs[-1]
    tag = re.sub(r'src="[^"]+"', f'src="{largest["webp"]}"', tag, count=1)
    if "srcset=" not in tag:
        tag = tag[:-1] + f' srcset="{srcset(vs, "webp")}"'
    if "sizes=" not in tag:
        sizes = "280px" if "spectrum-preview" in tag or "annotated" in tag else "(max-width: 720px) calc(100vw - 48px), 560px"
        tag += f' sizes="{sizes}"'
    if "width=" not in tag:
        tag += f' width="{largest["w"]}"'
    if "height=" not in tag:
        tag += f' height="{largest["h"]}"'
    if "loading=" not in tag:
        tag += ' loading="lazy"'
    if "decoding=" not in tag:
        tag += ' decoding="async"'
    tag += ">"
    avif = srcset(vs, "avif")
    return f'<picture><source type="image/avif" srcset="{avif}" sizes="{( "280px" if "spectrum-preview" in tag or "annotated" in tag else "(max-width: 720px) calc(100vw - 48px), 560px" )}">{tag}</picture>'

def rewrite_images(text):
    text = re.sub(r"<img\b[^>]*>", lambda m: rewrite_img(m.group(0)), text)

    def js_path(m):
        name = m.group(2)
        meta = lookup(name)
        if not meta:
            return m.group(0)
        return m.group(1) + meta["variants"][-1]["webp"] + m.group(3)

    text = re.sub(
        r"(['\"])(/work/images/([^'\"]+\.(?:png|PNG|jpe?g)))(['\"])",
        lambda m: m.group(1) + (lookup(m.group(3))["variants"][-1]["webp"] if lookup(m.group(3)) else m.group(2)) + m.group(4),
        text,
    )
    return text

def ink_css(text, protect_direction=False):
    lines = text.splitlines(keepends=True)
    out = []
    hold = False
    for line in lines:
        if protect_direction and ("direction-item--blog" in line or "direction-swatch--blog" in line or "direction-item--content" in line or "direction-item--product" in line or "direction-swatch--content" in line or "direction-swatch--product" in line):
            hold = True
        if hold and line.startswith("}") and "direction" not in line:
            out.append(line)
            hold = False
            continue
        if hold:
            out.append(line)
            continue
        line = line.replace("#C8DDD4", INK_BORDER)
        line = line.replace("#c8ddd4", INK_BORDER)
        line = line.replace("#8FB7A4", "var(--text3)")
        line = line.replace("#7FB8A0", INK_BORDER)
        line = line.replace("#5A9179", "var(--text)")
        line = line.replace("#5a9072", "var(--text)")
        line = line.replace("#4a6b5c", "var(--text)")
        line = line.replace("#e9f7f1", INK_WASH)
        line = line.replace("#b5ccc3", "var(--text2)")
        line = line.replace("rgba(200, 221, 212, 0.06)", INK_WASH_SOFT)
        line = line.replace("rgba(200, 221, 212, 0.08)", INK_WASH_SOFT)
        line = line.replace("rgba(200, 221, 212, 0.2)", "color-mix(in srgb, var(--text) 18%, transparent)")
        line = line.replace("rgba(200, 221, 212, 0.35)", "color-mix(in srgb, var(--text) 28%, transparent)")
        out.append(line)
    return "".join(out)

NEXT = {
    "sn": {
        "href": "/work/uniqlo-outfit.html",
        "title": "Uniqlo",
        "meta": "2026 · Password protected",
        "img": "/work/images/opt/outfit-detail-full-480.webp",
    },
    "uniqlo": {
        "href": "/work/tiket-discover.html",
        "title": "tiket.com",
        "meta": "2021",
        "img": "/work/images/opt/tiket-discover-1-480.webp",
    },
    "tiket": {
        "href": "/work/smartnews-ftux.html",
        "title": "SmartNews FTUX",
        "meta": "2025 · Password protected",
        "img": "/work/images/opt/ftux-current-480.webp",
    },
    "ftux": {
        "href": "/lab/tokyo-transit-map.html",
        "title": "Tokyo Transit Map",
        "meta": "Design engineering",
        "img": "/assets/opt/tokyo-transit-map-480.webp",
    },
    "transit": {
        "href": "/work/smartnews-design-system.html",
        "title": "SmartNews",
        "meta": "2021 · Password protected",
        "img": "/work/images/opt/sn-home-light-480.webp",
    },
}

def ending(key):
    n = NEXT[key]
    return f'''<nav class="case-end" aria-label="Continue">
      <a class="case-next" href="{n["href"]}">
        <span class="case-next-kicker">Next case study</span>
        <span class="case-next-row">
          <img src="{n["img"]}" alt="" width="72" height="90">
          <span class="case-next-copy">
            <span class="case-next-title">{n["title"]}</span>
            <span class="case-next-meta">{n["meta"]}</span>
          </span>
        </span>
      </a>
      <p class="case-end-links">
        <a href="/">← Back to the postcard</a>
        <span class="case-end-thanks">Thanks for reading · <a href="/?guestcard=open">Leave a note</a></span>
      </p>
    </nav>'''

BRIEFS = {
    "uniqlo": '''<section class="case-brief" aria-label="Public summary">
        <p class="case-brief-kicker">In brief</p>
        <dl>
          <dt data-en="Role" data-ja="役割">Role</dt>
          <dd data-en="Senior Product Designer" data-ja="シニアプロダクトデザイナー">Senior Product Designer</dd>
          <dt data-en="When" data-ja="時期">When</dt>
          <dd data-en="2026 · In progress" data-ja="2026年 · 進行中">2026 · In progress</dd>
        </dl>
        <p data-en="In the first month I only opened the Uniqlo app at the register, to show a membership barcode and collect points." data-ja="入社して最初の月、ユニクロのアプリを開くのはレジでメンバーシップのバーコードを見せ、ポイントを貯めるときだけでした。">In the first month I only opened the Uniqlo app at the register, to show a membership barcode and collect points.</p>
        <p data-en="The public aim is a different way to discover what to wear: outfits, not one item at a time." data-ja="公開している狙い——何を着るかの見つけ方を、一品ずつではなくコーディネートから考え直すことです。">The public aim is a different way to discover what to wear: outfits, not one item at a time.</p>
      </section>''',
    "sn": '''<section class="case-brief" aria-label="Public summary">
        <p class="case-brief-kicker">In brief</p>
        <dl>
          <dt>Role</dt><dd>Lead Product Designer</dd>
          <dt>When</dt><dd>4 months · shipped across Figma, Android, iOS</dd>
        </dl>
        <p>I joined SmartNews in 2021. Two designers shipped the same component for different features, in two styles. Both followed the brand guideline. That was the problem.</p>
        <p>Design system quality lies in the invisible. The work was shared naming, shared specs, and a shared process — the measured results sit behind the password.</p>
      </section>''',
    "ftux": '''<section class="case-brief" aria-label="Public summary">
        <p class="case-brief-kicker">In brief</p>
        <dl>
          <dt>Role</dt><dd>Senior Product Designer</dd>
          <dt>When</dt><dd>2025 · 3 months</dd>
        </dl>
        <p>New readers met hundreds of categories. Only 37.9% finished onboarding. The rest skipped it.</p>
        <p>The public aim was a first session about reading intentions, not a wall of categories. What shipped stays behind the password.</p>
      </section>''',
}

EARLY = '''<script>
    (function () {
      if (!document.body.classList.contains('is-paywalled')) return;
      var cut = document.querySelector('[data-paywall-cut]');
      var content = document.querySelector('.case-content');
      if (!cut || !content) return;
      var next = cut.nextElementSibling;
      var anchorTop = next ? next.offsetTop : (cut.offsetTop + cut.offsetHeight);
      content.style.maxHeight = (anchorTop + 140) + 'px';
      if (next) next.style.visibility = 'hidden';
    })();
    </script>'''

FADE = '<div class="case-fade" aria-hidden="true"></div>'

def strip_footer(text):
    return re.sub(r'\s*<footer class="case-footer">[\s\S]*?</footer>', '', text, count=1)

def install_gate(text, brief_key, end_key, early=False):
    text = strip_footer(text)
    idx = text.find('<aside class="pw-paywall"')
    if idx < 0:
        raise SystemExit(f"no paywall for {brief_key}")
    close = text.rfind("</article>", 0, idx)
    aside_end = text.find("</aside>", idx)
    if close < 0 or aside_end < 0:
        raise SystemExit(f"gate anchors missing for {brief_key}")
    aside_end += len("</aside>")
    bits = [text[:close], "</article>\n\n    ", FADE, "\n    "]
    if early:
        bits.append(EARLY + "\n    ")
    bits.append('<div class="case-gate">\n      ')
    bits.append(BRIEFS[brief_key])
    bits.append("\n      ")
    bits.append(text[idx:aside_end])
    bits.append("\n    </div>\n\n    ")
    bits.append(ending(end_key))
    bits.append("\n")
    bits.append(text[aside_end:])
    return "".join(bits)

def install_public_end(text, end_key):
    block = "\n\n      " + ending(end_key) + "\n"
    new, n = re.subn(r'\s*<footer class="case-footer">[\s\S]*?</footer>', block, text, count=1)
    if n != 1:
        raise SystemExit(f"public end failed {end_key}")
    return new

def link_phase2(text, cover=False, transit=False):
    extra = '\n  <link rel="stylesheet" href="/css/case-phase2.css?v=1">'
    if cover:
        extra += '\n  <script src="/js/case-cover.js?v=1" defer></script>'
    if transit:
        extra = '\n  <link rel="stylesheet" href="/css/light.css?v=1">' + extra
        extra += '\n  <script src="/js/transit-theme.js?v=1"></script>'
    if "/css/case-phase2.css" not in text:
        text = text.replace("</head>", extra + "\n</head>", 1)
    text = text.replace("case.css?v=156", "case.css?v=157")
    text = text.replace("floating-nav.css?v=34", "floating-nav.css?v=35")
    text = text.replace("style.css?v=47", "style.css?v=48")
    return text

def headings(text, kind):
    if kind == "sn":
        text = text.replace(
            '<h4 class="sni-panel-name" id="sni-panel-name">—</h4>',
            '<p class="sni-panel-name" id="sni-panel-name">—</p>',
        )
        text = text.replace('<h4 class="framework-layer-title">', '<h3 class="framework-layer-title">')
        text = text.replace("</h4>", "</h3>")
        text = text.replace(
            '--layer-tint: #5a8a72; --layer-bg: rgba(200, 221, 212, 0.25); --layer-border: rgba(200, 221, 212, 0.4);',
            '--layer-tint: var(--text); --layer-bg: color-mix(in srgb, var(--text) 14%, transparent); --layer-border: color-mix(in srgb, var(--text) 28%, transparent);',
        )
    if kind == "ftux":
        text = text.replace(
            '<h2 class="case-h2">From there, we narrowed it down to four directions. What would you have chosen? Pick the one you\'d ship.</h2>',
            '<p class="case-h2">From there, we narrowed it down to four directions. What would you have chosen? Pick the one you\'d ship.</p>',
        )
    return text

def video(text):
    old = '<video class="case-cover-video" autoplay loop muted playsinline>'
    new = '<video class="case-cover-video" loop muted playsinline preload="none" poster="/work/images/opt/tiket-discover-cover-poster.webp" width="1002" height="720">'
    return text.replace(old, new)

def tooltip(text):
    text = text.replace(
        'Want the deep dive? Click here for the full case study.',
        'The full study covers the research, the labyrinth, and what shipped.',
    )
    text = text.replace(
        '詳しく知りたい方はこちらから完全版へ。',
        '完全版には、リサーチと迷宮、そして届いたものまで書いてあります。',
    )
    old = '''        // Show after 4s.
        setTimeout(function () {
          if (dismissed) return;
          positionTip();
          tip.classList.add('is-visible');
          attachDismissers();
          // Auto-dismiss after 8s of being visible if untouched.
          setTimeout(dismiss, 8000);
        }, 4000);'''
    new = '''        tip.hidden = true;
        var shown = false;
        var wait = 0;
        function reveal() {
          if (shown || dismissed || window.scrollY < 120) return;
          shown = true;
          tip.hidden = false;
          positionTip();
          var top = parseFloat(getComputedStyle(tip).top) || 0;
          if (top < 96) tip.style.setProperty('--anchor-top', '96px');
          tip.classList.add('is-visible');
          attachDismissers();
          setTimeout(dismiss, 8000);
          window.removeEventListener('scroll', arm);
        }
        function arm() {
          clearTimeout(wait);
          if (window.scrollY < 120) return;
          wait = setTimeout(reveal, 700);
        }
        window.addEventListener('scroll', arm, { passive: true });'''
    if old not in text:
        raise SystemExit('tooltip block missing')
    return text.replace(old, new)

def process(rel, kind):
    path = ROOT / rel
    text = path.read_text()
    text = rewrite_images(text)
    text = ink_css(text, protect_direction=False)
    if kind in ("uniqlo",):
        text = install_gate(text, "uniqlo", "uniqlo", early=True)
    elif kind == "sn":
        text = install_gate(text, "sn", "sn", early=False)
        text = headings(text, "sn")
    elif kind == "ftux":
        text = install_gate(text, "ftux", "ftux", early=False)
        text = headings(text, "ftux")
    elif kind == "tiket":
        text = install_public_end(text, "tiket")
        text = video(text)
        if rel.endswith("tiket-discover.html"):
            text = tooltip(text)
    text = link_phase2(text, cover=kind == "tiket")
    path.write_text(text)
    print("updated", rel)

def transit():
    path = ROOT / "lab/tokyo-transit-map.html"
    text = path.read_text()
    text = text.replace("<body>", '<body class="transit-page">', 1)
    text = text.replace(
        '<footer class="foot" data-reveal>\n    </footer>',
        '<footer class="foot" data-reveal>\n      ' + ending("transit") + '\n    </footer>',
        1,
    )
    text = link_phase2(text, transit=True)
    path.write_text(text)
    print("updated transit")

def case_css():
    path = ROOT / "css/case.css"
    original = path.read_text()
    # Keep the category-map hues exactly.
    start = original.find("/* Content items — blog yellow style */")
    end = original.find("/* ---- Scroll takeover dots ---- */")
    if start < 0 or end < 0:
        raise SystemExit("direction block not found")
    kept = original[start:end]
    rewritten = ink_css(original, protect_direction=False)
    start2 = rewritten.find("/* Content items — blog yellow style */")
    end2 = rewritten.find("/* ---- Scroll takeover dots ---- */")
    rewritten = rewritten[:start2] + kept + rewritten[end2:]
    path.write_text(rewritten)
    print("case.css ink")

def style_bits():
    path = ROOT / "css/style.css"
    text = path.read_text()
    text = text.replace(
        """body.minimal ::selection {
  background: #C8DDD4;
}""",
        """body.minimal ::selection {
  background: color-mix(in srgb, var(--text) 18%, transparent);
}""",
    )
    text = text.replace("color: #4a6b5c;\n  border: 1px solid #C8DDD4;", "color: var(--text);\n  border: 1px solid color-mix(in srgb, var(--text) 28%, transparent);")
    text = text.replace("color: #b5ccc3;\n  border-color: rgba(200, 221, 212, 0.35);", "color: var(--text2);\n  border-color: color-mix(in srgb, var(--text) 28%, transparent);")
    text = text.replace("background: rgba(200, 221, 212, 0.08);\n  border-color: rgba(200, 221, 212, 0.2);\n  color: #4a6b5c;", "background: color-mix(in srgb, var(--text) 8%, transparent);\n  border-color: color-mix(in srgb, var(--text) 18%, transparent);\n  color: var(--text);")
    path.write_text(text)
    print("style accents")

if __name__ == "__main__":
    raise SystemExit("apply-phase2.py already ran against this tree and is not idempotent. It is kept as a record of the patch.")
    case_css()
    style_bits()
    process("work/uniqlo-outfit.html", "uniqlo")
    process("work/uniqlo-outfit-full.html", "uniqlo")
    process("work/smartnews-design-system.html", "sn")
    process("work/smartnews-ftux.html", "ftux")
    process("work/tiket-discover.html", "tiket")
    process("work/tiket-discover-full.html", "tiket")
    transit()

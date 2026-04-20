// ---- Dark Mode Toggle ----
const html = document.documentElement;

function getTheme() {
  return localStorage.getItem('theme') || 'light';
}

function applyTheme(theme) {
  if (theme === 'dark') {
    html.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    html.setAttribute('data-theme', 'light');
  } else {
    html.removeAttribute('data-theme');
  }
}

applyTheme(getTheme());

// Wire up all theme toggles (old nav toggle + new minimal toggle)
document.querySelectorAll('.theme-toggle, .m-theme-toggle').forEach(btn => {
  btn?.addEventListener('click', () => {
    const current = localStorage.getItem('theme');
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getTheme() === 'auto') applyTheme('auto');
});

// ---- Language Switcher ----
function getLang() {
  return localStorage.getItem('lang') || 'en';
}

function applyLang(lang, animate) {
  // Show the OTHER language as the toggle label (what you'll switch TO)
  document.querySelectorAll('.m-lang-toggle, .lang-toggle').forEach(btn => {
    btn.textContent = lang === 'ja' ? 'EN' : 'JA';
  });

  const els = document.querySelectorAll('[data-en], [data-en-html]');
  if (!animate || !els.length) {
    // Non-animated: switch font + content together
    html.setAttribute('data-lang', lang);
    swapText(lang, els);
    return;
  }

  // Animated: do NOT switch data-lang yet — keep current font during scramble
  scrambleAll(lang, els);
}

// ---- Scramble engine ----
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソ0123456789';
const SCRAMBLE_INTERVAL = 40;
const SCRAMBLE_CAP = 600;

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

function isScramblable(ch) {
  return ch !== ' ' && ch !== '\u3000' && !/[.,!?;:—–\-\u2019\u2018'"()（）、。「」\u00B7\u2026\/←→↓↑\n\r]/.test(ch);
}

function scrambleText(el, target, done) {
  const chars = [...target];
  const len = chars.length;
  const duration = Math.min(SCRAMBLE_INTERVAL * len, SCRAMBLE_CAP);
  const resolveInterval = len > 0 ? duration / len : 0;
  let resolved = 0;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const shouldResolve = resolveInterval > 0 ? Math.floor(elapsed / resolveInterval) : len;
    resolved = Math.min(shouldResolve, len);

    let display = '';
    for (let i = 0; i < len; i++) {
      if (i < resolved) {
        display += chars[i];
      } else if (!isScramblable(chars[i])) {
        display += chars[i];
      } else {
        display += randomChar();
      }
    }
    el.textContent = display;

    if (resolved < len) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target;
      if (done) done();
    }
  }

  requestAnimationFrame(tick);
}

function scrambleAll(lang, els) {
  let pending = 0;
  const tasks = [];
  const pinned = [];

  // Phase 1: snapshot and pin every element's current dimensions BEFORE anything changes
  els.forEach(el => {
    const htmlVal = el.getAttribute('data-' + lang + '-html');
    const textVal = el.getAttribute('data-' + lang);
    const isHtml = htmlVal !== null;
    const targetRaw = isHtml ? htmlVal : textVal;
    if (targetRaw === null) return;

    // Pin current size — exact height and width, not min
    const h = el.offsetHeight;
    const w = el.offsetWidth;
    el.style.height = h + 'px';
    el.style.width = w + 'px';
    el.style.overflow = 'hidden';
    pinned.push(el);

    let targetText;
    if (isHtml) {
      const tmp = document.createElement('div');
      tmp.innerHTML = targetRaw;
      targetText = tmp.textContent || '';
    } else {
      targetText = targetRaw;
    }

    tasks.push({ el, isHtml, htmlVal, targetText });
  });

  if (!tasks.length) {
    html.setAttribute('data-lang', lang);
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
    return;
  }

  // Phase 2: run scrambles (font hasn't changed yet — data-lang still old)
  pending = tasks.length;
  tasks.forEach(({ el, isHtml, htmlVal, targetText }) => {
    scrambleText(el, targetText, () => {
      if (isHtml) {
        el.innerHTML = htmlVal;
        if (window.spawnConfetti) {
          el.querySelectorAll('.m-highlight').forEach(h => {
            h.addEventListener('mouseenter', () => window.spawnConfetti(h));
          });
        }
      }
      pending--;
      if (pending === 0) {
        // Phase 3: all scrambles done — now switch the font
        html.setAttribute('data-lang', lang);

        // Phase 4: smoothly transition to new natural height
        requestAnimationFrame(() => {
          // Measure each element's new natural height with font switched
          const targets = pinned.map(el => {
            const pinnedH = parseFloat(el.style.height);
            el.style.height = '';
            el.style.width = '';
            const naturalH = el.offsetHeight;
            // Re-pin to old height so we can transition
            el.style.height = pinnedH + 'px';
            el.style.overflow = 'hidden';
            return { el, naturalH };
          });

          // Force layout so the re-pin takes effect before transition
          void document.body.offsetHeight;

          // Apply transition and animate to new height
          pinned.forEach(el => {
            el.style.transition = 'height 0.25s ease';
          });
          targets.forEach(({ el, naturalH }) => {
            el.style.height = naturalH + 'px';
          });

          // Clean up after transition
          const cleanup = () => {
            pinned.forEach(el => {
              el.style.transition = '';
              el.style.height = '';
              el.style.width = '';
              el.style.overflow = 'hidden';
            });
            window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
          };
          // Use transitionend on first pinned element, with timeout fallback
          if (pinned.length > 0) {
            let cleaned = false;
            const onEnd = () => {
              if (cleaned) return;
              cleaned = true;
              cleanup();
            };
            pinned[0].addEventListener('transitionend', onEnd, { once: true });
            setTimeout(onEnd, 350); // fallback if no transition fires
          } else {
            cleanup();
          }
        });
      }
    });
  });
}

function swapText(lang, els) {
  els.forEach(el => {
    const htmlVal = el.getAttribute('data-' + lang + '-html');
    if (htmlVal !== null) {
      el.innerHTML = htmlVal;
      if (window.spawnConfetti) {
        el.querySelectorAll('.m-highlight').forEach(h => {
          h.addEventListener('mouseenter', () => window.spawnConfetti(h));
        });
      }
      return;
    }
    const textVal = el.getAttribute('data-' + lang);
    if (textVal !== null) {
      el.textContent = textVal;
    }
  });
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

// ---- Reserve space for both languages (zero layout shift) ----
function reserveLangSpace() {
  const els = document.querySelectorAll('[data-en], [data-en-html]');
  if (!els.length) return;

  const currentLang = getLang();

  const items = [];
  els.forEach(el => {
    const enVal = el.getAttribute('data-en-html') || el.getAttribute('data-en');
    const jaVal = el.getAttribute('data-ja-html') || el.getAttribute('data-ja');
    if (!enVal || !jaVal) return;
    const isHtml = el.hasAttribute('data-en-html');
    // Clear any previous inline sizing so we get natural dimensions
    el.style.minHeight = '';
    el.style.minWidth = '';
    el.style.height = '';
    el.style.width = '';
    items.push({ el, enVal, jaVal, isHtml, savedHTML: el.innerHTML });
  });

  if (!items.length) return;

  // Pass 1: measure EN sizes (with EN font)
  html.setAttribute('data-lang', 'en');
  items.forEach(it => {
    if (it.isHtml) it.el.innerHTML = it.enVal; else it.el.textContent = it.enVal;
  });
  items.forEach(it => {
    it.enH = it.el.offsetHeight;
    it.enW = it.el.offsetWidth;
  });

  // Pass 2: measure JP sizes (with JP font)
  html.setAttribute('data-lang', 'ja');
  items.forEach(it => {
    if (it.isHtml) it.el.innerHTML = it.jaVal; else it.el.textContent = it.jaVal;
  });
  items.forEach(it => {
    it.jaH = it.el.offsetHeight;
    it.jaW = it.el.offsetWidth;
  });

  // Restore original lang + content
  html.setAttribute('data-lang', currentLang);
  items.forEach(it => { it.el.innerHTML = it.savedHTML; });

  // The innerHTML restores above replaced the original .m-highlight nodes
  // with fresh copies — the confetti IIFE's mouseenter listeners are now
  // orphaned on the old (detached) nodes. Re-attach to the live nodes.
  if (window.spawnConfetti) {
    document.querySelectorAll('.m-highlight').forEach(h => {
      if (h._confettiWired) return;
      h._confettiWired = true;
      h.addEventListener('mouseenter', () => window.spawnConfetti(h));
    });
  }

  // Apply min sizes — always max of both directions
  items.forEach(it => {
    const maxH = Math.max(it.enH, it.jaH);
    if (maxH > 0) it.el.style.minHeight = maxH + 'px';

    // Allowlist: only short nav / label elements get nowrap + min-width
    // treatment. Everything else (paragraphs, card bodies, titles, etc.)
    // should wrap naturally — a blocklist here was fragile and caused
    // body copy inside <div data-en> to get clamped to a single line.
    const isSingleLine = it.el.matches(
      '.m-badge-soon, .m-badge-ai, ' +
      '.case-back, .case-mobile-back, .article-back, .back-link, ' +
      '.case-cta, .case-nav-link, ' +
      '.m-lang-toggle, .lang-toggle, .case-lang-toggle'
    );
    if (isSingleLine) {
      const maxW = Math.max(it.enW, it.jaW);
      if (maxW > 0) it.el.style.minWidth = maxW + 'px';
      it.el.style.whiteSpace = 'nowrap';
      // Only clip overflow when we've forced single-line — multi-line
      // elements should be able to grow naturally if the measured
      // min-height underestimates (font swap, responsive width).
      it.el.style.overflow = 'hidden';
    }
  });

  // Reserve space for lang toggle buttons
  document.querySelectorAll('.m-lang-toggle, .lang-toggle').forEach(btn => {
    const saved = btn.textContent;
    btn.textContent = 'JA';
    const w1 = btn.offsetWidth;
    btn.textContent = 'EN';
    const w2 = btn.offsetWidth;
    btn.textContent = saved;
    btn.style.minWidth = Math.max(w1, w2) + 'px';
  });
}

// Apply saved lang immediately (no animation on load)
applyLang(getLang(), false);

// Reserve space only after fonts are fully loaded for accurate measurements
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => reserveLangSpace());
} else {
  // Fallback: measure now (may be inaccurate if fonts still loading)
  reserveLangSpace();
}

// Wire up all lang toggles
document.querySelectorAll('.m-lang-toggle, .lang-toggle').forEach(btn => {
  btn?.addEventListener('click', () => {
    const next = getLang() === 'ja' ? 'en' : 'ja';
    localStorage.setItem('lang', next);
    applyLang(next, true);
  });
});

// ---- Active Nav Link ----
const currentPath = window.location.pathname;
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPath || (href !== '/' && currentPath.startsWith(href.replace('.html', '')))) {
    link.classList.add('active');
  }
});

// ---- Confetti Physics ----
(function () {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let particles = [];
  let animating = false;
  let obstacles = [];
  let sourceY = 0; // Y position of the element that triggered confetti

  const COLORS = [
    '#C8DDD4', '#FFD3B6', '#FF8B94', '#D4A5FF',
    '#FFACC7', '#B8D4E3', '#FFE156', '#88D8B0',
    '#F7DC6F', '#AED6F1', '#F0B27A', '#82E0AA'
  ];
  const GRAVITY = 0.35;
  const BOUNCE_DAMPING = 0.4;
  const FRICTION = 0.98;
  const PARTICLE_COUNT = 30;

  function resize() {
    var w = document.documentElement.clientWidth;
    var h = document.documentElement.clientHeight;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);

  // Only collect obstacles BELOW the source element
  function collectObstacles(sourceEl) {
    const selectors = [
      '.m-name', '.m-bio', '.m-medium', '.m-highlight', '.m-highlight-muted',
      '.m-list a', '.m-list-soon', '.m-badge-soon', '.m-link',
      '.m-footer a', '.m-dot'
    ];
    obstacles = [];
    document.querySelectorAll(selectors.join(',')).forEach(el => {
      // Skip the source element itself and its children
      if (sourceEl && (el === sourceEl || sourceEl.contains(el) || el.contains(sourceEl))) return;
      const r = el.getBoundingClientRect();
      // Only include elements below the source
      if (r.width > 0 && r.height > 0 && r.top >= sourceY) {
        obstacles.push({
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height
        });
      }
    });
  }

  function createParticle(originX, originY) {
    const size = 3 + Math.random() * 4;
    const angle = Math.random() * Math.PI * 2; // Full 360 explosion
    const speed = 4 + Math.random() * 6; // Strong initial burst
    const shape = Math.random();
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3, // Bias slightly upward for explosion feel
      size: size,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      shape: shape < 0.33 ? 'circle' : shape < 0.66 ? 'rect' : 'triangle',
      alpha: 1,
      bounceCount: 0,
      life: 0
    };
  }

  let currentSourceEl = null;

  function spawnConfetti(el) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    sourceY = rect.bottom;
    currentSourceEl = el;

    collectObstacles(el);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(cx, cy));
    }

    if (!animating) {
      animating = true;
      animate();
    }
  }

  function resolveCollision(p) {
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      if (
        p.x + p.size > o.x &&
        p.x - p.size < o.x + o.w &&
        p.y + p.size > o.y &&
        p.y - p.size < o.y + o.h
      ) {
        const overlapLeft = (p.x + p.size) - o.x;
        const overlapRight = (o.x + o.w) - (p.x - p.size);
        const overlapTop = (p.y + p.size) - o.y;
        const overlapBottom = (o.y + o.h) - (p.y - p.size);
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop && p.vy > 0) {
          p.y = o.y - p.size;
          p.vy = -Math.abs(p.vy) * BOUNCE_DAMPING;
          p.vx += (Math.random() - 0.5) * 2;
          p.bounceCount++;
        } else if (minOverlap === overlapBottom && p.vy < 0) {
          p.y = o.y + o.h + p.size;
          p.vy = Math.abs(p.vy) * BOUNCE_DAMPING;
          p.bounceCount++;
        } else if (minOverlap === overlapLeft && p.vx > 0) {
          p.x = o.x - p.size;
          p.vx = -Math.abs(p.vx) * BOUNCE_DAMPING;
          p.bounceCount++;
        } else if (minOverlap === overlapRight && p.vx < 0) {
          p.x = o.x + o.w + p.size;
          p.vx = Math.abs(p.vx) * BOUNCE_DAMPING;
          p.bounceCount++;
        }

        p.rotationSpeed *= -0.8;
        break;
      }
    }
  }

  let frameCount = 0;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    frameCount++;
    // Refresh obstacles periodically for live DOM changes
    if (frameCount % 6 === 0) {
      collectObstacles(currentSourceEl);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.vy += GRAVITY;
      p.vx *= FRICTION;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life++;

      // Only collide after the initial explosion phase (first ~8 frames)
      if (p.life > 8) {
        resolveCollision(p);
      }

      // Fade out near bottom
      const distFromBottom = canvas.height - p.y;
      if (distFromBottom < 80) {
        p.alpha = Math.max(0, distFromBottom / 80);
      }

      // Also fade after many bounces
      if (p.bounceCount > 4) {
        p.alpha *= 0.95;
      }

      if (p.y > canvas.height + 20 || p.alpha <= 0.01) {
        particles.splice(i, 1);
        continue;
      }

      // Draw
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
      } else {
        // Triangle
        ctx.beginPath();
        ctx.moveTo(0, -p.size / 2);
        ctx.lineTo(-p.size / 2, p.size / 2);
        ctx.lineTo(p.size / 2, p.size / 2);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    if (particles.length > 0) {
      requestAnimationFrame(animate);
    } else {
      animating = false;
    }
  }

  // Attach to all green highlighted elements
  document.querySelectorAll('.m-highlight').forEach(el => {
    el.addEventListener('mouseenter', () => spawnConfetti(el));
  });

  // Expose for lang-switcher re-attachment
  window.spawnConfetti = spawnConfetti;
})();

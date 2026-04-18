// ---- Sidebar active section tracking ----
(function () {
  const navLinks = Array.from(document.querySelectorAll('.case-nav-link'));

  if (!navLinks.length) return;

  // Only observe sections that have a matching sidebar link. SN FTUX has
  // extra <section id="evolution"> / <section id="showcase"> inside the
  // Journey section that aren't represented in the sidebar — if we
  // observed them and they became the "intersecting" entry, the callback
  // would clear all .active classes without setting a new one, leaving
  // the indicator blank for a stretch of scroll.
  const sections = Array.from(document.querySelectorAll('.case-content section[id]'))
    .filter((s) => document.querySelector('.case-nav-link[href="#' + s.id + '"]'));

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const activeLink = document.querySelector(
            '.case-nav-link[href="#' + entry.target.id + '"]'
          );
          // Only update active if we actually have a matching link —
          // otherwise leave the current .active alone instead of clearing.
          if (activeLink) {
            navLinks.forEach((link) => link.classList.remove('active'));
            activeLink.classList.add('active');
          }
        }
      });
    },
    {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    }
  );

  sections.forEach((section) => observer.observe(section));

  // ---- Rubber-band line indicator ----
  // A 2px vertical line on the left of the nav that tracks the active
  // section link. Three phases:
  //   1. Idle at a section — line sits at ~20px, aligned to the active link.
  //   2. Stretching between sections — as the user scrolls past the current
  //      section toward the next, the line's height grows toward the gap
  //      between the two links. Eased-in so it feels like rubber under
  //      tension.
  //   3. Snapping to new section — when IntersectionObserver swaps the
  //      .active class, we collapse the line back to 20px at the new link
  //      with a spring transition (CSS .snapping class).
  (function setupNavLine() {
    const sidebar = document.querySelector('.case-sidebar');
    if (!sidebar) return;
    const ul = sidebar.querySelector('ul');
    if (!ul) return;
    const links = Array.from(sidebar.querySelectorAll('.case-nav-link'));
    if (!links.length) return;

    // Only draw the line when the sidebar is actually visible
    // (it's display:none on mobile).
    function sidebarVisible() {
      return getComputedStyle(sidebar).display !== 'none';
    }

    // Static gray track behind the line — spans from the first link's
    // vertical center to the last link's vertical center.
    const track = document.createElement('div');
    track.className = 'case-nav-track';
    ul.appendChild(track);

    const line = document.createElement('div');
    line.className = 'case-nav-line';
    ul.appendChild(line);

    const IDLE_HEIGHT = 20;
    const SNAP_MS = 400;
    const BOTTOM_THRESHOLD = 4;  // px from page end that counts as "at bottom"
    let currentActiveIdx = -1;
    let ticking = false;
    let snapTimer = null;

    function linkCenterInUl(link) {
      const r = link.getBoundingClientRect();
      const u = ul.getBoundingClientRect();
      return r.top - u.top + r.height / 2;
    }

    function updateTrack() {
      if (!links.length) return;
      const first = linkCenterInUl(links[0]);
      const last = linkCenterInUl(links[links.length - 1]);
      track.style.top = (first - IDLE_HEIGHT / 2) + 'px';
      track.style.height = Math.max(0, (last - first) + IDLE_HEIGHT) + 'px';
    }

    function isAtBottom() {
      const docH = document.documentElement.scrollHeight;
      const winH = window.innerHeight;
      // Only trust "at bottom" when the page is actually scrollable.
      // On first paint (e.g. SN FTUX with the password wall still up and
      // .case-page display:none) docH barely exceeds winH, and the naive
      // check `scrollY + winH >= docH - N` would be true at scrollY=0,
      // incorrectly forcing the last section to be active before the
      // visitor has scrolled anywhere.
      if (docH <= winH + 40) return false;
      return (window.scrollY + winH) >= (docH - BOTTOM_THRESHOLD);
    }

    function getActiveIdx() {
      // At page bottom, the last section is always considered active —
      // otherwise short final sections whose tops never reach the IO
      // trigger leave the indicator stuck on the previous section.
      if (isAtBottom()) {
        // Ensure the CSS class stays in sync.
        links.forEach((l, i) => l.classList.toggle('active', i === links.length - 1));
        return links.length - 1;
      }
      const active = sidebar.querySelector('.case-nav-link.active');
      if (!active) return 0;
      return links.indexOf(active);
    }

    function easeIn(t) { return t * t; }

    // Progress 0..1 from "just became active" toward "about to become the
    // next section". IO uses -20%/-70% rootMargin, so the trigger line
    // sits at ~20% of viewport height from the top.
    function forwardProgress(activeIdx) {
      if (activeIdx >= sections.length - 1) return 0;
      const cur = sections[activeIdx].getBoundingClientRect();
      const nxt = sections[activeIdx + 1].getBoundingClientRect();
      const span = nxt.top - cur.top;
      if (span <= 0) return 0;
      const triggerY = window.innerHeight * 0.2;
      const distToTrigger = nxt.top - triggerY;
      return 1 - Math.max(0, Math.min(1, distToTrigger / span));
    }

    // Progress 0..1 toward the previous section when scrolling UP —
    // triggered when the active section's top has moved BELOW the trigger
    // line (i.e. the user is scrolling back up past the active heading).
    function backwardProgress(activeIdx) {
      if (activeIdx <= 0) return 0;
      const cur = sections[activeIdx].getBoundingClientRect();
      const prv = sections[activeIdx - 1].getBoundingClientRect();
      const span = cur.top - prv.top;
      if (span <= 0) return 0;
      const triggerY = window.innerHeight * 0.2;
      const distBelowTrigger = cur.top - triggerY;
      return Math.max(0, Math.min(1, distBelowTrigger / span));
    }

    function update() {
      ticking = false;
      if (!sidebarVisible()) return;
      const activeIdx = getActiveIdx();
      const activeLink = links[activeIdx];
      if (!activeLink) return;
      const cCenter = linkCenterInUl(activeLink);

      // Section changed — snap the line to the new active link.
      if (activeIdx !== currentActiveIdx) {
        const firstSettle = currentActiveIdx === -1;
        currentActiveIdx = activeIdx;
        if (!firstSettle) line.classList.add('snapping');
        line.style.height = IDLE_HEIGHT + 'px';
        line.style.top = (cCenter - IDLE_HEIGHT / 2) + 'px';
        if (snapTimer) clearTimeout(snapTimer);
        snapTimer = setTimeout(() => {
          line.classList.remove('snapping');
          snapTimer = null;
        }, SNAP_MS);
        return;
      }

      // Mid-snap — let the CSS spring finish before resuming JS updates.
      if (line.classList.contains('snapping')) return;

      const fp = forwardProgress(activeIdx);
      const bp = backwardProgress(activeIdx);

      // Whichever direction the user is leaning further toward wins the
      // stretch. If they're idle in the middle of a section (fp=bp=0)
      // the line collapses to idle.
      if (fp > 0 && fp >= bp) {
        const nextLink = links[activeIdx + 1];
        const nCenter = linkCenterInUl(nextLink);
        const h = IDLE_HEIGHT + (nCenter - cCenter) * easeIn(fp);
        line.style.height = h + 'px';
        line.style.top = (cCenter - IDLE_HEIGHT / 2) + 'px';
      } else if (bp > 0) {
        const prevLink = links[activeIdx - 1];
        const pCenter = linkCenterInUl(prevLink);
        const h = IDLE_HEIGHT + (cCenter - pCenter) * easeIn(bp);
        // Anchor the BOTTOM at the active link's center and stretch the
        // TOP upward toward the previous link.
        line.style.height = h + 'px';
        line.style.top = (cCenter + IDLE_HEIGHT / 2 - h) + 'px';
      } else {
        line.style.height = IDLE_HEIGHT + 'px';
        line.style.top = (cCenter - IDLE_HEIGHT / 2) + 'px';
      }
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    // Initial settle once layout is stable.
    requestAnimationFrame(() => setTimeout(() => { updateTrack(); update(); }, 80));
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', () => { updateTrack(); requestUpdate(); });

    // ResizeObserver catches the case where the sidebar is initially inside
    // a display:none ancestor (e.g. the SN FTUX password wall gating
    // .case-page). When the ancestor becomes visible and the <ul> resizes
    // from 0 to its real height, we re-measure the track + line.
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        updateTrack();
        requestUpdate();
      });
      ro.observe(ul);
    }
  })();

  // Smooth scroll for sidebar links. We also signal any page-level
  // scroll-hijacks (e.g. "The Beginning" problem takeover on the SmartNews
  // case) to stand down so the jump can pass through their trigger zone.
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');

      // Flag + event: hijacks should bypass their triggers and release now.
      window.__bypassScrollHijack = true;
      window.dispatchEvent(
        new CustomEvent('sidebar-nav-click', { detail: { href } })
      );

      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Clear the flag after the smooth scroll likely settles.
      clearTimeout(window.__bypassScrollHijackTimer);
      window.__bypassScrollHijackTimer = setTimeout(() => {
        window.__bypassScrollHijack = false;
      }, 1500);
    });
  });
})();

// ---- Theme toggle (reuse from main) ----
(function () {
  const html = document.documentElement;
  const theme = localStorage.getItem('theme') || 'light';
  if (theme === 'dark') {
    html.setAttribute('data-theme', 'dark');
  } else {
    html.setAttribute('data-theme', 'light');
  }

  document.querySelectorAll('.m-theme-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var current = localStorage.getItem('theme') || 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      if (next === 'dark') {
        html.setAttribute('data-theme', 'dark');
      } else {
        html.setAttribute('data-theme', 'light');
      }
    });
  });
})();

// ---- Language switcher (reuse from main) ----
(function () {
  var html = document.documentElement;
  var lang = localStorage.getItem('lang') || 'en';
  html.setAttribute('data-lang', lang);

  function applyLang(lang, animate) {
    document.querySelectorAll('.m-lang-toggle, .lang-toggle').forEach(function(btn) {
      btn.textContent = lang === 'ja' ? 'EN' : 'JA';
    });
    var els = document.querySelectorAll('[data-en], [data-en-html]');
    if (!animate || !els.length) {
      html.setAttribute('data-lang', lang);
      swapText(lang, els);
      return;
    }
    // Animated: do NOT switch data-lang yet — keep current font during scramble
    scrambleAll(lang, els);
  }

  var SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソ0123456789';
  var SCRAMBLE_INTERVAL = 40;
  var SCRAMBLE_CAP = 600;

  function randomChar() {
    return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
  }

  function isScramblable(ch) {
    return ch !== ' ' && ch !== '\u3000' && !/[.,!?;:\u2014\u2013\-\u2019\u2018'"()（）、。「」\u00B7\u2026\/←→\n\r]/.test(ch);
  }

  function scrambleText(el, target, done) {
    var chars = Array.from(target);
    var len = chars.length;
    var duration = Math.min(SCRAMBLE_INTERVAL * len, SCRAMBLE_CAP);
    var resolveInterval = len > 0 ? duration / len : 0;
    var resolved = 0;
    var start = performance.now();

    function tick(now) {
      var elapsed = now - start;
      var shouldResolve = resolveInterval > 0 ? Math.floor(elapsed / resolveInterval) : len;
      resolved = Math.min(shouldResolve, len);
      var display = '';
      for (var i = 0; i < len; i++) {
        if (i < resolved) { display += chars[i]; }
        else if (!isScramblable(chars[i])) { display += chars[i]; }
        else { display += randomChar(); }
      }
      el.textContent = display;
      if (resolved < len) { requestAnimationFrame(tick); }
      else { el.textContent = target; if (done) done(); }
    }
    requestAnimationFrame(tick);
  }

  function scrambleAll(lang, els) {
    var pending = 0;
    var tasks = [];
    var pinned = [];

    // Pin every element's current dimensions BEFORE anything changes
    els.forEach(function(el) {
      var htmlVal = el.getAttribute('data-' + lang + '-html');
      var textVal = el.getAttribute('data-' + lang);
      var isHtml = htmlVal !== null;
      var targetRaw = isHtml ? htmlVal : textVal;
      if (targetRaw === null) return;

      var h = el.offsetHeight;
      var w = el.offsetWidth;
      el.style.height = h + 'px';
      el.style.width = w + 'px';
      el.style.overflow = 'hidden';
      pinned.push(el);

      var targetText;
      if (isHtml) {
        var tmp = document.createElement('div');
        tmp.innerHTML = targetRaw;
        targetText = tmp.textContent || '';
      } else {
        targetText = targetRaw;
      }
      tasks.push({ el: el, isHtml: isHtml, htmlVal: htmlVal, targetText: targetText });
    });

    if (!tasks.length) {
      html.setAttribute('data-lang', lang);
      return;
    }

    pending = tasks.length;
    tasks.forEach(function(t) {
      scrambleText(t.el, t.targetText, function() {
        if (t.isHtml) { t.el.innerHTML = t.htmlVal; }
        pending--;
        if (pending === 0) {
          html.setAttribute('data-lang', lang);
          requestAnimationFrame(function() {
            // Measure new natural heights with font switched
            var targets = [];
            pinned.forEach(function(el) {
              var pinnedH = parseFloat(el.style.height);
              el.style.height = '';
              el.style.width = '';
              var naturalH = el.offsetHeight;
              el.style.height = pinnedH + 'px';
              el.style.overflow = 'hidden';
              targets.push({ el: el, naturalH: naturalH });
            });

            // Force layout
            void document.body.offsetHeight;

            // Transition to new height
            pinned.forEach(function(el) {
              el.style.transition = 'height 0.25s ease';
            });
            targets.forEach(function(t) {
              t.el.style.height = t.naturalH + 'px';
            });

            // Cleanup after transition
            var cleaned = false;
            var onEnd = function() {
              if (cleaned) return;
              cleaned = true;
              pinned.forEach(function(el) {
                el.style.transition = '';
                el.style.height = '';
                el.style.width = '';
                el.style.overflow = 'hidden';
              });
            };
            if (pinned.length > 0) {
              pinned[0].addEventListener('transitionend', onEnd, { once: true });
              setTimeout(onEnd, 350);
            } else {
              onEnd();
            }
          });
        }
      });
    });
  }

  function swapText(lang, els) {
    els.forEach(function(el) {
      var htmlVal = el.getAttribute('data-' + lang + '-html');
      if (htmlVal !== null) { el.innerHTML = htmlVal; return; }
      var textVal = el.getAttribute('data-' + lang);
      if (textVal !== null) el.textContent = textVal;
    });
  }

  applyLang(lang, false);

  // Reserve space for both languages (zero layout shift)
  function reserveLangSpace() {
    var els = document.querySelectorAll('[data-en], [data-en-html]');
    if (!els.length) return;
    var currentLang = localStorage.getItem('lang') || 'en';

    var items = [];
    els.forEach(function(el) {
      var enVal = el.getAttribute('data-en-html') || el.getAttribute('data-en');
      var jaVal = el.getAttribute('data-ja-html') || el.getAttribute('data-ja');
      if (!enVal || !jaVal) return;
      var isHtml = el.hasAttribute('data-en-html');
      el.style.minHeight = '';
      el.style.minWidth = '';
      el.style.height = '';
      el.style.width = '';
      items.push({ el: el, enVal: enVal, jaVal: jaVal, isHtml: isHtml, savedHTML: el.innerHTML });
    });

    if (!items.length) return;

    html.setAttribute('data-lang', 'en');
    items.forEach(function(it) {
      if (it.isHtml) it.el.innerHTML = it.enVal; else it.el.textContent = it.enVal;
    });
    items.forEach(function(it) {
      it.enH = it.el.offsetHeight;
      it.enW = it.el.offsetWidth;
    });

    html.setAttribute('data-lang', 'ja');
    items.forEach(function(it) {
      if (it.isHtml) it.el.innerHTML = it.jaVal; else it.el.textContent = it.jaVal;
    });
    items.forEach(function(it) {
      it.jaH = it.el.offsetHeight;
      it.jaW = it.el.offsetWidth;
    });

    html.setAttribute('data-lang', currentLang);
    items.forEach(function(it) { it.el.innerHTML = it.savedHTML; });

    items.forEach(function(it) {
      var maxH = Math.max(it.enH, it.jaH);
      if (maxH > 0) it.el.style.minHeight = maxH + 'px';

      var isSingleLine = it.el.matches('.case-back, .case-mobile-back, .pw-back, [data-en]:not(p):not(h1):not(h2):not(.m-bio)');
      if (isSingleLine) {
        var maxW = Math.max(it.enW, it.jaW);
        if (maxW > 0) it.el.style.minWidth = maxW + 'px';
        it.el.style.whiteSpace = 'nowrap';
      }

      it.el.style.overflow = 'hidden';
    });

    document.querySelectorAll('.m-lang-toggle, .lang-toggle').forEach(function(btn) {
      var saved = btn.textContent;
      btn.textContent = 'JA';
      var w1 = btn.offsetWidth;
      btn.textContent = 'EN';
      var w2 = btn.offsetWidth;
      btn.textContent = saved;
      btn.style.minWidth = Math.max(w1, w2) + 'px';
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function() { reserveLangSpace(); });
  } else {
    reserveLangSpace();
  }

  document.querySelectorAll('.m-lang-toggle, .lang-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var next = (localStorage.getItem('lang') || 'en') === 'ja' ? 'en' : 'ja';
      localStorage.setItem('lang', next);
      applyLang(next, true);
    });
  });
})();

// ---- Direction Chart hover interaction ----
(function() {
  var area = document.querySelector('.direction-chart-area');
  if (!area) return;
  var items = area.querySelectorAll('.direction-item');

  items.forEach(function(item) {
    item.addEventListener('mouseenter', function() {
      var cat = item.getAttribute('data-cat');
      area.classList.add('has-hover');
      items.forEach(function(it) {
        if (it.getAttribute('data-cat') === cat) {
          it.classList.add('is-highlighted');
        } else {
          it.classList.remove('is-highlighted');
        }
      });
    });

    item.addEventListener('mouseleave', function() {
      area.classList.remove('has-hover');
      items.forEach(function(it) {
        it.classList.remove('is-highlighted');
      });
    });
  });
})();

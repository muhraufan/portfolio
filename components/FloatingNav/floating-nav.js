/* ════════════════════════════════════════════════════════════════════
   Floating Nav — controller
   ────────────────────────────────────────────────────────────────────
   - Click "Sections" → toggle popover.
   - Click any link inside the popover → smooth-scroll to the section
     and close the popover.
   - Click outside the popover → close it.
   - Press Escape → close it.
   - On scroll, mark the section currently in view as `.is-active`.

   Self-contained. Boots when DOM is ready. Does nothing if the
   .case-fn-menu element isn't on the page (so safe to load globally
   even on pages without floating nav).
   ════════════════════════════════════════════════════════════════════ */
(function () {
  function boot() {
    var menuBtn  = document.querySelector('.case-fn-menu');
    var popover  = document.querySelector('.case-fn-popover');
    if (!menuBtn || !popover) return;

    var links = popover.querySelectorAll('.case-fn-popover-link');

    function setOpen(yes) {
      popover.classList.toggle('is-open', yes);
      // Keep the button visually "expanded" (label visible + hover bg)
      // while the popover is open, even if the cursor has moved away
      // onto the popover items.
      menuBtn.classList.toggle('is-active', yes);
      menuBtn.setAttribute('aria-expanded', yes ? 'true' : 'false');
    }

    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!popover.classList.contains('is-open'));
    });

    // Close on click outside.
    document.addEventListener('click', function (e) {
      if (!popover.contains(e.target) && !menuBtn.contains(e.target)) {
        setOpen(false);
      }
    });

    // Close on Escape.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });

    // Smooth-scroll on link click. The popover STAYS OPEN so the
    // visitor can jump between sections without re-opening it each
    // time. Dismissal is intentional only: outside click, Escape, or
    // tapping the Outline button again.
    //
    // PAYWALL GUARD: when body has `is-paywalled`, sections past the
    // cut are hidden behind the Medium-style wall, so jumping to them
    // would scroll the visitor past the cut into clipped content. We
    // block the scroll, surface the wall instead, and shake it as
    // tactile feedback that "you need to unlock first."
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href') || '';
        if (href.charAt(0) !== '#') return; // external — let it through
        e.preventDefault();

        if (document.body.classList.contains('is-paywalled')) {
          var wall = document.querySelector('.pw-paywall');
          if (wall) {
            wall.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Replay the shake every click: remove → force reflow → add.
            // Without the reflow, re-adding the same class wouldn't
            // re-trigger the keyframes.
            wall.classList.remove('case-fn-bump');
            void wall.offsetWidth; // jshint ignore:line — reflow on purpose
            wall.classList.add('case-fn-bump');
            // Once the shake finishes, drop the class so it can fire
            // again on the next attempt.
            setTimeout(function () { wall.classList.remove('case-fn-bump'); }, 600);
            // Drop the visitor into the password input after the scroll
            // settles — they came here to navigate, give them the next
            // best action.
            var input = wall.querySelector('.pw-input');
            if (input) setTimeout(function () {
              try { input.focus({ preventScroll: true }); } catch (_) { input.focus(); }
            }, 450);
          }
          return;
        }

        var target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Update active immediately (visual feedback)
          links.forEach(function (l) { l.classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });
    });

    // Build a parallel array of section elements once, used by both
    // active-section tracking AND the per-section progress bars.
    var sections = Array.prototype.map.call(links, function (link) {
      var href = link.getAttribute('href') || '';
      return href.charAt(0) === '#' ? document.querySelector(href) : null;
    });

    // Active section tracking via IntersectionObserver — same idea
    // as the legacy .case-nav-link active state. The link whose
    // section is most visible gets `.is-active`.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var idx = sections.indexOf(entry.target);
            if (idx >= 0) {
              links.forEach(function (l) { l.classList.remove('is-active'); });
              links[idx].classList.add('is-active');
            }
          }
        });
      }, { rootMargin: '-30% 0px -55% 0px' });
      sections.forEach(function (s) { if (s) io.observe(s); });
    }

    // ─── Scroll progress ──────────────────────────────────────────
    // Drives the top-of-viewport progress strip via the
    // --scroll-progress custom property (0..1 of total page scroll).
    // RAF-throttled so rapid scroll events collapse into one repaint
    // per frame.
    var topProgress = document.querySelector('.case-fn-top-progress');
    var body        = document.body;
    var scrolledOn  = false;
    var bottomFadeOn = false;
    var ticking = false;
    function updateProgress() {
      ticking = false;
      var scrollY = window.scrollY || window.pageYOffset;
      var docH = Math.max(0,
        document.documentElement.scrollHeight - window.innerHeight);
      var total = docH > 0 ? Math.max(0, Math.min(1, scrollY / docH)) : 0;
      if (topProgress) {
        topProgress.style.setProperty('--scroll-progress', total);
      }

      // Top-fade overlay — on once we're past the very top.
      // 8px deadband so micro-scrolls don't flicker it on/off.
      var nowScrolled = scrollY > 8;
      if (nowScrolled !== scrolledOn) {
        scrolledOn = nowScrolled;
        body.classList.toggle('is-fn-scrolled', nowScrolled);
      }

      // Bottom-fade overlay — only when there's still content below the
      // viewport. Otherwise it'd dissolve already-visible content right
      // before the page actually ends, which feels broken. Same 8px
      // deadband for stability.
      var hasMoreBelow = (scrollY + window.innerHeight) < (document.documentElement.scrollHeight - 8);
      if (hasMoreBelow !== bottomFadeOn) {
        bottomFadeOn = hasMoreBelow;
        body.classList.toggle('is-fn-bottom-fade', hasMoreBelow);
      }

      // Last-section fallback. The IO's -55% bottom rootMargin means
      // a short final section may never enter the active band, so the
      // outline gets "stuck" on the second-to-last item once the
      // visitor reaches the foot of the page. When the viewport is
      // within ~80px of the doc bottom, force the last link active.
      if (links.length > 0 && (scrollY + window.innerHeight) >= (document.documentElement.scrollHeight - 80)) {
        var lastIdx = links.length - 1;
        if (!links[lastIdx].classList.contains('is-active')) {
          for (var i = 0; i < links.length; i++) {
            links[i].classList.remove('is-active');
          }
          links[lastIdx].classList.add('is-active');
        }
      }
    }
    function schedule() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateProgress);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    updateProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();

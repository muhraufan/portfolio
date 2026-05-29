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

    // Smooth-scroll + close on link click.
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href') || '';
        if (href.charAt(0) !== '#') return; // external — let it through
        e.preventDefault();
        var target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Update active immediately (visual feedback)
          links.forEach(function (l) { l.classList.remove('is-active'); });
          link.classList.add('is-active');
        }
        setOpen(false);
      });
    });

    // Active section tracking via IntersectionObserver — same idea
    // as the legacy .case-nav-link active state. The link whose
    // section is most visible gets `.is-active`.
    if ('IntersectionObserver' in window) {
      var sections = Array.prototype.map.call(links, function (link) {
        var href = link.getAttribute('href') || '';
        return href.charAt(0) === '#' ? document.querySelector(href) : null;
      });
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();

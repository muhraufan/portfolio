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

// Wire up all theme toggles (old nav toggle + new minimal toggle).
// Wrap the swap in document.startViewTransition so CSS can animate a
// soft wavefront from the toggle's position. See style.css for the
// ::view-transition-new(root) rule and the --vt-* custom props.
function runThemeToggle(btn) {
  const current = localStorage.getItem('theme');
  const next = current === 'dark' ? 'light' : 'dark';
  const swap = () => {
    localStorage.setItem('theme', next);
    applyTheme(next);
  };

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduce) { swap(); return; }

  // Origin & coverage radius for the radial-gradient mask.
  const rect = btn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = Math.max(cx, window.innerWidth - cx);
  const dy = Math.max(cy, window.innerHeight - cy);
  const radius = Math.hypot(dx, dy) * 1.1; // small overshoot past the far corner

  html.style.setProperty('--vt-x', `${cx}px`);
  html.style.setProperty('--vt-y', `${cy}px`);
  html.style.setProperty('--vt-r', `${radius}px`);

  document.startViewTransition(swap);
}
document.querySelectorAll('.theme-toggle, .m-theme-toggle').forEach(btn => {
  btn?.addEventListener('click', () => runThemeToggle(btn));
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getTheme() === 'auto') applyTheme('auto');
});

// ---- Profile-photo portfolio switcher ----
(function profilePortfolioSwitcher() {
  const picker = document.querySelector('.m-avatar-picker');
  if (!picker) return;

  const cards = [...picker.querySelectorAll('.m-avatar-card')];
  const panels = [...document.querySelectorAll('[data-profile-panel]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const touchLayout = window.matchMedia('(hover: none), (pointer: coarse)');
  let transitionToken = 0;

  function closeTouchPicker() {
    picker.classList.remove('is-open');
  }

  function updateProfileUrl(mode, method = 'pushState') {
    const url = new URL(window.location.href);
    if (mode === 'photography') url.searchParams.set('view', 'photography');
    else url.searchParams.delete('view');
    window.history[method]({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function showProfile(mode, { animate = true, updateUrl = true } = {}) {
    const nextPanel = panels.find(panel => panel.dataset.profilePanel === mode);
    if (!nextPanel) return;

    const visiblePanel = panels.find(panel => !panel.hidden);
    const token = ++transitionToken;
    document.body.dataset.profile = mode;
    document.title = mode === 'photography' ? 'Photography — Raufan Yusup' : 'Raufan Yusup';

    cards.forEach(card => {
      const isActive = card.dataset.profile === mode;
      card.classList.toggle('is-active', isActive);
      card.setAttribute('aria-pressed', String(isActive));
    });
    if (updateUrl) updateProfileUrl(mode);

    if (visiblePanel === nextPanel) {
      visiblePanel.classList.remove('is-leaving');
      visiblePanel.classList.add('is-active');
      return;
    }

    const reveal = () => {
      if (token !== transitionToken) return;
      panels.forEach(panel => {
        panel.hidden = panel !== nextPanel;
        panel.classList.remove('is-active', 'is-leaving');
      });
      nextPanel.hidden = false;
      window.dispatchEvent(new CustomEvent('profilechange', { detail: { mode } }));

      if (!animate || reduceMotion.matches) {
        nextPanel.classList.add('is-active');
        return;
      }

      requestAnimationFrame(() => {
        if (token !== transitionToken) return;
        nextPanel.classList.add('is-active');
      });
    };

    if (!visiblePanel || !animate || reduceMotion.matches) {
      reveal();
      return;
    }

    visiblePanel.classList.remove('is-active');
    visiblePanel.classList.add('is-leaving');
    window.setTimeout(reveal, 150);
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      if (touchLayout.matches) {
        if (!picker.classList.contains('is-open')) {
          picker.classList.add('is-open');
          return;
        }

        const isAlreadyActive = card.classList.contains('is-active');
        closeTouchPicker();
        if (isAlreadyActive) return;
      }

      showProfile(card.dataset.profile);
    });
  });

  document.addEventListener('pointerdown', event => {
    if (!touchLayout.matches || !picker.classList.contains('is-open')) return;
    if (!picker.contains(event.target)) closeTouchPicker();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeTouchPicker();
  });

  touchLayout.addEventListener('change', closeTouchPicker);

  window.addEventListener('popstate', () => {
    const mode = new URLSearchParams(window.location.search).get('view') === 'photography'
      ? 'photography'
      : 'design';
    showProfile(mode, { animate: false, updateUrl: false });
  });

  const initialMode = new URLSearchParams(window.location.search).get('view') === 'photography'
    ? 'photography'
    : 'design';
  showProfile(initialMode, { animate: false, updateUrl: false });
})();

// ---- Photography filters + native-ratio archive grid ----
(async function photographyGallery() {
  const grid = document.querySelector('.m-photo-grid');
  const filters = [...document.querySelectorAll('[data-photo-filter]')];
  if (!grid) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeFilter = 'all';
  let photoItems = [];
  let activeItem = null;
  let savedScrollY = 0;
  let closeTimer = 0;
  let filterTimer = 0;
  let filterTransitionToken = 0;
  let viewerBaseWidth = 1;
  const fullPhotoCache = new Map();
  const scatteredItems = new Set();
  const scatteredChrome = new Set();

  const viewer = document.createElement('div');
  const viewerBackdrop = document.createElement('div');
  const viewerImage = document.createElement('img');
  const viewerControls = document.createElement('div');
  const viewerCount = document.createElement('span');
  const viewerClose = document.createElement('button');

  viewer.className = 'm-photo-viewer';
  viewer.hidden = true;
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-label', 'Enlarged photograph. Use Left and Right Arrow keys to browse.');

  viewerBackdrop.className = 'm-photo-viewer-backdrop';

  viewerImage.className = 'm-photo-viewer-image';
  viewerImage.decoding = 'async';

  viewerControls.className = 'm-photo-viewer-controls';
  viewerCount.className = 'm-photo-viewer-count';
  viewerCount.setAttribute('aria-live', 'polite');
  viewerClose.className = 'm-photo-viewer-close';
  viewerClose.type = 'button';
  viewerClose.setAttribute('aria-label', 'Close enlarged photograph');
  viewerClose.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
  viewerControls.append(viewerCount, viewerClose);
  viewer.append(viewerBackdrop, viewerImage, viewerControls);
  document.body.append(viewer);

  const viewerChrome = [
    ...document.querySelectorAll('.m-top-controls > *'),
    ...document.querySelectorAll('.m-avatar-picker > .m-avatar-card'),
    document.querySelector('.m-header > .m-name'),
    document.querySelector('.m-photo-profile > .m-photo-intro'),
    ...document.querySelectorAll('.m-photo-heading > *'),
    ...document.querySelectorAll('.m-photo-filters > .m-photo-filter'),
    ...document.querySelectorAll('.m-page > .m-footer > *')
  ].filter(Boolean);
  viewerChrome.forEach(element => element.classList.add('m-photo-viewer-chrome'));

  function seededOrder(item) {
    const input = `${item.dataset.photoSource}-${item.dataset.photoIndex}`;
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mixedAllItems(items) {
    return [...items].sort((first, second) => seededOrder(first) - seededOrder(second));
  }

  function loadFullPhoto(item) {
    const src = item?.dataset.photoFull;
    if (!src) return Promise.resolve(null);
    if (fullPhotoCache.has(src)) return fullPhotoCache.get(src);

    const request = new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = async () => {
        try { await image.decode(); } catch (_) { /* A loaded image is still safe to display. */ }
        resolve(image);
      };
      image.onerror = () => resolve(null);
      image.src = src;
    });
    fullPhotoCache.set(src, request);
    return request;
  }

  async function upgradeViewerImage(item) {
    const fullImage = await loadFullPhoto(item);
    if (!fullImage || activeItem !== item || viewer.hidden) return;
    viewerImage.src = fullImage.currentSrc || fullImage.src;
  }

  function viewerTarget(image) {
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const item = image.closest('.m-photo-item');
    const naturalWidth = Number(item?.dataset.photoWidth)
      || image.naturalWidth
      || Number(image.getAttribute('width'))
      || 1;
    const naturalHeight = Number(item?.dataset.photoHeight)
      || image.naturalHeight
      || Number(image.getAttribute('height'))
      || 1;
    const ratio = naturalWidth / naturalHeight;
    const gutter = viewportWidth < 640 ? 20 : Math.max(56, viewportWidth * 0.1);
    const verticalGutter = viewportWidth < 640 ? 88 : Math.max(64, viewportHeight * 0.08);
    const maxWidth = viewportWidth - gutter * 2;
    const maxHeight = viewportHeight - verticalGutter * 2;
    const width = Math.min(maxWidth, maxHeight * ratio, naturalWidth);
    const height = width / ratio;

    return {
      x: Math.round((viewportWidth - width) / 2),
      y: Math.round((viewportHeight - height) / 2),
      width,
      height
    };
  }

  function viewportExit(rect, focusX, focusY, overshoot, fallbackAngle) {
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    let deltaX = rect.left + rect.width / 2 - focusX;
    let deltaY = rect.top + rect.height / 2 - focusY;

    if (Math.hypot(deltaX, deltaY) < 2) {
      deltaX = Math.cos(fallbackAngle) * 2;
      deltaY = Math.sin(fallbackAngle) * 2;
    }

    const distance = Math.hypot(deltaX, deltaY);
    const unitX = deltaX / distance;
    const unitY = deltaY / distance;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const exitCenterX = unitX >= 0
      ? viewportWidth + rect.width / 2 + overshoot
      : -rect.width / 2 - overshoot;
    const exitCenterY = unitY >= 0
      ? viewportHeight + rect.height / 2 + overshoot
      : -rect.height / 2 - overshoot;
    const travelX = Math.abs(unitX) > 0.001 ? (exitCenterX - centerX) / unitX : Infinity;
    const travelY = Math.abs(unitY) > 0.001 ? (exitCenterY - centerY) / unitY : Infinity;
    const travel = Math.min(
      travelX > 0 ? travelX : Infinity,
      travelY > 0 ? travelY : Infinity
    );

    return {
      x: unitX * travel,
      y: unitY * travel,
      distanceRatio: Math.min(distance / Math.hypot(viewportWidth / 2, viewportHeight / 2), 1)
    };
  }

  function intersectsViewport(rect, margin = 0) {
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    return rect.bottom > -margin
      && rect.top < viewportHeight + margin
      && rect.right > -margin
      && rect.left < viewportWidth + margin;
  }

  function scatterGallery(selectedItem, target) {
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const focusX = target.x + target.width / 2;
    const focusY = target.y + target.height / 2;
    const overshoot = viewportWidth < 640 ? 16 : 28;

    [...grid.querySelectorAll('.m-photo-item')].forEach((item, index) => {
      if (item === selectedItem) {
        item.style.opacity = '0';
        scatteredItems.add(item);
        return;
      }

      const rect = item.getBoundingClientRect();
      if (!intersectsViewport(rect, 32)) return;
      const movement = viewportExit(rect, focusX, focusY, overshoot, index * 2.399963);
      const fade = 0.42 + movement.distanceRatio * 0.08;
      const blur = 1.4 - movement.distanceRatio * 0.4;

      item.style.transform = `translate3d(${movement.x.toFixed(2)}px, ${movement.y.toFixed(2)}px, 0) scale(0.98)`;
      item.style.opacity = fade.toFixed(2);
      item.style.filter = `blur(${blur}px)`;
      scatteredItems.add(item);
    });
  }

  function clearGalleryItemStyles(item) {
    item.style.removeProperty('transform');
    item.style.removeProperty('opacity');
    item.style.removeProperty('filter');
  }

  function resetGalleryScatter(preservedItem = null) {
    const shouldPreserve = preservedItem && scatteredItems.has(preservedItem);
    scatteredItems.forEach(item => {
      if (item !== preservedItem) clearGalleryItemStyles(item);
    });
    scatteredItems.clear();
    if (shouldPreserve) scatteredItems.add(preservedItem);
  }

  function restoreGalleryItem(item) {
    clearGalleryItemStyles(item);
    scatteredItems.delete(item);
  }

  function scatterPageChrome(target, shouldAnimate) {
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const focusX = target.x + target.width / 2;
    const focusY = target.y + target.height / 2;
    const overshoot = viewportWidth < 640 ? 20 : 36;

    viewerChrome.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      if (!intersectsViewport(rect)) return;

      if (shouldAnimate) {
        const movement = viewportExit(rect, focusX, focusY, overshoot, index * 2.399963);
        element.style.translate = `${movement.x.toFixed(2)}px ${movement.y.toFixed(2)}px`;
      } else {
        element.style.opacity = '0';
      }
      element.style.pointerEvents = 'none';
      scatteredChrome.add(element);
    });
  }

  function resetPageChrome() {
    scatteredChrome.forEach(element => {
      element.style.removeProperty('translate');
      element.style.removeProperty('opacity');
      element.style.removeProperty('filter');
      element.style.removeProperty('pointer-events');
    });
    scatteredChrome.clear();
  }

  async function openViewer(item, { animate = true } = {}) {
    if (activeItem) return;
    const thumbnail = item.querySelector('img');
    if (!thumbnail) return;

    if (!thumbnail.complete) {
      try { await thumbnail.decode(); } catch (_) { /* The browser can still render it. */ }
    }

    window.clearTimeout(closeTimer);
    activeItem = item;
    savedScrollY = window.scrollY;

    const sourceRect = thumbnail.getBoundingClientRect();
    const visibleItems = [...grid.querySelectorAll('.m-photo-item')];
    const visibleIndex = visibleItems.indexOf(item);
    const target = viewerTarget(thumbnail);
    const shouldAnimate = animate && !reduceMotion.matches;

    viewerImage.src = thumbnail.currentSrc || thumbnail.src;
    viewerImage.alt = thumbnail.alt;
    viewerImage.style.width = `${sourceRect.width}px`;
    viewerImage.style.height = `${sourceRect.height}px`;
    viewerImage.style.transform = `translate3d(${sourceRect.left}px, ${sourceRect.top}px, 0) scale(1)`;
    viewerBaseWidth = sourceRect.width;
    viewerCount.textContent = `${visibleIndex + 1} / ${visibleItems.length}`;

    viewer.hidden = false;
    viewer.removeAttribute('data-closing');
    viewer.toggleAttribute('data-instant', !shouldAnimate);
    document.body.classList.remove('m-photo-viewer-closing');
    document.body.classList.toggle('m-photo-viewer-instant', !shouldAnimate);
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.style.setProperty('--photo-viewer-scrollbar-width', `${scrollbarWidth}px`);
    document.body.classList.add('m-photo-viewer-open');
    document.body.style.top = `-${savedScrollY}px`;
    void document.body.offsetWidth;
    scatterGallery(item, target);
    scatterPageChrome(target, shouldAnimate);

    requestAnimationFrame(() => {
      viewer.setAttribute('data-open', '');
      viewerImage.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) scale(${target.width / sourceRect.width})`;
      viewerClose.focus({ preventScroll: true });
      upgradeViewerImage(item);
      requestAnimationFrame(() => {
        viewer.removeAttribute('data-instant');
        document.body.classList.remove('m-photo-viewer-instant');
      });
    });
  }

  function navigateViewer(direction) {
    if (!activeItem) return;
    const visibleItems = [...grid.querySelectorAll('.m-photo-item')];
    const currentIndex = visibleItems.indexOf(activeItem);
    if (currentIndex < 0 || visibleItems.length < 2) return;

    const nextIndex = (currentIndex + direction + visibleItems.length) % visibleItems.length;
    const nextItem = visibleItems[nextIndex];
    const thumbnail = nextItem.querySelector('img');
    if (!thumbnail) return;

    const target = viewerTarget(thumbnail);
    viewer.setAttribute('data-instant', '');
    document.body.classList.add('m-photo-viewer-instant');
    resetGalleryScatter();
    activeItem = nextItem;

    viewerImage.src = thumbnail.currentSrc || thumbnail.src;
    viewerImage.alt = thumbnail.alt;
    viewerImage.style.width = `${target.width}px`;
    viewerImage.style.height = `${target.height}px`;
    viewerImage.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) scale(1)`;
    viewerBaseWidth = target.width;
    viewerCount.textContent = `${nextIndex + 1} / ${visibleItems.length}`;
    scatterGallery(nextItem, target);
    upgradeViewerImage(nextItem);

    requestAnimationFrame(() => {
      viewer.removeAttribute('data-instant');
      document.body.classList.remove('m-photo-viewer-instant');
    });
  }

  function closeViewer({ animate = true } = {}) {
    if (!activeItem) return;
    window.clearTimeout(closeTimer);

    const itemToRestore = activeItem;
    const thumbnail = itemToRestore.querySelector('img');
    const sourceRect = thumbnail?.getBoundingClientRect();
    const shouldAnimate = animate && !reduceMotion.matches && sourceRect;
    activeItem = null;

    viewer.setAttribute('data-closing', '');
    viewer.toggleAttribute('data-instant', !shouldAnimate);
    document.body.classList.add('m-photo-viewer-closing');
    document.body.classList.toggle('m-photo-viewer-instant', !shouldAnimate);
    viewer.removeAttribute('data-open');
    resetGalleryScatter(itemToRestore);
    resetPageChrome();
    if (sourceRect) {
      viewerImage.style.transform = `translate3d(${sourceRect.left}px, ${sourceRect.top}px, 0) scale(${sourceRect.width / viewerBaseWidth})`;
    }

    const finish = () => {
      viewer.hidden = true;
      viewerImage.removeAttribute('src');
      document.body.classList.add('m-photo-viewer-instant');
      itemToRestore.classList.add('m-photo-source-handoff');
      restoreGalleryItem(itemToRestore);
      void itemToRestore.offsetWidth;
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      viewer.removeAttribute('data-closing');
      viewer.removeAttribute('data-instant');
      document.body.classList.remove('m-photo-viewer-open');
      document.body.classList.remove('m-photo-viewer-closing', 'm-photo-viewer-instant');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('--photo-viewer-scrollbar-width');
      window.scrollTo(0, savedScrollY);
      itemToRestore.querySelector('.m-photo-open')?.focus({ preventScroll: true });
      void root.offsetWidth;
      requestAnimationFrame(() => {
        itemToRestore.classList.remove('m-photo-source-handoff');
        if (previousScrollBehavior) root.style.scrollBehavior = previousScrollBehavior;
        else root.style.removeProperty('scroll-behavior');
      });
    };

    closeTimer = window.setTimeout(finish, shouldAnimate ? 320 : 20);
  }

  function createPhotoItem(photo) {
    const item = document.createElement('figure');
    const openButton = document.createElement('button');
    const image = document.createElement('img');
    const caption = document.createElement('figcaption');
    const title = document.createElement('span');
    const category = document.createElement('span');
    const categories = Array.isArray(photo.category) ? photo.category : [photo.category];

    item.className = 'm-photo-item';
    item.dataset.photoCategory = categories.filter(Boolean).join(' ');
    item.dataset.frame = photo.frame || 'standard';
    item.dataset.photoIndex = String(photo.order || '');
    item.dataset.photoSource = photo.source || photo.src;
    item.dataset.photoFull = photo.fullSrc || photo.src;
    item.dataset.photoWidth = String(photo.width);
    item.dataset.photoHeight = String(photo.height);
    item.style.setProperty('--photo-ratio', photo.width / photo.height);
    item.style.setProperty('--photo-basis', `${Math.round(photo.width / photo.height * 90)}px`);
    item.style.setProperty('--photo-basis-mobile', `${Math.round(photo.width / photo.height * 64)}px`);

    openButton.className = 'm-photo-open';
    openButton.type = 'button';
    openButton.setAttribute('aria-label', `Enlarge ${photo.title || 'photograph'}`);

    image.src = photo.src;
    image.alt = photo.alt || photo.title || '';
    image.width = photo.width;
    image.height = photo.height;
    image.loading = 'lazy';
    image.decoding = 'async';
    if (photo.position) image.style.setProperty('--photo-position', photo.position);

    title.textContent = photo.title || '';
    category.textContent = categories.join(', ');
    caption.append(title, category);
    openButton.append(image);
    openButton.addEventListener('pointerdown', () => loadFullPhoto(item));
    openButton.addEventListener('click', event => {
      openViewer(item, { animate: event.detail !== 0 });
    });
    item.append(openButton, caption);
    return item;
  }

  function matchingPhotoItems(filter) {
    let matchingItems = photoItems.filter(item => {
      if (filter === 'all') return true;
      const categories = item.dataset.photoCategory?.split(' ') || [];
      return categories.includes(filter);
    });
    if (filter === 'all') matchingItems = mixedAllItems(matchingItems);
    return matchingItems;
  }

  function clearFilterMotion(items = photoItems) {
    items.forEach(item => {
      item.classList.remove('is-filter-leaving', 'is-filter-entering');
      item.style.removeProperty('transition-delay');
    });
    grid.removeAttribute('data-filter-phase');
  }

  function renderFilter(filter, { animate = true } = {}) {
    if (filter === activeFilter && grid.childElementCount) return;
    activeFilter = filter;
    filters.forEach(button => {
      const active = button.dataset.photoFilter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    const matchingItems = matchingPhotoItems(filter);
    const currentItems = [...grid.querySelectorAll('.m-photo-item')];
    const token = ++filterTransitionToken;
    window.clearTimeout(filterTimer);
    clearFilterMotion();

    if (!animate || reduceMotion.matches || !currentItems.length) {
      grid.replaceChildren(...matchingItems);
      return;
    }

    grid.dataset.filterPhase = 'exit';
    currentItems.forEach((item, index) => {
      item.style.transitionDelay = `${(index % 6) * 12}ms`;
      item.classList.add('is-filter-leaving');
    });

    filterTimer = window.setTimeout(() => {
      if (token !== filterTransitionToken) return;
      clearFilterMotion(currentItems);
      grid.replaceChildren(...matchingItems);
      grid.dataset.filterPhase = 'enter';

      matchingItems.forEach((item, index) => {
        item.style.transitionDelay = `${(index % 6) * 12}ms`;
        item.classList.add('is-filter-entering');
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (token !== filterTransitionToken) return;
          matchingItems.forEach(item => item.classList.remove('is-filter-entering'));
          filterTimer = window.setTimeout(() => {
            if (token === filterTransitionToken) clearFilterMotion(matchingItems);
          }, 300);
        });
      });
    }, 200);
  }

  filters.forEach(button => {
    button.addEventListener('click', event => {
      renderFilter(button.dataset.photoFilter, { animate: event.detail !== 0 });
    });
  });

  viewerBackdrop.addEventListener('click', () => closeViewer());
  viewerClose.addEventListener('click', event => closeViewer({ animate: event.detail !== 0 }));
  document.addEventListener('keydown', event => {
    if (!activeItem) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeViewer({ animate: false });
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigateViewer(-1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigateViewer(1);
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      viewerClose.focus({ preventScroll: true });
    }
  });

  window.addEventListener('resize', () => {
    if (!activeItem) return;
    const thumbnail = activeItem.querySelector('img');
    const sourceRect = thumbnail?.getBoundingClientRect();
    if (!thumbnail || !sourceRect) return;
    const target = viewerTarget(thumbnail);
    viewer.setAttribute('data-instant', '');
    document.body.classList.add('m-photo-viewer-instant');
    resetGalleryScatter();
    resetPageChrome();
    viewerImage.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) scale(${target.width / viewerBaseWidth})`;
    scatterGallery(activeItem, target);
    scatterPageChrome(target, true);
    requestAnimationFrame(() => {
      viewer.removeAttribute('data-instant');
      document.body.classList.remove('m-photo-viewer-instant');
    });
  });

  try {
    const response = await fetch('/assets/photography/portfolio/photos.json?v=5');
    if (!response.ok) throw new Error(`Photography manifest returned ${response.status}`);
    const manifest = await response.json();
    photoItems = manifest.photos.map(createPhotoItem);
    renderFilter(activeFilter, { animate: false });
  } catch (error) {
    console.error('[Photography] Unable to load the archive', error);
    const message = document.createElement('p');
    message.className = 'm-photo-error';
    message.textContent = 'The photography archive could not be loaded.';
    grid.replaceChildren(message);
  } finally {
    grid.setAttribute('aria-busy', 'false');
  }
})();

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

// Keep the shimmer overlay copy of the gallery CTA in sync with the visible
// label — the language switcher rewrites textContent on data-en/data-ja
// elements, so we mirror that back into data-shimmer for the ::after content.
(function syncGalleryCtaShimmer() {
  const label = document.querySelector('.m-gallery-cta-label');
  if (!label) return;
  const sync = () => label.setAttribute('data-shimmer', label.textContent.trim());
  sync();
  new MutationObserver(sync).observe(label, { childList: true, characterData: true, subtree: true });
})();

// Spotlight hover on the homepage list links — DISABLED for now.
// Re-enable by un-commenting the IIFE below. CSS hooks remain in
// css/style.css (look for `.is-spotlight` / `.is-active-list` /
// `.is-active-li`) so toggling JS back on is enough to restore it.
//
// (function spotlightListHover() {
//   const links = document.querySelectorAll('body.minimal .m-list a');
//   if (!links.length) return;
//   const body = document.body;
//   const lists = document.querySelectorAll('body.minimal .m-list');
//   const items = document.querySelectorAll('body.minimal .m-list li');
//   let leaveTimer = null;
//
//   function clearActive() {
//     links.forEach(a => a.classList.remove('is-active'));
//     lists.forEach(ul => ul.classList.remove('is-active-list'));
//     items.forEach(li => li.classList.remove('is-active-li'));
//   }
//   function activate(link) {
//     if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
//     clearActive();
//     link.classList.add('is-active');
//     const parentLi = link.closest('li');
//     if (parentLi) parentLi.classList.add('is-active-li');
//     const parentList = link.closest('.m-list');
//     if (parentList) parentList.classList.add('is-active-list');
//     body.classList.add('is-spotlight');
//   }
//   function scheduleDeactivate() {
//     if (leaveTimer) clearTimeout(leaveTimer);
//     leaveTimer = setTimeout(() => {
//       clearActive();
//       body.classList.remove('is-spotlight');
//       leaveTimer = null;
//     }, 120);
//   }
//
//   links.forEach(link => {
//     link.addEventListener('mouseenter', () => activate(link));
//     link.addEventListener('mouseleave', scheduleDeactivate);
//     link.addEventListener('focus', () => activate(link));
//     link.addEventListener('blur', scheduleDeactivate);
//   });
// })();

// ---- Case-study folders ----
// The folder link owns navigation. Sheets are decorative previews; tracking
// the one under the pointer gives the stack a tactile, print-like response.
(function caseStudyFolders() {
  const folders = document.querySelectorAll('.case-folder');
  if (!folders.length) return;

  folders.forEach(folder => {
    const sheets = folder.querySelectorAll('.case-sheet');
    const clearFocus = () => {
      sheets.forEach(sheet => sheet.classList.remove('is-focused'));
      delete folder.dataset.focus;
    };

    folder.addEventListener('pointerenter', () => {
      folder.classList.add('is-open');
    });
    folder.addEventListener('pointerleave', () => {
      folder.classList.remove('is-open');
      clearFocus();
    });
    sheets.forEach((sheet, index) => {
      sheet.addEventListener('pointerenter', () => {
        if (!folder.classList.contains('is-open')) return;
        clearFocus();
        sheet.classList.add('is-focused');
        folder.dataset.focus = String(index);
      });
    });
  });
})();

/* Timeline — language, Tokyo dates, and the row spring.
   Sound lives in feel.js. The light control is the site's light-menu.js. */
(function () {
  var html = document.documentElement, TL = window.TL = {};
  var reduce = TL.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  TL.lang = function () { return html.getAttribute('data-lang') || localStorage.getItem('lang') || 'en'; };
  var subs = [];
  TL.onLang = function (fn) { subs.push(fn); };
  window.addEventListener('langchange', function () { requestAnimationFrame(function () { subs.forEach(function (f) { f(); }); }); });
  function setLangAttr() { html.lang = TL.lang() === 'ja' ? 'ja' : 'en'; }   // so screen readers and JA line breaking follow
  setLangAttr(); subs.push(setLangAttr);
  new MutationObserver(function () { subs.forEach(function (f) { f(); }); }).observe(html, { attributes: true, attributeFilter: ['data-lang'] });
  TL.s = function (o) { return o ? (o[TL.lang()] || o.en) : ''; };

  // ---------- places ----------
  // Every place that was the homepage scene, newest first. Only a name and a neighbourhood are ever shown.
  var META = { 'niko-and-shibuya': { name: { en: 'niko and ...', ja: 'niko and ...' }, area: { en: 'Shibuya, Tokyo', ja: '東京・渋谷' } } };
  TL.places = function () {
    var all = LastSeen.all();
    return all.map(function (S, i) {
      var m = META[S.id] || {}, next = all[i - 1];
      return { S: S, id: S.id, name: m.name || S.name || S.place, area: m.area || S.area || { en: '', ja: '' },
        from: new Date(S.seenAt), to: next ? new Date(next.seenAt) : null, current: i === 0, notes: [] };   // no guest notes yet: never invented
    });
  };
  // dates read in Tokyo time, where the places are. A visit shows its date, never the clock.
  var TZ = 'Asia/Tokyo';
  TL.day = function (d) { return TL.lang() === 'ja' ? d.toLocaleDateString('ja-JP', { timeZone: TZ, month: 'long', day: 'numeric' }) : d.toLocaleDateString('en-US', { timeZone: TZ, month: 'short', day: 'numeric' }); };
  // ---------- spring: semi-implicit Euler, fixed 120 Hz substeps; low-bounce by default ----------
  TL.Spring = function (v, o) {
    o = o || {}; this.x = v; this.v = 0; this.target = v;
    this.k = o.k || 260; this.c = o.c || 2 * Math.sqrt(this.k) * (o.zeta || .82);
  };
  TL.Spring.prototype.step = function (dt) {
    var h = 1 / 120, n = Math.max(1, Math.round(Math.min(dt, .05) / h));
    for (var i = 0; i < n; i++) { var a = -this.k * (this.x - this.target) - this.c * this.v; this.v += a * h; this.x += this.v * h; }
    if (Math.abs(this.v) < .002 && Math.abs(this.x - this.target) < .0005) { this.x = this.target; this.v = 0; return false; }   // land exactly
    return true;
  };
  TL.rubber = function (over, dim) { return dim * .22 * Math.tanh(over / (dim * .55)); };   // resistance past an end, never more than ~22% of the size
})();

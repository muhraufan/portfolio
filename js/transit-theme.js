/* Night mode for Tokyo Transit, using the same light preference as the case studies. */
(function () {
  var html = document.documentElement;
  var KEY = 'light';
  var STATES = ['morning', 'midday', 'golden', 'night'];
  var STARTS = [['morning', 300], ['midday', 660], ['golden', 930], ['night', 1080]];
  var dark = window.matchMedia('(prefers-color-scheme: dark)');
  function clock(d) {
    d = d || new Date();
    var m = d.getHours() * 60 + d.getMinutes();
    var k = 'night';
    for (var i = 0; i < STARTS.length; i++) if (m >= STARTS[i][1]) k = STARTS[i][0];
    return m < STARTS[0][1] ? 'night' : k;
  }
  function choice() {
    try {
      var c = localStorage.getItem(KEY);
      if (STATES.indexOf(c) >= 0) return c;
      if (localStorage.getItem('theme') === 'dark') return 'night';
    } catch (e) {}
    return 'auto';
  }
  var c = choice();
  var s = c === 'auto' ? (dark.matches ? 'night' : clock()) : c;
  html.setAttribute('data-tod', s);
  html.setAttribute('data-theme', s === 'night' ? 'dark' : 'light');
  function bind() {
    var page = document.body;
    if (!page) return;
    var onScroll = function () {
      page.classList.toggle('is-transit-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  if (document.body) bind();
  else document.addEventListener('DOMContentLoaded', bind);
})();

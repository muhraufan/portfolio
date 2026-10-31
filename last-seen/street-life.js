/* Street life for the hero scene (home page only): a red post box at the scene's edge that takes the notes people
   post from the guest card, and one rare, quiet detail per light (a crow in the morning, a cloud's shadow at midday,
   two birds at golden hour, an office window flicking on at night). Load after last-seen.js and the scenes, before
   /js/postcard.js, which mounts the hero with { extras: LastSeenStreet }. Everything is a function of the scene's own
   clock, so it pauses with the scene (hidden tab, card scrolled away) and resets on a change of light or scene. */
(function () {
  var LS = window.LastSeen, K = window.LastSeenKit; if (!LS || !K || !LS._drawPrims) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var easeOut = function (x) { return 1 - Math.pow(1 - x, 3); };
  var r = K.r, e = K.e, line = K.line, grain = K.grain, mix = K.mix;

  // ---------- where things go, per scene (scene units, 400 x 300). A scene that is not listed gets no post box. ----------
  // post: the box's foot on the near pavement, on the side he does not walk off to; crow: the morning crow's spot;
  // win: a dark upper window that comes on at night (omitted where the scene has none); birdsY: the golden birds' height.
  var SPOTS = window.LastSeenStreetSpots = {
    'bear-pond-espresso': { post: { x: 34, foot: 273 }, crow: { x: 296, foot: 253 }, win: { x: 199, y: 61, w: 28, h: 46 }, birdsY: 34 },   // by the neighbour's shutter, clear of the bench
    'apple-marunouchi': { post: { x: 104, foot: 271 }, crow: { x: 292, foot: 250 }, win: { x: 229.5, y: 42.6, w: 6, h: 6.6 }, birdsY: 30 },
    'cinta-jawa-shibuya': { post: { x: 100, foot: 271 } },
    'et-cultural-coffeehouse': { post: { x: 100, foot: 271 }, vend: { x: 296 } },   // drinks machine clear of the shrubs
    'fuglen-noborito': { post: { x: 100, foot: 271 } },
    'lifefit-yurigaoka': { post: { x: 100, foot: 271 } },
    'nadoya-no-katte': { post: { x: 52, foot: 272 }, vend: { x: 298 } },            // left of the bench, clear of the sitter
    'niko-and-shibuya': { post: { x: 136, foot: 271 } },          // clear of the "new in" board
    'stayful-life-store': { post: { x: 100, foot: 271 }, vend: { x: 349 } },        // past the potted tree
    'tokyo-big-sight': { post: { x: 100, foot: 271 } },
    'tokyo-camii': { post: { x: 100, foot: 271 } },
    'tokyo-nihombashi-tower': { post: { x: 150, foot: 272 } },    // past the parked bike, by the Metro glass
    'tsuchiya-kaban-nakameguro': { post: { x: 150, foot: 272 }, vend: { x: 296 } }  // past the parked bikes, at the foot of the steps
    // mufg-park, yoyogi-park: no post box (a lawn and a park path, no street)
  };
  function spots(S) {
    var o = SPOTS[S.id] || {}, g = LS.groundOf(S);
    return { post: o.post || null, crow: o.crow || { x: S.signature.walk.dir > 0 ? g.xMax - 70 : g.xMin + 70, foot: g.y0 + 4 }, win: o.win || null, birdsY: o.birdsY || 30 };
  }

  // ---------- colours: the post box red goes through the same light as the scene (the kit's tone targets) ----------
  var TONE = { morning: ['#cbd8e2', .16], golden: ['#f0b07e', .2], night: ['#0d1124', .72] };
  var BASE = { post: '#c4402e', postShade: '#93291d', postLite: '#e06b52', postSlot: '#2a1814', postPlate: '#f1ece2', postBase: '#3b3734' };
  function tint(v) { var t = TONE[v], o = {}; Object.keys(BASE).forEach(function (k) { o[k] = t ? mix(BASE[k], t[0], t[1]) : BASE[k]; }); return o; }

  // ---------- the post box: a classic round one, painted once per light and size with the scene's grain ----------
  function postPrims(x, f) {
    return [
      e(x + 2.5, f, 11, 2, 'shadow', { a: .16 }),
      r(x - 7, f - 4.5, 14, 4.5, 'postBase', { r: [0, 0, .8, .8], shade: grain('shadow', .3, 'right') }),
      r(x - 7.4, f - 34, 14.8, 30, 'post', { shade: [grain('postShade', .55, 'right', 1.3), grain('postShade', .18, 'down')] }),
      r(x - 5.8, f - 33, 1.8, 28, 'postLite', { a: .5 }),
      e(x, f - 35.4, 8.2, 4.4, 'post', { shade: grain('postShade', .45, 'right') }),
      e(x - 2.2, f - 37.2, 3.4, 1.4, 'postLite', { a: .45 }),
      r(x - 8.2, f - 35.2, 16.4, 2.2, 'postShade', { r: .8 }),
      r(x - 4.4, f - 29.2, 8.8, 1.3, 'postSlot', { r: .5 }),
      r(x - 3.4, f - 25, 6.8, 5, 'postPlate', { r: .4, a: .92 }),
      r(x - 2.6, f - 23.6, 5.2, .45, 'postShade', { a: .35 }), r(x - 2.6, f - 22, 5.2, .45, 'postShade', { a: .35 }),
      line([x - 1.7, f - 16.6, x + 1.7, f - 16.6], 'postPlate', .6), line([x - 1.7, f - 15.2, x + 1.7, f - 15.2], 'postPlate', .6), line([x, f - 15.2, x, f - 12.4], 'postPlate', .6),
      r(x - 7.4, f - 6, 14.8, 1, 'postShade', { a: .5 })
    ];
  }
  var sprite = null, spriteKey = '';
  function postSprite(S, sp, pal, vkey, k) {
    var key = S.id + vkey + k; if (spriteKey === key) return sprite;
    var bx = sp.x - 12, by = sp.foot - 42, c = document.createElement('canvas');
    c.width = Math.ceil(26 * k); c.height = Math.ceil(46 * k);
    var x = c.getContext('2d'); x.setTransform(k, 0, 0, k, -bx * k, -by * k);
    LS._drawPrims(x, postPrims(sp.x, sp.foot), Object.assign({}, pal, tint(vkey)), LS._rng(S.seed + 4242), Math.max(.55, 1.15 / k));
    sprite = { c: c, bx: bx, by: by }; spriteKey = key; return sprite;
  }
  var ack = -1e9;                   // when the last note landed: the flap lifts once and the box gives one small bump
  function drawPost(f, S, sp, pal, vkey) {
    var k = f.getTransform().a, s = postSprite(S, sp, pal, vkey, k), tp = tint(vkey), t = performance.now();
    var u = (t - ack) / 300, b = u >= 0 && u < 1 && !reduce.matches ? Math.sin(Math.PI * u) * (1 - u) : 0;
    f.translate(sp.x, sp.foot); f.scale(1 + .03 * b, 1 - .045 * b); f.translate(-sp.x, -sp.foot);
    f.drawImage(s.c, s.bx, s.by, s.c.width / k, s.c.height / k);
    var lu = (t - ack) / 240, lid = lu >= 0 && lu < 1 ? (reduce.matches ? 1 : Math.sin(Math.PI * Math.min(1, lu * 1.4))) : 0;
    f.fillStyle = tp.postShade; f.fillRect(sp.x - 4.8, sp.foot - 30.6 - lid * 1.1, 9.6, 1.1);
    if (lid > .05) { f.globalAlpha = .5 * lid; f.fillStyle = tp.postSlot; f.fillRect(sp.x - 4.4, sp.foot - 29.6 - lid * .6, 8.8, .9); }
  }

  // ---------- one rare detail per light: once soon after arriving (or after a change of light), then after a long gap ----------
  var GAP = { morning: [45, 75], midday: [80, 120], golden: [70, 100], night: [70, 110] };
  var DUR = { morning: 1.15, midday: 14, golden: 4.2, night: .7 };
  var FIRST = { morning: 2.6, midday: 1.5, golden: 3, night: 2.2 };
  var amb = { key: null, at: -1e9, next: 0, seen: false };
  function ambient(t, v, S) {       // -> progress 0..1 of the current beat, or -1 (t is the scene's clock, in seconds)
    var key = S.id + v; amb.t = t;
    if (amb.key !== key || t < amb.at) { amb.key = key; amb.at = -1e9; amb.seen = false; amb.next = t + FIRST[v]; }   // reset on light/scene change
    if (t >= amb.next) {
      if (v === 'morning' && api && api.feeding && api.feeding()) amb.next = t + 8;      // the crows are already down: not now
      else { amb.at = t; amb.seen = true; amb.next = t + GAP[v][0] + Math.random() * (GAP[v][1] - GAP[v][0]); }
    }
    var u = (t - amb.at) / DUR[v]; return u >= 0 && u <= 1 ? u : -1;
  }
  function crowProp(sp, pal, v, u) {   // morning: a crow on the pavement, two short hops then one peck; still under reduced motion
    var hop = 0, dx = amb.seen ? 4.8 : 0, peck = 0;
    if (u >= 0) { var ms = u * DUR.morning * 1000;
      if (ms < 520) { var h = (ms % 260) / 260; hop = Math.sin(Math.PI * h) * 2.6; dx = (Math.floor(ms / 260) + easeOut(h)) * 2.4; }
      else { dx = 4.8; var p = (ms - 620) / 380; peck = p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; } }
    var c = sp.crow; return { foot: c.foot, draw: function (f) { LS.crow(f, c.x + dx, c.foot - hop, c.foot / 240, 1, pal, v, { peck: peck }); } };
  }
  function cloud(f, pal, u) {          // midday: a soft shadow drifting over the street, left to right
    var x = -150 + u * 700, a = .085 * Math.min(1, u / .12, (1 - u) / .12);
    f.beginPath(); f.rect(0, 205, 400, 95); f.clip();
    f.translate(x, 262); f.scale(1, .26);
    var g = f.createRadialGradient(0, 0, 10, 0, 0, 140), sh = pal.shadow || '#3a2e25';
    g.addColorStop(0, sh); g.addColorStop(.55, sh); g.addColorStop(1, 'rgba(0,0,0,0)');
    f.globalAlpha = a; f.fillStyle = g; f.beginPath(); f.arc(0, 0, 140, 0, 7); f.arc(-80, 40, 90, 0, 7); f.fill();
  }
  function birds(f, pal, u, y0) {      // golden: two birds cross high, right to left, wings beating only while they cross
    var sh = pal.shadow || '#5a3520';
    f.strokeStyle = sh; f.lineWidth = .7; f.lineCap = 'round';
    [[0, 0], [9, 4]].forEach(function (b, i) {
      var x = 420 - u * 460 + b[0], y = y0 - u * 10 + b[1] + Math.sin(u * 9 + i) * 1.2, wy = 1.6 * Math.sin(u * DUR.golden * 2 * Math.PI * 4.5 + i * 1.7);
      f.globalAlpha = .62 * Math.min(1, u / .08, (1 - u) / .08);
      f.beginPath(); f.moveTo(x - 3, y - wy); f.quadraticCurveTo(x - 1.2, y - .6 - wy * .3, x, y); f.quadraticCurveTo(x + 1.2, y - .6 - wy * .3, x + 3, y - wy); f.stroke();
    });
  }
  function windowLight(f, u, w) {      // night: a fluorescent tube catching, two flickers then on; it stays on
    var on;
    if (reduce.matches) on = 1;
    else if (u >= 0) { var ms = u * DUR.night * 1000; on = ms < 50 ? 1 : ms < 140 ? 0 : ms < 190 ? .7 : ms < 360 ? .1 : easeOut(Math.min(1, (ms - 360) / 200)); }
    else on = amb.seen ? 1 : 0;
    if (on <= 0) return;
    f.globalAlpha = on; f.fillStyle = '#f6e6bf'; f.fillRect(w.x, w.y, w.w, w.h);
    f.globalAlpha = on * .5; f.fillStyle = '#fff7e2'; f.fillRect(w.x, w.y, w.w, 1.1);
    f.globalCompositeOperation = 'screen'; f.globalAlpha = on * .22;
    var g = f.createRadialGradient(w.x + w.w / 2, w.y + w.h / 2, 1, w.x + w.w / 2, w.y + w.h / 2, 9); g.addColorStop(0, '#ffe2a8'); g.addColorStop(1, 'rgba(0,0,0,0)');
    f.fillStyle = g; f.fillRect(w.x - 10, w.y - 10, w.w + 20, w.h + 20);
  }

  // ---------- the note's flight: it leaves the card as the card turns back to the scene and drops into the slot ----------
  var api = null, root = null, flight = null, scene = null;
  function slotPoint(S, sp) {
    var cv = root.querySelector('canvas'), rc = cv.getBoundingClientRect(), sc = rc.width / S.size[0];
    return { x: rc.left + sp.x * sc, y: rc.top + (sp.foot - 29) * sc, sc: sc };
  }
  function delivered(entry) { document.dispatchEvent(new CustomEvent('pc:delivered', { detail: { entry: entry } })); }
  document.addEventListener('pc:posted', function (ev) {
    var d = ev.detail || {}, S = scene, sp = S && spots(S).post;
    if (flight) flight.finish();
    var land = function () { ack = performance.now(); if (reduce.matches && api) { api.redraw(); setTimeout(api.redraw, 260); } setTimeout(function () { delivered(d.entry); }, 90); };
    if (!d.flight || !sp || !root || !d.card) { delivered(d.entry); return; }
    if (reduce.matches) { setTimeout(land, 500); return; }          // calm: no flight; the flap ticks once and the count goes up
    var cr = d.card.getBoundingClientRect(), el = document.createElement('div');
    el.className = 'ls-mail'; el.setAttribute('aria-hidden', 'true');
    el.style.setProperty('--paper', d.paper || '#f1ede4'); el.style.setProperty('--line', d.ink || '#2b2d30');
    var W0 = Math.round(cr.width * .26), H0 = Math.round(W0 * .64);
    el.style.width = W0 + 'px'; el.style.height = H0 + 'px';
    document.body.appendChild(el);
    var go = setTimeout(function () {
      var a = { x: cr.left + cr.width * .5, y: cr.top + cr.height * .5 }, s = slotPoint(S, sp), endSc = Math.max(.08, (9 * s.sc) / W0);
      var c = { x: a.x + (s.x - a.x) * .35, y: Math.min(a.y, s.y) - cr.height * .32 }, kf = [], N = 18;
      for (var i = 0; i <= N; i++) {
        var u = i / N, v = easeOut(u), w = 1 - v;
        var x = w * w * a.x + 2 * w * v * c.x + v * v * s.x, y = w * w * a.y + 2 * w * v * c.y + v * v * s.y;
        var sc = 1 + (endSc - 1) * Math.pow(v, .8), rot = -7 * (1 - v) + 3 * Math.sin(Math.PI * v) * (1 - v);
        kf.push({ offset: u, transform: 'translate(' + (x - W0 / 2).toFixed(1) + 'px,' + (y - H0 / 2).toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')',
          opacity: u < .06 ? u / .06 : u > .9 ? Math.max(0, (1 - u) / .1) : 1 });
      }
      var an = el.animate(kf, { duration: 660, easing: 'linear', fill: 'forwards' });
      flight = an;
      an.onfinish = an.oncancel = function () { el.remove(); if (flight === an) flight = null; land(); };
    }, 400);
    flight = { finish: function () { clearTimeout(go); el.remove(); flight = null; land(); } };   // a second note lands the first at once
  });

  // ---------- the hooks LastSeen.mount calls ----------
  window.LastSeenStreet = {
    attach: function (a, el, S) { api = a; root = el; scene = S; },
    busy: function () { return !!amb.key && /morning$/.test(amb.key) && amb.t - amb.at >= 0 && amb.t - amb.at < DUR.morning; },   // the morning crow is mid-beat
    layer: function (name, f, t, pal, v, S) {
      var sp = spots(S);
      f.save();
      if (name === 'back' && v === 'night' && sp.win) windowLight(f, reduce.matches ? -1 : ambient(t, v, S), sp.win);
      if (name === 'air' && !reduce.matches) {
        var u = ambient(t, v, S);
        if (v === 'midday' && u >= 0) cloud(f, pal, u);
        if (v === 'golden' && u >= 0) birds(f, pal, u, sp.birdsY);
      }
      f.restore();
    },
    props: function (t, pal, v, S) {
      var sp = spots(S), out = [];
      if (sp.post) out.push({ foot: sp.post.foot, draw: function (f) { drawPost(f, S, sp.post, pal, v); } });
      if (v === 'morning') out.push(crowProp(sp, pal, v, reduce.matches ? -1 : ambient(t, v, S)));
      return out;
    }
  };
})();

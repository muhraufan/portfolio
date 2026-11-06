/* Scene — nadoya-no-katte-2026-11-06. Needs /last-seen/last-seen.js, /last-seen/scenes/_kit.js and /last-seen/scenes/nadoya-no-katte.js
   (either order: this one waits for it). The same drawing as the Oct 2 visit; only the visit changes: the time, and the four of them. */
(function () {
  var K = window.LastSeenKit, mix = K.mix;
  /* ================= nadoya no kaTte — Yoyogi-Uehara, again (Nov 6, 13:56), with Brian, Rizal and Reihan =================
     Raufan in his two-tone Gramicci five-panel: slate-blue crown, a rust front panel and flat brim; a white tee, black
     trousers, his usual grey Asics, a black watch, no bag. With him: Brian (a cream cap, glasses, a charcoal long-sleeve top,
     dark trousers, sage trainers), Rizal (a light grey cap, glasses, a mid-grey short-sleeve V-neck, black trousers) and
     Reihan (short black hair, glasses, a pale grey-blue long-sleeve shirt, a black backpack, dark trousers). */
  var PEOPLE = { rfCap: '#7d8fa5', rfCapFront: '#b4612f', rfCapBrim: '#a9582a', rfTee: '#f1efe9', rfPants: '#232427', rfWatch: '#1b1b1e',
    rfShoe: '#c9cbc8', rfSole: '#f1f0eb', rfShoeMark: '#2c2f36',
    brCap: '#dcd0b4', brTop: '#4b4d52', brPants: '#2e2f33', brShoe: '#93a38a', brSole: '#ebe9e1',
    rzCap: '#c8c9c7', rzTee: '#6f7276', rzCollar: '#4a4c50', rzPants: '#26272a', rzShoe: '#2f3034', rzSole: '#d9d8d3',
    rhShirt: '#a3adb7', rhPants: '#36373c', rhBag: '#26272b', rhShoe: '#3a3b3f', rhSole: '#dedcd6',
    frames: '#26262a' };
  function tone(t, k) { var o = {}; Object.keys(PEOPLE).forEach(function (n) { o[n] = mix(PEOPLE[n], t, k); }); return o; }
  function go() {
    var S = K.nadoya();
    S.seenAt = '2026-11-06T13:56:00+09:00';
    S.alt = 'Illustration of nadoya no kaTte in Yoyogi-Uehara: an old plaster house with a timber-framed glass room, an open timber coffee counter under a thin canopy, a low concrete slab over gravel, stepping stones, a stone lantern and garden trees, with Raufan in a two-tone cap and three friends.';
    S.palette = Object.assign({}, S.palette, PEOPLE);
    var tones = { morning: tone('#cbd8e2', .08), golden: tone('#f0b07e', .12), night: tone('#0d1124', .6) };
    Object.keys(tones).forEach(function (k) { S.light[k] = Object.assign({}, S.light[k]); S.light[k].set = Object.assign({}, S.light[k].set || {}, tones[k]); });
    S.sig = { emerge: { x: 200, foot0: 230, foot1: 264, s0: .7, s1: 1.22, dur: 1.3 },
      // the camp cap covers his hair (no longHair): only the short nape shows under the crown
      person: { coat: 'rfTee', shortSleeve: true, long: -6, legs: 'rfPants', hair: 'hairDark', hat: false, bag: false,
        campcap: 'rfCap', capFront: 'rfCapFront', capBrim: 'rfCapBrim', watch: 'rfWatch', shoe: 'rfShoe', sole: 'rfSole', shoeMark: 'rfShoeMark' },
      company: [
        { person: { coat: 'brTop', long: -5.5, legs: 'brPants', hair: 'hairDark', hat: false, bag: false, ballcap: 'brCap', glasses: 'frames',
            shoe: 'brShoe', sole: 'brSole', stride: 11.5 }, dx: -28, dy: 3, ds: .03, lag: .22 },
        { person: { coat: 'rzTee', shortSleeve: true, long: -5.5, collar: 'rzCollar', legs: 'rzPants', hair: 'hairDark', hat: false, bag: false, ballcap: 'rzCap', glasses: 'frames',
            shoe: 'rzShoe', sole: 'rzSole', stride: 11.5 }, dx: 30, dy: -2.6, ds: -.035, lag: .36 },
        { person: { coat: 'rhShirt', long: -4.5, legs: 'rhPants', hair: 'hairDark', hat: false, bag: false, glasses: 'frames', carry: 'backpack', carryC: 'rhBag',
            shoe: 'rhShoe', sole: 'rhSole', stride: 11.5 }, dx: 55, dy: .8, ds: 0, lag: .5 }] };
    K.make('nadoya-no-katte-2026-11-06', S);
  }
  if (K.nadoya) go(); else {
    (K.nadoyaQ = K.nadoyaQ || []).push(go);
    // loaded on its own (e.g. a lazy loader asked for this id only): fetch the shared drawing too, unless a page already has it coming
    var need = function () { if (K.nadoya || document.querySelector('script[src*="/scenes/nadoya-no-katte.js"]')) return;
      var s = document.createElement('script'); s.src = '/last-seen/scenes/nadoya-no-katte.js?v=5'; document.head.appendChild(s); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', need); else need();
  }
})();

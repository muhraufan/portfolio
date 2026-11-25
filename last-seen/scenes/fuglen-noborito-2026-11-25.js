/* Scene — fuglen-noborito-2026-11-25. Needs /last-seen/last-seen.js, /last-seen/scenes/_kit.js and /last-seen/scenes/fuglen-noborito.js
   (either order: this one waits for it). The same drawing as the Oct 23 visit; only the visit changes: the time, and the five of them. */
(function () {
  var K = window.LastSeenKit, mix = K.mix;
  /* ================= FUGLEN COFFEE ROASTERS — Noborito, again (Nov 25, 15:50), with Rizal, Brian, Denny and Mei =================
     Raufan in a dark brown corduroy cap over shoulder-length hair worn down, an olive jacket with a brown corduroy collar open
     over a cream hoodie, black trousers, his usual grey Asics, no bag. With him, four friends:
     a cream cap, glasses, a navy zip jacket, cream trousers, green suede trainers;
     glasses, a navy puffer open over a grey shirt, pale grey sweatpants, white trainers, a backpack;
     glasses, a black fleece open over a white T-shirt, beige trousers, grey trainers;
     long dark hair, glasses, a long mauve coat, wide brown trousers, white trainers. */
  var PEOPLE = { rfCap: '#4a3226', rfJacket: '#59625a', rfHoodie: '#e2d9c8', rfCollar: '#5a3a2a', rfPants: '#232427',
    rfShoe: '#c9cbc8', rfSole: '#f1f0eb', rfShoeMark: '#2c2f36',
    aCap: '#dcd3bd', aJacket: '#232b3d', aPants: '#e6dfcb', aShoe: '#7f9a72', aSole: '#e9e3d2',
    bPuffer: '#262d3f', bShirt: '#7c7f84', bPants: '#cfcdc6', bShoe: '#e9e9e6', bSole: '#f6f5f1', bBag: '#1f2431',
    cFleece: '#1e1f22', cTee: '#eeece6', cPants: '#d9d0bd', cShoe: '#bfc1bd', cSole: '#eeede8',
    dCoat: '#b9a39c', dPants: '#4a3a31', dShoe: '#efeeea', dSole: '#f8f7f3',
    frames: '#26262a' };
  function tone(t, k) { var o = {}; Object.keys(PEOPLE).forEach(function (n) { o[n] = mix(PEOPLE[n], t, k); }); return o; }
  function go() {
    var S = K.fuglen();
    S.seenAt = '2026-11-25T15:50:00+09:00';
    S.alt = 'Illustration of FUGLEN COFFEE ROASTERS in Noborito: a beige stone-tiled corner building with a maroon band, a red round bird sign, dark glass doors, wooden benches out front and a white guardrail by the road, with Raufan in a brown cap and an olive jacket and four friends.';
    S.palette = Object.assign({}, S.palette, PEOPLE);
    S.light = Object.assign({}, S.light);
    var tones = { morning: tone('#cbd8e2', .08), golden: tone('#f0b07e', .12), night: tone('#0d1124', .6) };
    Object.keys(tones).forEach(function (k) { S.light[k] = Object.assign({}, S.light[k]); S.light[k].set = Object.assign({}, S.light[k].set || {}, tones[k]); });
    S.sig = { emerge: { x: 200, foot0: 232, foot1: 264, s0: .74, s1: 1.22, dur: 1.3 },
      person: { coat: 'rfJacket', open: 'rfHoodie', collar: 'rfCollar', long: -4.5, legs: 'rfPants', hair: 'hairDark', hairDown: true, longHair: true, hat: false, bag: false,
        ballcap: 'rfCap', shoe: 'rfShoe', sole: 'rfSole', shoeMark: 'rfShoeMark' },
      company: [
        { person: { coat: 'aJacket', long: -5, legs: 'aPants', hair: 'hairDark', hat: false, bag: false, ballcap: 'aCap', glasses: 'frames',
            shoe: 'aShoe', sole: 'aSole', stride: 11.5 }, dx: -28, dy: 3, ds: .03, lag: .22 },
        { person: { coat: 'bPuffer', open: 'bShirt', long: -5, legs: 'bPants', hair: 'hairDark', hat: false, bag: false, glasses: 'frames', carry: 'backpack', carryC: 'bBag',
            shoe: 'bShoe', sole: 'bSole', stride: 11.5 }, dx: 30, dy: -2.6, ds: -.035, lag: .36 },
        { person: { coat: 'cFleece', open: 'cTee', long: -5, legs: 'cPants', hair: 'hairDark', hat: false, bag: false, glasses: 'frames',
            shoe: 'cShoe', sole: 'cSole', stride: 11.5 }, dx: 55, dy: .8, ds: 0, lag: .5 },
        { person: { coat: 'dCoat', long: 9, legs: 'dPants', hair: 'hairDark', longHair: true, hat: false, bag: false, glasses: 'frames',
            shoe: 'dShoe', sole: 'dSole', stride: 10.5 }, dx: -53, dy: -1.2, ds: -.06, lag: .62 }] };
    K.make('fuglen-noborito-2026-11-25', S);
  }
  if (K.fuglen) go(); else {
    (K.fuglenQ = K.fuglenQ || []).push(go);
    // loaded on its own (e.g. a lazy loader asked for this id only): fetch the shared drawing too, unless a page already has it coming
    var need = function () { if (K.fuglen || document.querySelector('script[src*="/scenes/fuglen-noborito.js"]')) return;
      var s = document.createElement('script'); s.src = '/last-seen/scenes/fuglen-noborito.js?v=6'; document.head.appendChild(s); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', need); else need();
  }
})();

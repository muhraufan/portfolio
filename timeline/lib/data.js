/* Timeline — the places Raufan was last seen, newest first.
   A place plugs into its illustration by scene id. Only a name and a neighbourhood are shown. */
(function () {
  var TL2 = window.TL2 = window.TL2 || {};
  var TZ = 'Asia/Tokyo';
  var REAL = [
    { scene: 'bear-pond-espresso', seenAt: '2026-10-31T15:45:00+09:00', name: { en: 'Bear Pond Espresso', ja: 'ベアポンド エスプレッソ' }, area: { en: 'Shimokitazawa, Tokyo', ja: '東京・下北沢' }, with: [{ name: { en: 'his wife and son', ja: '妻と息子' } }] },
    { scene: 'apple-marunouchi', seenAt: '2026-10-29T12:19:00+09:00', name: { en: 'Apple Marunouchi', ja: 'Apple 丸の内' }, area: { en: 'Marunouchi, Tokyo', ja: '東京・丸の内' }, with: [{ name: 'Shane', url: 'https://www.linkedin.com/in/shanejapan' }, { name: 'Bee', url: 'https://www.linkedin.com/in/jiajhenli' }] },
    { scene: 'cinta-jawa-shibuya', seenAt: '2026-10-27T19:30:00+09:00', name: { en: 'Cinta Jawa Cafe', ja: 'チンタジャワカフェ' }, area: { en: 'Shibuya, Tokyo', ja: '東京・渋谷' } },
    { scene: 'tokyo-nihombashi-tower', seenAt: '2026-10-27T09:49:00+09:00', name: { en: 'Tokyo Nihombashi Tower', ja: '東京日本橋タワー' }, area: { en: 'Nihonbashi, Tokyo', ja: '東京・日本橋' } },
    { scene: 'niko-and-shibuya', seenAt: '2026-10-25T18:56:00+09:00', name: { en: 'niko and ...', ja: 'niko and ...' }, area: { en: 'Shibuya, Tokyo', ja: '東京・渋谷' } },
    { scene: 'tsuchiya-kaban-nakameguro', seenAt: '2026-10-25T13:45:00+09:00', name: { en: 'Tsuchiya Kaban', ja: '土屋鞄' }, area: { en: 'Nakameguro, Tokyo', ja: '東京・中目黒' } },
    { scene: 'fuglen-noborito', seenAt: '2026-10-23T13:40:00+09:00', name: { en: 'Fuglen Coffee Roasters', ja: 'フグレン コーヒー ロースターズ' }, area: { en: 'Noborito, Kawasaki', ja: '川崎・登戸' } },
    { scene: 'tokyo-camii', seenAt: '2026-10-23T12:20:00+09:00', name: { en: 'Tokyo Camii', ja: '東京ジャーミイ' }, area: { en: 'Yoyogi-Uehara, Tokyo', ja: '東京・代々木上原' } },
    { scene: 'lifefit-yurigaoka', seenAt: '2026-10-21T17:47:00+09:00', name: { en: 'LifeFit', ja: 'ライフフィット' }, area: { en: 'Yurigaoka, Kawasaki', ja: '川崎・百合ヶ丘' } },
    { scene: 'yoyogi-park', seenAt: '2026-10-18T11:30:00+09:00', name: { en: 'Yoyogi Park', ja: '代々木公園' }, area: { en: 'Yoyogi, Tokyo', ja: '東京・代々木' } },
    { scene: 'tokyo-big-sight', seenAt: '2026-10-17T14:00:00+09:00', name: { en: 'Tokyo Big Sight', ja: '東京ビッグサイト' }, area: { en: 'Ariake, Tokyo', ja: '東京・有明' } },
    { scene: 'mufg-park', seenAt: '2026-10-11T11:00:00+09:00', name: { en: 'MUFG PARK', ja: 'MUFG PARK' }, area: { en: 'Yanagisawa, Nishitokyo', ja: '西東京・柳沢' } },
    { scene: 'stayful-life-store', seenAt: '2026-10-03T17:10:00+09:00', name: { en: 'STAYFUL LIFE STORE', ja: 'ステイフル ライフ ストア' }, area: { en: 'Nakacho, Musashino', ja: '武蔵野・中町' } },
    { scene: 'nadoya-no-katte', seenAt: '2026-10-02T13:15:00+09:00', name: { en: 'nadoya no kaTte', ja: 'ナドヤノカッテ' }, area: { en: 'Yoyogi-Uehara, Tokyo', ja: '東京・代々木上原' } },
    { scene: 'et-cultural-coffeehouse', seenAt: '2026-09-12T15:17:00+09:00', name: { en: 'Et · The Cultural Coffeehouse', ja: 'Et · The Cultural Coffeehouse' }, area: { en: 'Shimokitazawa, Tokyo', ja: '東京・下北沢' } }
  ];
  // Optional `with: [{ name, url }]` on a row; `name` can be { en, ja } and `url` can be left out (no link).
  // ?withdemo=1 / ?withdemo=2 borrow a local example for niko and ... only.
  TL2.companyFor = function (sceneId) {
    var row = null, i, demo;
    for (i = 0; i < REAL.length; i++) if (REAL[i].scene === sceneId) row = REAL[i];
    if (row && row.with && row.with.length) return row.with;
    if (sceneId === 'niko-and-shibuya' && window.LastSeen && LastSeen.demoCompany) {
      demo = LastSeen.demoCompany();
      if (demo && demo.length) return demo;
    }
    return [];
  };
  TL2.FALLBACK = 'niko-and-shibuya';

  // The miniature on a visitor note. The latest place whose last-seen time is
  // at or before the note was written; a note older than every place returns
  // null and the gallery keeps the dated postmark. Adding a row to REAL above
  // updates the stamps. Times are absolute (the offsets are already Asia/Tokyo).
  TL2.stampFor = function (createdAt) {
    var t = Date.parse(createdAt);
    if (!isFinite(t)) return null;
    var best = null, bestT = -Infinity, i;
    for (i = 0; i < REAL.length; i++) {
      var pt = Date.parse(REAL[i].seenAt);
      if (pt <= t && pt > bestT) { best = REAL[i]; bestT = pt; }
    }
    if (!best) return null;
    var area = String(best.area && best.area.en || '').split(',').map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean);
    var name = String(best.name && best.name.en || '').toUpperCase();
    return {
      key: best.scene,
      ring: area.concat([name]).join(' · ') + ' · ',
      credit: {
        en: (best.name.en || '') + ' · ' + (best.area.en || ''),
        ja: (best.name.ja || best.name.en || '') + ' · ' + (best.area.ja || best.area.en || '')
      }
    };
  };

  // ---------- Tokyo-time date parts ----------
  var fmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  TL2.ymd = function (d) { var o = {}; fmt.formatToParts(d).forEach(function (p) { o[p.type] = +p.value || p.value; }); return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute }; };
  TL2.key = function (y, m, d) { return y * 10000 + m * 100 + (d || 0); };

  TL2.places = function () {
    var LS = window.LastSeen, have = function (id) { return LS && LS.byId && LS.byId(id); };
    var all = REAL.slice();
    all.sort(function (a, b) { return Date.parse(b.seenAt) - Date.parse(a.seenAt); });
    return all.map(function (p, i) {
      var S = have(p.scene) || have(TL2.FALLBACK), next = all[i - 1], from = new Date(p.seenAt);
      var company = (p.with && p.with.length) ? p.with : TL2.companyFor(p.scene);
      return { i: i, id: p.scene + '-' + from.getTime().toString(36), place: p.scene, scene: S ? S.id : null, S: S, example: false,
        name: p.name, area: p.area, with: company.length ? company : null,
        from: from, to: next ? new Date(next.seenAt) : null, current: i === 0, at: TL2.ymd(from) };
    });
  };

  // ---------- strings ----------
  var MON = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'] };
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  TL2.mon = function (m) { return (MON[TL.lang()] || MON.en)[m - 1]; };
  TL2.monthTitle = function (y, m) { return TL.lang() === 'ja' ? y + '年' + m + '月' : MONTH[m - 1] + ' ' + y; };
  TL2.fullDate = function (y, m, d) { return TL.lang() === 'ja' ? y + '年' + m + '月' + d + '日' : d + ' ' + MONTH[m - 1] + ' ' + y; };
  TL2.edge = function (a) { return (a.d < 10 ? '0' : '') + a.d + ' ' + MON.en[a.m - 1].toUpperCase() + ' ' + String(a.y).slice(2); };   // film edge code: 25 OCT 26
  TL2.back = function (a) { var z = function (n) { return (n < 10 ? '0' : '') + n; }; return "'" + String(a.y).slice(2) + ' ' + z(a.m) + ' ' + z(a.d); };   // date-back: '26 10 25
  TL2.s = function (o) { return o ? (o[TL.lang()] || o.en) : ''; };
})();

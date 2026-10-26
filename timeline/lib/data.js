/* Timeline — the places Raufan was last seen, newest first.
   A place plugs into its illustration by scene id. Only a name and a neighbourhood are shown. */
(function () {
  var TL2 = window.TL2 = window.TL2 || {};
  var TZ = 'Asia/Tokyo';
  var REAL = [
    { scene: 'niko-and-shibuya', seenAt: '2026-10-25T18:56:00+09:00', name: { en: 'niko and ...', ja: 'niko and ...' }, area: { en: 'Shibuya, Tokyo', ja: '東京・渋谷' } },
    { scene: 'tsuchiya-kaban-nakameguro', seenAt: '2026-10-25T13:45:00+09:00', name: { en: 'Tsuchiya Kaban', ja: '土屋鞄' }, area: { en: 'Nakameguro, Tokyo', ja: '東京・中目黒' } },
    { scene: 'fuglen-noborito', seenAt: '2026-10-23T13:40:00+09:00', name: { en: 'Fuglen Coffee Roasters', ja: 'フグレン コーヒー ロースターズ' }, area: { en: 'Noborito, Kawasaki', ja: '川崎・登戸' } },
    { scene: 'tokyo-camii', seenAt: '2026-10-23T12:20:00+09:00', name: { en: 'Tokyo Camii', ja: '東京ジャーミイ' }, area: { en: 'Yoyogi-Uehara, Tokyo', ja: '東京・代々木上原' } },
    { scene: 'yoyogi-park', seenAt: '2026-10-18T11:30:00+09:00', name: { en: 'Yoyogi Park', ja: '代々木公園' }, area: { en: 'Yoyogi, Tokyo', ja: '東京・代々木' } },
    { scene: 'tokyo-big-sight', seenAt: '2026-10-17T14:00:00+09:00', name: { en: 'Tokyo Big Sight', ja: '東京ビッグサイト' }, area: { en: 'Ariake, Tokyo', ja: '東京・有明' } }
  ];
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
      return { i: i, id: p.scene + '-' + from.getTime().toString(36), scene: S ? S.id : null, S: S, example: false,
        name: p.name, area: p.area,
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
  TL2.span = function (p) {
    var ja = TL.lang() === 'ja', A = p.at, day = function (a) { return ja ? a.m + '月' + a.d + '日' : MON.en[a.m - 1] + ' ' + a.d; };
    var time = function (a) { return (a.h < 10 ? '0' : '') + a.h + ':' + (a.mi < 10 ? '0' : '') + a.mi; };
    if (p.current) return day(A) + ' ' + time(A);
    var B = TL2.ymd(p.to), same = A.y === B.y && A.m === B.m && A.d === B.d;
    if (same) return day(A) + (ja ? ' ' : ', ') + time(A) + '–' + time(B);
    return day(A) + (A.y !== B.y ? ' ' + A.y : '') + ' – ' + day(B) + ' ' + B.y;
  };
  TL2.s = function (o) { return o ? (o[TL.lang()] || o.en) : ''; };
})();

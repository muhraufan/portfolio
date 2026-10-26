/* Play a case cover only while it is on screen. Reduced motion stays on the poster. */
(function () {
  var videos = document.querySelectorAll('video.case-cover-video');
  if (!videos.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  videos.forEach(function (video) {
    video.autoplay = false;
    video.removeAttribute('autoplay');
    if (reduce) return;
    if (!('IntersectionObserver' in window)) {
      video.play().catch(function () {});
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) video.play().catch(function () {});
        else video.pause();
      });
    }, { threshold: 0.25 });
    io.observe(video);
  });
})();

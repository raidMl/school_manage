// dashboard-patch.js — Enhances tables with styled avatars + animated stat counters
document.addEventListener('DOMContentLoaded', function () {

  function patchTable(tbodySelector) {
    var tb = document.querySelector(tbodySelector);
    if (!tb) return;
    new MutationObserver(function () {
      tb.querySelectorAll('img').forEach(function (img) {
        img.style.cssText = 'width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #e2e8f0;display:block';
      });
    }).observe(tb, { childList: true, subtree: true });
  }

  patchTable('#backend-recent-students tbody');
  patchTable('#backend-recent-teachers tbody');

  // Animated stat counters
  document.querySelectorAll('.sc-value').forEach(function (el) {
    new MutationObserver(function () {
      var val = parseInt(el.textContent);
      if (!isNaN(val) && val > 0 && !el.dataset.ani) {
        el.dataset.ani = '1';
        var start = performance.now();
        var dur = 900;
        function step(now) {
          var t = Math.min((now - start) / dur, 1);
          var ease = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(ease * val);
          if (t < 1) requestAnimationFrame(step);
          else el.textContent = val;
        }
        requestAnimationFrame(step);
      }
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });
});

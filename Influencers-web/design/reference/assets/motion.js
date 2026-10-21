/* Bareeq motion layer — vanilla JS, no dependencies (Lenis loaded from CDN if available).
   Port this 1:1 into the app (e.g. a client-side <MotionProvider> or useEffect in the root layout). */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.querySelector('.bq');
  if (!root) return;

  /* 1. Custom cursor: writes --cx/--cy on .bq; CSS moves .cur-dot / .cur-ring */
  if (finePointer) {
    var cx = 0, cy = 0, pending = false;
    window.addEventListener('mousemove', function (e) {
      cx = e.clientX; cy = e.clientY;
      if (!pending) { pending = true; requestAnimationFrame(function () {
        root.style.setProperty('--cx', cx + 'px'); root.style.setProperty('--cy', cy + 'px'); pending = false; }); }
    }, { passive: true });
  }

  if (reduce) return;

  /* 2. Magnetic buttons: .mag follows the cursor (30% x / 45% y), springs back on leave */
  if (finePointer) document.querySelectorAll('.mag').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.3) + 'px');
      el.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.45) + 'px');
    });
    el.addEventListener('mouseleave', function () { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
  });

  /* 3. 3D tilt + glare: .tilt rotates up to ±7deg, glare follows cursor */
  if (finePointer) document.querySelectorAll('.tilt').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', ((x - 0.5) * 14) + 'deg'); el.style.setProperty('--rx', ((0.5 - y) * 12) + 'deg');
      el.style.setProperty('--gx', (x * 100) + '%'); el.style.setProperty('--gy', (y * 100) + '%');
    });
    el.addEventListener('mouseleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });

  /* 4. Scroll reveals: CSS scroll timelines where supported, IntersectionObserver fallback elsewhere */
  if (!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'))) {
    document.documentElement.classList.add('io');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    document.querySelectorAll('.rv,.clip,.zoom,.hlv,.hlvd,.lfill').forEach(function (el) { io.observe(el); });
  }

  /* 5. Horizontal slider prev/next buttons */
  document.querySelectorAll('.ibtn[aria-label="التالي"], .ibtn[aria-label="السابق"]').forEach(function (b) {
    b.addEventListener('click', function () {
      var sec = b.closest('section'), t = sec && sec.querySelector('.hsc');
      if (t) t.scrollBy({ left: b.getAttribute('aria-label') === 'التالي' ? -380 : 380, behavior: 'smooth' });
    });
  });

  /* 6. Smooth scrolling (Lenis) */
  var s = document.createElement('script');
  s.src = 'https://unpkg.com/lenis@1.1.13/dist/lenis.min.js';
  s.onload = function () {
    if (!window.Lenis) return;
    var lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  };
  document.head.appendChild(s);
})();

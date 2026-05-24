/* =========================================================
   CROWN PLUMBING — interactions
   ========================================================= */

(() => {
  'use strict';

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------
     Editorial chrome (marginalia)
     ------------------------------------------------------- */
  function injectChrome() {
    if (document.querySelector('.chrome-tl')) return;
    const tl = document.createElement('div');
    tl.className = 'chrome chrome-tl';
    tl.textContent = 'Crown — 001';
    const tr = document.createElement('div');
    tr.className = 'chrome chrome-tr';
    tr.textContent = '©2026 / Richmond Hill ON';
    const br = document.createElement('div');
    br.className = 'chrome chrome-br';
    br.id = 'scroll-pct';
    br.textContent = '0';
    document.body.appendChild(tl);
    document.body.appendChild(tr);
    document.body.appendChild(br);
  }

  /* -------------------------------------------------------
     Lenis smooth scroll
     ------------------------------------------------------- */
  let lenis = null;
  function initLenis() {
    if (prefersReduced) return;
    if (window.__noLenis) return;
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    lenis.on('scroll', ({ scroll, limit }) => {
      const pct = limit > 0 ? Math.round((scroll / limit) * 100) : 0;
      const el = document.getElementById('scroll-pct');
      if (el) el.textContent = String(pct).padStart(2, '0');
    });

    // Anchor links work with Lenis
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -80 }); }
      });
    });
  }

  /* -------------------------------------------------------
     Custom cursor
     ------------------------------------------------------- */
  function initCursor() {
    if (isTouch || prefersReduced) return;
    document.body.classList.add('has-cursor');

    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    const ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mx = -100, my = -100;
    let rx = -100, ry = -100;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
    });

    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();

    // Hover state on interactive elements
    const sel = 'a, button, .programme, .gallery-item, .btn, [data-cursor]';
    document.querySelectorAll(sel).forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // Hide when leaving window
    document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = ''; ring.style.opacity = ''; });
  }

  /* -------------------------------------------------------
     Intro loader
     ------------------------------------------------------- */
  function runIntro(onComplete) {
    if (prefersReduced || sessionStorage.getItem('seen-intro') === '1') {
      onComplete && onComplete();
      return;
    }

    const intro = document.createElement('div');
    intro.className = 'intro';
    const word = document.createElement('div');
    word.className = 'intro-word';
    'CROWN'.split('').forEach(ch => {
      const s = document.createElement('span');
      s.textContent = ch;
      word.appendChild(s);
    });
    intro.appendChild(word);
    document.body.appendChild(intro);

    // Stop scroll during intro
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';

    const spans = word.querySelectorAll('span');
    requestAnimationFrame(() => {
      spans.forEach((s, i) => {
        setTimeout(() => s.classList.add('in'), 60 * i);
      });
    });

    const total = 60 * (spans.length - 1) + 550 + 400; // stagger + reveal + hold
    setTimeout(() => {
      intro.classList.add('gone');
      setTimeout(() => {
        intro.remove();
        document.body.style.overflow = '';
        if (lenis) lenis.start();
        sessionStorage.setItem('seen-intro', '1');
        onComplete && onComplete();
      }, 720);
    }, total);
  }

  /* -------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------- */
  function initReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });

    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // Image mask reveals (separate threshold)
    const imgSel = '.hero-image, .hero-panel, .statement-image, .programmes-head-media, .feature-image, .gallery-item, .service-row-media, .ba-half, .page-hero .hero-image';
    const imgIo = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          imgIo.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll(imgSel).forEach(el => imgIo.observe(el));
  }

  /* -------------------------------------------------------
     Hero word reveal
     ------------------------------------------------------- */
  function revealHeroWords() {
    const words = document.querySelectorAll('.hero h1 .word');
    words.forEach((w, i) => {
      setTimeout(() => w.classList.add('in'), 80 * i);
    });
  }

  /* -------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------- */
  function initMagnetic() {
    if (isTouch || prefersReduced) return;
    const buttons = Array.from(document.querySelectorAll('.btn'));
    if (!buttons.length) return;

    const state = new Map();
    buttons.forEach(b => state.set(b, { tx: 0, ty: 0, dx: 0, dy: 0 }));

    document.addEventListener('mousemove', (e) => {
      buttons.forEach(b => {
        const r = b.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
        const s = state.get(b);
        if (dist < 100) {
          s.dx = (e.clientX - cx) * 0.28;
          s.dy = (e.clientY - cy) * 0.28;
        } else {
          s.dx = 0; s.dy = 0;
        }
      });
    });

    function loop() {
      buttons.forEach(b => {
        const s = state.get(b);
        s.tx += (s.dx - s.tx) * 0.15;
        s.ty += (s.dy - s.ty) * 0.15;
        b.style.transform = `translate3d(${s.tx.toFixed(2)}px, ${s.ty.toFixed(2)}px, 0)`;
      });
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* -------------------------------------------------------
     Number counters
     ------------------------------------------------------- */
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function animateNumber(el, from, to, duration, formatter) {
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const v = from + (to - from) * easeOutQuart(t);
      el.textContent = formatter(v);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    if (prefersReduced) return;
    const nums = document.querySelectorAll('[data-count]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const to = parseFloat(el.dataset.count);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const reverse = el.dataset.reverse === '1';
        const from = reverse ? parseFloat(el.dataset.from || '999') : 0;

        animateNumber(el, from, to, 1400, (v) => {
          let str = v.toFixed(decimals);
          if (decimals === 0) str = Math.round(v).toLocaleString('en-US');
          else str = parseFloat(str).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
          return prefix + str + suffix;
        });
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    nums.forEach(n => io.observe(n));
  }

  /* -------------------------------------------------------
     Programme hover preview (signature moment)
     ------------------------------------------------------- */
  function initProgrammePreview() {
    if (isTouch || prefersReduced) return;
    const list = document.querySelector('.programme-list');
    if (!list) return;

    const preview = document.createElement('div');
    preview.className = 'programme-preview';
    const img = document.createElement('img');
    img.alt = '';
    const label = document.createElement('div');
    label.className = 'programme-preview-label';
    preview.appendChild(img);
    preview.appendChild(label);
    document.body.appendChild(preview);

    let mx = 0, my = 0, px = 0, py = 0;
    let active = false;
    let currentSrc = '';

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX + 40;
      my = e.clientY - 200;
    });

    list.addEventListener('mouseleave', () => {
      active = false;
      preview.classList.remove('show');
    });

    list.querySelectorAll('.programme').forEach(row => {
      row.addEventListener('mouseenter', () => {
        const src = row.dataset.preview;
        const title = row.dataset.previewTitle || '';
        const num = row.dataset.previewNum || '';
        if (src && src !== currentSrc) {
          img.src = src;
          currentSrc = src;
        }
        label.innerHTML = `<span class="roman">${num}</span><span>${title}</span>`;
        active = true;
        // Snap on first show
        px = mx; py = my;
        preview.style.transform = `translate3d(${px}px, ${py}px, 0)`;
        preview.classList.add('show');
      });
    });

    function loop() {
      if (active) {
        // Clamp to viewport
        const w = window.innerWidth, h = window.innerHeight;
        const cx = Math.max(20, Math.min(w - 340, mx));
        const cy = Math.max(80, Math.min(h - 420, my));
        px += (cx - px) * 0.15;
        py += (cy - py) * 0.15;
        preview.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0)`;
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* -------------------------------------------------------
     Marquee duplication (seamless loop)
     ------------------------------------------------------- */
  function initMarquee() {
    document.querySelectorAll('.marquee-track').forEach(track => {
      track.innerHTML = track.innerHTML + track.innerHTML;
    });
  }

  /* -------------------------------------------------------
     Mobile nav toggle
     ------------------------------------------------------- */
  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle && links) toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  /* -------------------------------------------------------
     Form (placeholder — no backend yet)
     ------------------------------------------------------- */
  function initForm() {
    const form = document.querySelector('#book-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      const original = btn.innerHTML;
      btn.innerHTML = 'Sent — we\'ll be in touch';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
        form.reset();
      }, 3200);
    });
  }

  /* -------------------------------------------------------
     Year stamp
     ------------------------------------------------------- */
  function initYear() {
    const y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* -------------------------------------------------------
     Init
     ------------------------------------------------------- */
  function start() {
    injectChrome();
    initLenis();
    initCursor();
    initMarquee();
    initNav();
    initForm();
    initYear();
    initReveal();
    initMagnetic();
    initCounters();
    initProgrammePreview();

    runIntro(() => {
      revealHeroWords();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Safety net: if IntersectionObserver fails to fire (devtools mobile emulation,
  // edge timing, etc.), force every image container visible 800ms after DOM ready.
  // Images are visible by default in CSS; this is belt-and-suspenders for the
  // .in-class transitions that lean on the observer.
  function netReveal() {
    setTimeout(() => {
      document.querySelectorAll(
        '.hero-image, .hero-panel, .statement-image, .programmes-head-media, ' +
        '.feature-image, .feature-pair .ba-half, .ba-half, .gallery-item, ' +
        '.service-row-media, .page-hero .hero-image'
      ).forEach(el => el.classList.add('in'));
    }, 800);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', netReveal);
  } else {
    netReveal();
  }
})();

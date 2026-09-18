/* Onyx IPTV landing page — progressive enhancement only.
   Everything on the page works without this file. */
(function () {
  'use strict';
  var d = document, w = window;
  w.__onyx = true;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* nav state */
  var nav = $('.nav');
  var onScroll = function () { nav && nav.classList.toggle('scrolled', w.scrollY > 24); };
  onScroll(); w.addEventListener('scroll', onScroll, { passive: true });

  /* mobile menu */
  var burger = $('.burger');
  if (burger) {
    var toggle = function (open) {
      var isOpen = open === undefined ? !d.body.classList.contains('menu-open') : open;
      d.body.classList.toggle('menu-open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
    };
    burger.addEventListener('click', function () { toggle(); });
    $$('.sheet a').forEach(function (a) { a.addEventListener('click', function () { toggle(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
  }

  /* language switcher: remember the choice, close the menu on outside click */
  $$('[data-lang]').forEach(function (a) {
    a.addEventListener('click', function () { try { localStorage.setItem('onyx-lang', a.getAttribute('data-lang')); } catch (e) {} });
  });
  var lm = $('.lang-menu');
  if (lm) d.addEventListener('click', function (e) { if (lm.open && !lm.contains(e.target)) lm.open = false; });

  /* hero: fake EPG timeline */
  var epg = $('.epg-bg');
  if (epg) {
    var rows = 7, frag = d.createDocumentFragment();
    for (var r = 0; r < rows; r++) {
      var row = d.createElement('div'); row.className = 'row';
      var html = '', total = 0, seed = r * 7 + 3;
      while (total < 2600) {
        seed = (seed * 9301 + 49297) % 233280;
        var wdt = 120 + Math.floor((seed / 233280) * 260);
        total += wdt + 10;
        html += '<i class="b' + (seed % 5 === 0 ? ' on' : '') + '" style="width:' + wdt + 'px"></i>';
      }
      row.innerHTML = html + html; /* duplicated for seamless loop */
      var dur = 70 + r * 11, dir = r % 2 ? 'reverse' : 'normal';
      if (!reduce) row.style.animation = 'ticker ' + dur + 's linear infinite ' + dir;
      frag.appendChild(row);
    }
    epg.appendChild(frag);
  }

  /* hero entrance */
  var hero = $('.hero');
  if (hero) requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('ready'); }); });

  /* hero tilt */
  var stage = $('.stage .float');
  if (stage && fine && !reduce) {
    var rect = null, raf = 0, tx = 0, ty = 0;
    hero.addEventListener('pointermove', function (e) {
      rect = rect || stage.getBoundingClientRect();
      var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      tx = Math.max(-1, Math.min(1, (e.clientX - cx) / (w.innerWidth / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - cy) / (w.innerHeight / 2)));
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        stage.style.transform = 'rotateY(' + (tx * 9) + 'deg) rotateX(' + (-ty * 7) + 'deg) translateZ(0)';
      });
    });
    hero.addEventListener('pointerleave', function () { stage.style.transform = ''; rect = null; });
    w.addEventListener('resize', function () { rect = null; });
  }

  /* reveal on scroll */
  var rv = $$('.rv');
  if ('IntersectionObserver' in w && rv.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* scrollytelling */
  var steps = $$('.step'), shots = $$('.story-stage .screen img');
  if (steps.length && shots.length && 'IntersectionObserver' in w) {
    var setActive = function (i) {
      steps.forEach(function (s, k) { s.classList.toggle('active', k === i); });
      shots.forEach(function (img, k) { img.setAttribute('data-active', String(k === i)); });
    };
    setActive(0);
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setActive(steps.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(function (s) { so.observe(s); });
  }

  /* spotlight cards */
  if (fine) $$('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var b = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - b.left) + 'px');
      c.style.setProperty('--my', (e.clientY - b.top) + 'px');
    });
  });

  /* count-up */
  var nums = $$('[data-count]');
  if (nums.length && 'IntersectionObserver' in w && !reduce) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, end = +el.getAttribute('data-count'), t0 = null;
        var tick = function (t) {
          t0 = t0 || t; var p = Math.min(1, (t - t0) / 1400); p = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * p);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { n.textContent = '0'; co.observe(n); });
  }

  /* typewriter (setup step 1) */
  var tw = $('[data-type]');
  if (tw && !reduce) {
    var full = tw.getAttribute('data-type'), i = 0, started = false;
    var type = function () {
      tw.textContent = full.slice(0, i++);
      if (i <= full.length) setTimeout(type, 28 + Math.random() * 40);
      else setTimeout(function () { i = 0; type(); }, 4200);
    };
    var to = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !started) { started = true; type(); to.disconnect(); }
    }, { threshold: 0.5 });
    to.observe(tw);
  } else if (tw) tw.textContent = tw.getAttribute('data-type');

  /* devices parallax */
  var scene = $('.scene');
  if (scene && !reduce && fine) {
    var tab = $('.tablet', scene), ph = $('.phone', scene), pr = 0;
    var par = function () {
      pr = 0;
      var b = scene.getBoundingClientRect();
      var p = (b.top + b.height / 2 - w.innerHeight / 2) / w.innerHeight; /* -1..1 */
      if (tab) tab.style.transform = 'translateY(' + (p * 60) + 'px)';
      if (ph) ph.style.transform = 'translateY(' + (p * 110) + 'px)';
    };
    w.addEventListener('scroll', function () { if (!pr) pr = requestAnimationFrame(par); }, { passive: true });
    par();
  }

  /* FAQ height animation */
  $$('.faq-list details').forEach(function (det) {
    var sum = $('summary', det), ans = $('.ans', det);
    if (!sum || !ans || reduce) return;
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      if (det.open) {
        var h = ans.offsetHeight;
        ans.style.height = h + 'px'; ans.getBoundingClientRect();
        ans.style.transition = 'height .4s cubic-bezier(.22,1,.36,1)';
        ans.style.height = '0px';
        ans.addEventListener('transitionend', function f() { det.open = false; ans.style.cssText = ''; ans.removeEventListener('transitionend', f); });
      } else {
        det.open = true;
        var h2 = ans.offsetHeight;
        ans.style.height = '0px'; ans.getBoundingClientRect();
        ans.style.transition = 'height .45s cubic-bezier(.22,1,.36,1)';
        ans.style.height = h2 + 'px';
        ans.addEventListener('transitionend', function g() { ans.style.cssText = ''; ans.removeEventListener('transitionend', g); });
      }
    });
  });
})();

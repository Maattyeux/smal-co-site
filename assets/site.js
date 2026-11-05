(function () {
  // Connexion lente ou économie de données : .low-bandwidth coupe animations et effets de survol
  var cn = navigator.connection;
  if (cn && (cn.saveData || /2g$/.test(cn.effectiveType || ''))) document.body.classList.add('low-bandwidth');
  // Découpe le manifeste en mots pour l'effet de révélation (le site de référence le fait au build)
  document.querySelectorAll('[data-words]').forEach(function (p) {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(function (w, i) {
      return '<span class="w" style="--i:' + i + '">' + w + '</span> ';
    }).join('');
  });
  // Page unique : refermer le menu mobile après un clic sur un lien
  var menu = document.getElementById('menu'), burger = document.querySelector('[data-burger]');
  if (menu && burger) menu.addEventListener('click', function (e) {
    if (e.target.closest('a') && menu.classList.contains('open')) burger.click();
  });
})();
﻿(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('low-bandwidth');
  var header = document.querySelector('[data-header]');
  var burger = document.querySelector('[data-burger]');
  var menu = document.getElementById('menu');

  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 24); }
  if (header) { onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); }

  if (header && burger && menu) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
      header.classList.toggle('menu-open', open);
      document.body.classList.toggle('nav-locked', open);
    });
    // clic sur le fond flouté, ou retour en largeur bureau : on referme
    header.addEventListener('click', function (e) { if (e.target === header && menu.classList.contains('open')) burger.click(); });
    matchMedia('(min-width: 869px)').addEventListener('change', function (e) { if (e.matches && menu.classList.contains('open')) burger.click(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) burger.click();
    });
  }

  var targets = document.querySelectorAll('[data-reveal], [data-words]');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (t) { t.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        var el = en.target, end = +el.getAttribute('data-count'), t0 = null;
        function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min((t - t0) / 1400, 1), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * e);
          if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = '0'; requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }
})();


// bouton « Copier l’adresse »
(function () {
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    var label = b.textContent;
    b.addEventListener('click', function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(b.getAttribute('data-copy')).then(function () {
        b.textContent = 'Adresse copiée'; setTimeout(function () { b.textContent = label; }, 2000);
      });
    });
  });
})();

// hero : progression du scroll (0 → 1) exposée en --p pour le zoom/fondu/parallaxe en CSS
(function () { var h = document.querySelector('[data-hero]');
  if (!h || matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('low-bandwidth')) return;
  var ticking = false;
  function upd() { ticking = false; h.style.setProperty('--p', Math.min(Math.max(scrollY / h.offsetHeight, 0), 1).toFixed(3)); }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true }); upd(); })();

// fondu enchaîné : progression du scroll dans la section exposée en --x (0 → 1), sur la plage centrale
(function () { var sec = document.querySelector('.scroll-crossfade-section');
  if (!sec) return;
  var ticking = false;
  function upd() { ticking = false;
    var r = sec.getBoundingClientRect(), run = r.height - innerHeight;
    var p = run > 0 ? -r.top / run : 0;
    sec.style.setProperty('--x', Math.min(Math.max((p - .25) / .5, 0), 1).toFixed(3)); }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd); upd(); })();

// galeries défilantes : .is-at-start / .is-at-end selon la position, boutons ‹ › (une carte par clic), glisser à la souris
(function () {
  document.querySelectorAll('.scroll-gallery-wrapper').forEach(function (wrapper) {
    var sc = wrapper.firstElementChild;
    if (!sc) return;
    function upd() {
      wrapper.classList.toggle('is-at-start', sc.scrollLeft <= 5);
      wrapper.classList.toggle('is-at-end', sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 5);
    }
    sc.addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    addEventListener('load', upd); // les images lazy changent la largeur défilable
    upd();

    function step() { // largeur d'une carte + l'écart entre cartes
      var first = sc.firstElementChild;
      return first ? first.getBoundingClientRect().width + (parseFloat(getComputedStyle(sc).columnGap) || 0) : sc.clientWidth * .8;
    }
    wrapper.querySelectorAll('.scroll-prev, .scroll-next').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sc.scrollBy({ left: btn.classList.contains('scroll-prev') ? -step() : step(), behavior: 'smooth' });
      });
    });

    // glisser à la souris (le tactile et le trackpad défilent déjà nativement)
    var down = false, moved = false, x0 = 0, left0 = 0;
    sc.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; x0 = e.clientX; left0 = sc.scrollLeft;
    });
    sc.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - x0;
      if (!moved && Math.abs(dx) < 5) return; // simple clic : on laisse passer
      if (!moved) { moved = true; sc.classList.add('is-dragging'); sc.setPointerCapture(e.pointerId); }
      sc.scrollLeft = left0 - dx;
    });
    function end() {
      if (!down) return;
      down = false;
      sc.classList.remove('is-dragging'); // le scroll-snap recale sur la carte la plus proche
    }
    sc.addEventListener('pointerup', end);
    sc.addEventListener('pointercancel', end);
    sc.addEventListener('dragstart', function (e) { e.preventDefault(); }); // pas de glisser natif des images
    sc.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  });
})();

// survol à la souris : spotlight (--mouse-x/y) sur les cartes équipe, inclinaison ±4° (--rx/--ry) sur les visuels
(function () {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('low-bandwidth');
  document.querySelectorAll('.founders li, .bento-card, .crossfade-image-box').forEach(function (el) {
    var tilt = !still && !el.matches('.founders li');
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty('--mouse-x', x + 'px');
      el.style.setProperty('--mouse-y', y + 'px');
      if (!tilt) return;
      el.classList.add('is-tilting');
      el.style.setProperty('--rx', ((.5 - y / r.height) * 8).toFixed(2) + 'deg');
      el.style.setProperty('--ry', ((x / r.width - .5) * 8).toFixed(2) + 'deg');
    });
    if (tilt) el.addEventListener('mouseleave', function () {
      el.classList.remove('is-tilting');
      el.style.removeProperty('--rx'); el.style.removeProperty('--ry');
    });
  });
})();

// image en erreur : remplacée par un bloc monogramme (logos exclus, leur alt suffit)
(function () {
  function swap(img) {
    if (!img.parentNode || /logos\//.test(img.getAttribute('src') || '')) return;
    var d = document.createElement('div'), w = img.getAttribute('width'), h = img.getAttribute('height');
    d.className = (img.className + ' img-fallback').trim();
    d.textContent = 'SMAL & CO';
    if (img.alt) { d.setAttribute('role', 'img'); d.setAttribute('aria-label', img.alt); } else d.setAttribute('aria-hidden', 'true');
    if (w && h) d.style.aspectRatio = w + ' / ' + h;
    img.replaceWith(d);
  }
  document.addEventListener('error', function (e) { if (e.target.tagName === 'IMG') swap(e.target); }, true);
  // erreurs survenues avant l'exécution du script (chargé en defer)
  Array.prototype.forEach.call(document.images, function (img) { if (img.complete && !img.naturalWidth && img.getAttribute('src')) swap(img); });
})();

// contact.html?objet=Partenariat+Cyclisme : présélectionne le motif (liens des offres partenaires), puis guide l'œil vers le champ
(function () {
  var sel = document.getElementById('contact-subject');
  var q = new URLSearchParams(location.search).get('objet') || new URLSearchParams(location.search).get('subject');
  if (!sel || !q) return;
  var opt = Array.prototype.find.call(sel.options, function (o) { return o.value.toLowerCase() === q.trim().toLowerCase(); });
  if (!opt) return; // valeur inconnue dans l'URL : on laisse le choix par défaut
  sel.value = opt.value;
  sel.classList.add('is-prefilled');
  sel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
})();

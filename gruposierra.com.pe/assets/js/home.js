// Anti-flicker: marca preload lo antes posible
document.documentElement.classList.add('preload');
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => document.documentElement.classList.remove('preload'), 60);
});

// =========================================================
// 🏠 Home — Carga slider desde API y conserva el botón CTA
// =========================================================
(function () {
  const root   = document.querySelector('.gs-main') || document;
  const slider = document.querySelector('.gs-hero__slider');
  const dotsBox= document.querySelector('.gs-dots');
  const prev   = root.querySelector('[data-prev]');
  const next   = root.querySelector('[data-next]');
  const overlayTpl = document.getElementById('gs-hero-overlay-tpl');

  if (!slider || !dotsBox) return;

  // --- Normaliza URLs para evitar contenido mixto y mapear IP -> dominio
  function normalizeImageUrl(u) {
    try {
      const cur = new URL(u, window.location.origin);

      // Si la página está en https y la imagen viene por http
      if (location.protocol === 'https:' && cur.protocol === 'http:') {
        // Caso especial: IP del server -> usar el mismo dominio actual
        if (cur.hostname === '93.127.137.138') {
          // Ajusta el path si tu proyecto está colgado en raíz
          let p = cur.pathname;
          if (p.startsWith('/gruposierra/')) p = p.replace('/gruposierra', '');
          return window.location.origin + p; // https://gruposierra.com.pe + /web/slider/...
        }
        // Intento genérico: subir a https
        cur.protocol = 'https:';
        return cur.toString();
      }
      return cur.toString();
    } catch {
      return u;
    }
  }

  // 1) Trae URLs desde API (solo ACTIVO y orden ASC: ya lo hace el endpoint)
  async function fetchSlider() {
    try {
      const r = await fetch('/includes/apiMySli.php?action=list', { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP '+r.status);
      const j = await r.json();
      if (!j.ok) throw new Error('API error');
      return (j.items || []).map(x => (x.url || '').trim()).filter(Boolean);
    } catch (e) {
      console.warn('Slider API fail, using local WebP fallbacks:', e);
      return [
        '/img/imagen/hero1.webp',
        '/img/imagen/hero2.webp',
        '/img/imagen/hero3.webp'
      ];
    }
  }

  // 2) Construye slides y dots (si no hay: 1 blanca) y clona el overlay con CTA
  function buildFromUrls(urls) {
    const list = (urls && urls.length) ? urls : [null]; // null => blanco
    slider.innerHTML = '';
    dotsBox.innerHTML = '';

    list.forEach((url, i) => {
      const art = document.createElement('article');
      art.className = 'gs-slide';
      art.setAttribute('aria-roledescription', 'slide');

      if (url) {
        const pic = document.createElement('picture');
        const img = document.createElement('img');
        img.src = normalizeImageUrl(url);
        img.alt = 'Slide ' + (i + 1);
        img.loading = (i === 0) ? 'eager' : 'lazy';

        // Fallback si la imagen no carga (404/SSL/mixed-content bloqueado)
        img.addEventListener('error', () => {
          art.classList.add('gs-slide--blank');
          art.style.background = '#ffffff';
          pic.remove();
        });

        pic.appendChild(img);
        art.appendChild(pic);
      } else {
        // hoja blanca
        art.classList.add('gs-slide--blank');
      }

      // Clona overlay + botón “Ver Proyectos”
      const overlay = overlayTpl.content.firstElementChild.cloneNode(true);
      // (Opcional) textos dinámicos por índice:
      // overlay.querySelector('.gs-hero__title').textContent = i===0 ? 'Vive donde sueñas' : '';
      // overlay.querySelector('.gs-hero__lead').textContent  = i===0 ? 'Departamentos, casas y oficinas en las mejores zonas.' : '';
      art.appendChild(overlay);
      slider.appendChild(art);

      // Dots
      const dot = document.createElement('button');
      dot.className = 'gs-dot';
      dot.dataset.goto = String(i);
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Diapositiva ' + (i+1));
      dotsBox.appendChild(dot);
    });

    // Activar primero
    const slides = Array.from(slider.querySelectorAll('.gs-slide'));
    const dots   = Array.from(dotsBox.querySelectorAll('.gs-dot'));
    if (slides[0]) slides[0].classList.add('is-active');
    if (dots[0]) { dots[0].classList.add('is-active'); dots[0].setAttribute('aria-selected','true'); }
    return { slides, dots };
  }

  // 3) Lógica del carrusel (tu misma lógica)
  function initCarousel(slides, dots) {
    let idx = 0, timer = null, hovered = false;

    function go(n){
      if(!slides.length) return;
      idx = (n + slides.length) % slides.length;
      slides.forEach((s,i)=>s.classList.toggle('is-active', i===idx));
      dots.forEach((d,i)=>{
        d.classList.toggle('is-active', i===idx);
        d.setAttribute('aria-selected', i===idx ? 'true' : 'false');
      });
    }
    function play(){ stop(); if(slides.length>1) timer = setInterval(()=>{ if(!hovered) go(idx+1); }, 6000); }
    function stop(){ if(timer) clearInterval(timer); }

    dots.forEach(d=>d.addEventListener('click', ()=>go(+d.dataset.goto)));
    next && next.addEventListener('click', ()=>go(idx+1));
    prev && prev.addEventListener('click', ()=>go(idx-1));
    slider && slider.addEventListener('mouseenter', ()=>{ hovered = true; });
    slider && slider.addEventListener('mouseleave', ()=>{ hovered = false; });
    document.addEventListener('visibilitychange', ()=>{ document.hidden ? stop() : play(); });

    go(0); play();
  }

  // 4) Ejecutar
  (async () => {
    const urls = await fetchSlider();
    const {slides, dots} = buildFromUrls(urls);
    initCarousel(slides, dots);
  })();

  // ---------- Scroll suave robusto ----------
  function getScrollRoot(startEl) {
    const explicit = document.querySelector('.gs-scroll-root');
    if (explicit) return explicit;
    let cur = startEl?.parentElement || null;
    while (cur) {
      const st = getComputedStyle(cur);
      const canScroll = (/(auto|scroll)/.test(st.overflowY) || /(auto|scroll)/.test(st.overflow));
      if (canScroll && cur.scrollHeight > cur.clientHeight) return cur;
      cur = cur.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }
  function headerHeight() {
    const fixed = document.querySelector('.gs-header, header.gs-header, header[role="banner"]');
    if (!fixed) return 0;
    const style = window.getComputedStyle(fixed);
    const isFixed = style.position === 'fixed' || style.position === 'sticky';
    return isFixed ? fixed.getBoundingClientRect().height : 0;
  }
  function smoothScrollTo(el) {
    const rootScroll = getScrollRoot(el);
    const rect = el.getBoundingClientRect();
    const rootRect = rootScroll.getBoundingClientRect();
    const current = rootScroll === document.scrollingElement ? window.scrollY : rootScroll.scrollTop;
    const targetTop = (rect.top - rootRect.top) + current - headerHeight() - 8;
    if (rootScroll === document.scrollingElement || rootScroll === document.documentElement || rootScroll === document.body) {
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    } else {
      rootScroll.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  }
  const routeMap = { '/inicio':'inicio', '/quienes':'quienes', '/servicios':'servicios' };
  function normalizePath(href) {
    try {
      const u = href.startsWith('http') ? new URL(href) : new URL(href, window.location.origin);
      let p = u.pathname;
      if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
      return p || '/';
    } catch { return href; }
  }
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[data-scroll]');
    if(!a) return;

    // #anchor directo
    const direct = a.getAttribute('data-target') || a.getAttribute('href');
    if (direct && direct.startsWith('#')) {
      const el = document.querySelector(direct);
      if (el) { e.preventDefault(); smoothScrollTo(el); history.pushState(null, '', direct); return; }
    }

    // Ruta -> id
    const path = normalizePath(a.getAttribute('href') || '');
    const id = routeMap[path] || routeMap[path.replace(/\/+$/,'')];
    const el = id && document.getElementById(id);
    if (el) { e.preventDefault(); smoothScrollTo(el); history.pushState(null, '', path); }
  });
})();

/* =========================================================
   🎬 SERVICIOS y QUIÉNES — Animaciones (como ya usas)
========================================================= */
(function () {
  const state = { servicios: { visible: false }, quienes: { visible: false } };

  function runServicios(force = false) {
    const section = document.getElementById('servicios');
    if (!section) return;
    const cards = section.querySelectorAll('.gs-service');
    if (!cards.length) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (force || !state.servicios.visible) {
      cards.forEach(c => c.classList.remove('is-in'));
      section.offsetHeight;
      cards.forEach((c, i) => {
        c.style.setProperty('--i', i);
        if (reduce) c.classList.add('is-in'); else setTimeout(() => c.classList.add('is-in'), i * 90);
      });
      state.servicios.visible = true;
    }
  }

  function runQuienes(force = false) {
    const section = document.getElementById('quienes');
    if (!section) return;
    const cards = section.querySelectorAll('.qs-card');
    if (!cards.length) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (force || !state.quienes.visible) {
      cards.forEach(c => c.classList.remove('is-in'));
      section.offsetHeight;
      cards.forEach((c, i) => {
        c.style.setProperty('--i', i);
        if (reduce) c.classList.add('is-in'); else setTimeout(() => c.classList.add('is-in'), i * 120);
      });
      state.quienes.visible = true;
    }
  }

  function setupObservers() {
    const opts = { threshold: 0.25, rootMargin: '0px 0px -10% 0px' };
    const obsS = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) runServicios(true); else state.servicios.visible = false; }), opts);
    const obsQ = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) runQuienes(true);  else state.quienes.visible = false; }), opts);
    const secS = document.getElementById('servicios');
    const secQ = document.getElementById('quienes');
    if (secS) obsS.observe(secS);
    if (secQ) obsQ.observe(secQ);
  }

  window.addEventListener('hashchange', () => {
    const h = location.hash || '';
    if (h === '#servicios') setTimeout(() => runServicios(true), 300);
    if (h === '#quienes')   setTimeout(() => runQuienes(true), 300);
  });

  document.addEventListener('DOMContentLoaded', () => {
    setupObservers();
    if (location.hash === '#servicios') setTimeout(() => runServicios(true), 400);
    if (location.hash === '#quienes')   setTimeout(() => runQuienes(true), 400);
  });
})();

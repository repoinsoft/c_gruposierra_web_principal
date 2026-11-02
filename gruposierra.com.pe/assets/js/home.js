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
          return window.location.origin + p; // https://gruposierra.pe + /web/slider/...
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

  // 1) Trae URLs desde la API central o fallbacks locales
  async function fetchSlider() {
    try {
      const r = await fetch('https://api.insoft.com.pe/sierra/web/api_web.php?action=sliders', { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      if (!j.ok) throw new Error('API error');
      const urls = (j.data || []).map(x => (x.url || '').trim()).filter(Boolean);
      if (urls.length) return urls;
      throw new Error('Sin sliders en API');
    } catch (e) {
      console.warn('Usando fallbacks locales de slider:', e);
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
  const routeMap = { '/inicio':'inicio', '/proyectos':'proyectos', '/quienes':'quienes', '/servicios':'servicios' };
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
   🎬 QUIÉNES SOMOS — Animaciones
========================================================= */
(function () {
  const state = { quienes: { visible: false } };

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
    const obsQ = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) runQuienes(true);  else state.quienes.visible = false; }), opts);
    const secQ = document.getElementById('quienes');
    if (secQ) obsQ.observe(secQ);
  }

  window.addEventListener('hashchange', () => {
    const h = location.hash || '';
    if (h === '#quienes') setTimeout(() => runQuienes(true), 300);
  });

  document.addEventListener('DOMContentLoaded', () => {
    setupObservers();
    if (location.hash === '#quienes') setTimeout(() => runQuienes(true), 400);
  });
})();

/* =========================================================
   📸 CLIENTES SATISFECHOS — Carrusel Continuo + Lightbox
========================================================= */
(function () {
  const track = document.getElementById('track-testimonios');
  const marquee = document.getElementById('marquee-testimonios');
  const lightbox = document.getElementById('gs-lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  const lbClose = document.getElementById('lb-btn-close');
  const lbBackdrop = document.getElementById('lb-backdrop');
  const lbPrev = document.getElementById('lb-btn-prev');
  const lbNext = document.getElementById('lb-btn-next');

  if (!track || !marquee) return;

  let currentPhotos = [];
  let currentIndex = 0;

  async function loadTestimonios() {
    try {
      const res = await fetch('https://api.insoft.com.pe/sierra/web/api_web.php?action=testimonios', { cache: 'no-cache' });
      const json = await res.json();
      if (res.ok && json.ok && json.data && json.data.length > 0) {
        currentPhotos = json.data;
      } else {
        throw new Error('Lista vacía');
      }
    } catch (e) {
      console.info('Cargando fotos de entrega predeterminadas:', e);
      currentPhotos = [
        { url: 'https://api.insoft.com.pe/sierra/web/testimonios/entrega_de_lote_urbanizado.jpg', titulo: 'Entrega de Lote y Título de Propiedad' },
        { url: 'https://api.insoft.com.pe/sierra/web/testimonios/entrega_de_titulo_y_minuta.png', titulo: 'Firma de Contrato y Minuta' },
        { url: 'https://api.insoft.com.pe/sierra/web/testimonios/entrega_residencial_villa_andina.png', titulo: 'Entrega Oficial en Residencial Villa Andina' },
        { url: 'https://api.insoft.com.pe/sierra/web/testimonios/familia_feliz_propietaria.jpg', titulo: 'Familia Feliz Propietaria' }
      ];
    }
    renderMarquee(currentPhotos);
  }

  function renderMarquee(photos) {
    track.innerHTML = '';
    if (!photos || !photos.length) {
      track.innerHTML = '<div style="padding: 24px; color: #6B7280; font-weight: 600; font-size: 1rem; width: 100%; text-align: center;"><i class="fas fa-camera"></i> Próximamente fotos de entregas de lotes y testimonios de nuestros clientes.</div>';
      return;
    }

    // Asegura al menos 8 elementos para desplazamiento continuo fluido
    let loopItems = [...photos];
    while (loopItems.length < 8) {
      loopItems = loopItems.concat(photos);
    }

    loopItems.forEach((p, idx) => {
      const realIndex = idx % photos.length;
      const card = document.createElement('div');
      card.className = 'gs-marquee__card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Ver foto: ${p.titulo || 'Cliente satisfecho'}`);

      card.innerHTML = `
        <div class="gs-marquee__img-wrap">
          <div class="gs-marquee__ambient" style="background-image: url('${p.url}')"></div>
          <img src="${p.url}" alt="${p.titulo || 'Cliente satisfecho Grupo Sierra'}" loading="lazy" class="gs-marquee__img">
          <div class="gs-marquee__overlay">
            <span class="gs-marquee__zoom-icon"><i class="fas fa-search-plus"></i></span>
            <span class="gs-marquee__badge"><i class="fas fa-check-circle"></i> Entrega Verificada</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => openLightbox(realIndex));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') openLightbox(realIndex); });
      track.appendChild(card);
    });

    // Pausar con touch en móvil
    marquee.addEventListener('touchstart', () => { track.style.animationPlayState = 'paused'; }, { passive: true });
    marquee.addEventListener('touchend', () => { track.style.animationPlayState = 'running'; }, { passive: true });
  }

  function openLightbox(index) {
    if (!lightbox || !currentPhotos.length) return;
    currentIndex = (index + currentPhotos.length) % currentPhotos.length;
    updateLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function updateLightbox() {
    const item = currentPhotos[currentIndex];
    if (!item) return;
    lbImg.src = item.url;
    lbImg.alt = item.titulo || 'Cliente satisfecho';
    if (lbCaption) {
      lbCaption.innerHTML = `<span><i class="fas fa-camera"></i> ${item.titulo || 'Entrega de lote - Grupo Sierra'}</span> <span>${currentIndex + 1} / ${currentPhotos.length}</span>`;
    }
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  function nextLightbox() {
    currentIndex = (currentIndex + 1) % currentPhotos.length;
    updateLightbox();
  }

  function prevLightbox() {
    currentIndex = (currentIndex - 1 + currentPhotos.length) % currentPhotos.length;
    updateLightbox();
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbBackdrop) lbBackdrop.addEventListener('click', closeLightbox);
  if (lbNext) lbNext.addEventListener('click', nextLightbox);
  if (lbPrev) lbPrev.addEventListener('click', prevLightbox);

  document.addEventListener('keydown', (e) => {
    if (lightbox && !lightbox.hidden) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
    }
  });

  // Gesto Swipe táctil en móvil
  let touchStartX = 0;
  if (lightbox) {
    lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    lightbox.addEventListener('touchend', e => {
      const diffX = e.changedTouches[0].screenX - touchStartX;
      if (diffX < -50) nextLightbox();
      if (diffX > 50) prevLightbox();
    }, { passive: true });
  }

  loadTestimonios();
})();

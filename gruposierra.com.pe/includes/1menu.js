// /includes/1menu.js

// ================================================================
// 0) Evita correcciones del navegador
// ================================================================
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (_) {}

/* (Opcional) Espera a que el scroll se estabilice cerca de un destino */
function GS_waitScrollSettle(targetTop, tolerance = 4, idleMs = 160, maxMs = 2500) {
  return new Promise(resolve => {
    let last = window.scrollY, idle = 0, elapsed = 0;
    const tick = () => {
      const y = window.scrollY;
      const near = Math.abs(y - targetTop) <= tolerance;
      const still = Math.abs(y - last) <= 1;
      last = y;
      if (near && still) idle += 16; else idle = 0;
      elapsed += 16;
      if (idle >= idleMs || elapsed >= maxMs) return resolve();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* ================================================================
   1) Delegado de anclas (#) con smooth-scroll + marcado inmediato
================================================================ */
(function () {
  const doc = document.documentElement;
  let scrolling = true; // para ignorar hashchange nativos durante scroll programático

  const headerH = () => {
    const header = document.querySelector('.gs-header');
    const cssVar = parseInt(getComputedStyle(doc).getPropertyValue('--header-height')) || 0;
    return (header?.getBoundingClientRect().height | 0) || cssVar || 80;
  };

  const normalize = p => (p.replace(/\/+$/, '/') || '/');

  const tryHandleAnchor = (a, e) => {
    if (!a) return false;
    const href = a.getAttribute('href') || '';
    if (!href || !href.includes('#')) return false;

    const url = new URL(href, window.location.origin);
    if (normalize(url.pathname) !== normalize(window.location.pathname)) return false;

    const id = (url.hash || '').slice(1);
    if (!id) return false;

    const target = document.getElementById(id);
    if (!target) return false;

    // Intercepta ANTES que el navegador haga nada
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    const extra = (id === 'inicio') ? 15 : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH() - 8 - extra;

    // Feedback inmediato: marcar activo el link pulsado
    document.querySelectorAll('.gs-nav__link').forEach(l => {
      l.classList.remove('is-active');
      l.removeAttribute('aria-current');
    });
    a.classList.add('is-active');
    a.setAttribute('aria-current','page');

    scrolling = true;
    window.scrollTo({ top, behavior: 'smooth' });

    // Actualiza la barra sin provocar salto
    if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    else history.replaceState(null, '', `#${id}`);

    // Cierra menú móvil si estaba abierto
    const burger = document.querySelector('.gs-burger');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    doc.classList.remove('gs-nav-open');

    // Tras un tiempo razonable, liberamos el bloqueo de hashchange
    setTimeout(() => { scrolling = false; }, 600);

    return true;
  };

  // Delegación con Click (evita el salto del primer click y es libre de lag en scroll táctil)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (a.matches('.gs-nav__link, a[data-scroll], a[href*="#"]')) {
      tryHandleAnchor(a, e);
    }
  }, true);

  // Ignora hashchange mientras estamos haciendo scroll programático
  window.addEventListener('hashchange', (e) => {
    if (scrolling) {
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
  }, true);
})();

/* ================================================================
   2) Header híbrido: usa el embebido si existe; si no, lo trae por fetch
================================================================ */
document.addEventListener("DOMContentLoaded", () => {

  const BOOT = () => {
    const $doc  = document.documentElement;
    const $body = document.body;

    const header = document.querySelector('.gs-header');
    const nav    = document.getElementById('gs-main-nav');
    const burger = document.querySelector('.gs-burger');
    const logoImg= document.querySelector('.gs-logo__img');

    if (!header || !nav) return false; // no hay header aún (quizá lo cargaremos por fetch)

    const links = Array.from(document.querySelectorAll('.gs-nav__link'));
    const hashLinks = links.filter(a => (a.getAttribute('href') || '').includes('#'));
    const pathLinks = links.filter(a => !(a.getAttribute('href') || '').includes('#'));

    const getVarPx = name => parseInt(getComputedStyle($doc).getPropertyValue(name)) || 0;
    const headerH = () =>
      (header?.getBoundingClientRect().height | 0) || getVarPx('--header-height') || 80;

    // --- util: normaliza paths (quita //, barra final, index.*) ---
    const normPath = (p) => {
      try {
        const url = new URL(p, window.location.origin); // tolera absolutos
        p = url.pathname || '/';
      } catch { /* p ya es relativo */ }

      p = p.replace(/\/{2,}/g, '/');                    // barras duplicadas
      p = p.replace(/\/index\.(?:html?|php)$/i, '/');   // index.* al final
      if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1); // barra final
      return p || '/';
    };

    // 👇 Solo consideramos secciones al hacer scroll cuando estamos en la HOME
    const isHome = normPath(window.location.pathname) === '/';

    // Offset real según altura del header (considera el margen del óvalo flotante)
    const applyOffset = () => {
      const h = headerH();
      $doc.style.setProperty('--header-height', h + 'px');
      const isMobile = window.innerWidth <= 900;
      const extraOffset = isMobile ? '20px' : '28px';
      $doc.style.setProperty('--header-offset', `calc(${h}px + ${extraOffset})`);
      
      // En la Home queremos que el carrusel fluya por debajo del menú flotante sin bloque blanco,
      // por lo que no le añadimos el padding superior gs-offset al body.
      if (!isHome) {
        $body.classList.add('gs-offset');
      } else {
        $body.classList.remove('gs-offset');
      }
    };

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => applyOffset());
      ro.observe(header);
    }
    if (logoImg && !logoImg.complete) {
      logoImg.addEventListener('load', applyOffset, { once: true });
      logoImg.addEventListener('error', applyOffset, { once: true });
    }

    // ===== Utilidades activo
    const clearActive = () => links.forEach(l => {
      l.classList.remove('is-active');
      l.removeAttribute('aria-current');
    });
    const setActive  = a => {
      if (!a) return;
      clearActive();
      a.classList.add('is-active');
      a.setAttribute('aria-current','page');
    };

    // ===== Activo por ruta (para /pages/…): prefijo más largo =====
    const markActiveByPath = () => {
      const cur = normPath(window.location.pathname);
      const linksNoHash = Array.from(document.querySelectorAll('.gs-nav__link'))
        .filter(a => !((a.getAttribute('href') || '').includes('#')));

      const candidates = linksNoHash.map(a => ({ a, href: normPath(a.getAttribute('href') || '/') }));

      let winner = null;
      for (const item of candidates) {
        if (item.href === '/') continue; // no marcar Inicio por ruta
        if (cur === item.href || cur.startsWith(item.href)) {
          if (!winner || item.href.length > winner.href.length) winner = item;
        }
      }

      if (winner) {
        clearActive();
        winner.a.classList.add('is-active');
        winner.a.setAttribute('aria-current', 'page');
      }
    };

    // Activo por sección visible (#inicio #proyectos #servicios #quienes)
    const sectionMap = isHome ? (() => {
      const map = new Map();
      hashLinks.forEach(a => {
        const id = (a.getAttribute('href') || '').split('#')[1];
        const sec = id ? document.getElementById(id) : null;
        if (sec) map.set(sec, a);
      });
      return map;
    })() : new Map();

    const markActiveBySection = () => {
      if (!isHome || !sectionMap.size) return;
      const h = headerH();
      let candidate = null;
      sectionMap.forEach((a, sec) => {
        const top = sec.getBoundingClientRect().top - (h + 12);
        if (top <= 0) {
          if (!candidate || sec.getBoundingClientRect().top > candidate.sec.getBoundingClientRect().top) {
            candidate = { sec, a };
          }
        }
      });
      if (candidate) setActive(candidate.a);
    };

    // Posiciona correctamente si entras con #hash
    const correctInitialHash = () => {
      if (!location.hash) return;
      const id = location.hash.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      requestAnimationFrame(() => {
        applyOffset();
        const extra = (id === 'inicio') ? 15 : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH() - 8 - extra;
        window.scrollTo({ top });
      });
    };

    // Sombra en scroll
    const onScrollShadow = () => {
      if (window.scrollY > 6) header.classList.add('gs-header--scrolled');
      else header.classList.remove('gs-header--scrolled');
    };

    // Hamburguesa
    const setNav = (open) => {
      if (!burger) return;
      burger.setAttribute('aria-expanded', String(open));
      document.documentElement.classList.toggle('gs-nav-open', open);
    };
    const wireBurger = () => {
      if (!burger) return;
      burger.addEventListener('click', () => {
        const open = burger.getAttribute('aria-expanded') !== 'true';
        setNav(open);
      });
      nav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => setNav(false));
      });
      window.addEventListener('resize', () => {
        if (window.innerWidth > 900) setNav(false);
      }, { passive: true });
    };

    // INIT
    applyOffset();
    correctInitialHash();
    markActiveByPath();          // ← rutas /pages/*
    if (isHome) markActiveBySection();   // ← secciones solo en la home
    onScrollShadow();
    wireBurger();

    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      onScrollShadow();
      if (isHome && !scrollTicking) {
        window.requestAnimationFrame(() => {
          markActiveBySection();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });

    let resizeTicking = false;
    window.addEventListener('resize', () => {
      if (!resizeTicking) {
        window.requestAnimationFrame(() => {
          applyOffset();
          if (isHome) markActiveBySection();
          resizeTicking = false;
        });
        resizeTicking = true;
      }
    }, { passive: true });

    // Mantener activo al navegar con el historial (←/→)
    window.addEventListener('popstate', markActiveByPath);

    // Feedback inmediato al clic dentro del nav (para rutas)
    nav.addEventListener('click', (ev) => {
      const a = ev.target.closest('.gs-nav__link');
      if (!a) return;
      document.querySelectorAll('.gs-nav__link')
        .forEach(l => { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
      a.classList.add('is-active');
      a.setAttribute('aria-current','page');
    }, true);

    // Corrección adicional cuando tipografías cargan
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { applyOffset(); correctInitialHash(); });
    }
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => { applyOffset(); correctInitialHash(); }, { once: true });
    }

    return true; // boot ok
  };

  // 1) Intentar boot con header embebido
  if (BOOT()) return;

  // 2) Si no hay header en el DOM, lo cargamos por fetch
  let placeholder = document.getElementById('header-placeholder');
  if (!placeholder) {
    placeholder = document.createElement('div');
    placeholder.id = 'header-placeholder';
    document.body.prepend(placeholder);
  }

  fetch("/includes/1menu.html", { cache: "no-cache" })
    .then(r => { if (!r.ok) throw new Error("No se pudo cargar /includes/1menu.html"); return r.text(); })
    .then(html => {
      placeholder.innerHTML = html;
      // ejecutar scripts embebidos si los hubiera
      placeholder.querySelectorAll("script").forEach(old => {
        const s = document.createElement("script");
        if (old.src) s.src = old.src; else s.textContent = old.textContent;
        document.body.appendChild(s); old.remove();
      });
      // ahora sí, boot
      BOOT();
    })
    .catch(err => console.error("Header híbrido:", err));
});

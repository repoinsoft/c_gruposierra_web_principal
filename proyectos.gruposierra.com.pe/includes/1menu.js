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
  let scrolling = true;

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

    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    const extra = (id === 'inicio') ? 15 : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH() - 8 - extra;

    document.querySelectorAll('.gs-nav__link').forEach(l => { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
    a.classList.add('is-active'); a.setAttribute('aria-current','page');

    scrolling = true;
    window.scrollTo({ top, behavior: 'smooth' });

    if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    else history.replaceState(null, '', `#${id}`);

    const burger = document.querySelector('.gs-burger');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    doc.classList.remove('gs-nav-open');

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

    if (!header || !nav) return false;

    const links = Array.from(document.querySelectorAll('.gs-nav__link'));
    const hashLinks = links.filter(a => (a.getAttribute('href') || '').includes('#'));
    const pathLinks = links.filter(a => !(a.getAttribute('href') || '').includes('#'));

    const getVarPx = name => parseInt(getComputedStyle($doc).getPropertyValue(name)) || 0;
    const headerH = () =>
      (header?.getBoundingClientRect().height | 0) || getVarPx('--header-height') || 80;

    // Offset real según altura del header (considera el margen del óvalo flotante)
    const applyOffset = () => {
      const h = headerH();
      $doc.style.setProperty('--header-height', h + 'px');
      const isMobile = window.innerWidth <= 900;
      const extraOffset = isMobile ? '20px' : '28px';
      $doc.style.setProperty('--header-offset', `calc(${h}px + ${extraOffset})`);
      $body.classList.remove('gs-offset');
    };

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => applyOffset());
      ro.observe(header);
    }
    if (logoImg && !logoImg.complete) {
      logoImg.addEventListener('load', applyOffset, { once: true });
      logoImg.addEventListener('error', applyOffset, { once: true });
    }

    const clearActive = () => links.forEach(l => { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
    const setActive  = a => { if (!a) return; clearActive(); a.classList.add('is-active'); a.setAttribute('aria-current','page'); };

    const normPath = (p) => {
      try { const url = new URL(p, window.location.origin); p = url.pathname || '/'; } catch {}
      p = p.replace(/\/{2,}/g, '/');
      p = p.replace(/\/index\.(?:html?|php)$/i, '/');
      if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
      return p || '/';
    };

    const markActiveByPath = () => {
      const cur = normPath(window.location.pathname);
      const linksNoHash = Array.from(document.querySelectorAll('.gs-nav__link'))
        .filter(a => !((a.getAttribute('href') || '').includes('#')));
      const candidates = linksNoHash.map(a => ({ a, href: normPath(a.getAttribute('href') || '/') }));
      let winner = null;
      for (const item of candidates) {
        if (item.href === '/') continue;
        if (cur === item.href || cur.startsWith(item.href)) {
          if (!winner || item.href.length > winner.href.length) winner = item;
        }
      }
      if (winner) { clearActive(); winner.a.classList.add('is-active'); winner.a.setAttribute('aria-current','page'); }
    };

    const sectionMap = (() => {
      const map = new Map();
      hashLinks.forEach(a => {
        const id = (a.getAttribute('href') || '').split('#')[1];
        const sec = id ? document.getElementById(id) : null;
        if (sec) map.set(sec, a);
      });
      return map;
    })();

    const markActiveBySection = () => {
      if (!sectionMap.size) return;
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

    const onScrollShadow = () => {
      if (window.scrollY > 6) header.classList.add('gs-header--scrolled');
      else header.classList.remove('gs-header--scrolled');
    };

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
      nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNav(false)));
      window.addEventListener('resize', () => { if (window.innerWidth > 900) setNav(false); }, { passive:true });
    };

    // INIT
    applyOffset();
    correctInitialHash();
    markActiveByPath();
    markActiveBySection();
    onScrollShadow();
    wireBurger();

    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      onScrollShadow();
      if (!scrollTicking) {
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
          markActiveBySection();
          resizeTicking = false;
        });
        resizeTicking = true;
      }
    }, { passive: true });
    window.addEventListener('popstate', markActiveByPath);

    nav.addEventListener('click', (ev) => {
      const a = ev.target.closest('.gs-nav__link');
      if (!a) return;
      document.querySelectorAll('.gs-nav__link').forEach(l => { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
      a.classList.add('is-active'); a.setAttribute('aria-current','page');
    }, true);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { applyOffset(); correctInitialHash(); });
    }
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => { applyOffset(); correctInitialHash(); }, { once:true });
    }

    return true;
  };

  // 1) Si ya existe el header en el DOM, inicia
  if (BOOT()) return;

  // 2) Si no existe, cargar 1menu.html por fetch
  let placeholder = document.getElementById('header-placeholder');
  if (!placeholder) {
    placeholder = document.createElement('div');
    placeholder.id = 'header-placeholder';
    document.body.prepend(placeholder);
  }

  // Detectar base URL del script actual
  const getBasePath = () => {
    const s = document.currentScript || document.querySelector('script[src*="1menu.js"]');
    if (s && s.src) {
      try {
        const u = new URL(s.src, window.location.href);
        return u.pathname.replace(/\/includes\/1menu\.js.*$/, '');
      } catch (_) {}
    }
    return '';
  };
  const base = getBasePath();
  const menuUrl = (base ? base : '') + '/includes/1menu.html';

  fetch(menuUrl, { cache: "no-cache" })
    .then(r => { if (!r.ok) throw new Error("No se pudo cargar " + menuUrl); return r.text(); })
    .then(html => {
      if (base) {
        html = html.replace(/href="\/(?!\/)/g, `href="${base}/`)
                   .replace(/src="\/(?!\/)/g, `src="${base}/`);
      }
      placeholder.innerHTML = html;
      placeholder.querySelectorAll("script").forEach(old => {
        const s = document.createElement("script");
        if (old.src) s.src = old.src; else s.textContent = old.textContent;
        document.body.appendChild(s); old.remove();
      });
      BOOT();
    })
    .catch(err => console.error("Header híbrido:", err));
});

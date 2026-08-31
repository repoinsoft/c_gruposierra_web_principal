// includes/2pie.js
document.addEventListener('DOMContentLoaded', () => {
  // Detectar base URL del script actual
  const getBasePath = () => {
    const s = document.currentScript || document.querySelector('script[src*="2pie.js"]');
    if (s && s.src) {
      try {
        const u = new URL(s.src, window.location.href);
        return u.pathname.replace(/\/includes\/2pie\.js.*$/, '');
      } catch (_) {}
    }
    return '';
  };
  const base = getBasePath();
  const pieUrl = (base ? base : '') + '/includes/2pie.html';
  const cssUrl = (base ? base : '') + '/includes/2pie.css?v=4.0';

  // Asegurar CSS del footer
  if (![...document.querySelectorAll('link[rel="stylesheet"]')].some(l => (l.href || '').includes('2pie.css'))) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    document.head.appendChild(link);
  }

  // Cargar el fragmento del footer desde /includes/2pie.html
  fetch(pieUrl, { cache: "no-cache" })
    .then(r => {
      if (!r.ok) throw new Error('No se pudo cargar ' + pieUrl);
      return r.text();
    })
    .then(html => {
      if (base) {
        html = html.replace(/href="\/(?!\/)/g, `href="${base}/`)
                   .replace(/src="\/(?!\/)/g, `src="${base}/`);
      }
      // Insertar en placeholder si existe; si no, al final del body
      const slot = document.getElementById('footer-placeholder');
      if (slot) {
        slot.innerHTML = html;
      } else {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        document.body.appendChild(temp.firstElementChild);
      }

      // Asegurar Font Awesome (si no lo tienes ya en <head>)
      const FA_HREF = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css";
      const hasFA = [...document.querySelectorAll('link[rel="stylesheet"]')].some(l => (l.href || "").includes("font-awesome"));
      if (!hasFA) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = FA_HREF;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }

      // Fijar año dinámico
      const y = document.getElementById('gs-year');
      if (y) y.textContent = new Date().getFullYear();
    })
    .catch(err => console.error('[2pie] Error:', err));
});

document.querySelectorAll('.gs-footer__bottom a').forEach(a=>{
  a.addEventListener('click', e => console.log('Click en:', a.href));
});

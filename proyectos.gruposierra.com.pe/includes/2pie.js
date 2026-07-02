// includes/2pie.js
document.addEventListener('DOMContentLoaded', () => {
  // Cargar el fragmento del footer desde /includes/2pie.html
  fetch('/includes/2pie.html', { cache: "no-cache" })
    .then(r => {
      if (!r.ok) throw new Error('No se pudo cargar /includes/2pie.html');
      return r.text();
    })
    .then(html => {
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

/* =========================================================
   📦 Proyectos — Render dinámico (forma tipo mock)
   Fuente: /includes/apiMyPro.php?action=list
   Lee: nombre/slug/direccion/descripcion/foto/moneda/desde/metros/mapa/tipo
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const grid  = document.getElementById('proyectos-list');
  const empty = document.getElementById('proyectos-empty');
  if (!grid) return;

  grid.innerHTML = '';

  // Mensaje de carga
  const ghost = document.createElement('div');
  ghost.className = 'proyectos-empty';
  ghost.textContent = 'Cargando proyectos…';
  grid.parentElement.appendChild(ghost);

  function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
      // Preservar números romanos
      const w = word.trim();
      if (w === 'ii' || w === 'iii' || w === 'iv' || w === 'v') {
        return w.toUpperCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  }

  const API_URL  = '/includes/apiMyPro.php?action=list';
  const buildURL = (slug) =>
    `https://proyectos.gruposierra.com.pe/?p=${encodeURIComponent(slug)}`;

  // ⮑ Normaliza cada item usando tus columnas reales
  const normalizeItem = (p) => {
    const titulo    = p.titulo    || p.nombre    || 'Proyecto';
    const ubicacion = p.ubicacion || p.direccion || p.descripcion || '';
    const img       = p.img       || p.foto      || '';

    // slug: usa el que venga; si falta, genera desde el nombre
    const mkSlug = (s) => (s || 'proyecto')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const slug = p.slug && String(p.slug).trim() ? p.slug : mkSlug(titulo);
    const url  = p.url || buildURL(slug);

    // Moneda
    const mapMoneda = (m) => {
      const s = (m || '').toString().trim().toUpperCase();
      if (s.includes('DOLAR')) return 'US$';
      if (s.includes('SOL'))   return 'S/';
      return 'S/';
    };

    // Precio y área
    const precio_num = Number(p.precio_desde ?? p.desde ?? p.precio ?? '');
    const area_num   = Number(p.area_desde   ?? p.metros ?? p.area ?? '');

    const precio_desde  = Number.isFinite(precio_num) ? precio_num : '';
    const area_desde    = Number.isFinite(area_num)   ? area_num   : '';
    const precio_moneda = mapMoneda(p.precio_moneda || p.moneda);

    // 🔹 Campos nuevos desde la API
    const maps_url = p.mapa || p.maps_url || '';
    const tipo     = p.tipo || '';

    return {
      titulo,
      ubicacion,
      img,
      slug,
      url,
      maps_url,
      area_desde,
      precio_desde,
      precio_moneda,
      tipo
    };
  };

  const render = (items) => {
    grid.innerHTML = '';

    if (!Array.isArray(items) || items.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    const frag = document.createDocumentFragment();
    const nf   = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });

    items.forEach((raw) => {
      const p = normalizeItem(raw);

      const card = document.createElement('article');
      card.className = 'proyecto-card reveal';
      card.setAttribute('role', 'listitem');

      // Enlace de cobertura (toda la card apunta al proyecto)
      const fullLink = document.createElement('a');
      fullLink.className = 'proyecto-link-mask';
      fullLink.href = p.url;
      fullLink.setAttribute('aria-label', `Abrir proyecto: ${p.titulo}`);
      fullLink.tabIndex = -1;
      card.appendChild(fullLink);

      // ===== MEDIA (foto + pill + "Ver en Maps") =====
      const media = document.createElement('div');
      media.className = 'proyecto-media';

      if (p.img) {
        const img = document.createElement('img');
        img.className = 'proyecto-img';
        img.src = p.img;
        img.alt = p.titulo;
        media.appendChild(img);
      }

      // Burbuja “Ver en Maps” — ahora usa la URL de 'mapa'
      if (p.maps_url) {
        const mapBadge = document.createElement('a');
        mapBadge.className = 'proy-map';
        mapBadge.textContent = 'Ver en Maps';
        mapBadge.href   = p.maps_url;
        mapBadge.target = '_blank';
        mapBadge.rel    = 'noopener noreferrer';
        media.appendChild(mapBadge);
      }

      // Pill “Desde XX m²”
      if (p.area_desde !== '') {
        const pill = document.createElement('div');
        pill.className = 'proy-pill';
        pill.textContent = `Desde ${p.area_desde} m²`;
        media.appendChild(pill);
      }

      card.appendChild(media);

      // ===== BODY (título rojo + dirección + footer) =====
      const body = document.createElement('div');
      body.className = 'proyecto-body';

      // Nombre del proyecto (rojo, grande, centrado)
      const titleBar = document.createElement('div');
      titleBar.className = 'proy-titlebar';
      titleBar.textContent = toTitleCase(p.titulo);
      body.appendChild(titleBar);

      // Dirección debajo del nombre
      if (p.ubicacion) {
        const addr = document.createElement('p');
        addr.className = 'proyecto-ubicacion';
        addr.textContent = toTitleCase(p.ubicacion);
        body.appendChild(addr);
      }

      // ===== Footer precio + CTA =====
      const footer = document.createElement('div');
      footer.className = 'proy-footer';

      const price = document.createElement('div');
      price.className = 'proy-price';

      const small = document.createElement('small');
      // 🔹 “tipo” va en la línea de arriba (en lugar de "Cuotas desde")
      small.textContent = p.tipo || 'Cuotas desde';

      const strong = document.createElement('strong');
      const monSpace = p.precio_moneda ? `${p.precio_moneda} ` : '';
      strong.textContent = p.precio_desde !== ''
        ? `${monSpace}${nf.format(p.precio_desde)}`
        : `${monSpace}—`;

      price.appendChild(small);
      price.appendChild(strong);

      const cta = document.createElement('a');
      cta.className = 'proy-cta';
      cta.href = p.url;
      cta.textContent = 'Ver Proyecto';

      footer.appendChild(price);
      footer.appendChild(cta);
      body.appendChild(footer);

      card.appendChild(body);
      frag.appendChild(card);
    });

    grid.appendChild(frag);

    // Animación de ingreso
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    grid.querySelectorAll('.reveal').forEach(el => io.observe(el));
  };

  // Fetch de la API
  fetch(API_URL, { cache: 'no-store' })
    .then(r => r.json())
    .then(json => {
      ghost.remove();
      const data = Array.isArray(json)
        ? json
        : (json && Array.isArray(json.data)) ? json.data
        : [];
      render(data);
    })
    .catch(err => {
      console.warn('Projects API fail, using local fallbacks:', err);
      ghost.remove();
      const fallbackData = [
        {
          titulo: "RESIDENCIAL VILLA ANDINA",
          ubicacion: "VILLA ANDINA",
          img: "/img/imagen/hero1.webp",
          slug: "residencialvillaandina",
          url: "https://proyectos.gruposierra.com.pe/?p=residencialvillaandina",
          mapa: "https://maps.app.goo.gl/to2y2vLXTpEdsMmV7",
          tipo: "Desde",
          precio_moneda: "SOLES",
          precio_desde: 23200,
          area_desde: 160
        },
        {
          titulo: "URBANIZACIÓN MARAVILLAS II",
          ubicacion: "MARAVILLAS",
          img: "/img/imagen/hero2.webp",
          slug: "urbanizacionmaravillasii",
          url: "https://proyectos.gruposierra.com.pe/?p=urbanizacionmaravillasii",
          mapa: "https://maps.app.goo.gl/to2y2vLXTpEdsMmV7",
          tipo: "Desde",
          precio_moneda: "SOLES",
          precio_desde: 27500,
          area_desde: 131.6
        },
        {
          titulo: "URBANIZACIÓN MARAVILLAS",
          ubicacion: "URBANIZACION MARAVILLAS",
          img: "/img/imagen/hero3.webp",
          slug: "urbanizacionmaravillas",
          url: "https://proyectos.gruposierra.com.pe/?p=urbanizacionmaravillas",
          mapa: "https://maps.app.goo.gl/to2y2vLXTpEdsMmV7",
          tipo: "Desde",
          precio_moneda: "SOLES",
          precio_desde: 22000,
          area_desde: 138
        },
        {
          titulo: "RESIDENCIAL INDEPENDENCIA",
          ubicacion: "AV. INDEPENDENCIA",
          img: "/img/imagen/hero1.webp",
          slug: "residencialindependencia",
          url: "https://proyectos.gruposierra.com.pe/?p=residencialindependencia",
          mapa: "https://maps.app.goo.gl/Wb8v7FDbQn9TYUbw5",
          tipo: "Desde",
          precio_moneda: "SOLES",
          precio_desde: 54000,
          area_desde: 120
        }
      ];
      render(fallbackData);
    });
});

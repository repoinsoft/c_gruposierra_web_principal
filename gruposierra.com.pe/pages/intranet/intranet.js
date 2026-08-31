/* =========================================================
   Intranet & CMS SuperAdmin — Grupo Sierra
   Conectado directamente a https://api.insoft.com.pe/sierra/web/api_web.php
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const API = 'https://api.insoft.com.pe/sierra/web/api_web.php';

  // 🛡️ Sanitización XSS
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Elementos Login
  const viewLogin     = document.getElementById('view-login');
  const formLogin     = document.getElementById('intra-form');
  const userInput     = document.getElementById('intra-user');
  const passInput     = document.getElementById('intra-pass');
  const btnLogin      = document.getElementById('btn-intra');
  const msgLogin      = document.getElementById('intra-msg');
  const btnTogglePass = document.getElementById('btn-toggle-pass');

  // Elementos Dashboard
  const viewDashboard = document.getElementById('view-dashboard');
  const userNameEl    = document.getElementById('cms-user-name');
  const btnLogout     = document.getElementById('btn-logout');
  const toastEl       = document.getElementById('cms-toast');
  const tabs          = document.querySelectorAll('.cms-tab');
  const tabContents   = document.querySelectorAll('.cms-tab-content');

  // Sliders
  const gridSliders        = document.getElementById('grid-sliders');
  const inputUploadSlider  = document.getElementById('input-upload-slider');

  // Proyectos
  const selectProjManage   = document.getElementById('select-proj-manage');
  const imgPreviewPortada  = document.getElementById('img-preview-portada');
  const inputUploadPortada = document.getElementById('input-upload-portada');
  const imgPreviewPlano    = document.getElementById('img-preview-plano');
  const planoEmptyMsg      = document.getElementById('plano-empty-msg');
  const inputUploadPlano   = document.getElementById('input-upload-plano');
  const grid360            = document.getElementById('grid-360');
  const inputUpload360     = document.getElementById('input-upload-360');
  const gridModelos        = document.getElementById('grid-modelos');
  const inputUploadModelo  = document.getElementById('input-upload-modelo');

  // Clientes Satisfechos / Testimonios
  const gridTestimonios        = document.getElementById('grid-testimonios');
  const inputUploadTestimonio  = document.getElementById('input-upload-testimonio');

  // Consultas
  const tbodyConsultas      = document.getElementById('tbody-consultas');
  const badgeConsultasCount = document.getElementById('badge-consultas-count');
  const btnRefreshConsultas = document.getElementById('btn-refresh-consultas');

  let state = {
    token: localStorage.getItem('sierra_admin_token') || '',
    user: JSON.parse(localStorage.getItem('sierra_admin_user') || 'null'),
    data: null,
    activeProjSlug: '',
    viewer360: null
  };

  // Helper para mostrar notificaciones toast
  function showToast(text, isError = false) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.style.background = isError ? '#D32F2F' : '#1B5E20';
    toastEl.hidden = false;
    setTimeout(() => { toastEl.hidden = true; }, 3500);
  }

  // Toggle mostrar contraseña
  if (btnTogglePass) {
    btnTogglePass.addEventListener('click', () => {
      const type = passInput.type === 'password' ? 'text' : 'password';
      passInput.type = type;
      btnTogglePass.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
  }

  // =========================================================
  // 1. AUTENTICACIÓN
  // =========================================================
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      msgLogin.textContent = '';
      msgLogin.className = 'intra-msg';
      btnLogin.disabled = true;

      const user = userInput.value.trim();
      const pass = passInput.value.trim();

      if (!user || !pass) {
        msgLogin.textContent = 'Ingresa usuario y contraseña.';
        msgLogin.classList.add('error');
        btnLogin.disabled = false;
        return;
      }

      try {
        const fd = new FormData();
        fd.append('action', 'admin_login');
        fd.append('user', user);
        fd.append('pass', pass);

        const res = await fetch(API, { method: 'POST', body: fd });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || 'Credenciales incorrectas');
        }

        state.token = json.token;
        state.user  = json.user;
        localStorage.setItem('sierra_admin_token', json.token);
        localStorage.setItem('sierra_admin_user', JSON.stringify(json.user));

        showToast(`¡Bienvenido ${json.user.nombre || 'Administrador'}!`);
        initDashboard();
      } catch (err) {
        msgLogin.textContent = `⚠️ ${err.message}`;
        msgLogin.classList.add('error');
      } finally {
        btnLogin.disabled = false;
      }
    });
  }

  // Cerrar Sesión
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('sierra_admin_token');
      localStorage.removeItem('sierra_admin_user');
      state.token = '';
      state.user = null;
      viewDashboard.hidden = true;
      viewLogin.hidden = false;
      userInput.value = '';
      passInput.value = '';
      showToast('Sesión cerrada correctamente');
    });
  }

  // =========================================================
  // 2. INICIALIZACIÓN DEL DASHBOARD CMS
  // =========================================================
  async function initDashboard() {
    if (!state.token) {
      viewLogin.hidden = false;
      viewDashboard.hidden = true;
      return;
    }

    viewLogin.hidden = true;
    viewDashboard.hidden = false;

    if (userNameEl && state.user) {
      userNameEl.textContent = state.user.nombre || state.user.user || 'Administrador';
    }

    await loadAllCmsData();
    loadConsultas();
  }

  // Cargar datos completos del servidor
  async function loadAllCmsData() {
    try {
      const res = await fetch(`${API}?action=list_all_content`, {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        if (res.status === 401) {
          // Token expirado
          btnLogout.click();
          return;
        }
        throw new Error(json.error || 'Error al cargar datos');
      }

      state.data = json.data;
      renderSliders(json.data.sliders || []);
      setupProjectSelector(json.data.proyectos || []);
      renderTestimonios(json.data.testimonios || []);

      if (badgeConsultasCount) {
        badgeConsultasCount.textContent = json.data.totalConsultas || '0';
      }
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // =========================================================
  // 3. GESTIÓN DE TABS
  // =========================================================
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      tabContents.forEach(c => c.classList.remove('is-active'));

      tab.classList.add('is-active');
      const targetId = tab.dataset.tab;
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add('is-active');
    });
  });

  // =========================================================
  // 4. SLIDERS (Inicio)
  // =========================================================
  function renderSliders(sliders) {
    if (!gridSliders) return;
    gridSliders.innerHTML = '';

    if (!sliders.length) {
      gridSliders.innerHTML = '<div class="cms-empty-placeholder">No hay sliders activos. Sube el primero con el botón superior.</div>';
      return;
    }

    sliders.forEach(s => {
      const item = document.createElement('div');
      item.className = 'cms-slider-item';
      item.innerHTML = `
        <img src="${s.url}" alt="${s.nombre}" class="cms-slider-img" loading="lazy">
        <div class="cms-slider-overlay">
          <span class="cms-slider-name">${s.nombre}</span>
          <button type="button" class="cms-btn-del" title="Eliminar Slider"><i class="fas fa-trash-alt"></i></button>
        </div>
      `;

      item.querySelector('.cms-btn-del').addEventListener('click', async () => {
        if (!confirm(`¿Estás seguro de eliminar el slider "${s.nombre}"?`)) return;
        try {
          const fd = new FormData();
          fd.append('action', 'delete_slider');
          fd.append('filename', s.nombre);

          const res = await fetch(API, {
            method: 'POST',
            body: fd,
            headers: { 'Authorization': `Bearer ${state.token}` }
          });
          const json = await res.json();
          if (!json.ok) throw new Error(json.error);

          showToast('Slider eliminado con éxito');
          loadAllCmsData();
        } catch (e) {
          showToast(e.message, true);
        }
      });

      gridSliders.appendChild(item);
    });
  }

  // Subir Slider
  if (inputUploadSlider) {
    inputUploadSlider.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fd = new FormData();
      fd.append('action', 'upload_slider');
      fd.append('file', file);

      try {
        showToast('Subiendo slider...');
        const res = await fetch(API, {
          method: 'POST',
          body: fd,
          headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);

        showToast('¡Slider publicado exitosamente!');
        inputUploadSlider.value = '';
        loadAllCmsData();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  // =========================================================
  // 4.1 CLIENTES SATISFECHOS (Galería / Testimonios)
  // =========================================================
  function renderTestimonios(testimonios) {
    if (!gridTestimonios) return;
    gridTestimonios.innerHTML = '';

    if (!testimonios.length) {
      gridTestimonios.innerHTML = '<div class="cms-empty-placeholder">No hay fotos de clientes aún. Sube fotos de entregas de lotes con el botón superior.</div>';
      return;
    }

    testimonios.forEach(t => {
      const item = document.createElement('div');
      item.className = 'cms-slider-item';
      item.innerHTML = `
        <img src="${t.url}" alt="${t.nombre}" class="cms-slider-img" loading="lazy">
        <div class="cms-slider-overlay">
          <span class="cms-slider-name">${t.nombre}</span>
          <button type="button" class="cms-btn-del" title="Eliminar Foto"><i class="fas fa-trash-alt"></i></button>
        </div>
      `;

      item.querySelector('.cms-btn-del').addEventListener('click', async () => {
        if (!confirm(`¿Estás seguro de eliminar la foto "${t.nombre}"?`)) return;
        try {
          const fd = new FormData();
          fd.append('action', 'delete_testimonio');
          fd.append('filename', t.nombre);

          const res = await fetch(API, {
            method: 'POST',
            body: fd,
            headers: { 'Authorization': `Bearer ${state.token}` }
          });
          const json = await res.json();
          if (!json.ok) throw new Error(json.error);

          showToast('Foto eliminada con éxito');
          loadAllCmsData();
        } catch (e) {
          showToast(e.message, true);
        }
      });

      gridTestimonios.appendChild(item);
    });
  }

  // Subir Foto de Cliente
  if (inputUploadTestimonio) {
    inputUploadTestimonio.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fd = new FormData();
      fd.append('action', 'upload_testimonio');
      fd.append('file', file);

      try {
        showToast('Subiendo foto de cliente...');
        const res = await fetch(API, {
          method: 'POST',
          body: fd,
          headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);

        showToast('¡Foto de cliente publicada con éxito!');
        inputUploadTestimonio.value = '';
        loadAllCmsData();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  // =========================================================
  // 5. GESTIÓN DE PROYECTOS
  // =========================================================
  function setupProjectSelector(projects) {
    if (!selectProjManage) return;
    selectProjManage.innerHTML = '';

    projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.slug;
      opt.textContent = p.nombre;
      selectProjManage.appendChild(opt);
    });

    if (projects.length) {
      state.activeProjSlug = projects[0].slug;
      renderProjectDetails(projects[0].slug);
    }

    selectProjManage.addEventListener('change', (e) => {
      state.activeProjSlug = e.target.value;
      renderProjectDetails(e.target.value);
    });
  }

  function renderProjectDetails(slug) {
    const proj = state.data?.proyectos?.find(p => p.slug === slug);
    if (!proj) return;

    // 1. Portada
    if (imgPreviewPortada) {
      imgPreviewPortada.src = proj.portada || '/img/imagen/hero1.webp';
    }

    // 2. Plano
    if (imgPreviewPlano && planoEmptyMsg) {
      if (proj.plano) {
        imgPreviewPlano.src = proj.plano;
        imgPreviewPlano.hidden = false;
        planoEmptyMsg.hidden = true;
      } else {
        imgPreviewPlano.hidden = true;
        planoEmptyMsg.hidden = false;
      }
    }

    // 3. Panoramas 360
    render360Grid(proj.sesenta || [], slug);

    // 4. Modelos
    renderModelosGrid(proj.modelos || [], slug);
  }

  // Render 360 Grid
  function render360Grid(sesenta, slug) {
    if (!grid360) return;
    grid360.innerHTML = '';

    if (!sesenta.length) {
      grid360.innerHTML = '<div class="cms-empty-placeholder">No hay fotos 360° en este proyecto. Sube una con el botón superior.</div>';
      return;
    }

    sesenta.forEach((img, idx) => {
      const card = document.createElement('div');
      card.className = 'cms-thumb-item';
      card.innerHTML = `
        <img src="${img.url}" alt="Vista 360 ${idx+1}" class="cms-thumb-img" loading="lazy">
        <div class="cms-thumb-overlay">
          <span class="cms-thumb-title">360 #${idx+1}</span>
          <button type="button" class="cms-btn-del" title="Eliminar 360"><i class="fas fa-trash-alt"></i></button>
        </div>
      `;

      // Clic para previsualizar en visor 360
      card.addEventListener('click', (e) => {
        if (e.target.closest('.cms-btn-del')) return;
        previewInPannellum(img.url);
      });

      // Eliminar
      card.querySelector('.cms-btn-del').addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta foto panorámica 360°?')) return;
        try {
          const fd = new FormData();
          fd.append('action', 'delete_sesenta');
          fd.append('slug', slug);
          fd.append('filename', img.nombre);

          const res = await fetch(API, {
            method: 'POST',
            body: fd,
            headers: { 'Authorization': `Bearer ${state.token}` }
          });
          const json = await res.json();
          if (!json.ok) throw new Error(json.error);

          showToast('Foto 360 eliminada');
          loadAllCmsData();
        } catch (err) {
          showToast(err.message, true);
        }
      });

      grid360.appendChild(card);
    });

    // Cargar la primera en el visor 360 interactivo
    if (sesenta.length) {
      previewInPannellum(sesenta[0].url);
    }
  }

  // Previsualizador Pannellum 360
  function previewInPannellum(url) {
    const el = document.getElementById('cms-visor360');
    if (!el || typeof pannellum === 'undefined') return;

    try {
      if (state.viewer360) {
        state.viewer360.destroy();
      }
    } catch (_) {}

    el.innerHTML = '';
    state.viewer360 = pannellum.viewer('cms-visor360', {
      type: 'equirectangular',
      panorama: url,
      autoLoad: true,
      showZoomCtrl: true,
      showFullscreenCtrl: true
    });
  }

  // Render Modelos Grid
  function renderModelosGrid(modelos, slug) {
    if (!gridModelos) return;
    gridModelos.innerHTML = '';

    if (!modelos.length) {
      gridModelos.innerHTML = '<div class="cms-empty-placeholder">No hay modelos de vivienda. Sube fotos de casas/distribución.</div>';
      return;
    }

    modelos.forEach(m => {
      const card = document.createElement('div');
      card.className = 'cms-thumb-item';
      card.innerHTML = `
        <img src="${m.url}" alt="${m.titulo}" class="cms-thumb-img" loading="lazy">
        <div class="cms-thumb-overlay">
          <span class="cms-thumb-title">${m.titulo}</span>
          <button type="button" class="cms-btn-del" title="Eliminar Modelo"><i class="fas fa-trash-alt"></i></button>
        </div>
      `;

      card.querySelector('.cms-btn-del').addEventListener('click', async () => {
        if (!confirm(`¿Eliminar modelo "${m.titulo}"?`)) return;
        try {
          const fd = new FormData();
          fd.append('action', 'delete_modelo');
          fd.append('slug', slug);
          fd.append('filename', m.nombre);

          const res = await fetch(API, {
            method: 'POST',
            body: fd,
            headers: { 'Authorization': `Bearer ${state.token}` }
          });
          const json = await res.json();
          if (!json.ok) throw new Error(json.error);

          showToast('Modelo eliminado');
          loadAllCmsData();
        } catch (err) {
          showToast(err.message, true);
        }
      });

      gridModelos.appendChild(card);
    });
  }

  // Uploaders de Proyecto
  if (inputUploadPortada) {
    inputUploadPortada.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file || !state.activeProjSlug) return;

      const fd = new FormData();
      fd.append('action', 'upload_portada');
      fd.append('slug', state.activeProjSlug);
      fd.append('file', file);

      try {
        showToast('Actualizando portada...');
        const res = await fetch(API, {
          method: 'POST',
          body: fd,
          headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);

        showToast('¡Portada actualizada exitosamente!');
        inputUploadPortada.value = '';
        loadAllCmsData();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  if (inputUploadPlano) {
    inputUploadPlano.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file || !state.activeProjSlug) return;

      const fd = new FormData();
      fd.append('action', 'upload_plano');
      fd.append('slug', state.activeProjSlug);
      fd.append('file', file);

      try {
        showToast('Subiendo plano...');
        const res = await fetch(API, {
          method: 'POST',
          body: fd,
          headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);

        showToast('¡Plano actualizado exitosamente!');
        inputUploadPlano.value = '';
        loadAllCmsData();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  if (inputUpload360) {
    inputUpload360.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file || !state.activeProjSlug) return;

      const fd = new FormData();
      fd.append('action', 'upload_sesenta');
      fd.append('slug', state.activeProjSlug);
      fd.append('file', file);

      try {
        showToast('Subiendo panorama 360°...');
        const res = await fetch(API, {
          method: 'POST',
          body: fd,
          headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);

        showToast('¡Panorama 360 publicado exitosamente!');
        inputUpload360.value = '';
        loadAllCmsData();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  if (inputUploadModelo) {
    inputUploadModelo.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file || !state.activeProjSlug) return;

      const fd = new FormData();
      fd.append('action', 'upload_modelo');
      fd.append('slug', state.activeProjSlug);
      fd.append('file', file);

      try {
        showToast('Subiendo modelo de vivienda...');
        const res = await fetch(API, {
          method: 'POST',
          body: fd,
          headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);

        showToast('¡Modelo de vivienda publicado exitosamente!');
        inputUploadModelo.value = '';
        loadAllCmsData();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  // =========================================================
  // 6. BANDEJA DE CONSULTAS WEB (Leads)
  // =========================================================
  async function loadConsultas() {
    if (!tbodyConsultas || !state.token) return;
    tbodyConsultas.innerHTML = '<tr><td colspan="6" class="text-center">Cargando consultas...</td></tr>';

    try {
      const res = await fetch(`${API}?action=list_consultas`, {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const json = await res.json();

      if (!json.ok) throw new Error(json.error);
      const items = json.data || [];

      if (!items.length) {
        tbodyConsultas.innerHTML = '<tr><td colspan="6" class="text-center">No hay consultas registradas aún.</td></tr>';
        return;
      }

      tbodyConsultas.innerHTML = '';
      items.forEach(c => {
        const cleanPhone = (c.telefono || '').replace(/\D/g, '');
        const waPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
        const waMsg = `Hola ${c.nombre || ''}, te saluda Grupo Sierra Inmobiliaria respecto a tu consulta por el proyecto ${c.proyecto || ''}. ¿Cómo podemos ayudarte?`;
        const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHTML((c.creado || '').slice(0, 16))}</td>
          <td><div class="lead-name">${escapeHTML(c.nombre || 'Anónimo')}</div></td>
          <td>
            <div class="lead-contact">
              <span><i class="fas fa-phone"></i> ${escapeHTML(c.telefono || '—')}</span>
              <span><i class="fas fa-envelope"></i> ${escapeHTML(c.email || '—')}</span>
            </div>
          </td>
          <td><span class="lead-badge">${escapeHTML(c.proyecto || 'General')}</span></td>
          <td>
            <strong>${escapeHTML(c.tema || 'Consulta')}</strong>
            <p style="margin:4px 0 0; color:#666; font-size:0.85rem;">${escapeHTML(c.mensaje || '')}</p>
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-wa-lead" title="Responder por WhatsApp">
                <i class="fab fa-whatsapp"></i> Responder
              </a>
            </div>
          </td>
        `;
        tbodyConsultas.appendChild(tr);
      });
    } catch (err) {
      tbodyConsultas.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${err.message}</td></tr>`;
    }
  }

  if (btnRefreshConsultas) {
    btnRefreshConsultas.addEventListener('click', loadConsultas);
  }

  // Auto-login si ya existe token
  if (state.token) {
    initDashboard();
  }
});


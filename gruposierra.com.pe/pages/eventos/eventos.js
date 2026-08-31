/* =========================================================
   🎟️ Eventos — Carga, conteo y modal de inscripción
   (Usa https://api.insoft.com.pe/sierra/web/api_web.php)
========================================================= */
(() => {
  const API = "https://api.insoft.com.pe/sierra/web/api_web.php";

  const grid = document.getElementById("eventos-grid");
  const empty = document.getElementById("eventos-empty");
  const overlay = document.getElementById("modal-overlay");
  if (!grid || !overlay) return;

  const modalClose = document.getElementById("modal-close");
  const form = document.getElementById("form-inscripcion");

  const lblTitle = document.getElementById("modal-title");
  const lblSubtitle = document.getElementById("modal-subtitle");
  const info = document.getElementById("form-info");

  const f_evento_id = document.getElementById("f_evento_id");
  const f_nombre = document.getElementById("f_nombre");
  const f_apellido = document.getElementById("f_apellido");
  const f_dni = document.getElementById("f_dni");
  const f_telefono = document.getElementById("f_telefono");
  const f_correo = document.getElementById("f_correo");
  const row_comp = document.getElementById("row_comprobante");
  const f_comp_file = document.getElementById("f_comprobante_file");

  let eventos = [];
  let current = null;

  async function fetchEventos() {
    try {
      const url = `${API}?action=events&_=${Date.now()}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Error");
      eventos = json.data || [];
      renderEventos(eventos);
    } catch (e) {
      empty.hidden = false;
      empty.textContent = "No se pudieron cargar los eventos.";
      console.error(e);
    }
  }

  function renderEventos(items) {
    grid.innerHTML = "";
    if (!items.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    for (const ev of items) {
      const card = document.createElement("article");
      card.className = "ev-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");

      const precio = Number(ev.precio || 0);
      const fechaFmt = formatFecha(ev.fecha_evento, ev.hora_evento);
      const soldout = Number(ev.cupos_disponibles ?? ev.cupos ?? 0) <= 0;

      card.dataset.soldout = soldout ? "1" : "0";
      card.setAttribute("aria-label", `${ev.titulo} en ${ev.lugar || "—"} el ${fechaFmt}${soldout ? " (Agotado)" : ""}`);

      card.innerHTML = `
        <div class="ev-thumbwrap">
          ${soldout ? `<div class="ev-ribbon">Agotado</div>` : ``}
          <img class="ev-thumb" loading="lazy"
               src="${ev.imagen || '/img/imagen/hero1.webp'}"
               alt="${ev.titulo}">
          <span class="ev-datechip">📅 ${fechaFmt}</span>
          <span class="ev-overlay"></span>
        </div>
        <div class="ev-body">
          <h3 class="ev-title">${ev.titulo}</h3>
          <div class="ev-meta"><i class="fas fa-map-marker-alt"></i> ${ev.lugar || ""}</div>
          <div class="ev-row">
            ${ev.es_pago
              ? `<span class="badge gold">S/ ${precio.toFixed(2)} ${ev.metodo_pago ? "· " + ev.metodo_pago : ""}</span>`
              : `<span class="badge">Gratuito</span>`}
            <span class="badge">Aforo: ${ev.aforo_maximo || ev.aforo}</span>
          </div>
          <div class="ev-actions">
            <div class="counts">👥 ${ev.inscritos} inscritos • 🪑 ${ev.cupos_disponibles ?? ev.cupos} cupos</div>
          </div>
        </div>
      `;

      card.addEventListener("click", () => { if (!soldout) openModal(ev); });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!soldout) openModal(ev);
        }
      });

      grid.appendChild(card);
    }
  }

  function openModal(ev) {
    current = ev;
    f_evento_id.value = ev.id;
    f_nombre.value = "";
    f_apellido.value = "";
    f_dni.value = "";
    f_telefono.value = "";
    f_correo.value = "";
    if (f_comp_file) f_comp_file.value = "";
    info.textContent = "";
    info.classList.remove("error");

    lblTitle.textContent = "Inscripción al evento";
    lblSubtitle.textContent = `${ev.titulo} — ${formatFecha(ev.fecha_evento, ev.hora_evento)} — ${ev.lugar || ''}`;

    row_comp.hidden = ev.es_pago ? false : true;
    overlay.hidden = false;
    f_nombre.focus();
  }

  function closeModal() {
    overlay.hidden = true;
    current = null;
  }

  modalClose.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", (e) => { if (!overlay.hidden && e.key === "Escape") closeModal(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!current) return;

    info.textContent = "";
    info.classList.remove("error");

    try {
      if (!f_nombre.value.trim()) throw new Error("Ingresa tu nombre.");
      if (current.es_pago && f_comp_file && !f_comp_file.files.length) {
        throw new Error("Debes adjuntar la foto de tu comprobante de pago.");
      }

      const fd = new FormData();
      fd.append("action", "inscribir");
      fd.append("evento_id", f_evento_id.value);
      fd.append("nombre", f_nombre.value.trim());
      fd.append("apellido", f_apellido.value.trim());
      fd.append("dni", f_dni.value.trim());
      fd.append("telefono", f_telefono.value.trim());
      fd.append("correo", f_correo.value.trim());
      if (current.es_pago && f_comp_file && f_comp_file.files.length) {
        fd.append("comprobante", f_comp_file.files[0]);
      }

      info.textContent = "Registrando inscripción...";
      const res = await fetch(`https://api.insoft.com.pe/sierra/b_sierra_eventos.php`, {
        method: "POST",
        body: fd,
        headers: { "X-API-SECRET": "sierra_insoft_key_access" }
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || json.msj || "No se pudo completar la inscripción.");
      }

      info.textContent = "✅ ¡Inscripción registrada con éxito! Te esperamos.";
      setTimeout(closeModal, 1600);
      fetchEventos();
    } catch (err) {
      info.textContent = `⚠️ ${err.message}`;
      info.classList.add("error");
    }
  });

  function formatFecha(d, t) {
    if (!d) return "";
    try {
      const parts = d.split("-");
      if (parts.length === 3) {
        const [y, m, day] = parts;
        const hm = (t || "").slice(0, 5);
        return `${day}/${m}/${y} ${hm ? hm + ' h' : ''}`.trim();
      }
      return d;
    } catch (_) {
      return d;
    }
  }

  fetchEventos();
})();

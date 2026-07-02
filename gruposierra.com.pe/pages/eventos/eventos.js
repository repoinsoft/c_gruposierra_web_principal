/* =========================================================
   🎟️ Eventos — Carga, conteo y modal de inscripción
   (usa /includes/apiMyEve.php)
========================================================= */
(() => {
  const API = "/includes/apiMyEve.php";

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
  const f_comp_url = document.getElementById("f_comprobante_url");

  let eventos = [];
  let current = null;

  async function fetchEventos() {
    try {
      const url = `${API}?action=events&_=${Date.now()}`;
      const res = await fetch(url, { credentials: "same-origin" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.detail || "Error");
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
        const fechaFmt = formatFecha(ev.fecha_hora);
        const soldout = Number(ev.cupos || 0) <= 0;
    
        // Atributos para estilos condicionales
        card.dataset.soldout = soldout ? "1" : "0";
        card.setAttribute("aria-label", `${ev.titulo} en ${ev.ubicacion || "—"} el ${fechaFmt}${soldout ? " (Agotado)" : ""}`);
    
        card.innerHTML = `
          <div class="ev-thumbwrap">
            ${soldout ? `<div class="ev-ribbon">Agotado</div>` : ``}
            <img class="ev-thumb" loading="lazy"
                 src="${ev.img || '/img/eventos/placeholder.jpg'}"
                 alt="${ev.titulo}">
            <span class="ev-datechip">📅 ${fechaFmt}</span>
            <span class="ev-overlay"></span>
          </div>
          <div class="ev-body">
            <h3 class="ev-title">${ev.titulo}</h3>
            <div class="ev-meta">${ev.ubicacion || ""}</div>
            <div class="ev-row">
              ${ev.es_pago
                ? `<span class="badge gold">S/ ${precio.toFixed(2)} ${ev.metodo_pago ? "· " + ev.metodo_pago : ""}</span>`
                : `<span class="badge">Gratuito</span>`}
              <span class="badge">Aforo: ${ev.aforo}</span>
            </div>
            <div class="ev-actions">
              <div class="counts">👥 ${ev.inscritos} inscritos • 🪑 ${ev.cupos} cupos</div>
            </div>
          </div>
        `;
    
        // Interacciones
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
    f_comp_url.value = "";
    info.textContent = "";
    info.classList.remove("error");

    lblTitle.textContent = "Inscripción al evento";
    lblSubtitle.textContent = `${ev.titulo} — ${formatFecha(ev.fecha_hora)} — ${ev.ubicacion || ''}`;

    // Campo de comprobante solo si es de pago
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
      if (current.es_pago && !f_comp_url.value.trim()) throw new Error("Debes pegar la URL del comprobante (Yape).");

      const fd = new FormData();
      fd.append("evento_id", f_evento_id.value);
      fd.append("nombre", f_nombre.value.trim());
      fd.append("apellido", f_apellido.value.trim());
      fd.append("dni", f_dni.value.trim());
      fd.append("telefono", f_telefono.value.trim());
      fd.append("correo", f_correo.value.trim());
      if (current.es_pago) fd.append("comprobante_url", f_comp_url.value.trim());

      const res = await fetch(`${API}?action=inscribir`, { method: "POST", body: fd, credentials: "same-origin" });
      const json = await res.json();
      if (!json.ok) {
        const msg =
          json.error === 'NO_SLOTS' ? 'No hay más cupos disponibles.' :
          json.error === 'EVENT_CLOSED' ? 'El evento ya no acepta inscripciones.' :
          json.error === 'PAY_PROOF_REQUIRED' ? 'Falta la URL del comprobante de pago.' :
          'No se pudo completar la inscripción.';
        throw new Error(msg);
      }

      // Actualiza contadores en la grilla
      current.inscritos = json.inscritos;
      current.cupos = json.cupos;
      renderEventos(eventos);

      info.textContent = "✅ Inscripción registrada. ¡Te esperamos!";
      setTimeout(closeModal, 1200);
    } catch (err) {
      info.textContent = `⚠️ ${err.message}`;
      info.classList.add("error");
    }
  });

  function formatFecha(dt) {
    if (!dt) return "";
    const [d,t] = dt.split(" ");
    const [y,m,day] = d.split("-");
    const hm = (t||"").slice(0,5);
    return `${day}/${m}/${y} ${hm} h`;
  }

  fetchEventos();
})();

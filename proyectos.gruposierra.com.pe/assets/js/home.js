/* ==================== Proyectos 360 + Plano — Grupo Sierra ==================== */
(() => {
  const API = "https://api.insoft.com.pe/sierra/web/api_web.php";

  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];

  const listEl    = $("#proy-list");
  const searchEl  = $("#proy-search");
  const nombreEl  = $("#proy-nombre");
  const dirEl     = $("#proy-direccion");
  const descEl    = $("#proy-descripcion");
  const thumbsEl  = $("#thumb-strip");

  const visor360   = $("#visor360");

  // Imagen grande (hero), plano y flechas del carrusel
  const heroImg    = $("#proy-hero");
  const heroBgImg  = $("#proy-hero-bg");
  const planImg    = $("#proy-plan");
  const prevBtn  = $("#proy-prev");
  const nextBtn  = $("#proy-next");

  // Nuevos elementos UI
  const estadoEl        = $("#proy-estado");
  const btnWa           = $("#btn-whatsapp");
  const btnScroll360    = $("#btn-scroll-360");
  const btnScrollPlano  = $("#btn-scroll-plano");
  const seccionPlano    = $("#seccion-plano");

  const MOCK_PROYECTOS = [
    {
      id: 5,
      nombre: "EDIFICIO LA TORRE CENTRAL",
      slug: "edificiolatorrecentral",
      direccion: "AV. LA TORRE, JULIACA",
      descripcion: "Edificio multifamiliar de departamentos, locales comerciales y cocheras con acabados de primera calidad.",
      foto: "https://api.insoft.com.pe/sierra/web/proyectos/edificiolatorrecentral/portada/portada_20260904_121819.webp",
      moneda: "DOLARES",
      tipo: "Edificio",
      desde: 18500,
      metros: 0,
      entrada: 36,
      salida: 0,
      saldo: 36,
      prioridad: 1,
      plano: "",
      img360: []
    },
    {
      id: 4,
      nombre: "RESIDENCIAL VILLA ANDINA",
      slug: "residencialvillaandina",
      direccion: "VILLA ANDINA",
      descripcion: "Hermoso proyecto residencial con amplias áreas verdes y todos los servicios básicos en una zona tranquila.",
      foto: "https://api.insoft.com.pe/sierra/web/proyectos/residencialvillaandina/portada/portada_20260904_121728.webp",
      moneda: "SOLES",
      tipo: "Desde",
      desde: 23200,
      metros: 160,
      entrada: 74,
      salida: 0,
      saldo: 74,
      prioridad: 0,
      plano: "https://api.insoft.com.pe/sierra/web/proyectos/residencialvillaandina/plano/RESIDENCIAL_VILLA_ANDINA.png",
      img360: [
        "https://api.insoft.com.pe/sierra/web/proyectos/residencialvillaandina/sesenta/1almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/residencialvillaandina/sesenta/2almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/residencialvillaandina/sesenta/3almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/residencialvillaandina/sesenta/4almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/residencialvillaandina/sesenta/5almacen360.jpg"
      ]
    },
    {
      id: 3,
      nombre: "URBANIZACIÓN MARAVILLAS II",
      slug: "urbanizacionmaravillasii",
      direccion: "MARAVILLAS",
      descripcion: "Segunda etapa del exitoso proyecto Maravillas. Lotes habilitados con pórtico de ingreso y seguridad permanente.",
      foto: "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillasii/portada/portada.webp",
      moneda: "SOLES",
      tipo: "Desde",
      desde: 27500,
      metros: 131.6,
      entrada: 49,
      salida: 0,
      saldo: 49,
      prioridad: 0,
      plano: "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillasii/plano/urbanizacion_maravillas_ii.png",
      img360: [
        "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillasii/sesenta/1almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillasii/sesenta/2almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillasii/sesenta/3almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillasii/sesenta/4almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillasii/sesenta/5almacen360.jpg"
      ]
    },
    {
      id: 2,
      nombre: "URBANIZACIÓN MARAVILLAS",
      slug: "urbanizacionmaravillas",
      direccion: "URBANIZACION MARAVILLAS",
      descripcion: "Urbanización moderna con servicios completos, pistas y veredas. Excelente oportunidad de inversión.",
      foto: "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillas/portada/portada_20260904_121706.webp",
      moneda: "SOLES",
      tipo: "Desde",
      desde: 22000,
      metros: 138,
      entrada: 40,
      salida: 0,
      saldo: 40,
      prioridad: 0,
      plano: "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillas/plano/urbanizacion_maravillas.png",
      img360: [
        "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillas/sesenta/1almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillas/sesenta/2almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillas/sesenta/3almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillas/sesenta/4almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/urbanizacionmaravillas/sesenta/5almacen360.jpg"
      ]
    },
    {
      id: 1,
      nombre: "RESIDENCIAL INDEPENDENCIA",
      slug: "residencialindependencia",
      direccion: "AV. INDEPENDENCIA",
      descripcion: "Ubicación privilegiada con vista a la cordillera. Lotes listos para construir el hogar de tus sueños.",
      foto: "https://api.insoft.com.pe/sierra/web/proyectos/residencialindependencia/portada/portada.webp",
      moneda: "SOLES",
      tipo: "Desde",
      desde: 54000,
      metros: 120,
      entrada: 67,
      salida: 0,
      saldo: 67,
      prioridad: 0,
      plano: "https://api.insoft.com.pe/sierra/web/proyectos/residencialindependencia/plano/RESIDENCIAL_INDEPENDENCIA.png",
      img360: [
        "https://api.insoft.com.pe/sierra/web/proyectos/residencialindependencia/sesenta/1almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/residencialindependencia/sesenta/2almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/residencialindependencia/sesenta/3almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/residencialindependencia/sesenta/4almacen360.jpg",
        "https://api.insoft.com.pe/sierra/web/proyectos/residencialindependencia/sesenta/5almacen360.jpg"
      ]
    }
  ];

  let proyectos = [];        // dataset completo (sin filtrar)
  let viewer360 = null;
  let escenas360 = [];
  let planoUrl = "";
  let selectedId = null;     // id del proyecto activo

  // --- Parámetros de URL (slug/id + extras) -----------------------
  const params     = new URLSearchParams(location.search);
  const wantSlug   = params.get("p") || params.get("slug") || "";
  const wantId     = parseInt(params.get("id") || "0", 10);
  const wantScene  = Math.max(0, (parseInt(params.get("scene") || "1", 10) - 1));

  function updateUrlWithSlug(slug){
    const next = new URL(location.href);
    next.searchParams.set("p", slug);
    next.searchParams.delete("id");
    next.searchParams.delete("scene");
    next.searchParams.delete("plano");
    history.replaceState(null, "", next.toString());
  }

  // --- Carga Pannellum --------------------------------------------
  const loadScriptOnce = (src,id)=>new Promise((res,rej)=>{
    if (id && document.getElementById(id)) return res();
    const s=document.createElement("script");
    s.src=src; s.id=id;
    s.onload=res; s.onerror=()=>rej(new Error("No se cargó "+src));
    document.body.appendChild(s);
  });
  const loadCssOnce = (href,id)=>{
    if (id && document.getElementById(id)) return;
    const l=document.createElement("link");
    l.rel="stylesheet"; l.href=href; l.id=id;
    document.head.appendChild(l);
  };
  async function ensurePannellum(){
    if (window.pannellum) return;
    loadCssOnce("https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css","pano-css");
    await loadScriptOnce("https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js","pano-js");
  }

  // Variables para la carga diferida (Lazy Load)
  let pending360 = null;
  let observer360 = null;

  // ===== Visor 360 =====
  async function mostrar360(url, thumbBtn){
    // Actualizar visualmente la miniatura activa de inmediato
    $$(".gs-thumb", thumbsEl).forEach(b => b.classList.remove("is-active"));
    if (thumbBtn) thumbBtn.classList.add("is-active");

    // Guardar los datos de carga de forma diferida
    pending360 = { url };

    // Si ya existe el observer, dejamos que controle la inicialización cuando entre en pantalla.
    // Si no es soportado, cargamos de inmediato.
    if (!("IntersectionObserver" in window)) {
      await boot360Real();
      return;
    }

    if (!observer360) {
      observer360 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && pending360) {
            boot360Real();
          } else if (!entry.isIntersecting && viewer360) {
            // Liberar memoria WebGL de la GPU si el visor se va de la pantalla
            try {
              viewer360.destroy();
              viewer360 = null;
              visor360.innerHTML = '<div class="gs-pano__skeleton"></div>';
            } catch (_) {}
          }
        });
      }, { rootMargin: "150px" }); // Pre-cargar 150px antes de que entre a la pantalla

      observer360.observe(visor360);
    } else if (visor360.getBoundingClientRect().top < window.innerHeight + 150) {
      // Si ya está en pantalla (o cerca), actualizamos de inmediato
      await boot360Real();
    } else {
      // Si está fuera de pantalla, dejamos el placeholder con animación
      visor360.innerHTML = '<div class="gs-pano__skeleton"></div>';
    }
  }

  async function boot360Real() {
    if (!pending360) return;
    const { url } = pending360;
    pending360 = null; // Limpiar

    visor360.innerHTML = "";
    await ensurePannellum();

    // Cache-buster para obligar al navegador a recibir la nueva cabecera CORS sin usar caché vieja
    const panoUrl = url.includes("?") ? `${url}&cors=${Date.now()}` : `${url}?cors=${Date.now()}`;

    try {
      viewer360 = pannellum.viewer("visor360", {
        type: "equirectangular",
        panorama: panoUrl,
        crossOrigin: "anonymous",
        autoLoad: true,
        showZoomCtrl: true,
        showFullscreenCtrl: true,
        keyboardZoom: true,
        mouseZoom: true,
        touchZoom: true,
        compass: true,
        hfov: 100,
        minHfov: 40,
        maxHfov: 120,
        previewTitle: "Recorrido Virtual 360°",
        previewAuthor: "GrupoSierra.pe"
      });
    } catch (err) {
      console.warn("Error inicializando visor 360 con URL remota, intentando fallback local:", err);
      try {
        viewer360 = pannellum.viewer("visor360", {
          type: "equirectangular",
          panorama: "./img/360/1almacen360.jpg",
          autoLoad: true,
          showZoomCtrl: true,
          showFullscreenCtrl: true,
          hfov: 100
        });
      } catch (e2) {
        console.error("Error definitivo en visor 360:", e2);
      }
    }
  }

  // ===== Render listado (tarjetas del carrusel) =====
  function renderLista(items){
    listEl.innerHTML = "";
    items.forEach(p=>{
      const li=document.createElement("li");
      li.className="gs-proy__item";
      li.dataset.id=p.id;
      li.dataset.slug=p.slug || "";
      if (String(p.id) === String(selectedId)) li.classList.add("is-active");
      const fallbackThumb = "./img/imagen/hero1.webp";
      const thumbSrc = p.miniatura || p.foto_card || p.portada || p.foto || fallbackThumb;
      li.innerHTML=`
        <img class="gs-proy__thumb" src="${thumbSrc}" alt="${p.nombre}" onerror="this.onerror=null; this.src='${fallbackThumb}';">
        <div>
          <h4 class="gs-proy__name">${p.nombre}</h4>
          <div class="gs-proy__chips">
            <span class="gs-chip">Lotes: ${Number(p.entrada||0)}</span>
            <span class="gs-chip gs-chip--warn">Vendidos: ${Number(p.salida||0)}</span>
            <span class="gs-chip gs-chip--ok">Quedan: ${Number(p.saldo||0)}</span>
          </div>
        </div>`;
      li.onclick = async ()=>{
        const loaded = await selectProyecto(p.id);
        if (loaded?.ok) updateUrlWithSlug(p.slug || String(p.id));
      };
      listEl.append(li);
    });
  }

  // ===== Render miniaturas =====
  function renderThumbs(){
    thumbsEl.innerHTML="";
    escenas360.forEach((u,i)=>{
      const b=document.createElement("button");
      b.type = "button";
      b.className="gs-thumb";
      b.setAttribute("aria-label", `Vista 360 ${i+1}`);
      const fallback360Thumb = `./img/360/${(i % 5) + 1}almacen360.jpg`;
      b.innerHTML = `<img src="${u}" alt="Vista 360 ${i+1}" onerror="this.onerror=null; this.src='${fallback360Thumb}';">`;
      b.onclick=()=>mostrar360(u, b);
      thumbsEl.append(b);
    });
  }

  // ===== Seleccionar proyecto (por id) =====
  async function selectProyecto(id){
    selectedId = id; // mantener activo tras filtrar

    $$(".gs-proy__item",listEl).forEach(li=>{
      li.classList.toggle("is-active", li.dataset.id==id);
    });

    try{
      let proyecto = null;
      let pUrl = "";
      let img360 = [];

      try {
        const found = proyectos.find(p => p.id == id) || MOCK_PROYECTOS.find(p => p.id == id);
        const slug = found ? (found.slug || '') : '';
        const r = await fetch(`${API}?action=project_detail&id=${id}&slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
        if (!r.ok) throw new Error("API response not ok");
        const j = await r.json();
        if(!j.ok) throw new Error(j.error);
        proyecto = j.data.proyecto || found;
        pUrl = j.data.plano_url || (found && found.plano) || "";
        img360 = (j.data.img360 || []).map(x => typeof x === 'string' ? x : x.url).filter(Boolean);
        if (!img360.length && found && found.img360 && found.img360.length) {
          img360 = found.img360;
        }
        if (j.data.portada) proyecto.portada = j.data.portada;
      } catch (apiError) {
        console.warn("No se pudo cargar el detalle del proyecto de la API, usando mock local.", apiError);
        const mock = proyectos.find(p => p.id == id) || MOCK_PROYECTOS.find(p => p.id == id);
        if (!mock) throw new Error("Proyecto no encontrado en mock");
        proyecto = mock;
        pUrl = mock.plano || "";
        img360 = (mock.img360 || []).map(x => typeof x === 'string' ? x : x.url).filter(Boolean);
      }

      planoUrl = pUrl;
      escenas360 = img360;

      nombreEl.textContent=proyecto.nombre||"Proyecto";

      // Sincronizar con el desplegable del formulario de contacto
      const pSelect = document.getElementById("contact-project");
      if (pSelect && proyecto.nombre) {
        pSelect.value = proyecto.nombre;
        // Forzar disparador de cambio para que la etiqueta flotante se mueva (si aplica)
        pSelect.dispatchEvent(new Event("change"));
      }
      
      // 📍 Añadir pin de mapa a la dirección
      if (dirEl) {
        if (proyecto.direccion) {
          dirEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${proyecto.direccion}`;
          dirEl.style.display = "inline-flex";
        } else {
          dirEl.innerHTML = "";
          dirEl.style.display = "none";
        }
      }
      
      descEl.textContent=proyecto.descripcion||"";

      // 🔹 Actualizar estado dinámico (badge)
      if (estadoEl) {
        const saldo = Number(proyecto.saldo || 0);
        if (saldo > 5) {
          estadoEl.textContent = "En Venta";
          estadoEl.className = "gs-hero__badge gs-hero__badge--venta";
          estadoEl.style.display = "inline-block";
        } else if (saldo > 0) {
          estadoEl.textContent = `Últimos ${saldo} Lotes`;
          estadoEl.className = "gs-hero__badge gs-hero__badge--ultimos";
          estadoEl.style.display = "inline-block";
        } else {
          estadoEl.textContent = "Vendido";
          estadoEl.className = "gs-hero__badge gs-hero__badge--vendido";
          estadoEl.style.display = "inline-block";
        }
      }

      // 🔹 Actualizar enlace de WhatsApp
      if (btnWa) {
        const rawMsg = `Hola Grupo Sierra, estoy interesado en obtener más información sobre el proyecto: ${proyecto.nombre || 'el proyecto'}. ¿Me podrían brindar detalles de los lotes disponibles?`;
        btnWa.href = `https://wa.me/51972535066?text=${encodeURIComponent(rawMsg)}`;
      }

      // 🔹 Actualizar imagen HERO
      if (heroImg){
        const fromList = proyectos.find(p => p.id === id);
        const heroSrc =
          proyecto.banner      ||
          proyecto.portada     ||
          proyecto.foto        ||
          (fromList && fromList.foto) ||
          "./img/imagen/hero1.webp";

        heroImg.onerror = () => {
          heroImg.onerror = null;
          heroImg.src = "./img/imagen/hero1.webp";
          if (heroBgImg) heroBgImg.src = "./img/imagen/hero1.webp";
        };
        heroImg.src = heroSrc;
        heroImg.alt = proyecto.nombre || "Proyecto Grupo Sierra";
        if (heroBgImg) {
          heroBgImg.src = heroSrc;
        }
      }

      // 🔹 Mostrar plano (solo si el proyecto tiene plano asignado)
      if (planImg && seccionPlano){
        if (planoUrl) {
          planImg.onerror = () => {
            planImg.onerror = null;
            seccionPlano.style.display = "none";
            if (btnScrollPlano) btnScrollPlano.style.display = "none";
          };
          planImg.src = planoUrl;
          planImg.alt = `Plano de ${proyecto.nombre || "proyecto"}`;
          seccionPlano.style.display = "block";
          if (btnScrollPlano) {
            btnScrollPlano.style.display = "inline-flex";
            btnScrollPlano.onclick = () => seccionPlano.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        } else {
          planImg.src = "";
          seccionPlano.style.display = "none";
          if (btnScrollPlano) btnScrollPlano.style.display = "none";
        }
      }

      // 🔹 Visor 360 (solo si el proyecto tiene escenas 360 cargadas)
      const headerPano = $(".gs-section-header--pano");
      if (visor360) {
        if (escenas360.length) {
          if (headerPano) headerPano.style.display = "block";
          visor360.style.display = "block";
          if (thumbsEl) thumbsEl.style.display = "flex";
          if (btnScroll360) {
            btnScroll360.style.display = "inline-flex";
            btnScroll360.onclick = () => visor360.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          renderThumbs();
          visor360.innerHTML = "";
          const firstThumb = thumbsEl ? thumbsEl.querySelector(".gs-thumb") : null;
          if (firstThumb) mostrar360(escenas360[0], firstThumb);
        } else {
          if (headerPano) headerPano.style.display = "none";
          visor360.style.display = "none";
          visor360.innerHTML = "";
          if (thumbsEl) {
            thumbsEl.style.display = "none";
            thumbsEl.innerHTML = "";
          }
          if (btnScroll360) btnScroll360.style.display = "none";
        }
      }

      return { ok:true, escenas: escenas360.slice(), plano: !!planoUrl, slug: proyecto.slug || "" };
    }catch(e){
      console.error("Error al cargar datos del proyecto:", e);
      return { ok:false };
    }
  }

  // ===== Búsqueda en vivo =====
  const norm = (s)=> (s||"").toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"");

  function filtrarProyectos(q){
    const n = norm(q);
    if (!n) { renderLista(proyectos); return; }
    const filtered = proyectos.filter(p=>{
      return [p.nombre, p.slug, p.direccion, p.descripcion]
        .some(v => norm(v).includes(n));
    });
    renderLista(filtered);
  }

  searchEl?.addEventListener("input", (e)=>{
    filtrarProyectos(e.target.value);
  });

  // Enter → abrir el primer resultado visible
  searchEl?.addEventListener("keydown", (e)=>{
    if (e.key === "Enter"){
      const first = listEl.querySelector(".gs-proy__item");
      if (first){
        first.click();
        e.preventDefault();
      }
    }
  });

  // Esc → limpiar búsqueda y restaurar lista completa
  searchEl?.addEventListener("keydown", (e)=>{
    if (e.key === "Escape"){
      searchEl.value = "";
      renderLista(proyectos);
    }
  });

  // ===== Carrusel con flechas =====
  function scrollStrip(direction){
    if (!listEl) return;
    const amount = listEl.clientWidth * 0.9;
    listEl.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth"
    });
  }

  prevBtn?.addEventListener("click", ()=>scrollStrip("left"));
  nextBtn?.addEventListener("click", ()=>scrollStrip("right"));

  // ===== Init =====
  (async()=>{
    try{
      try {
        const r=await fetch(`${API}?action=projects`, { cache: "no-store" });
        if (!r.ok) throw new Error("API response not ok");
        const j=await r.json();
        if(!j.ok) throw new Error(j.error);
        proyectos=j.data;
      } catch (apiError) {
        console.warn("No se pudo cargar la lista de proyectos de la API, usando mock local.", apiError);
        proyectos = MOCK_PROYECTOS;
      }

      renderLista(proyectos);

      // Rellenar dinámicamente el select de proyectos en el formulario de contacto
      const projectSelect = document.getElementById("contact-project");
      if (projectSelect) {
        projectSelect.innerHTML = '<option value="" disabled selected hidden></option>';
        proyectos.forEach(p => {
          const opt = document.createElement("option");
          opt.value = p.nombre;
          opt.textContent = p.nombre;
          projectSelect.appendChild(opt);
        });
      }

      if(proyectos.length){
        const bySlug = wantSlug && proyectos.find(x=>x.slug===wantSlug);
        const initialId = bySlug
          ? bySlug.id
          : (wantId && proyectos.some(p=>p.id===wantId)) ? wantId
          : proyectos[0].id;

        const loaded = await selectProyecto(initialId);

        if (loaded && loaded.escenas && loaded.escenas.length && loaded.escenas[wantScene]){
          const nth = thumbsEl.querySelectorAll(".gs-thumb")[wantScene];
          if (nth) mostrar360(loaded.escenas[wantScene], nth);
        }

        const current = proyectos.find(p=>p.id===initialId);
        updateUrlWithSlug((bySlug?.slug) || (current?.slug) || String(initialId));
      }
    }catch(e){
      console.error(e);
    }
  })();

  // ===== Control de Envío de Formulario a WhatsApp =====
  const contactForm = document.getElementById("gs-contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const hpVal = document.getElementById("website_hp") ? document.getElementById("website_hp").value.trim() : "";
      if (hpVal) {
        console.warn("Spam detectado por trampa honeypot");
        return;
      }

      const nameVal = document.getElementById("contact-name").value.trim();
      const emailVal = document.getElementById("contact-email").value.trim();
      const phoneVal = document.getElementById("contact-phone").value.trim();
      const projectSelect = document.getElementById("contact-project");
      const projectVal = projectSelect ? projectSelect.value : "";
      const subjectVal = document.getElementById("contact-subject").value;
      const messageVal = document.getElementById("contact-message").value.trim();

      // Enviar datos en segundo plano a la API central
      const formData = new FormData();
      formData.append("action", "submit_contact");
      formData.append("website_hp", hpVal);
      formData.append("nombre", nameVal);
      formData.append("email", emailVal);
      formData.append("telefono", phoneVal);
      formData.append("proyecto", projectVal);
      formData.append("tema", subjectVal);
      formData.append("mensaje", messageVal);

      fetch(API, {
        method: "POST",
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        console.log("Consulta registrada en BD:", data);
      })
      .catch(err => {
        console.error("Error al guardar consulta en BD:", err);
      });

      const waMessage = `*Nueva consulta desde la web — Grupo Sierra*

*Nombre:* ${nameVal}
*Correo electrónico:* ${emailVal}
*Teléfono:* ${phoneVal}
*Proyecto de interés:* ${projectVal}
*Tema de consulta:* ${subjectVal}

*Mensaje:*
${messageVal}`;

      const waNumber = "51972535066";
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

      window.open(waUrl, "_blank");
    });
  }
})();


/* =========================================================
   SLIDER AMENIDADES — CENTRADO (usando scrollLeft)
========================================================= */
  /* El slider de modelos de vivienda ahora se maneja de forma fluida y nativa mediante CSS (Acordeón Flexbox y apilado responsivo) */

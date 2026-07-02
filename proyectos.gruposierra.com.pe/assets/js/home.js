/* ==================== Proyectos 360 + Plano — Grupo Sierra ==================== */
(() => {
  const API = "/includes/apiProy.php";

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
  const heroImg  = $("#proy-hero");
  const planImg  = $("#proy-plan");
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
      id: 1,
      nombre: "Residencial Villa Andina",
      slug: "residencial-villa-andina",
      direccion: "Distrito de Villa Andina, Ancash",
      descripcion: "Hermoso proyecto residencial con amplias áreas verdes y todos los servicios básicos en una zona tranquila.",
      foto: "https://elcomercio-gestion-prod.web.arc-cdn.net/resizer/v2/B2PE7FJ625AQ3C44MDAAT27EXQ.png?auth=b88d2b97c36766369f79c3110f2d170a5f8ec9399476a9c04f81153beadcd69b&width=1200&height=713&smart=true&quality=75",
      entrada: 74,
      salida: 0,
      saldo: 74,
      plano: "https://elcomercio-gestion-prod.web.arc-cdn.net/resizer/v2/B2PE7FJ625AQ3C44MDAAT27EXQ.png?auth=b88d2b97c36766369f79c3110f2d170a5f8ec9399476a9c04f81153beadcd69b&width=1200&height=713&smart=true&quality=75",
      img360: ["/img/360/1almacen360.jpg", "/img/360/2almacen360.jpg", "/img/360/3almacen360.jpg"]
    },
    {
      id: 2,
      nombre: "Urbanización Maravillas II",
      slug: "urbanizacion-maravillas-ii",
      direccion: "Av. Las Maravillas, Huaraz",
      descripcion: "Segunda etapa del exitoso proyecto Maravillas. Lotes habilitados con pórtico de ingreso y seguridad.",
      foto: "https://elcomercio-gestion-prod.web.arc-cdn.net/resizer/v2/B2PE7FJ625AQ3C44MDAAT27EXQ.png?auth=b88d2b97c36766369f79c3110f2d170a5f8ec9399476a9c04f81153beadcd69b&width=1200&height=713&smart=true&quality=75",
      entrada: 49,
      salida: 0,
      saldo: 49,
      plano: "https://elcomercio-gestion-prod.web.arc-cdn.net/resizer/v2/B2PE7FJ625AQ3C44MDAAT27EXQ.png?auth=b88d2b97c36766369f79c3110f2d170a5f8ec9399476a9c04f81153beadcd69b&width=1200&height=713&smart=true&quality=75",
      img360: ["/img/360/4almacen360.jpg"]
    },
    {
      id: 3,
      nombre: "Urbanización Maravillas",
      slug: "urbanizacion-maravillas",
      direccion: "Huaraz, Ancash",
      descripcion: "Urbanización moderna con servicios completos, pistas y veredas. Excelente oportunidad de inversión.",
      foto: "https://elcomercio-gestion-prod.web.arc-cdn.net/resizer/v2/B2PE7FJ625AQ3C44MDAAT27EXQ.png?auth=b88d2b97c36766369f79c3110f2d170a5f8ec9399476a9c04f81153beadcd69b&width=1200&height=713&smart=true&quality=75",
      entrada: 40,
      salida: 0,
      saldo: 40,
      plano: "https://elcomercio-gestion-prod.web.arc-cdn.net/resizer/v2/B2PE7FJ625AQ3C44MDAAT27EXQ.png?auth=b88d2b97c36766369f79c3110f2d170a5f8ec9399476a9c04f81153beadcd69b&width=1200&height=713&smart=true&quality=75",
      img360: ["/img/360/5almacen360.jpg"]
    },
    {
      id: 4,
      nombre: "Residencial Independencia",
      slug: "residencial-independencia",
      direccion: "Distrito de Independencia, Huaraz",
      descripcion: "Ubicación privilegiada con vista a la cordillera. Lotes listos para construir el hogar de tus sueños.",
      foto: "https://elcomercio-gestion-prod.web.arc-cdn.net/resizer/v2/B2PE7FJ625AQ3C44MDAAT27EXQ.png?auth=b88d2b97c36766369f79c3110f2d170a5f8ec9399476a9c04f81153beadcd69b&width=1200&height=713&smart=true&quality=75",
      entrada: 87,
      salida: 0,
      saldo: 87,
      plano: "https://elcomercio-gestion-prod.web.arc-cdn.net/resizer/v2/B2PE7FJ625AQ3C44MDAAT27EXQ.png?auth=b88d2b97c36766369f79c3110f2d170a5f8ec9399476a9c04f81153beadcd69b&width=1200&height=713&smart=true&quality=75",
      img360: ["/img/360/1almacen360.jpg"]
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

    viewer360 = pannellum.viewer("visor360", {
      type: "equirectangular",
      panorama: url,
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
      previewTitle: "Proyectos",
      previewAuthor: "GrupoSierra.com.pe"
    });
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
      li.innerHTML=`
        <img class="gs-proy__thumb" src="${p.foto||'/img/proyectos/default.jpg'}" alt="${p.nombre}">
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
      b.innerHTML = `<img src="${u}" alt="Vista 360 ${i+1}">`;
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
        const r=await fetch(`${API}?action=viewer&id=${id}`);
        if (!r.ok) throw new Error("API response not ok");
        const j=await r.json();
        if(!j.ok) throw new Error(j.error);
        proyecto = j.data.proyecto;
        pUrl = j.data.plano_url || "";
        img360 = (j.data.img360 || []).filter(Boolean);
      } catch (apiError) {
        console.warn("No se pudo cargar el detalle del proyecto de la API, usando mock local.", apiError);
        const mock = proyectos.find(p => p.id == id) || MOCK_PROYECTOS.find(p => p.id == id);
        if (!mock) throw new Error("Proyecto no encontrado en mock");
        proyecto = mock;
        pUrl = mock.plano || "";
        img360 = mock.img360 || [];
      }

      planoUrl = pUrl;
      escenas360 = img360;

      nombreEl.textContent=proyecto.nombre||"Proyecto";
      
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
        btnWa.href = `https://wa.me/51974441357?text=${encodeURIComponent(rawMsg)}`;
      }

      // 🔹 Actualizar imagen HERO
      if (heroImg){
        const fromList = proyectos.find(p => p.id === id);
        const heroSrc =
          proyecto.banner      ||
          proyecto.portada     ||
          proyecto.foto        ||
          (fromList && fromList.foto) ||
          "/img/proyectos/default_hero.jpg";

        heroImg.src = heroSrc;
        heroImg.alt = proyecto.nombre || "Proyecto Grupo Sierra";
      }

      // 🔹 Mostrar plano (si existe) y configurar botón de scroll
      if (planImg && seccionPlano){
        if (planoUrl){
          planImg.src = planoUrl;
          planImg.alt = `Plano de ${proyecto.nombre || "proyecto"}`;
          seccionPlano.style.display = "block";
          if (btnScrollPlano) {
            btnScrollPlano.style.display = "inline-flex";
            btnScrollPlano.onclick = () => seccionPlano.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }else{
          planImg.src = "";
          seccionPlano.style.display = "none";
          if (btnScrollPlano) btnScrollPlano.style.display = "none";
        }
      }

      // 🔹 Configurar botón de scroll para 360
      if (btnScroll360) {
        if (escenas360.length) {
          btnScroll360.style.display = "inline-flex";
          btnScroll360.onclick = () => visor360.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          btnScroll360.style.display = "none";
        }
      }

      renderThumbs();
      visor360.innerHTML = "";

      if (escenas360.length) {
        const firstThumb = thumbsEl.querySelector(".gs-thumb");
        if (firstThumb) mostrar360(escenas360[0], firstThumb);
      }

      return { ok:true, escenas: escenas360.slice(), plano: !!planoUrl, slug: proyecto.slug || "" };
    }catch(e){
      console.error(e);
      alert("No se pudo cargar el visor");
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
        const r=await fetch(`${API}?action=projects`);
        if (!r.ok) throw new Error("API response not ok");
        const j=await r.json();
        if(!j.ok) throw new Error(j.error);
        proyectos=j.data;
      } catch (apiError) {
        console.warn("No se pudo cargar la lista de proyectos de la API, usando mock local.", apiError);
        proyectos = MOCK_PROYECTOS;
      }

      renderLista(proyectos);

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
})();


/* =========================================================
   SLIDER AMENIDADES — CENTRADO (usando scrollLeft)
========================================================= */
  /* El slider de modelos de vivienda ahora se maneja de forma fluida y nativa mediante CSS (Acordeón Flexbox y apilado responsivo) */

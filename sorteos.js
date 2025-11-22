// sorteos.js

// =========================
// Conexión a Supabase
// =========================
const supabaseUrl = 'https://mkplcvwomznyyqniiwqt.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rcGxjdndvbXpueXlxbmlpd3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjY0MzMsImV4cCI6MjA3ODcwMjQzM30.Ckauv0DBuiHoXjFeZlmwgugtuuipw3VEYCA6lWuvYWo';

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Arranque
document.addEventListener('DOMContentLoaded', () => {
  initSorteoPage().catch((err) => {
    console.error('Error inicializando sorteo:', err);
  });
});

// =========================
// 1) Leer config desde Supabase
// =========================
async function loadSorteoConfig() {
  try {
    const { data, error } = await supabase
      .from('contenido_dinamico')
      .select(`
        kicker,
        titulo,
        premio1_label,
        premio1_monto,
        premio2_label,
        premio2_monto,
        draw_end,
        slots_min,
        slots_total,
        cta_label,
        cta_url,
        legal,
        hero_image
      `)
      .eq('slug', 'sorteo')
      .eq('is_active', true)
      .limit(1); // sin order() porque no tenés created_at

    if (error) {
      console.error('Error leyendo contenido_dinamico:', error);
      return {};
    }

    if (!data || !data.length) {
      console.warn('No se encontró config activa para slug = sorteo');
      return {};
    }

    return data[0];
  } catch (err) {
    console.error('Excepción al cargar sorteo:', err);
    return {};
  }
    /* TRACKING: clic en CTA principal de sorteo */
  const cta = document.querySelector('.sorteos-wa-main');
  if (cta) {
    cta.addEventListener('click', () => {
      const payload = {
        page: 'sorteo',
        slug: 'SORTEO_001', // si más adelante cambiás de campaña, cambiás esta etiqueta
        user_agent: navigator.userAgent || null,
        referrer: document.referrer || null
      };

      // disparamos sin bloquear el click a WhatsApp
      supabase
        .from('sorteo_clicks')
        .insert(payload)
        .then(({ error }) => {
          if (error) {
            console.warn('No se pudo loguear el click de sorteo:', error.message);
          }
        });
    });
  }
}

// =========================
// 2) Aplicar config al DOM
// =========================
function applyConfigToDOM(cfg = {}) {
  // Kicker
  const kickerEl = document.querySelector('.sorteo-kicker');
  if (kickerEl && cfg.kicker) kickerEl.textContent = cfg.kicker;

  // Título H1
  const titleEl = document.getElementById('sorteo-title');
  if (titleEl && cfg.titulo) titleEl.textContent = cfg.titulo;

  // Premios
  const goldCard = document.querySelector('.prize-card--gold');
  if (goldCard) {
    const r = goldCard.querySelector('.prize-rank');
    const a = goldCard.querySelector('.prize-amount');

    if (cfg.premio1_label && r) r.textContent = cfg.premio1_label;

    if (cfg.premio1_monto != null && a) {
      const monto1 = Number(cfg.premio1_monto);
      if (!Number.isNaN(monto1)) {
        a.textContent = `$${monto1.toLocaleString('es-AR')}`;
      }
    }
  }

  const silverCard = document.querySelector('.prize-card--silver');
  if (silverCard) {
    const r = silverCard.querySelector('.prize-rank');
    const a = silverCard.querySelector('.prize-amount');

    if (cfg.premio2_label && r) r.textContent = cfg.premio2_label;

    if (cfg.premio2_monto != null && a) {
      const monto2 = Number(cfg.premio2_monto);
      if (!Number.isNaN(monto2)) {
        a.textContent = `$${monto2.toLocaleString('es-AR')}`;
      }
    }
  }

  // Imagen hero
  const heroImg = document.querySelector('.sorteo-hero__img img');
  if (heroImg && cfg.hero_image) {
    heroImg.src = cfg.hero_image;
  }

  // CTA principal a WhatsApp
  const cta = document.querySelector('.sorteos-wa-main');
  if (cta) {
    if (cfg.cta_label) cta.textContent = cfg.cta_label;
    if (cfg.cta_url) cta.href = cfg.cta_url;
  }

  // Legal
  const legalEl = document.querySelector('.sorteo-legal');
  if (legalEl && cfg.legal) {
    legalEl.textContent = cfg.legal;
  }

  // Guardar draw_end / slots en data-attributes (por si queremos inspeccionar)
  const countdownEl = document.getElementById('drawCountdown');
  if (countdownEl && cfg.draw_end) {
    countdownEl.dataset.end = cfg.draw_end;
  }

  const slotsBox = document.getElementById('slots');
  if (slotsBox) {
    if (cfg.slots_total != null) {
      slotsBox.dataset.total = String(cfg.slots_total);
    }
    if (cfg.slots_min != null) {
      slotsBox.dataset.min = String(cfg.slots_min);
    }
  }
}

// =========================
// 3) Countdown (usa cfg.draw_end o data-end)
// =========================
function setupCountdown(cfg = {}) {
  const countdownEl = document.getElementById('drawCountdown');
  if (!countdownEl) return;

  const valueEl = countdownEl.querySelector('.cd-value');
  if (!valueEl) return;

  const endStr = cfg.draw_end || countdownEl.dataset.end;
  if (!endStr) {
    valueEl.textContent = 'Próximamente';
    return;
  }

  const end = new Date(endStr);

  const updateCountdown = () => {
    if (Number.isNaN(end.getTime())) {
      valueEl.textContent = 'Próximamente';
      return;
    }

    const diff = end.getTime() - Date.now();

    if (diff <= 0) {
      valueEl.textContent = 'Cierra hoy';
      return;
    }

    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      valueEl.textContent = `${days}d ${hours}h ${minutes}m`;
    } else {
      valueEl.textContent = `${hours}h ${minutes}m`;
    }
  };

  updateCountdown();
  setInterval(updateCountdown, 60000);
}

// =========================
// 4) Barra "Últimos cupos"
// =========================
function setupSlots(cfg = {}) {
  const slotsBox = document.getElementById('slots');
  if (!slotsBox) return;

  const total =
    cfg.slots_total != null
      ? Number(cfg.slots_total)
      : Number(slotsBox.dataset.total) || 200;

  const min =
    cfg.slots_min != null
      ? Number(cfg.slots_min)
      : Number(slotsBox.dataset.min) || 150;

  const currentSpan = document.getElementById('slotsCurrent');
  const fill = document.getElementById('slotsFill');
  const fillText = document.getElementById('slotsFillText');

  let current = min;

  const renderSlots = () => {
    if (!currentSpan || !fill) return;
    currentSpan.textContent = current;
    const pct = Math.min(100, (current / total) * 100);
    fill.style.width = pct + '%';
    if (fillText) fillText.textContent = `${current} / ${total}`;
  };

  renderSlots();

  const interval = setInterval(() => {
    if (current >= total) {
      clearInterval(interval);
      return;
    }
    const step = Math.random() < 0.5 ? 1 : 2;
    current = Math.min(total, current + step);
    renderSlots();
  }, 12000);
}

// =========================
// 5) Mini feed de participantes (mock)
// =========================
function setupFeed() {
  const feedList = document.getElementById('feedList');
  if (!feedList) return;

  const personas = [
    // CABA (20)
    'Agustina · CABA',
    'Lautaro · CABA',
    'Brenda · CABA',
    'Sofía · CABA',
    'Lucas · CABA',
    'Nicolás · CABA',
    'Camila · CABA',
    'Martín · CABA',
    'Florencia · CABA',
    'Julieta · CABA',
    'Ramiro · CABA',
    'Juan · CABA',
    'Paula · CABA',
    'Diego · CABA',
    'Rocío · CABA',
    'Pablo · CABA',
    'Carla · CABA',
    'Matías · CABA',
    'Micaela · CABA',
    'Gonzalo · CABA',

    // PBA (20)
    'Valentina · PBA',
    'Franco · PBA',
    'Daniela · PBA',
    'Cristian · PBA',
    'Melina · PBA',
    'Tomás · PBA',
    'Luciana · PBA',
    'Federico · PBA',
    'Candela · PBA',
    'Rodrigo · PBA',
    'Magalí · PBA',
    'Axel · PBA',
    'Yamila · PBA',
    'Simón · PBA',
    'Agostina · PBA',
    'Kevin · PBA',
    'Oriana · PBA',
    'Bianca · PBA',
    'Enzo · PBA',
    'Ailén · PBA',

    // Santa Fe (20)
    'Bruno · Santa Fe',
    'Morena · Santa Fe',
    'Ulises · Santa Fe',
    'Milagros · Santa Fe',
    'Esteban · Santa Fe',
    'Giuliana · Santa Fe',
    'Marcos · Santa Fe',
    'Lara · Santa Fe',
    'Leonel · Santa Fe',
    'Tamara · Santa Fe',
    'Ignacio · Santa Fe',
    'Sol · Santa Fe',
    'Benjamín · Santa Fe',
    'Malena · Santa Fe',
    'Alan · Santa Fe',
    'Zoe · Santa Fe',
    'Hernán · Santa Fe',
    'Pilar · Santa Fe',
    'Maximiliano · Santa Fe',
    'Lola · Santa Fe',

    // Córdoba (20)
    'Jeremías · Córdoba',
    'Daiana · Córdoba',
    'Paloma · Córdoba',
    'Martina · Córdoba',
    'Thiago · Córdoba',
    'Catalina · Córdoba',
    'Ian · Córdoba',
    'Chiara · Córdoba',
    'Adrián · Córdoba',
    'Luján · Córdoba',
    'Brian · Córdoba',
    'Naiara · Córdoba',
    'Leandro · Córdoba',
    'Abril · Córdoba',
    'Julián · Córdoba',
    'Celeste · Córdoba',
    'Facundo · Córdoba',
    'Priscila · Córdoba',
    'Nahuel · Córdoba',
    'Angie · Córdoba',

    // Mendoza (20)
    'Tiziano · Mendoza',
    'Alma · Mendoza',
    'Joaquín · Mendoza',
    'Lucio · Mendoza',
    'Renata · Mendoza',
    'Jonatan · Mendoza',
    'Selene · Mendoza',
    'Agustín · Mendoza',
    'Kiara · Mendoza',
    'Ezequiel · Mendoza',
    'Mora · Mendoza',
    'Gastón · Mendoza',
    'Luna · Mendoza',
    'Damián · Mendoza',
    'Berenice · Mendoza',
    'Alex · Mendoza',
    'Victoria · Mendoza',
    'Federico · Mendoza',
    'Valen · Mendoza',
    'Morena · Mendoza'
  ];

  // Mezclamos una vez
  const pool = personas.slice().sort(() => Math.random() - 0.5);
  let feedIndex = 0;

  const pushEntry = () => {
    if (feedIndex >= pool.length) return;
    const who = pool[feedIndex++];
    const li = document.createElement('li');
    li.textContent = `${who} acaba de sumar chances`;
    feedList.prepend(li);

    while (feedList.children.length > 5) {
      feedList.removeChild(feedList.lastChild);
    }
  };

  pushEntry();
  setTimeout(pushEntry, 8000);
  setInterval(pushEntry, 15000);
}

// =========================
// 6) Inicialización general de la página
// =========================
async function initSorteoPage() {
  /* LOADER */
  const loader = document.getElementById('sorteoLoader');
  if (loader) {
    loader.classList.remove('is-hidden');
    setTimeout(() => {
      loader.classList.add('is-hidden');
      document.body.classList.add('sorteo-ready');
    }, 2000);
  }

  /* MENÚ HAMBURGUESA */
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

  function setMenu(open) {
    if (!mobileMenu || !toggle) return;
    mobileMenu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const isOpen = document.body.classList.contains('menu-open');
      setMenu(!isOpen);
    });

    mobileMenu.addEventListener('click', (e) => {
      if (e.target.matches('a')) setMenu(false);
    });
  }

  /* NAV INK */
  const ink = document.querySelector('.nav-ink');
  const activeLink = document.querySelector('.nav-tabs .nav-link.is-active');
  if (ink && activeLink && activeLink.parentElement) {
    const rect = activeLink.getBoundingClientRect();
    const parentRect = activeLink.parentElement.getBoundingClientRect();
    ink.style.width = rect.width + 'px';
    ink.style.transform = `translateX(${rect.left - parentRect.left}px)`;
  }

  /* LEER CONFIG DESDE SUPABASE E INYECTAR */
  const sorteoConfig = await loadSorteoConfig();
  applyConfigToDOM(sorteoConfig);

  /* INICIALIZAR COUNTDOWN, CUPOS Y FEED */
  setupCountdown(sorteoConfig);
  setupSlots(sorteoConfig);
  setupFeed();
}

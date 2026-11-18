(function () {
  "use strict";

  const CONFIG = window.SITEGEN_CONFIG || {
    brandName: "SiteGen",
    whatsappNumber: "77000000000",
    whatsappDisplay: "+7 (700) 000-00-00",
    defaultGreeting: "Здравствуйте! Хочу заказать разработку сайта в SiteGen."
  };

  const PROJECTS = Array.isArray(window.SITEGEN_PROJECTS) ? window.SITEGEN_PROJECTS : [];

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    heroMode: "landing",
    labDevice: "desktop",
    foldMode: "unfolded",
    filter: "all",
    waFormat: "Лендинг",
    waNote: "",
    modalProject: null,
    modalDevice: "desktop",
    modalFoldMode: "unfolded",
    modalVariantIdx: 0,
    modalModeIdx: 0,
    modalPageIdx: 0,
    marketCategory: "Все",
    marketQuery: "",
    marketCart: []
  };

  /* ========================================================================
     1. HELPERS
     ======================================================================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function formatRub(num) {
    return new Intl.NumberFormat("ru-RU").format(num) + " ₽";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  let toastTimer = null;
  function showToast(msg) {
    const toast = $("#toast-pill");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  /* ========================================================================
     2. HERO AURORA CANVAS (GPU-FRIENDLY APPLE KEYNOTE LIGHT FIELD)
     ======================================================================== */
  function initHeroAurora() {
    const canvas = $("#hero-aurora");
    const hero = $("#hero");
    if (!canvas || !hero) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rafId = null;
    let isVisible = true;
    let t = 0;
    let pointerX = 0.5;
    let pointerY = 0.42;
    let targetX = 0.5;
    let targetY = 0.42;

    function resize() {
      const rect = hero.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawFrame() {
      if (!isVisible) return;
      t += prefersReducedMotion ? 0 : 0.0085;
      pointerX += (targetX - pointerX) * 0.05;
      pointerY += (targetY - pointerY) * 0.05;

      ctx.clearRect(0, 0, w, h);

      // Ambient deep glows
      const cx1 = w * (0.3 + Math.sin(t * 0.9) * 0.08 + (pointerX - 0.5) * 0.12);
      const cy1 = h * (0.28 + Math.cos(t * 0.7) * 0.06 + (pointerY - 0.5) * 0.1);
      const g1 = ctx.createRadialGradient(cx1, cy1, 10, cx1, cy1, Math.max(w, h) * 0.52);
      g1.addColorStop(0, "rgba(74, 144, 255, 0.24)");
      g1.addColorStop(0.45, "rgba(116, 86, 255, 0.11)");
      g1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const cx2 = w * (0.72 + Math.cos(t * 0.8) * 0.07 - (pointerX - 0.5) * 0.08);
      const cy2 = h * (0.36 + Math.sin(t * 1.1) * 0.07);
      const g2 = ctx.createRadialGradient(cx2, cy2, 10, cx2, cy2, Math.max(w, h) * 0.45);
      g2.addColorStop(0, "rgba(182, 148, 255, 0.18)");
      g2.addColorStop(0.5, "rgba(42, 196, 175, 0.08)");
      g2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Sleek luminous keynote light curves
      ctx.save();
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const baseY = h * (0.42 + i * 0.065);
        for (let x = 0; x <= w; x += 28) {
          const norm = x / w;
          const wave =
            Math.sin(norm * 4.2 + t * (1.2 + i * 0.25) + i) * 26 +
            Math.cos(norm * 2.4 - t * 0.9) * 16;
          const y = baseY + wave;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const strokeGrad = ctx.createLinearGradient(0, 0, w, 0);
        strokeGrad.addColorStop(0, "rgba(255,255,255,0)");
        strokeGrad.addColorStop(0.5, `rgba(170, 208, 255, ${0.14 - i * 0.03})`);
        strokeGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = strokeGrad;
        ctx.stroke();
      }
      ctx.restore();

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(drawFrame);
      }
    }

    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const rect = hero.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width;
      targetY = (e.clientY - rect.top) / rect.height;
    });

    const io = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible && !rafId && !prefersReducedMotion) {
          drawFrame();
        } else if (!isVisible && rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
      { threshold: 0.02 }
    );

    resize();
    drawFrame();
    io.observe(hero);
    window.addEventListener("resize", resize);
  }

  /* ========================================================================
     3. SEGMENTED CONTROL PHYSICS THUMB
     ======================================================================== */
  function positionSegmentedThumb(control) {
    const thumb = $(".segmented-thumb", control);
    const active = $(".seg-btn.is-active", control);
    if (!thumb || !active) return;

    const x = active.offsetLeft - 4;
    thumb.style.width = `${active.offsetWidth}px`;
    thumb.style.transform = `translateX(${x}px)`;
  }

  function initSegmentedControls() {
    const controls = $$("[data-segmented]");
    controls.forEach((ctrl) => {
      positionSegmentedThumb(ctrl);
      if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(() => positionSegmentedThumb(ctrl)).observe(ctrl);
      }
    });
    window.addEventListener("load", () => controls.forEach(positionSegmentedThumb));
    window.addEventListener("resize", () => controls.forEach(positionSegmentedThumb));
  }

  /* ========================================================================
     4. HERO MULTI-DEVICE STAGE
     ======================================================================== */
  const HERO_STAGE_DATA = {
    landing: {
      url: "sitegen.studio / aura-landing",
      caption: "<strong>Лендинг:</strong> фокус на одном продукте, студийное фото и мгновенная заявка с любого экрана.",
      brand: "AURA",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      navItems: ["Обзор", "Звук", "Заказ"],
      title: "Тишина звучит иначе.",
      sub: "Беспроводные наушники · 45 ч работы",
      cards: [
        { k: "ANC Pro", v: "-48 дБ тишины" },
        { k: "Титан", v: "Вес 240 г" },
        { k: "Заказ", v: "В 2 касания" }
      ],
      cta: "Предзаказ"
    },
    "five-page": {
      url: "sitegen.studio / arctec-5pages",
      caption: "<strong>Сайт на 5 страниц:</strong> Главная, О компании, Услуги, Проекты и Контакты — стройная структура для доверия.",
      brand: "ARCTEC",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      navItems: ["Главная", "О бюро", "Услуги", "Проекты", "Контакты"],
      title: "Архитектура света и тишины.",
      sub: "5 страниц с проектами вилл и сметой",
      cards: [
        { k: "01–02", v: "Главная и О бюро" },
        { k: "03–04", v: "Услуги и Проекты" },
        { k: "05", v: "Контакты и WhatsApp" }
      ],
      cta: "Все 5 разделов"
    },
    marketplace: {
      url: "sitegen.studio / modular-market",
      caption: "<strong>Маркетплейс:</strong> умный каталог с живыми фото товаров, фильтрами категорий и удобной корзиной.",
      brand: "MODULAR",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      navItems: ["Все", "Свет", "Кресла", "Корзина (2)"],
      title: "120+ мебельных брендов.",
      sub: "Живая фильтрация товаров и быстрый заказ",
      cards: [
        { k: "Кресло Oslo", v: "48 900 ₽ · Хит" },
        { k: "Лампа Dome", v: "16 400 ₽ · В наличии" },
        { k: "Стол Travertine", v: "39 200 ₽ · Топ" }
      ],
      cta: "Открыть каталог"
    }
  };

  function renderStageScreen(mode, deviceKind) {
    const data = HERO_STAGE_DATA[mode];
    if (!data) return "";

    if (deviceKind === "foldable") {
      return `
        <div class="mini-ui mini-ui-fold">
          <div class="mini-fold-pane">
            <strong style="font-size:0.66rem; color:#9ec5ff;">${escapeHtml(data.brand)}</strong>
            <div class="mini-ui-photo" style="background-image:url('${escapeHtml(data.image)}')"></div>
            <div class="mini-ui-hero-title">${escapeHtml(data.title)}</div>
          </div>
          <div class="mini-fold-pane">
            <div class="mini-ui-cards cols-1">
              ${data.cards
                .slice(0, 2)
                .map(
                  (c) => `
                  <div class="mini-ui-card">
                    <strong>${escapeHtml(c.k)}</strong>
                    <span>${escapeHtml(c.v)}</span>
                  </div>`
                )
                .join("")}
            </div>
            <span class="mini-ui-btn">${escapeHtml(data.cta)}</span>
          </div>
        </div>
      `;
    }

    const colsClass = deviceKind === "tablet" ? "cols-2" : deviceKind === "phone" ? "cols-1" : "";
    const showHeroSplit = deviceKind === "desktop";

    return `
      <div class="mini-ui">
        <div class="mini-ui-nav">
          <strong>${escapeHtml(data.brand)}</strong>
          <div class="mini-ui-pills">
            ${data.navItems
              .slice(0, colsClass === "cols-1" ? 2 : 4)
              .map((item, idx) => `<span class="${idx === 0 ? "is-on" : ""}">${escapeHtml(item)}</span>`)
              .join("")}
          </div>
        </div>
        ${
          showHeroSplit
            ? `<div class="mini-ui-hero-split">
                <div>
                  <div class="mini-ui-hero-title">${escapeHtml(data.title)}</div>
                  <div class="mini-ui-sub">${escapeHtml(data.sub)}</div>
                  <span class="mini-ui-btn" style="margin-top:8px;">${escapeHtml(data.cta)}</span>
                </div>
                <div class="mini-ui-photo mini-ui-photo-lg" style="background-image:url('${escapeHtml(data.image)}')"></div>
              </div>`
            : `<div class="mini-ui-photo" style="background-image:url('${escapeHtml(data.image)}')"></div>
               <div>
                 <div class="mini-ui-hero-title">${escapeHtml(data.title)}</div>
               </div>`
        }
        <div class="mini-ui-cards ${colsClass}">
          ${data.cards
            .slice(0, colsClass === "cols-2" || colsClass === "cols-1" ? 2 : 3)
            .map(
              (c) => `
              <div class="mini-ui-card">
                <strong>${escapeHtml(c.k)}</strong>
                <span>${escapeHtml(c.v)}</span>
              </div>`
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function updateHeroStage(mode) {
    state.heroMode = mode;
    const data = HERO_STAGE_DATA[mode];
    if (!data) return;

    const urlEl = $("#hero-stage-url");
    const capEl = $("#hero-stage-caption");
    const desktop = $("#stage-screen-desktop");
    const tablet = $("#stage-screen-tablet");
    const foldable = $("#stage-screen-foldable");
    const phone = $("#stage-screen-phone");

    if (urlEl) urlEl.textContent = data.url;
    if (capEl) capEl.innerHTML = data.caption;
    if (desktop) desktop.innerHTML = renderStageScreen(mode, "desktop");
    if (tablet) tablet.innerHTML = renderStageScreen(mode, "tablet");
    if (foldable) foldable.innerHTML = renderStageScreen(mode, "foldable");
    if (phone) phone.innerHTML = renderStageScreen(mode, "phone");
  }

  function initHeroStage() {
    const ctrl = $('[data-segmented="hero-stage"]');
    const stage = $("#hero-devices-stage");
    updateHeroStage(state.heroMode);

    if (ctrl) {
      $$("[data-stage-mode]", ctrl).forEach((btn) => {
        btn.addEventListener("click", () => {
          $$(".seg-btn", ctrl).forEach((b) => {
            b.classList.remove("is-active");
            b.setAttribute("aria-selected", "false");
          });
          btn.classList.add("is-active");
          btn.setAttribute("aria-selected", "true");
          positionSegmentedThumb(ctrl);
          updateHeroStage(btn.dataset.stageMode);
        });
      });
    }

    // Subtle scroll depth for hero stage on desktop
    if (stage && !prefersReducedMotion) {
      let ticking = false;
      window.addEventListener(
        "scroll",
        () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            const p = Math.min(1, Math.max(0, window.scrollY / 560));
            stage.style.setProperty("--scroll-p", p.toFixed(3));
            ticking = false;
          });
        },
        { passive: true }
      );
    }
  }

  /* ========================================================================
     5. MULTI-DEVICE LAB (ПК / ПЛАНШЕТ / РАСКЛАДНОЙ / ТЕЛЕФОН)
     ======================================================================== */
  const DEVICE_LAB_SPECS = {
    desktop: {
      badge: "Desktop · 1280px–2560px+",
      title: "ПК и широкоформатные мониторы",
      desc: "Воздушная 12-колоночная композиция, точная типографика и деликатное отражение света под курсором.",
      frameClass: "is-desktop",
      colsClass: "",
      dualPane: false,
      specs: [
        { k: "Навигация и фокус", v: "Плавающая стеклянная шапка и быстрый обзор всех секций без лишнего скролла." },
        { k: "Микроанимации", v: "3D-глубина, плавный скролл и подсветка карточек под движением мыши." },
        { k: "Результат для клиента", v: "Ощущение дорогого технологичного бренда с первых 2 секунд." }
      ]
    },
    tablet: {
      badge: "Tablet · 768px–1180px",
      title: "Планшеты (iPad & Galaxy Tab)",
      desc: "Сбалансированная 2-колоночная сетка для горизонтального и вертикального хвата с крупными зонами касания.",
      frameClass: "is-tablet",
      colsClass: "cols-2",
      dualPane: false,
      specs: [
        { k: "Тач-эргономика", v: "Все кнопки минимум 44×44 px — удобно нажимать пальцем или стилусом." },
        { k: "Адаптация пропорций", v: "Карточки не сжимаются и не растягиваются в пустые полосы." },
        { k: "Результат для клиента", v: "Идеально для презентаций бизнеса и заказов с дивана." }
      ]
    },
    foldable_unfolded: {
      badge: "Foldable Inner · Dual-Screen / Hinge Aware",
      title: "Раскладной телефон (раскрыт)",
      desc: "На квадратном внутреннем экране сайт разделяется на две чистые зоны: текст и карточки никогда не попадают на линию сгиба.",
      frameClass: "is-foldable",
      colsClass: "cols-1",
      dualPane: true,
      specs: [
        { k: "Защита от сгиба (CSS Viewport Segments)", v: "Центральный шарнир остаётся свободным — увеличенный зазор между колонками." },
        { k: "Двухпанельный комфорт", v: "Левая часть — фото и заголовок, правая — список форматов и кнопки действия." },
        { k: "Результат для клиента", v: "Ваш сайт выглядит продуманным даже на самых современных Fold-устройствах." }
      ]
    },
    foldable_cover: {
      badge: "Foldable Cover · 280px–344px",
      title: "Раскладной телефон (внешний узкий экран)",
      desc: "Специальная защита для узких внешних экранов Galaxy Z Fold: ни слова не обрезается и нет горизонтальной прокрутки.",
      frameClass: "is-fold-cover",
      colsClass: "cols-1",
      dualPane: false,
      specs: [
        { k: "Умная типографика clamp()", v: "Заголовки мягко уменьшаются, сохраняя читаемость на ширине от 280 px." },
        { k: "Кнопки на всю ширину", v: "Крупные пилюли-кнопки в зоне одного большого пальца." },
        { k: "Результат для клиента", v: "Удобно смотреть и писать в WhatsApp даже на ходу одной рукой." }
      ]
    },
    mobile: {
      badge: "Smartphone · 360px–440px",
      title: "Смартфоны (iOS & Android)",
      desc: "Учитываем Dynamic Island, вырезы и безопасные отступы снизу. Нижняя панель держит кнопку WhatsApp всегда под рукой.",
      frameClass: "is-mobile",
      colsClass: "cols-1",
      dualPane: false,
      specs: [
        { k: "Эргономика большого пальца", v: "Ключевые фильтры, примеры и переход в WhatsApp доступны без перехвата телефона." },
        { k: "Лёгкость 60–120 FPS", v: "Оптимизированные анимации не сажают батарею и не тормозят на мобильном интернете." },
        { k: "Результат для клиента", v: "Максимум заявок с мобильного трафика (70–85% всех посетителей)." }
      ]
    }
  };

  function renderDeviceLab() {
    const key =
      state.labDevice === "foldable"
        ? state.foldMode === "cover"
          ? "foldable_cover"
          : "foldable_unfolded"
        : state.labDevice;
    const spec = DEVICE_LAB_SPECS[key];
    if (!spec) return;

    const frame = $("#lab-frame");
    const content = $("#lab-frame-content");
    const info = $("#device-lab-info");
    const subtoggle = $("#fold-subtoggle");

    if (subtoggle) {
      subtoggle.hidden = state.labDevice !== "foldable";
    }

    if (frame) {
      frame.className = `lab-frame ${spec.frameClass}`;
    }

    if (content) {
      content.innerHTML = `
        <div class="lab-ui-shell ${spec.dualPane ? "is-dual" : ""}">
          <div class="lab-ui-pane">
            <div class="lab-ui-bar">
              <strong>SiteGen UI</strong>
              <span>${escapeHtml(spec.badge.split("·")[0].trim())}</span>
            </div>
            <div class="lab-ui-photo" style="background-image:url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80')"></div>
            <h4 class="lab-ui-title">
              ${spec.dualPane ? "Левый экран · Визуал" : "Адаптация под ваш экран"}
            </h4>
            <p class="lab-ui-text">
              ${spec.dualPane ? "Фото и заголовок слева от линии сгиба." : "Сетка, фото и отступы перестроились автоматически."}
            </p>
            <div class="lab-ui-cta">Оставить заявку в WhatsApp</div>
          </div>

          <div class="lab-ui-pane">
            ${
              spec.dualPane
                ? `<div class="lab-ui-bar"><strong>Правый экран</strong><span>Форматы</span></div>`
                : ""
            }
            <div class="lab-ui-grid ${spec.colsClass}">
              <div class="lab-ui-tile">
                <strong>Лендинг</strong>
                <span>Фокус и конверсия</span>
              </div>
              <div class="lab-ui-tile">
                <strong>5 страниц</strong>
                <span>Структура бренда</span>
              </div>
              <div class="lab-ui-tile">
                <strong>Маркетплейс</strong>
                <span>Каталог и корзина</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (info) {
      info.innerHTML = `
        <div>
          <span class="lab-info-badge">${escapeHtml(spec.badge)}</span>
          <h3 class="lab-info-title">${escapeHtml(spec.title)}</h3>
          <p class="lab-info-desc">${escapeHtml(spec.desc)}</p>
          <ul class="lab-specs-list">
            ${spec.specs
              .map(
                (s) => `
              <li>
                <strong>${escapeHtml(s.k)}</strong>
                <span>${escapeHtml(s.v)}</span>
              </li>`
              )
              .join("")}
          </ul>
        </div>
      `;
    }
  }

  function initDeviceLab() {
    const ctrl = $('[data-segmented="device-lab"]');
    const subtoggle = $("#fold-subtoggle");

    if (ctrl) {
      $$("[data-device]", ctrl).forEach((btn) => {
        btn.addEventListener("click", () => {
          $$(".seg-btn", ctrl).forEach((b) => {
            b.classList.remove("is-active");
            b.setAttribute("aria-selected", "false");
          });
          btn.classList.add("is-active");
          btn.setAttribute("aria-selected", "true");
          positionSegmentedThumb(ctrl);
          state.labDevice = btn.dataset.device;
          renderDeviceLab();
        });
      });
    }

    if (subtoggle) {
      $$("[data-fold-state]", subtoggle).forEach((btn) => {
        btn.addEventListener("click", () => {
          $$(".chip-btn", subtoggle).forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          state.foldMode = btn.dataset.foldState;
          renderDeviceLab();
        });
      });
    }

    renderDeviceLab();
  }

  /* ========================================================================
     6. PORTFOLIO CARDS + FILTERING
     ======================================================================== */
  function buildCardMiniPreview(project) {
    const pv = project.preview;
    const cover = project.coverImage || "";

    if (pv.type === "landing") {
      return `
        <div class="card-preview-window">
          <div class="cpw-top">
            <span class="cpw-brand">${escapeHtml(pv.brand)}</span>
            <span>${escapeHtml(pv.badge)}</span>
          </div>
          <div class="cpw-split">
            <div class="cpw-split-copy">
              <div class="cpw-hero-line">${escapeHtml(pv.headline)}</div>
              <div class="cpw-swatches">
                ${pv.variants
                  .map((v) => `<span class="cpw-dot" style="background:${escapeHtml(v.swatch)}" title="${escapeHtml(v.label)}"></span>`)
                  .join("")}
                <span class="cpw-price-tag">${escapeHtml(pv.variants[0].price)}</span>
              </div>
            </div>
            <div class="cpw-photo" style="background-image:url('${escapeHtml(cover)}')" role="img" aria-label="${escapeHtml(project.title)}"></div>
          </div>
        </div>
      `;
    }

    if (pv.type === "five-page") {
      return `
        <div class="card-preview-window">
          <div class="cpw-top">
            <span class="cpw-brand">${escapeHtml(pv.brand)}</span>
            <span>5 разделов</span>
          </div>
          <div class="cpw-pages-row">
            ${pv.pages
              .map(
                (pg, i) =>
                  `<span class="cpw-page-pill ${i === 0 ? "is-first" : ""}">${escapeHtml(pg.num)}. ${escapeHtml(pg.title)}</span>`
              )
              .join("")}
          </div>
          <div class="cpw-split">
            <div class="cpw-split-copy">
              <div class="cpw-hero-line">${escapeHtml(pv.pages[0].heroTitle)}</div>
            </div>
            <div class="cpw-photo" style="background-image:url('${escapeHtml(cover)}')" role="img" aria-label="${escapeHtml(project.title)}"></div>
          </div>
        </div>
      `;
    }

    // Marketplace
    return `
      <div class="card-preview-window">
        <div class="cpw-top">
          <span class="cpw-brand">${escapeHtml(pv.brand)}</span>
          <span>${escapeHtml(pv.sellersCount)}</span>
        </div>
        <div class="cpw-sub-grid">
          ${pv.products
            .slice(0, 3)
            .map(
              (prod) => `
              <div class="cpw-mini-box">
                <div class="cpw-mini-thumb" style="background-image:url('${escapeHtml(prod.image || cover)}')"></div>
                <strong>${escapeHtml(prod.name)}</strong>
                <span>${formatRub(prod.price)}</span>
              </div>`
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderPortfolio() {
    const grid = $("#portfolio-grid");
    if (!grid) return;

    const list =
      state.filter === "all"
        ? PROJECTS
        : PROJECTS.filter((p) => p.category === state.filter);

    grid.innerHTML = list
      .map((p) => {
        const th = p.theme;
        const styleVars = [
          `--card-bg:${th.bg}`,
          `--card-surface:${th.cardBg}`,
          `--card-text:${th.text}`,
          `--card-muted:${th.muted}`,
          `--card-accent:${th.accent}`,
          `--card-accent-soft:${th.accentSoft}`,
          `--card-border:${th.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`
        ].join(";");

        return `
          <article
            class="project-card spotlight-card ${th.dark ? "is-dark" : ""}"
            style="${styleVars}"
            tabindex="0"
            role="button"
            aria-label="Открыть интерактивный пример ${escapeHtml(p.title)}"
            data-project-id="${escapeHtml(p.id)}"
          >
            <div class="project-card-glow" style="background:${th.gradient}"></div>

            <div class="project-card-head">
              <div>
                <span class="project-cat-pill">${escapeHtml(p.categoryLabel)}</span>
                <h3 class="project-title">${escapeHtml(p.title)}</h3>
                <p class="project-niche">${escapeHtml(p.niche)}</p>
              </div>
              <span class="project-open-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </div>

            ${buildCardMiniPreview(p)}

            <p class="project-summary">${escapeHtml(p.summary)}</p>

            <div class="project-metrics-row">
              ${p.metrics
                .map(
                  (m) => `
                  <div>
                    <span class="pm-val">${escapeHtml(m.value)}</span>
                    <span class="pm-lbl">${escapeHtml(m.label)}</span>
                  </div>`
                )
                .join("")}
            </div>

            <span class="project-card-cta">
              <span>Открыть живой макет</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </article>
        `;
      })
      .join("");

    $$("[data-project-id]", grid).forEach((card) => {
      const openHandler = () => openPreviewModal(card.dataset.projectId);
      card.addEventListener("click", openHandler);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openHandler();
        }
      });
    });
  }

  function initPortfolio() {
    const filterCtrl = $('[data-segmented="portfolio-filter"]');
    if (filterCtrl) {
      $$("[data-filter]", filterCtrl).forEach((btn) => {
        btn.addEventListener("click", () => {
          $$(".seg-btn", filterCtrl).forEach((b) => {
            b.classList.remove("is-active");
            b.setAttribute("aria-selected", "false");
          });
          btn.classList.add("is-active");
          btn.setAttribute("aria-selected", "true");
          positionSegmentedThumb(filterCtrl);
          state.filter = btn.dataset.filter;
          renderPortfolio();
        });
      });
    }
    renderPortfolio();
  }

  /* ========================================================================
     7. INTERACTIVE QUICK-LOOK MODAL PREVIEWER
     ======================================================================== */
  let lastFocusedEl = null;

  function renderModalContent() {
    const project = state.modalProject;
    const container = $("#modal-screen-content");
    const shell = $("#modal-device-shell");
    if (!project || !container || !shell) return;

    const th = project.theme;
    shell.style.setProperty("--pv-bg", th.bg);
    shell.style.setProperty("--pv-card", th.cardBg);
    shell.style.setProperty("--pv-text", th.text);
    shell.style.setProperty("--pv-muted", th.muted);
    shell.style.setProperty("--pv-accent", th.accent);
    shell.style.setProperty("--pv-accent-soft", th.accentSoft);
    shell.style.setProperty("--pv-on-accent", th.dark && th.accent === "#e2e5ec" ? "#0c0d10" : "#ffffff");

    const pv = project.preview;

    // 1. LANDING INTERACTIVE PREVIEW
    if (pv.type === "landing") {
      const variant = pv.variants[state.modalVariantIdx] || pv.variants[0];
      const mode = pv.modes[state.modalModeIdx] || pv.modes[0];

      container.innerHTML = `
        <div class="pv-wrap">
          <div class="pv-nav">
            <span class="pv-brand">${escapeHtml(pv.brand)}</span>
            <span style="font-size:0.78rem; color:var(--pv-muted);">Интерактивный лендинг</span>
          </div>

          <div class="pv-hero-grid">
            <div>
              <span class="pv-badge">${escapeHtml(pv.badge)}</span>
              <h2 class="pv-h1">${escapeHtml(pv.headline)}</h2>
              <p class="pv-lead">${escapeHtml(pv.subhead)}</p>

              <div class="pv-swatches" style="margin-bottom:14px;">
                ${pv.variants
                  .map(
                    (v, idx) => `
                    <button type="button" class="pv-swatch-btn ${idx === state.modalVariantIdx ? "is-active" : ""}" data-pv-variant="${idx}">
                      <span class="pv-swatch-dot" style="background:${escapeHtml(v.swatch)}"></span>
                      <span>${escapeHtml(v.label)}</span>
                    </button>`
                  )
                  .join("")}
              </div>

              <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
                <button type="button" class="pv-cta-btn" id="pv-landing-cta">${escapeHtml(pv.ctaText)} · ${escapeHtml(variant.price)}</button>
                <span style="font-size:0.8rem; color:var(--pv-muted);">${escapeHtml(variant.delivery)}</span>
              </div>
            </div>

            <div class="pv-visual-stage">
              <div
                class="pv-hero-photo"
                style="background-image:url('${escapeHtml(variant.image || project.coverImage || "")}'); --orb-glow:${escapeHtml(variant.glow)};"
              >
                <span class="pv-photo-chip">${escapeHtml(mode.label)}: ${escapeHtml(mode.db)}</span>
              </div>
              <strong>${escapeHtml(variant.label)}</strong>
            </div>
          </div>

          <div>
            <div class="pv-tabs" style="margin-bottom:12px;">
              ${pv.modes
                .map(
                  (m, idx) =>
                    `<button type="button" class="pv-tab-btn ${idx === state.modalModeIdx ? "is-active" : ""}" data-pv-mode="${idx}">${escapeHtml(m.label)}</button>`
                )
                .join("")}
            </div>
            <p style="margin:0 0 14px; font-size:0.86rem; color:var(--pv-muted);">${escapeHtml(mode.desc)}</p>

            <div class="pv-cards-grid">
              ${pv.highlights
                .map(
                  (h) => `
                  <div class="pv-card">
                    <h4>${escapeHtml(h.title)}</h4>
                    <p>${escapeHtml(h.desc)}</p>
                  </div>`
                )
                .join("")}
            </div>
          </div>
        </div>
      `;

      $$("[data-pv-variant]", container).forEach((b) =>
        b.addEventListener("click", () => {
          state.modalVariantIdx = Number(b.dataset.pvVariant);
          renderModalContent();
        })
      );
      $$("[data-pv-mode]", container).forEach((b) =>
        b.addEventListener("click", () => {
          state.modalModeIdx = Number(b.dataset.pvMode);
          renderModalContent();
        })
      );
      const ctaBtn = $("#pv-landing-cta", container);
      if (ctaBtn) {
        ctaBtn.addEventListener("click", () => {
          showToast(`Демо-заявка: ${pv.brand} (${variant.label})`);
        });
      }
      return;
    }

    // 2. 5-PAGE INTERACTIVE PREVIEW
    if (pv.type === "five-page") {
      const page = pv.pages[state.modalPageIdx] || pv.pages[0];
      const pageImg = page.heroImage || project.coverImage || "";

      let bodyHtml = "";
      if (page.cards) {
        bodyHtml = `
          <div class="pv-cards-grid cols-2">
            ${page.cards
              .map(
                (c) => `
                <div class="pv-card">
                  ${
                    c.image
                      ? `<div class="pv-card-img" style="background-image:url('${escapeHtml(c.image)}')"></div>`
                      : ""
                  }
                  <span class="pv-badge" style="width:fit-content;">${escapeHtml(c.tag)}</span>
                  <h4>${escapeHtml(c.title)}</h4>
                  <p>${escapeHtml(c.meta)}</p>
                </div>`
              )
              .join("")}
          </div>`;
      } else if (page.stats) {
        bodyHtml = `
          <div class="pv-cards-grid">
            ${page.stats
              .map(
                (s) => `
                <div class="pv-card">
                  <h4 style="font-size:1.5rem;">${escapeHtml(s.num)}</h4>
                  <p>${escapeHtml(s.label)}</p>
                </div>`
              )
              .join("")}
          </div>
          <div class="pv-card" style="margin-top:10px;"><p>${escapeHtml(page.note)}</p></div>`;
      } else if (page.list) {
        bodyHtml = `
          <div class="pv-cards-grid">
            ${page.list
              .map(
                (item) => `
                <div class="pv-card">
                  <span style="font-size:0.74rem; color:var(--pv-accent); font-weight:600;">${escapeHtml(item.term)}</span>
                  <h4>${escapeHtml(item.title)}</h4>
                  <p>${escapeHtml(item.desc)}</p>
                </div>`
              )
              .join("")}
          </div>`;
      } else if (page.slots) {
        bodyHtml = `
          <div class="pv-card">
            <h4>График и формат связи</h4>
            <p style="margin-bottom:10px;">${escapeHtml(page.office)}</p>
            <div class="pv-tabs">
              ${page.slots
                .map(
                  (slot) =>
                    `<button type="button" class="pv-tab-btn js-pv-slot">${escapeHtml(slot)}</button>`
                )
                .join("")}
            </div>
          </div>`;
      }

      container.innerHTML = `
        <div class="pv-wrap">
          <div class="pv-nav">
            <div>
              <span class="pv-brand">${escapeHtml(pv.brand)}</span>
              <span style="display:block; font-size:0.72rem; color:var(--pv-muted);">${escapeHtml(pv.tagline)}</span>
            </div>
            <div class="pv-tabs" role="tablist" aria-label="Страницы сайта">
              ${pv.pages
                .map(
                  (pg, idx) => `
                  <button type="button" class="pv-tab-btn ${idx === state.modalPageIdx ? "is-active" : ""}" data-pv-page="${idx}">
                    ${escapeHtml(pg.num)}. ${escapeHtml(pg.title)}
                  </button>`
                )
                .join("")}
            </div>
          </div>

          <div class="pv-hero-grid">
            <div>
              <span class="pv-badge">Страница ${escapeHtml(page.num)} из 05 · ${escapeHtml(page.title)}</span>
              <h2 class="pv-h1">${escapeHtml(page.heroTitle)}</h2>
              <p class="pv-lead">${escapeHtml(page.heroLead)}</p>
            </div>
            <div class="pv-page-banner" style="background-image:url('${escapeHtml(pageImg)}')"></div>
          </div>

          ${bodyHtml}
        </div>
      `;

      $$("[data-pv-page]", container).forEach((b) =>
        b.addEventListener("click", () => {
          state.modalPageIdx = Number(b.dataset.pvPage);
          renderModalContent();
        })
      );
      $$(".js-pv-slot", container).forEach((b) =>
        b.addEventListener("click", () => {
          showToast(`Выбрана тема: ${b.textContent}`);
        })
      );
      return;
    }

    // 3. MARKETPLACE INTERACTIVE PREVIEW
    const filteredProducts = pv.products.filter((prod) => {
      const matchCat = state.marketCategory === "Все" || prod.category === state.marketCategory;
      const q = state.marketQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.seller.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    const cartTotal = state.marketCart.reduce((sum, item) => sum + item.price, 0);

    container.innerHTML = `
      <div class="pv-wrap">
        <div class="pv-nav">
          <div>
            <span class="pv-brand">${escapeHtml(pv.brand)}</span>
            <span style="display:block; font-size:0.72rem; color:var(--pv-muted);">${escapeHtml(pv.tagline)} · ${escapeHtml(pv.sellersCount)}</span>
          </div>
          <div class="pv-cart-pill" id="pv-cart-summary">
            Корзина: ${state.marketCart.length} · ${formatRub(cartTotal)}
          </div>
        </div>

        <div class="pv-market-bar">
          <input
            type="search"
            class="pv-search"
            id="pv-market-search"
            placeholder="Поиск по товарам и продавцам..."
            value="${escapeHtml(state.marketQuery)}"
          >
          <div class="pv-tabs">
            ${pv.categories
              .map(
                (cat) => `
                <button type="button" class="pv-tab-btn ${cat === state.marketCategory ? "is-active" : ""}" data-pv-mcat="${escapeHtml(cat)}">
                  ${escapeHtml(cat)}
                </button>`
              )
              .join("")}
          </div>
        </div>

        <div class="pv-cards-grid">
          ${
            filteredProducts.length
              ? filteredProducts
                  .map(
                    (prod) => `
                  <div class="pv-card">
                    <div
                      class="pv-product-swatch"
                      style="background-image:linear-gradient(180deg, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.62) 100%), url('${escapeHtml(prod.image || project.coverImage || "")}'); background-color:${escapeHtml(prod.swatch)};"
                    >
                      <span>${escapeHtml(prod.badge)}</span>
                      <span>★ ${escapeHtml(prod.rating)}</span>
                    </div>
                    <div>
                      <h4>${escapeHtml(prod.name)}</h4>
                      <p>Продавец: ${escapeHtml(prod.seller)}</p>
                    </div>
                    <div class="pv-price-row">
                      <span class="pv-price">${formatRub(prod.price)}</span>
                      <button type="button" class="pv-tab-btn is-active js-add-cart" data-prod-id="${escapeHtml(prod.id)}">
                        + В корзину
                      </button>
                    </div>
                  </div>`
                  )
                  .join("")
              : `<div class="pv-card"><p>По вашему запросу товары не найдены.</p></div>`
          }
        </div>
      </div>
    `;

    const searchInput = $("#pv-market-search", container);
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        state.marketQuery = e.target.value;
        const pos = e.target.selectionStart;
        renderModalContent();
        const nextInput = $("#pv-market-search", container);
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(pos, pos);
        }
      });
    }

    $$("[data-pv-mcat]", container).forEach((b) =>
      b.addEventListener("click", () => {
        state.marketCategory = b.dataset.pvMcat;
        renderModalContent();
      })
    );

    $$(".js-add-cart", container).forEach((b) =>
      b.addEventListener("click", () => {
        const prod = pv.products.find((x) => x.id === b.dataset.prodId);
        if (prod) {
          state.marketCart.push(prod);
          showToast(`Добавлено в корзину: ${prod.name}`);
          renderModalContent();
        }
      })
    );
  }

  function setModalDevice(dev) {
    state.modalDevice = dev;
    const shell = $("#modal-device-shell");
    const badge = $("#modal-shell-badge");
    const modalFoldBar = $("#modal-fold-subtoggle");

    if (modalFoldBar) {
      modalFoldBar.hidden = dev !== "foldable";
    }

    const shellClass =
      dev === "foldable"
        ? state.modalFoldMode === "cover"
          ? "is-fold-cover"
          : "is-foldable"
        : `is-${dev}`;

    const labels = {
      desktop: "Desktop",
      tablet: "Tablet 740px",
      foldable: state.modalFoldMode === "cover" ? "Fold · Внешний 320px" : "Fold · Раскрыт",
      mobile: "Phone 375px"
    };

    if (shell) {
      shell.className = `modal-device-shell ${shellClass}`;
    }
    if (badge) {
      badge.textContent = labels[dev] || "Desktop";
    }
    $$(".mdev-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.modalDev === dev);
    });
  }

  function openPreviewModal(projectId) {
    const project = PROJECTS.find((p) => p.id === projectId);
    const modal = $("#preview-modal");
    if (!project || !modal) return;

    lastFocusedEl = document.activeElement;
    state.modalProject = project;
    state.modalFoldMode = "unfolded";
    state.modalVariantIdx = 0;
    state.modalModeIdx = 0;
    state.modalPageIdx = 0;
    state.marketCategory = "Все";
    state.marketQuery = "";
    state.marketCart = [];

    const modalFoldBar = $("#modal-fold-subtoggle");
    if (modalFoldBar) {
      $$("[data-modal-fold]", modalFoldBar).forEach((b) => {
        b.classList.toggle("is-active", b.dataset.modalFold === "unfolded");
      });
    }

    const titleEl = $("#modal-project-title");
    const catEl = $("#modal-cat-badge");
    const urlEl = $("#modal-shell-url");
    if (titleEl) titleEl.textContent = project.title;
    if (catEl) catEl.textContent = project.categoryLabel;
    if (urlEl) urlEl.textContent = `preview.sitegen.studio / ${project.id}`;

    // Auto-select matching viewport frame based on user's current screen
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let autoDev = "desktop";
    if (vw <= 520) {
      autoDev = "mobile";
    } else if (vw <= 860 && Math.abs(vw - vh) < 260) {
      autoDev = "foldable";
    } else if (vw <= 1040) {
      autoDev = "tablet";
    }
    setModalDevice(autoDev);
    renderModalContent();

    modal.hidden = false;
    requestAnimationFrame(() => {
      modal.classList.add("is-open");
    });
    document.body.style.overflow = "hidden";
    const closeBtn = $("#modal-close-btn");
    if (closeBtn) closeBtn.focus();
  }

  function closePreviewModal() {
    const modal = $("#preview-modal");
    if (!modal || modal.hidden) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => {
      modal.hidden = true;
      if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
        lastFocusedEl.focus();
      }
    }, 320);
  }

  function initPreviewModal() {
    const modal = $("#preview-modal");
    const closeBtn = $("#modal-close-btn");
    const orderBtn = $("#modal-order-btn");
    const modalFoldBar = $("#modal-fold-subtoggle");

    if (closeBtn) closeBtn.addEventListener("click", closePreviewModal);

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closePreviewModal();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePreviewModal();
    });

    $$(".mdev-btn").forEach((b) =>
      b.addEventListener("click", () => setModalDevice(b.dataset.modalDev))
    );

    if (modalFoldBar) {
      $$("[data-modal-fold]", modalFoldBar).forEach((btn) => {
        btn.addEventListener("click", () => {
          $$(".chip-btn", modalFoldBar).forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          state.modalFoldMode = btn.dataset.modalFold;
          setModalDevice("foldable");
        });
      });
    }

    if (orderBtn) {
      orderBtn.addEventListener("click", () => {
        const proj = state.modalProject;
        closePreviewModal();
        if (proj) {
          const mapFmt = {
            landing: "Лендинг",
            "five-page": "Сайт на 5 страниц",
            marketplace: "Маркетплейс"
          };
          selectWaFormat(mapFmt[proj.category] || "Лендинг", `Ориентир: ${proj.title}`);
        }
        const contact = $("#contact");
        if (contact) contact.scrollIntoView({ behavior: "smooth" });
      });
    }
  }

  /* ========================================================================
     8. WHATSAPP BUILDER, COPY & FORMAT CTAS
     ======================================================================== */
  function updateWhatsAppUI() {
    const numDisplay = $("#wa-number-display");
    const previewMsg = $("#wa-preview-msg");
    const directLink = $("#wa-direct-link");

    const cleanDigits = String(CONFIG.whatsappNumber || "").replace(/\D/g, "");
    const notePart = state.waNote.trim() ? ` Ниша / ориентир: ${state.waNote.trim()}.` : "";
    const text = `Здравствуйте! Хочу заказать разработку сайта в SiteGen (формат: ${state.waFormat}).${notePart}`;

    if (numDisplay) numDisplay.textContent = CONFIG.whatsappDisplay;
    if (previewMsg) previewMsg.textContent = `«${text}»`;
    if (directLink) {
      directLink.href = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(text)}`;
    }
  }

  function selectWaFormat(fmt, noteText) {
    state.waFormat = fmt;
    $$("[data-wa-format]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.waFormat === fmt);
    });
    const nicheInput = $("#wa-niche-input");
    if (typeof noteText === "string" && nicheInput) {
      nicheInput.value = noteText;
      state.waNote = noteText;
    }
    updateWhatsAppUI();
  }

  function initWhatsAppSection() {
    $$("[data-wa-format]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectWaFormat(btn.dataset.waFormat);
      });
    });

    const nicheInput = $("#wa-niche-input");
    if (nicheInput) {
      nicheInput.addEventListener("input", (e) => {
        state.waNote = e.target.value;
        updateWhatsAppUI();
      });
    }

    $$(".js-select-format").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectWaFormat(btn.dataset.format);
        const contact = $("#contact");
        if (contact) contact.scrollIntoView({ behavior: "smooth" });
      });
    });

    const copyBtn = $("#wa-copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const val = CONFIG.whatsappDisplay;
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(val);
          } else {
            const ta = document.createElement("textarea");
            ta.value = val;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
          }
          showToast(`Номер ${val} скопирован`);
        } catch {
          showToast(`WhatsApp: ${val}`);
        }
      });
    }

    updateWhatsAppUI();
  }

  /* ========================================================================
     9. HEADER ADAPTATION, MOBILE DRAWER, REVEALS & SPOTLIGHT
     ======================================================================== */
  function initNavigationAndChrome() {
    const header = $("#site-header");
    const toggle = $("#menu-toggle");
    const drawer = $("#mobile-drawer");
    const bottomBar = $("#mobile-bottom-bar");
    const lightSections = $$(".section-light, .section-white, .section-contact");

    function closeDrawer() {
      if (!toggle || !drawer) return;
      toggle.setAttribute("aria-expanded", "false");
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
    }

    if (toggle && drawer) {
      toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        drawer.classList.toggle("is-open", !open);
        drawer.setAttribute("aria-hidden", String(open));
      });

      $$(".drawer-link", drawer).forEach((link) => {
        link.addEventListener("click", closeDrawer);
      });
    }

    const progressBar = $("#scroll-progress-bar");

    function updateScrollChrome() {
      const y = window.scrollY;
      if (progressBar) {
        const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const ratio = Math.min(1, Math.max(0, y / docH));
        progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }
      if (bottomBar) {
        bottomBar.classList.toggle("is-visible", y > 440);
      }
      if (header) {
        const probeY = 44;
        const overLight = lightSections.some((sec) => {
          const r = sec.getBoundingClientRect();
          return r.top <= probeY && r.bottom >= probeY;
        });
        header.classList.toggle("is-light-mode", overLight);
      }
    }

    window.addEventListener("scroll", updateScrollChrome, { passive: true });
    updateScrollChrome();
  }

  function initRevealsAndInteractions() {
    const items = $$(".reveal-up");
    if ("IntersectionObserver" in window && !prefersReducedMotion) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      items.forEach((el) => io.observe(el));
    } else {
      items.forEach((el) => el.classList.add("is-revealed"));
    }

    // Apple cursor glass reflection on spotlight cards
    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const card = e.target.closest(".spotlight-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });

    // Tactile iOS switches in Bento
    $$(".ios-switch").forEach((sw) => {
      sw.addEventListener("click", () => {
        const next = !sw.classList.contains("is-on");
        sw.classList.toggle("is-on", next);
        sw.setAttribute("aria-checked", String(next));
      });
    });
  }

  /* ========================================================================
     BOOTSTRAP
     ======================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    initHeroAurora();
    initSegmentedControls();
    initHeroStage();
    initDeviceLab();
    initPortfolio();
    initPreviewModal();
    initWhatsAppSection();
    initNavigationAndChrome();
    initRevealsAndInteractions();
  });
})();


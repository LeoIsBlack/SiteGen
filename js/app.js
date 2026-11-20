(function () {
  "use strict";

  const CONFIG = window.SITEGEN_CONFIG || {
    brandName: "SiteGen",
    whatsappNumber: "77761985879",
    whatsappDisplay: "+7 (776) 198-58-79",
    defaultGreeting: "Здравствуйте! Хочу заказать сайт."
  };

  const PROJECTS = Array.isArray(window.SITEGEN_PROJECTS) ? window.SITEGEN_PROJECTS : [];

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function loadAnimPrefs() {
    try {
      const raw = localStorage.getItem("sitegen_anim_prefs");
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          motion: typeof parsed.motion === "boolean" ? parsed.motion : !prefersReducedMotion,
          depth: typeof parsed.depth === "boolean" ? parsed.depth : !prefersReducedMotion,
          glow: typeof parsed.glow === "boolean" ? parsed.glow : !prefersReducedMotion
        };
      }
    } catch {
      // Ignore storage failures
    }
    const def = !prefersReducedMotion;
    return { motion: def, depth: def, glow: def };
  }

  const initialAnim = loadAnimPrefs();
  let syncHeroAurora = () => {};

  const state = {
    heroMode: "premium",
    labDevice: "desktop",
    foldMode: "cover",
    filter: "all",
    waFormat: "Лендинг",
    waNote: "",
    modalProject: null,
    modalDevice: "desktop",
    modalFoldMode: "cover",
    modalVariantIdx: 0,
    modalModeIdx: 0,
    marketCategory: "Все",
    marketQuery: "",
    marketCart: [],
    animMotion: initialAnim.motion,
    animDepth: initialAnim.depth,
    animGlow: initialAnim.glow
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

  // Чёрный или белый текст поверх цвета — по яркости фона (иначе на светлом акценте белый текст не читается)
  function readableTextOn(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return "#ffffff";
    const n = parseInt(m[1], 16);
    const lin = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
    return L > 0.4 ? "#0c0d10" : "#ffffff";
  }

  /* Переключатель «как в iOS» (для кнопок «Внешний / Раскрытый экран»).
     • ползунок перетекает между кнопками: ведущий край чуть опережает задний — он плавно «тянется»;
     • светлая копия подписей обрезается ровно по ползунку, поэтому цвет текста меняется
       не скачком, а именно там, где сейчас проходит ползунок.
     Возвращает функцию place(animate), которую вызывают после смены активной кнопки. */
  function initLiquidSegment(seg, buttonSelector) {
    if (!seg) return () => {};
    const buttons = $$(buttonSelector, seg);
    if (!buttons.length) return () => {};

    const thumb = document.createElement("span");
    thumb.className = "liq-thumb";
    thumb.setAttribute("aria-hidden", "true");

    const ink = document.createElement("span");
    ink.className = "liq-ink";
    ink.setAttribute("aria-hidden", "true");
    ink.innerHTML = buttons
      .map((b) => `<span class="chip-btn">${b.innerHTML}</span>`)
      .join("");

    seg.prepend(thumb);
    seg.append(ink);
    seg.classList.add("liq-seg");

    let lastIdx = -1;
    function place(animate) {
      const idx = buttons.findIndex((b) => b.classList.contains("is-active"));
      if (idx < 0 || !seg.offsetWidth) return; // скрыт — разместим, когда появится
      const b = buttons[idx];
      const l = b.offsetLeft;
      const r = seg.clientWidth - (b.offsetLeft + b.offsetWidth);
      const move = animate && lastIdx !== -1 && idx !== lastIdx && !prefersReducedMotion;

      seg.classList.toggle("is-to-right", move && idx > lastIdx);
      seg.classList.toggle("is-to-left", move && idx < lastIdx);
      if (!move) seg.classList.add("no-anim");
      seg.style.setProperty("--seg-l", `${l}px`);
      seg.style.setProperty("--seg-r", `${r}px`);
      if (!move) {
        void seg.offsetWidth;
        seg.classList.remove("no-anim");
      }
      lastIdx = idx;
    }

    // Пересчитываем при изменении размеров (поворот экрана, показ скрытого блока)
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => place(false)).observe(seg);
    }
    place(false);
    return place;
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
      t += state.animMotion ? 0.0085 : 0;
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

      if (state.animMotion) {
        rafId = requestAnimationFrame(drawFrame);
      } else {
        rafId = null;
      }
    }

    syncHeroAurora = () => {
      if (state.animMotion && isVisible) {
        if (!rafId) drawFrame();
      } else {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        drawFrame();
      }
    };

    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || !state.animMotion) return;
      const rect = hero.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width;
      targetY = (e.clientY - rect.top) / rect.height;
    });

    const io = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible && !rafId && state.animMotion) {
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
    window.addEventListener("resize", () => {
      resize();
      // При изменении размера canvas очищается; без анимации его нужно перерисовать вручную
      if (!state.animMotion) drawFrame();
    });
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
    // Премиум-лендинг в эстетике крупных техно-брендов: вымышленная марка часов KAIRO
    premium: {
      projectId: "kairo-watch",
      url: "sitegen.studio / kairo-meridian",
      caption:
        "<strong>Премиум-лендинг</strong> — сайт в эстетике больших брендов: крупная типографика, продукт в центре и плавные анимации. Для товара, которым хочется гордиться.",
      brand: "KAIRO",
      navItems: ["Meridian", "Коллекции", "Сервис"],
      eyebrow: "Новинка",
      title: "Meridian. Время без лишнего.",
      sub: "Сапфировое стекло, титановый корпус 40 мм и неделя хода.",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
      links: ["Подробнее", "Купить"],
      cards: [
        { k: "Сапфир", v: "Стекло без царапин" },
        { k: "40 мм", v: "Титановый корпус" },
        { k: "7 дней", v: "Запас хода" }
      ],
      cta: "Купить"
    },
    landing: {
      projectId: "skill-lab",
      url: "sitegen.studio / skill-lab",
      caption: "<strong>Лендинг</strong> — одна страница про один продукт или услугу. Быстро запускается и хорошо работает с рекламой.",
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
      projectId: "arctec-studio",
      url: "sitegen.studio / arctec-5pages",
      caption: "<strong>Сайт на 5 страниц</strong> — главная, о компании, услуги, работы и контакты. Всё, чтобы клиент вам доверился.",
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
      projectId: "modular-market",
      url: "sitegen.studio / modular-market",
      caption: "<strong>Маркетплейс</strong> — каталог с поиском, фильтрами и корзиной. Для магазина или площадки с несколькими продавцами.",
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

  /* Настоящие страницы демо-сайтов на устройствах первого экрана: страница свёрстана в реальную
     ширину устройства (как в окне примеров) и уменьшена под экран — выглядит как живой скриншот */
  const HERO_PAGE_DEVICES = {
    desktop: { cls: "is-desktop", width: 1280 },
    tablet: { cls: "is-tablet", width: 820 },
    foldable: { cls: "is-foldable", width: 760 },
    phone: { cls: "is-mobile", width: 390 }
  };

  // На телефоне «монитор» первого экрана узкий — страницу в 1280px там не прочесть, берём планшетную
  function heroPageSpec(screenEl, kind) {
    if (kind === "desktop" && screenEl.clientWidth && screenEl.clientWidth < 520) {
      return { cls: "is-tablet", width: 760, key: "desktop-narrow" };
    }
    return { ...HERO_PAGE_DEVICES[kind], key: kind };
  }

  function fitHeroPage(screenEl) {
    const page = screenEl && screenEl.querySelector(".hero-page");
    const kind = screenEl && screenEl.dataset.pageKind;
    if (!page || !kind || !screenEl.clientWidth) return;
    const spec = heroPageSpec(screenEl, kind);
    // экран пересёк границу «узкий/широкий» — перерисовываем страницу в нужной вёрстке
    if (spec.key !== screenEl.dataset.pageSpec) {
      const project = PROJECTS.find((p) => p.id === (HERO_STAGE_DATA[state.heroMode] || {}).projectId);
      if (project) renderHeroPage(screenEl, project, kind);
      return;
    }
    const scale = screenEl.clientWidth / spec.width;
    page.style.width = `${spec.width}px`;
    page.style.height = `${Math.ceil(screenEl.clientHeight / scale)}px`;
    page.style.transform = `scale(${scale})`;
  }

  function renderHeroPage(screenEl, project, kind) {
    const spec = heroPageSpec(screenEl, kind);
    screenEl.dataset.pageKind = kind;
    screenEl.dataset.pageSpec = spec.key;
    screenEl.innerHTML = `
      <div class="modal-device-shell ${spec.cls} hero-page">
        <div class="modal-fold-crease"></div>
        <div class="modal-screen-scroll"></div>
      </div>`;
    const shell = screenEl.querySelector(".hero-page");
    renderModalContent({ project, shell, container: shell.querySelector(".modal-screen-scroll") });
    // это картинка, а не интерфейс: без id-дублей, фокуса и кликов
    $$("[id]", shell).forEach((n) => n.removeAttribute("id"));
    $$("button, a, input", shell).forEach((n) => n.setAttribute("tabindex", "-1"));
    fitHeroPage(screenEl);
    if (canAnimate(shell)) {
      shell.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 480, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
    }
  }

  function updateHeroStage(mode) {
    state.heroMode = mode;
    const data = HERO_STAGE_DATA[mode];
    if (!data) return;
    const project = PROJECTS.find((p) => p.id === data.projectId);

    const urlEl = $("#hero-stage-url");
    const capEl = $("#hero-stage-caption");
    const screens = {
      desktop: $("#stage-screen-desktop"),
      tablet: $("#stage-screen-tablet"),
      foldable: $("#stage-screen-foldable"),
      phone: $("#stage-screen-phone")
    };

    if (urlEl) urlEl.textContent = data.url;
    if (capEl) {
      capEl.innerHTML = project
        ? `${data.caption} <button type="button" class="hero-stage-open" data-open-project="${escapeHtml(project.id)}">Открыть демо →</button>`
        : data.caption;
    }
    Object.keys(screens).forEach((kind) => {
      const el = screens[kind];
      if (!el) return;
      if (project) renderHeroPage(el, project, kind);
      else el.innerHTML = renderStageScreen(mode, kind);
    });
  }

  function initHeroStage() {
    const ctrl = $('[data-segmented="hero-stage"]');
    const stage = $("#hero-devices-stage");
    updateHeroStage(state.heroMode);

    // уменьшенные страницы подстраиваются под размер экранов устройств
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver((entries) => entries.forEach((e) => fitHeroPage(e.target)));
      $$(".stage-screen", stage || document).forEach((el) => ro.observe(el));
    }
    // «Открыть демо» и клик по самим устройствам открывают этот сайт в окне примеров
    const openCurrent = () => {
      const data = HERO_STAGE_DATA[state.heroMode];
      if (data && data.projectId) openPreviewModal(data.projectId);
    };
    document.addEventListener("click", (e) => {
      if (e.target.closest(".hero-stage-open")) openCurrent();
    });
    if (stage) {
      stage.style.cursor = "pointer";
      stage.addEventListener("click", openCurrent);
    }

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
    if (stage) {
      let ticking = false;
      window.addEventListener(
        "scroll",
        () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            const p = state.animMotion ? Math.min(1, Math.max(0, window.scrollY / 560)) : 0;
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
      badge: "Компьютер",
      title: "Компьютер и ноутбук",
      desc: "Просторная раскладка: всё важное видно сразу, без лишней прокрутки.",
      frameClass: "is-desktop",
      colsClass: "",
      dualPane: false,
      specs: [
        { k: "Удобная навигация", v: "Меню всегда под рукой — в любой раздел можно перейти в один клик." },
        { k: "Аккуратные эффекты", v: "Карточки мягко реагируют на курсор, но не отвлекают от содержания." },
        { k: "Что это даёт", v: "Сайт с первых секунд выглядит солидно и вызывает доверие." }
      ]
    },
    tablet: {
      badge: "Планшет",
      title: "Планшет",
      desc: "Контент в две колонки и крупные кнопки — удобно и вертикально, и горизонтально.",
      frameClass: "is-tablet",
      colsClass: "cols-2",
      dualPane: false,
      specs: [
        { k: "Крупные кнопки", v: "Легко попасть пальцем, ничего не нужно увеличивать." },
        { k: "Правильные пропорции", v: "Карточки и фото не растягиваются и не сжимаются." },
        { k: "Что это даёт", v: "Удобно показать сайт клиенту на встрече или спокойно выбрать товар дома." }
      ]
    },
    foldable_unfolded: {
      badge: "Складной · раскрыт",
      title: "Складной телефон в раскрытом виде",
      desc: "То, что было на внешнем экране, остаётся справа, а слева открывается дополнительная информация. Ничего важного не попадает на линию сгиба.",
      frameClass: "is-foldable",
      colsClass: "cols-1",
      dualPane: true,
      specs: [
        { k: "Учитываем сгиб", v: "Текст и кнопки не попадают на середину экрана." },
        { k: "Без скачков", v: "Справа — то же, что было на внешнем экране, слева — подробности. Клиент не теряет, где был." },
        { k: "Что это даёт", v: "Сайт выглядит продуманным даже на новых складных телефонах." }
      ]
    },
    foldable_cover: {
      badge: "Складной · внешний экран",
      title: "Узкий внешний экран складного телефона",
      desc: "Даже на очень узком экране текст не обрезается и страница не прокручивается вбок.",
      frameClass: "is-fold-cover",
      colsClass: "cols-1",
      dualPane: false,
      specs: [
        { k: "Читаемый текст", v: "Заголовки аккуратно уменьшаются, но остаются читаемыми." },
        { k: "Кнопки на всю ширину", v: "Удобно нажимать большим пальцем." },
        { k: "Что это даёт", v: "Можно посмотреть сайт и написать вам в WhatsApp на ходу, одной рукой." }
      ]
    },
    mobile: {
      badge: "Телефон",
      title: "Смартфон",
      desc: "Учитываем вырезы экрана и нижнюю панель жестов. Кнопка WhatsApp всегда под рукой.",
      frameClass: "is-mobile",
      colsClass: "cols-1",
      dualPane: false,
      specs: [
        { k: "Под большой палец", v: "Главные кнопки внизу экрана — не нужно тянуться." },
        { k: "Лёгкий сайт", v: "Быстро открывается даже на мобильном интернете." },
        { k: "Что это даёт", v: "Больше заявок с телефона — а именно оттуда приходит большинство посетителей." }
      ]
    }
  };

  /* ---------- Складной телефон: 3D-раскрытие книжкой + оптика iPhone Duo ----------
     Главный принцип iPhone Duo: изображение остаётся на месте, а экран раскрывается вокруг него.
     Подвижная створка — это «окно» на неподвижную плоскость картинки (плоскость правой половины):
     каждый пиксель створки проецируется лучом из глаза зрителя (та же камера, что у CSS perspective)
     обратно на эту плоскость. Поэтому контент не крутится вместе со створкой и не прыгает,
     а по мере наклона дальний от шарнира край темнеет и размывается. */
  const FOLD_DURATION = 1250; // совпадает с --fold-dur в CSS
  const FOLD_EASE = [0.62, 0, 0.22, 1]; // совпадает с --fold-ease в CSS
  const FOLD_LIFT_Z = 56; // насколько телефон «отъезжает» вглубь в середине движения, px
  const FOLD_LIFT_TILT = 7; // и насколько наклоняется назад, градусы
  const FOLD_SCREEN_BG = "#0d0f14"; // один фон для всех экранов — стык створки и плоскости невидим
  let foldRaf = null;
  let foldOpenAmount = 0; // 0 = сложен (внешний экран), 1 = полностью раскрыт
  let foldBuilt = false;
  let foldDuoRenderer = null;

  function clampVal(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function smoothstep01(x) {
    const t = clampVal(x, 0, 1);
    return t * t * (3 - 2 * t);
  }

  // Позиция элемента в вёрстке без учёта CSS-трансформаций (они учитываются отдельно)
  function layoutOffset(el) {
    let x = 0;
    let y = 0;
    let cur = el;
    while (cur) {
      x += cur.offsetLeft || 0;
      y += cur.offsetTop || 0;
      const parent = cur.offsetParent;
      if (parent) {
        x += parent.clientLeft || 0;
        y += parent.clientTop || 0;
      }
      cur = parent;
    }
    return { x, y };
  }

  // Геометрия сцены: камера CSS perspective, положение подъёма и «книжки», ширина рамок
  function measureFoldGeometry() {
    const stage = $("#fold-stage");
    const lift = $("#fold-lift");
    const rig = $("#fold-rig");
    if (!stage || !lift || !rig || !rig.offsetWidth) return null;
    const innerLeft = rig.querySelector(".fold-inner-left");
    const cover = rig.querySelector(".fold-cover");
    if (!innerLeft || !cover) return null;

    const cs = window.getComputedStyle(stage);
    const persp = parseFloat(cs.perspective);
    const origin = String(cs.perspectiveOrigin || "").split(" ").map(parseFloat);
    const stagePos = layoutOffset(stage);
    const liftPos = layoutOffset(lift);
    const rigPos = layoutOffset(rig);

    return {
      persp: persp > 0 ? persp : 2200,
      eyeX: Number.isFinite(origin[0]) ? origin[0] : stage.offsetWidth * 0.5,
      eyeY: Number.isFinite(origin[1]) ? origin[1] : stage.offsetHeight * 0.35,
      liftX: liftPos.x - stagePos.x,
      liftY: liftPos.y - stagePos.y,
      liftW: lift.offsetWidth,
      liftH: lift.offsetHeight,
      rigX: rigPos.x - liftPos.x,
      rigY: rigPos.y - liftPos.y,
      rigW: rig.offsetWidth,
      rigH: rig.offsetHeight,
      hinge: rig.offsetWidth / 2,
      bezel: innerLeft.clientTop,
      coverBezel: cover.clientTop
    };
  }

  // Поза «книжки» для доли раскрытия 0..1 — одна хореография для лаборатории и предпросмотра примеров.
  // Всё зависит от положения створки, а не от времени: при смене направления посреди движения ничего не скачет.
  function foldPoseFor(openAmt) {
    const amt = clampVal(openAmt, 0, 1);
    const liftK = Math.sin(Math.PI * amt);
    return {
      phi: 180 * (1 - amt), // угол створки: 180° — сложено, 0° — раскрыто
      liftK,
      liftZ: -FOLD_LIFT_Z * liftK,
      liftTilt: FOLD_LIFT_TILT * liftK,
      // сложенный телефон стоит по центру; к центру раскрытого он доезжает, когда створка ложится влево
      shift: 0.25 * (1 - smoothstep01((amt - 0.2) / 0.8)),
      // сложенная створка лежит на 2px ближе правой половины (без мерцания); в повороте этот сдвиг
      // смещал бы край у шарнира и открывал щель, поэтому он есть только у самого закрытия (180°…150°)
      leafZ: -2 * smoothstep01(1 - 6 * amt)
    };
  }

  function foldLiftTransform(pose) {
    return pose.liftK > 0.001
      ? `translateZ(${pose.liftZ.toFixed(2)}px) rotateX(${pose.liftTilt.toFixed(3)}deg)`
      : "";
  }

  // Точка створки (d — расстояние от шарнира, y — высота) -> точка неподвижной плоскости,
  // которую зритель видит сквозь эту точку (луч из глаза до плоскости z = 0)
  function foldRayToPlane(eye, hinge, cosPhi, sinPhi, z0, d, y) {
    const px = hinge - d * cosPhi + z0 * sinPhi;
    const pz = d * sinPhi + z0 * cosPhi;
    const k = eye.z / Math.max(eye.z - pz, 1);
    return { x: eye.x + (px - eye.x) * k, y: eye.y + (y - eye.y) * k };
  }

  // Глаз зрителя в координатах «книжки» (ось z — на зрителя) с учётом подъёма и сдвига
  function foldEyeInRig(geo, liftZ, liftTiltDeg, rigShiftX) {
    const vx = geo.eyeX - (geo.liftX + geo.liftW / 2);
    const vy = geo.eyeY - (geo.liftY + geo.liftH / 2);
    const vz = geo.persp - liftZ;
    const a = (liftTiltDeg * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    // обратное преобразование к translateZ(liftZ) rotateX(a) вокруг центра .fold-lift
    return {
      x: vx + geo.liftW / 2 - geo.rigX - rigShiftX,
      y: vy * c + vz * s + geo.liftH / 2 - geo.rigY,
      z: -vy * s + vz * c
    };
  }

  function solveCubicBezier(p1x, p1y, p2x, p2y, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const cx = 3 * p1x;
    const bx = 3 * (p2x - p1x) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * p1y;
    const by = 3 * (p2y - p1y) - cy;
    const ay = 1 - cy - by;
    let t = x;
    for (let i = 0; i < 5; i++) {
      const xEst = ((ax * t + bx) * t + cx) * t - x;
      if (Math.abs(xEst) < 1e-5) break;
      const dx = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(dx) < 1e-6) break;
      t = clampVal(t - xEst / dx, 0, 1);
    }
    return ((ay * t + by) * t + cy) * t;
  }

  function drawRoundedRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawWrappedText(ctx, text, x, y, maxW, lineH) {
    const words = String(text).split(" ");
    let line = "";
    let curY = y;
    for (let i = 0; i < words.length; i++) {
      const test = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, curY);
        line = words[i];
        curY += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, curY);
    return curY;
  }

  function getBoxInContainer(el, container) {
    let x = 0;
    let y = 0;
    let cur = el;
    while (cur && cur !== container && cur !== document.body) {
      x += cur.offsetLeft || 0;
      y += cur.offsetTop || 0;
      cur = cur.offsetParent;
    }
    return {
      x,
      y,
      w: el.offsetWidth || 0,
      h: el.offsetHeight || 0
    };
  }

  function drawPaneFromDom(canvas, faceEl, uiEl, photoImg, bgHex) {
    const cssW = (faceEl && faceEl.clientWidth) || (uiEl && uiEl.clientWidth) || 256;
    const cssH = (faceEl && faceEl.clientHeight) || (uiEl && uiEl.clientHeight) || 406;
    const texScale = 2;
    canvas.width = Math.round(cssW * texScale);
    canvas.height = Math.round(cssH * texScale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.scale(texScale, texScale);

    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, cssW, cssH);

    const root = faceEl || uiEl;
    if (!uiEl || !root || cssW < 10) {
      ctx.restore();
      return;
    }

    // 1. Status bar
    const bar = uiEl.querySelector(".fold-statusbar");
    if (bar) {
      const barCs = window.getComputedStyle(bar);
      const barBox = getBoxInContainer(bar, root);
      const spans = bar.querySelectorAll("span");
      ctx.fillStyle = barCs.color || "#9ca3af";
      ctx.font = `${barCs.fontWeight || "600"} ${barCs.fontSize || "10px"} ${barCs.fontFamily || "sans-serif"}`;
      ctx.textBaseline = "top";
      if (spans[0]) {
        ctx.textAlign = "left";
        ctx.fillText(spans[0].textContent.trim(), barBox.x, barBox.y + 1);
      }
      if (spans[1]) {
        ctx.textAlign = "right";
        ctx.fillText(spans[1].textContent.trim(), barBox.x + barBox.w, barBox.y + 1);
        ctx.textAlign = "left";
      }
    }

    // 2. Hero photo (на внешнем и правом внутреннем экранах)
    const photoEl = uiEl.querySelector(".lab-ui-photo");
    if (photoEl) {
      const pBox = getBoxInContainer(photoEl, root);
      const pCs = window.getComputedStyle(photoEl);
      const pRad = parseFloat(pCs.borderRadius) || 12;
      if (pBox.w > 2 && pBox.h > 2) {
        ctx.save();
        drawRoundedRectPath(ctx, pBox.x, pBox.y, pBox.w, pBox.h, pRad);
        ctx.clip();

        const artGrad = ctx.createLinearGradient(pBox.x, pBox.y, pBox.x + pBox.w, pBox.y + pBox.h);
        artGrad.addColorStop(0, "#1d2c48");
        artGrad.addColorStop(0.55, "#263858");
        artGrad.addColorStop(1, "#131a29");
        ctx.fillStyle = artGrad;
        ctx.fillRect(pBox.x, pBox.y, pBox.w, pBox.h);

        ctx.fillStyle = "rgba(120, 175, 255, 0.16)";
        ctx.beginPath();
        ctx.arc(pBox.x + pBox.w * 0.78, pBox.y + pBox.h * 0.3, pBox.h * 0.52, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 204, 138, 0.28)";
        ctx.fillRect(pBox.x + pBox.w * 0.1, pBox.y + pBox.h * 0.36, pBox.w * 0.8, pBox.h * 0.42);
        ctx.fillStyle = "rgba(15, 20, 32, 0.75)";
        ctx.fillRect(pBox.x + pBox.w * 0.07, pBox.y + pBox.h * 0.33, pBox.w * 0.86, pBox.h * 0.06);
        ctx.fillRect(pBox.x + pBox.w * 0.1, pBox.y + pBox.h * 0.76, pBox.w * 0.8, pBox.h * 0.24);

        if (photoImg && photoImg.complete && photoImg.naturalWidth > 0) {
          const imgRatio = photoImg.naturalWidth / photoImg.naturalHeight;
          const boxRatio = pBox.w / pBox.h;
          let sx = 0;
          let sy = 0;
          let sw = photoImg.naturalWidth;
          let sh = photoImg.naturalHeight;
          if (imgRatio > boxRatio) {
            sw = sh * boxRatio;
            sx = (photoImg.naturalWidth - sw) * 0.5;
          } else {
            sh = sw / boxRatio;
            sy = (photoImg.naturalHeight - sh) * 0.5;
          }
          ctx.drawImage(photoImg, sx, sy, sw, sh, pBox.x, pBox.y, pBox.w, pBox.h);
        }
        ctx.restore();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;
        drawRoundedRectPath(ctx, pBox.x + 0.5, pBox.y + 0.5, pBox.w - 1, pBox.h - 1, pRad);
        ctx.stroke();
      }
    }

    // 3. Heading (.lab-ui-title)
    const titleEl = uiEl.querySelector(".lab-ui-title");
    if (titleEl) {
      const tBox = getBoxInContainer(titleEl, root);
      const tCs = window.getComputedStyle(titleEl);
      const fSize = parseFloat(tCs.fontSize) || 15.36;
      const lineH = parseFloat(tCs.lineHeight) || fSize * 1.2;
      ctx.fillStyle = tCs.color || "#f5f5f7";
      ctx.font = `${tCs.fontWeight || "700"} ${tCs.fontSize} ${tCs.fontFamily}`;
      ctx.textBaseline = "top";
      drawWrappedText(ctx, titleEl.textContent.trim(), tBox.x, tBox.y + 1, tBox.w + 3, lineH);
    }

    // 4. Body text (.lab-ui-text)
    const textEl = uiEl.querySelector(".lab-ui-text");
    if (textEl) {
      const pBox = getBoxInContainer(textEl, root);
      const pCs = window.getComputedStyle(textEl);
      const fSize = parseFloat(pCs.fontSize) || 11.84;
      const lineH = parseFloat(pCs.lineHeight) || fSize * 1.38;
      ctx.fillStyle = pCs.color || "#9ca3af";
      ctx.font = `${pCs.fontWeight || "400"} ${pCs.fontSize} ${pCs.fontFamily}`;
      ctx.textBaseline = "top";
      drawWrappedText(ctx, textEl.textContent.trim(), pBox.x, pBox.y + 1, pBox.w + 3, lineH);
    }

    // 5. Tiles (.lab-ui-tile на левой внутренней половине)
    const tileEls = uiEl.querySelectorAll(".lab-ui-tile");
    if (tileEls.length > 0) {
      tileEls.forEach((tile) => {
        const box = getBoxInContainer(tile, root);
        const cs = window.getComputedStyle(tile);
        const rad = parseFloat(cs.borderRadius) || 12;
        ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
        drawRoundedRectPath(ctx, box.x, box.y, box.w, box.h, rad);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        drawRoundedRectPath(ctx, box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1, rad);
        ctx.stroke();

        const strong = tile.querySelector("strong");
        if (strong) {
          const sBox = getBoxInContainer(strong, root);
          const sCs = window.getComputedStyle(strong);
          ctx.fillStyle = sCs.color || "#f5f5f7";
          ctx.font = `${sCs.fontWeight || "700"} ${sCs.fontSize} ${sCs.fontFamily}`;
          ctx.textBaseline = "top";
          ctx.fillText(strong.textContent.trim(), sBox.x, sBox.y + 1);
        }
        const span = tile.querySelector("span");
        if (span) {
          const spBox = getBoxInContainer(span, root);
          const spCs = window.getComputedStyle(span);
          const spSize = parseFloat(spCs.fontSize) || 11.2;
          const spLineH = parseFloat(spCs.lineHeight) || spSize * 1.4;
          ctx.fillStyle = spCs.color || "#9ca3af";
          ctx.font = `${spCs.fontWeight || "400"} ${spCs.fontSize} ${spCs.fontFamily}`;
          ctx.textBaseline = "top";
          // на узком экране подпись переносится так же, как в вёрстке
          drawWrappedText(ctx, span.textContent.trim(), spBox.x, spBox.y + 1, spBox.w + 3, spLineH);
        }
      });
    }

    // 6. Bottom CTA pill (.lab-ui-cta)
    const ctaEl = uiEl.querySelector(".lab-ui-cta");
    if (ctaEl) {
      const cBox = getBoxInContainer(ctaEl, root);
      const cCs = window.getComputedStyle(ctaEl);
      ctx.fillStyle = "#ffffff";
      drawRoundedRectPath(ctx, cBox.x, cBox.y, cBox.w, cBox.h, cBox.h * 0.5);
      ctx.fill();

      ctx.fillStyle = cCs.color || "#0d0d10";
      ctx.font = `${cCs.fontWeight || "600"} ${cCs.fontSize} ${cCs.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ctaEl.textContent.trim(), cBox.x + cBox.w * 0.5, cBox.y + cBox.h * 0.5 + 0.5);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
    }

    ctx.restore();
  }

  // Единый WebGL-рендерер эффекта iPhone Duo («перспективное окно», по мотивам Dasojj/HingeLab perspectiveWindow).
  // Створка не поворачивает картинку, а показывает неподвижную плоскость изображения сквозь себя.
  function getFoldDuoRenderer() {
    if (foldDuoRenderer) return foldDuoRenderer;

    const sources = {
      cover: document.createElement("canvas"),
      right: document.createElement("canvas"),
      left: document.createElement("canvas")
    };
    let loadedImg = null;
    let texturesKey = "";

    const glCanvas = document.createElement("canvas");
    let gl = null;
    try {
      const opts = { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: true };
      gl = glCanvas.getContext("webgl", opts) || glCanvas.getContext("experimental-webgl", opts);
    } catch {
      gl = null;
    }
    let glState = null;

    function uploadTextures() {
      if (!gl || !glState) return;
      Object.keys(sources).forEach((key) => {
        const src = sources[key];
        if (!src.width || !src.height) return;
        gl.bindTexture(gl.TEXTURE_2D, glState.tex[key]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      });
    }

    function rebuildTextures() {
      const uis = {
        cover: $("#fold-cover-ui"),
        right: $("#fold-cont-ui"),
        left: $("#fold-inner-left-ui")
      };
      const drawAll = () => {
        Object.keys(uis).forEach((key) => {
          const ui = uis[key];
          const face = ui ? ui.closest(".fold-face") : null;
          drawPaneFromDom(sources[key], face, ui, loadedImg, FOLD_SCREEN_BG);
        });
        uploadTextures();
      };
      try {
        drawAll();
      } catch {
        // фото не отдало CORS-заголовки и «испачкало» холст — рисуем экраны без него
        loadedImg = null;
        drawAll();
      }

      const rig = $("#fold-rig");
      if (rig && sources.cover.width > 20) {
        rig.classList.add("is-duo-ready");
      }
    }

    if (gl) {
      const vsSource = `
        attribute vec2 a_pos;
        varying vec2 v_uv;
        void main() {
          v_uv = vec2((a_pos.x + 1.0) * 0.5, (1.0 - a_pos.y) * 0.5);
          gl_Position = vec4(a_pos, 0.0, 1.0);
        }
      `;

      // Все величины — в CSS-пикселях в системе координат .fold-rig (x вправо, y вниз, z на зрителя).
      // Плоскость z = 0 — неподвижная правая половина; там же лежит «эталонное» изображение каждого экрана.
      const fsSource = `
        precision highp float;
        varying vec2 v_uv;
        uniform sampler2D u_tex;
        uniform vec2 u_css;        // размер холста экрана
        uniform vec2 u_texSize;    // размер эталонного изображения
        uniform float u_flat;      // 1 — экран лежит в плоскости, проекция не нужна
        uniform vec3 u_eye;        // глаз зрителя
        uniform float u_hinge;     // x шарнира
        uniform vec3 u_leaf;       // cos(угол створки), sin(угол створки), сдвиг по z
        uniform vec3 u_map;        // расстояние до шарнира = x + y * px, верхний отступ экрана
        uniform vec2 u_refOrigin;  // где на плоскости лежит левый верхний угол эталона
        uniform float u_side;      // +1 — эталон справа от шарнира, -1 — слева
        uniform float u_extent;    // ширина створки для нормировки
        uniform float u_motion;    // 0..1 — насколько створка отклонена от плоскости

        vec3 sampleRef(vec2 px, float feather) {
          vec2 lo = smoothstep(vec2(-feather), vec2(feather), px);
          vec2 hi = vec2(1.0) - smoothstep(u_texSize - vec2(feather), u_texSize + vec2(feather), px);
          float coverage = lo.x * lo.y * hi.x * hi.y;
          return texture2D(u_tex, clamp(px / u_texSize, 0.0, 1.0)).rgb * coverage;
        }

        void main() {
          vec2 c = v_uv * u_css;
          if (u_flat > 0.5) {
            gl_FragColor = vec4(texture2D(u_tex, clamp(c / u_texSize, 0.0, 1.0)).rgb, 1.0);
            return;
          }

          // Точка створки в пространстве
          float d = u_map.x + u_map.y * c.x;
          vec3 P = vec3(
            u_hinge - d * u_leaf.x + u_leaf.z * u_leaf.y,
            u_map.z + c.y,
            d * u_leaf.y + u_leaf.z * u_leaf.x
          );

          // Луч из глаза через точку створки до неподвижной плоскости z = 0
          float depth = u_eye.z - P.z;
          if (depth <= 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
          }
          vec2 R = u_eye.xy + (P.xy - u_eye.xy) * (u_eye.z / depth);
          vec2 src = R - u_refOrigin;

          // Блюр и OLED-тень живут в координатах изображения и растут от шарнира к дальнему краю
          float prog = clamp(u_side * (R.x - u_hinge) / u_extent, 0.0001, 1.0);
          float radius = min(u_texSize.x, u_texSize.y) * 0.05 * u_motion * pow(prog, 1.35);
          float shade = 1.0 - min(1.0, 2.0 * u_motion * pow(clamp((prog - 0.2) / 0.8, 0.0001, 1.0), 1.35));
          float feather = max(0.75, radius * 0.3);

          vec3 acc = vec3(0.0);
          float wsum = 0.0;
          for (int y = -2; y <= 2; y++) {
            for (int x = -2; x <= 2; x++) {
              float w = exp(-0.5 * float(x * x + y * y));
              acc += sampleRef(src + vec2(float(x), float(y)) * radius * 0.5, feather) * w;
              wsum += w;
            }
          }
          gl_FragColor = vec4(acc / wsum * shade, 1.0);
        }
      `;

      const compile = (type, src) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          gl.deleteShader(sh);
          return null;
        }
        return sh;
      };

      const vs = compile(gl.VERTEX_SHADER, vsSource);
      const fs = compile(gl.FRAGMENT_SHADER, fsSource);
      if (vs && fs) {
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          const buf = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
          );
          const posLoc = gl.getAttribLocation(prog, "a_pos");
          gl.enableVertexAttribArray(posLoc);
          gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
          gl.useProgram(prog);

          const u = (name) => gl.getUniformLocation(prog, name);
          glState = {
            tex: { cover: gl.createTexture(), right: gl.createTexture(), left: gl.createTexture() },
            u_tex: u("u_tex"),
            u_css: u("u_css"),
            u_texSize: u("u_texSize"),
            u_flat: u("u_flat"),
            u_eye: u("u_eye"),
            u_hinge: u("u_hinge"),
            u_leaf: u("u_leaf"),
            u_map: u("u_map"),
            u_refOrigin: u("u_refOrigin"),
            u_side: u("u_side"),
            u_extent: u("u_extent"),
            u_motion: u("u_motion")
          };
        }
      }
    }

    // Точка створки -> точка неподвижной плоскости (та же формула, что в шейдере)
    function projectToPlane(view, cx, cy) {
      const d = view.dBase + view.dSign * cx;
      const px = view.hinge - d * view.cos + view.z0 * view.sin;
      const py = view.yBase + cy;
      const pz = d * view.sin + view.z0 * view.cos;
      const k = view.eye.z / Math.max(view.eye.z - pz, 1);
      return {
        x: view.eye.x + (px - view.eye.x) * k - view.refX,
        y: view.eye.y + (py - view.eye.y) * k - view.refY
      };
    }

    let refreshOnPhotoLoad = () => {};

    const photo = new Image();
    photo.crossOrigin = "anonymous";
    photo.onload = () => {
      loadedImg = photo;
      // Перерисуем текстуры при следующем показе (если телефон сейчас виден — сразу)
      texturesKey = "";
      refreshOnPhotoLoad();
    };
    photo.src =
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80";

    foldDuoRenderer = {
      setPhotoRefreshCallback(fn) {
        refreshOnPhotoLoad = fn;
      },
      invalidate() {
        texturesKey = "";
      },
      // Текстуры зависят только от размеров телефона — перерисовываем их, когда меняется вёрстка
      syncTextures(key) {
        if (key && key !== texturesKey) {
          texturesKey = key;
          rebuildTextures();
        }
      },
      // view = null — экран лежит в плоскости; иначе параметры створки и камеры
      renderPane(targetCanvas, texKey, view) {
        if (!targetCanvas) return;
        const cssW = targetCanvas.clientWidth;
        const cssH = targetCanvas.clientHeight;
        const src = sources[texKey];
        if (cssW < 2 || cssH < 2 || !src || !src.width) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(cssW * dpr);
        const h = Math.round(cssH * dpr);
        if (targetCanvas.width !== w || targetCanvas.height !== h) {
          targetCanvas.width = w;
          targetCanvas.height = h;
        }
        const ctx2d = targetCanvas.getContext("2d");
        if (!ctx2d) return;

        const texW = src.width / 2;
        const texH = src.height / 2;

        if (gl && glState) {
          if (glCanvas.width < w || glCanvas.height < h) {
            glCanvas.width = Math.max(glCanvas.width, w);
            glCanvas.height = Math.max(glCanvas.height, h);
          }
          gl.viewport(0, 0, w, h);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, glState.tex[texKey]);
          gl.uniform1i(glState.u_tex, 0);
          gl.uniform2f(glState.u_css, cssW, cssH);
          gl.uniform2f(glState.u_texSize, texW, texH);
          gl.uniform1f(glState.u_flat, view ? 0 : 1);
          if (view) {
            gl.uniform3f(glState.u_eye, view.eye.x, view.eye.y, view.eye.z);
            gl.uniform1f(glState.u_hinge, view.hinge);
            gl.uniform3f(glState.u_leaf, view.cos, view.sin, view.z0);
            gl.uniform3f(glState.u_map, view.dBase, view.dSign, view.yBase);
            gl.uniform2f(glState.u_refOrigin, view.refX, view.refY);
            gl.uniform1f(glState.u_side, view.side);
            gl.uniform1f(glState.u_extent, view.extent);
            gl.uniform1f(glState.u_motion, view.motion);
          }
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          ctx2d.drawImage(glCanvas, 0, glCanvas.height - h, w, h, 0, 0, w, h);
          return;
        }

        // Запасной путь без WebGL: та же проекция по центральным линиям + блюр и тень
        ctx2d.fillStyle = "#000000";
        ctx2d.fillRect(0, 0, w, h);
        if (!view) {
          ctx2d.drawImage(src, 0, 0, w, h);
          return;
        }
        const a = projectToPlane(view, 0, cssH / 2);
        const b = projectToPlane(view, cssW, cssH / 2);
        const t = projectToPlane(view, cssW / 2, 0);
        const btm = projectToPlane(view, cssW / 2, cssH);
        const sx = a.x * 2;
        const sy = t.y * 2;
        const sw = (b.x - a.x) * 2;
        const sh = (btm.y - t.y) * 2;
        if (sw > 1 && sh > 1) {
          ctx2d.save();
          if ("filter" in ctx2d) ctx2d.filter = `blur(${(view.motion * 6 * dpr).toFixed(1)}px)`;
          ctx2d.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
          ctx2d.restore();
        }
        if (view.motion > 0.01) {
          const farRight = view.dSign > 0;
          const grad = ctx2d.createLinearGradient(farRight ? 0 : w, 0, farRight ? w : 0, 0);
          grad.addColorStop(0.2, "rgba(0,0,0,0)");
          grad.addColorStop(0.7, `rgba(0,0,0,${clampVal(view.motion, 0, 1).toFixed(3)})`);
          grad.addColorStop(1, `rgba(0,0,0,${clampVal(view.motion, 0, 1).toFixed(3)})`);
          ctx2d.fillStyle = grad;
          ctx2d.fillRect(0, 0, w, h);
        }
      }
    };

    return foldDuoRenderer;
  }

  function buildFoldScreens() {
    if (foldBuilt) return;
    foldBuilt = true;
    const photo =
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80";

    const cover = $("#fold-cover-ui");
    const cont = $("#fold-cont-ui");
    const left = $("#fold-inner-left-ui");

    const coverHtml = `
        <div class="fold-statusbar"><span>9:41</span><span>●●●</span></div>
        <div class="lab-ui-photo" style="background-image:url('${photo}')"></div>
        <h4 class="lab-ui-title">Ваш сайт на любом экране</h4>
        <p class="lab-ui-text">Текст и кнопки не обрезаются — ни на узком, ни на раскрытом экране.</p>
        <div class="lab-ui-cta">Написать</div>
      `;
    if (cover) cover.innerHTML = coverHtml;
    // Тот же контент остаётся на правой внутренней половине при раскрытии
    if (cont) cont.innerHTML = coverHtml;
    // Слева при раскрытии появляется дополнительная информация
    if (left) {
      left.innerHTML = `
        <div class="fold-statusbar"><span>Ваш сайт</span><span>Форматы</span></div>
        <h4 class="lab-ui-title">Больше места — больше информации</h4>
        <div class="lab-ui-tile"><strong>Лендинг</strong><span>Один продукт или услуга</span></div>
        <div class="lab-ui-tile"><strong>5 страниц</strong><span>Сайт компании</span></div>
        <div class="lab-ui-tile"><strong>Маркетплейс</strong><span>Каталог и корзина</span></div>
      `;
    }
    const duo = getFoldDuoRenderer();
    const rig = $("#fold-rig");
    const refreshAtRest = () => {
      if (!foldRaf && state.labDevice === "foldable") {
        setFoldState(state.foldMode === "unfolded", false);
      }
    };
    if (typeof ResizeObserver !== "undefined" && rig) {
      new ResizeObserver(refreshAtRest).observe(rig);
    }
    duo.setPhotoRefreshCallback(refreshAtRest);
    // Шрифт Inter приходит позже — перерисуем экраны с правильной вёрсткой текста
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        duo.invalidate();
        refreshAtRest();
      });
    }
  }

  let placeFoldSeg = () => {};

  function syncFoldChips(animate = false) {
    $$("[data-fold-state]").forEach((b) => {
      const on = b.dataset.foldState === state.foldMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const seg = $("#fold-seg");
    if (seg) seg.dataset.state = state.foldMode;
    placeFoldSeg(animate);
  }

  function setFoldState(open, animate) {
    const rig = $("#fold-rig");
    if (!rig) return;
    const lift = $("#fold-lift");
    const hint = $("#fold-hint");
    const leftHalf = rig.querySelector(".fold-left");
    const crease = rig.querySelector(".fold-crease");
    const coverCanvas = $("#fold-duo-cover-canvas");
    const leftCanvas = $("#fold-duo-left-canvas");
    const rightCanvas = $("#fold-duo-right-canvas");

    const targetOpen = open ? 1 : 0;
    const nextState = open ? "open" : "closed";
    const duo = getFoldDuoRenderer();

    if (foldRaf) {
      cancelAnimationFrame(foldRaf);
      foldRaf = null;
    }

    rig.setAttribute("aria-label", open ? "Сложить телефон" : "Раскрыть складной телефон");
    if (hint) hint.textContent = open ? "Нажмите ещё раз, чтобы сложить" : "Нажмите на телефон, чтобы раскрыть";

    const geo = measureFoldGeometry();
    if (geo) duo.syncTextures(`${geo.rigW}x${geo.rigH}`);

    // Створка (левая половина) повёрнута на phi: 180° — сложено (виден внешний экран), 0° — раскрыто.
    // Внешний экран показывает свой эталон, лежащий поверх правой половины (там же, где его контент
    // после раскрытия), внутренний левый — свой эталон слева от шарнира. Правая половина неподвижна.
    const renderLeaf = (openAmt, eye) => {
      const phi = 180 * (1 - openAmt);
      const showCover = phi > 90;
      if (coverCanvas) coverCanvas.classList.toggle("is-visible", showCover);
      if (leftCanvas) leftCanvas.classList.toggle("is-visible", !showCover);

      const tilt = showCover ? 180 - phi : phi;
      let view = null;
      if (geo && eye && tilt > 0.05) {
        const rad = (phi * Math.PI) / 180;
        const common = {
          eye,
          hinge: geo.hinge,
          cos: Math.cos(rad),
          sin: Math.sin(rad),
          z0: foldPoseFor(openAmt).leafZ,
          extent: geo.hinge,
          motion: smoothstep01(Math.min(tilt, 89.5) / 90)
        };
        view = showCover
          ? {
              ...common,
              dBase: geo.coverBezel,
              dSign: 1,
              yBase: geo.coverBezel,
              refX: geo.hinge + geo.coverBezel,
              refY: geo.coverBezel,
              side: 1
            }
          : {
              ...common,
              dBase: geo.hinge - geo.bezel,
              dSign: -1,
              yBase: geo.bezel,
              refX: geo.bezel,
              refY: geo.bezel,
              side: -1
            };
      }
      duo.renderPane(showCover ? coverCanvas : leftCanvas, showCover ? "cover" : "left", view);
    };

    const renderFixedPane = () => {
      if (rightCanvas) {
        duo.renderPane(rightCanvas, "right", null);
        rightCanvas.classList.add("is-visible");
      }
    };

    // Переход в состояние покоя всегда мгновенный: иначе CSS-переходы доигрывали бы позу
    // от последнего кадра (при пропуске кадров — заметно и без оптики iPhone Duo)
    const settleRestPose = () => {
      // если за время движения подгрузились фото или шрифт — обновим текстуры
      if (geo) duo.syncTextures(`${geo.rigW}x${geo.rigH}`);
      rig.classList.add("no-anim");
      rig.classList.remove("is-js-driving");
      rig.dataset.state = nextState;
      rig.style.transform = "";
      rig.style.removeProperty("--fold-shadow-left");
      if (leftHalf) leftHalf.style.transform = "";
      if (lift) lift.style.transform = "";
      if (crease) crease.style.opacity = "";
      renderFixedPane();
      renderLeaf(targetOpen, null);
      void rig.offsetWidth;
      rig.classList.remove("no-anim");
    };

    const fromOpen = foldOpenAmount;
    if (!animate || prefersReducedMotion || !state.animMotion || Math.abs(targetOpen - fromOpen) < 0.001) {
      foldOpenAmount = targetOpen;
      settleRestPose();
      return;
    }

    const applyPose = (openAmt) => {
      const pose = foldPoseFor(openAmt);
      const footprint = Math.max(0, Math.cos((pose.phi * Math.PI) / 180));

      rig.style.transform = `translateX(${(-pose.shift * 100).toFixed(3)}%)`;
      rig.style.setProperty("--fold-shadow-left", `${(3 + 50 * (1 - footprint)).toFixed(2)}%`);
      if (leftHalf) {
        leftHalf.style.transform = `rotateY(${pose.phi.toFixed(3)}deg) translateZ(${pose.leafZ.toFixed(3)}px)`;
      }
      if (lift) lift.style.transform = foldLiftTransform(pose);
      if (crease) {
        crease.style.opacity = smoothstep01((openAmt - 0.72) / 0.22).toFixed(3);
      }
      // .fold-rig сдвинут влево на shift — в его координатах глаз смещается вправо
      renderLeaf(openAmt, geo ? foldEyeInRig(geo, pose.liftZ, pose.liftTilt, -pose.shift * geo.rigW) : null);
    };

    const duration = Math.max(380, Math.round(FOLD_DURATION * Math.abs(targetOpen - fromOpen)));
    const startMs = performance.now();

    rig.dataset.state = nextState;
    rig.classList.add("is-js-driving");
    renderFixedPane();
    applyPose(fromOpen);

    const tick = (now) => {
      const linearT = clampVal((now - startMs) / duration, 0, 1);
      const eased = solveCubicBezier(FOLD_EASE[0], FOLD_EASE[1], FOLD_EASE[2], FOLD_EASE[3], linearT);
      foldOpenAmount = fromOpen + (targetOpen - fromOpen) * eased;

      if (linearT < 1) {
        applyPose(foldOpenAmount);
        foldRaf = requestAnimationFrame(tick);
      } else {
        foldRaf = null;
        foldOpenAmount = targetOpen;
        settleRestPose();
      }
    };

    foldRaf = requestAnimationFrame(tick);
  }

  /* ---------- Движение в духе Apple: пружины и морфинг рамки устройства ---------- */
  function motionEase(name, fallback) {
    const v = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function canAnimate(el) {
    return !!el && typeof el.animate === "function" && state.animMotion && !prefersReducedMotion;
  }

  // Появление блока «пружиной» снизу (например, сцена складного телефона)
  function riseIn(el) {
    if (!canAnimate(el)) return;
    el.animate(
      [
        { opacity: 0, transform: "translateY(18px) scale(0.96)" },
        { opacity: 1, transform: "none" }
      ],
      { duration: 820, easing: motionEase("--ease-spring", "cubic-bezier(0.22, 1, 0.36, 1)") }
    );
  }

  // Переключение ПК / Планшет / Складной / Телефон: рамка перетекает по размеру, скруглению
  // и толщине на пружине; новый экран сразу свёрстан в финальном размере (текст не «перетекает»
  // по ходу), а снимок старого экрана растворяется поверх. apply() меняет класс и содержимое.
  function morphDeviceFrame(frame, apply, opts = {}) {
    const visible = !!frame && !frame.hidden && frame.offsetParent !== null;
    if (!visible || !canAnimate(frame) || !frame.parentNode) {
      if (frame && frame._morphCleanup) frame._morphCleanup();
      apply();
      return;
    }

    // Если прошлый морфинг ещё идёт — продолжаем с текущего (промежуточного) состояния
    const cs0 = window.getComputedStyle(frame);
    const from = {
      width: `${frame.offsetWidth}px`,
      height: `${frame.offsetHeight}px`,
      borderRadius: cs0.borderRadius,
      borderWidth: cs0.borderWidth,
      borderColor: cs0.borderColor
    };
    const fromLeft = frame.offsetLeft;
    const fromTop = frame.offsetTop;
    if (frame._morphCleanup) frame._morphCleanup();

    // Снимок старого экрана: копия рамки без самой рамки и фона, на прежнем месте
    const ghost = frame.cloneNode(true);
    ghost.removeAttribute("id");
    $$("[id]", ghost).forEach((n) => n.removeAttribute("id"));
    const srcNodes = $$("*", frame);
    const ghostNodes = $$("*", ghost);
    const scrolled = [];
    srcNodes.forEach((n, i) => {
      if ((n.scrollTop || n.scrollLeft) && ghostNodes[i]) {
        ghostNodes[i].style.overflow = "hidden";
        scrolled.push([ghostNodes[i], n.scrollTop, n.scrollLeft]);
      }
    });
    ghost.setAttribute("aria-hidden", "true");
    ghost.setAttribute("inert", "");
    Object.assign(ghost.style, {
      position: "absolute",
      left: `${fromLeft}px`,
      top: `${fromTop}px`,
      width: from.width,
      height: from.height,
      margin: "0",
      maxWidth: "none",
      minHeight: "0",
      background: "transparent",
      borderColor: "transparent",
      boxShadow: "none",
      pointerEvents: "none",
      zIndex: "3",
      transition: "none",
      animation: "none"
    });

    // CSS-переходы рамки отключаем до смены класса: иначе они перебили бы пружину
    frame.style.transition = "none";
    apply();
    frame.parentNode.appendChild(ghost);
    scrolled.forEach(([n, top, left]) => {
      n.scrollTop = top;
      n.scrollLeft = left;
    });

    const cs1 = window.getComputedStyle(frame);
    const to = {
      width: `${frame.offsetWidth}px`,
      height: `${frame.offsetHeight}px`,
      borderRadius: cs1.borderRadius,
      borderWidth: cs1.borderWidth,
      borderColor: cs1.borderColor
    };
    const innerW = frame.clientWidth;
    const toLeft = frame.offsetLeft;
    const toTop = frame.offsetTop;

    // Новый экран — в финальном размере, по центру рамки, пока она растёт или сжимается
    const locked = Array.from(frame.children).filter(
      (c) => c !== ghost && window.getComputedStyle(c).position !== "absolute"
    );
    locked.forEach((c) => {
      c.style.width = `${innerW}px`;
      c.style.flexShrink = "0";
      c.style.marginLeft = `calc(50% - ${innerW / 2}px)`;
    });
    frame.style.maxWidth = "none";
    frame.style.minHeight = "0px";
    // во flex-колонке (окно примеров) высоту задаёт flex: 1 — на время морфинга её ведёт анимация
    const wasFlexed = parseFloat(cs1.flexGrow) > 0;
    if (wasFlexed) frame.style.flex = "none";

    // Если рамка не только меняет размер, но и съезжает (над ней появился переключатель),
    // довозим её со старого места сдвигом — без скачка
    frame.style.width = from.width;
    frame.style.height = from.height;
    const offX = fromLeft - frame.offsetLeft;
    const offY = fromTop - frame.offsetTop;
    frame.style.removeProperty("width");
    frame.style.removeProperty("height");
    const kf0 = { ...from };
    const kf1 = { ...to };
    if (Math.abs(offX) > 0.5 || Math.abs(offY) > 0.5) {
      kf0.transform = `translate(${offX.toFixed(2)}px, ${offY.toFixed(2)}px)`;
      kf1.transform = "translate(0px, 0px)";
    }

    const spring = motionEase("--ease-spring", "cubic-bezier(0.22, 1, 0.36, 1)");
    const expo = "cubic-bezier(0.16, 1, 0.3, 1)";
    const duration = opts.duration || 780;
    const anim = frame.animate([kf0, kf1], { duration, easing: spring, fill: "forwards" });

    // Снимок старого экрана обрезается по текущему контуру рамки (та же пружина) —
    // ничего не торчит за её края, пока она сжимается
    const radii = (r) => {
      const parts = String(r).split("/")[0].trim().split(/\s+/).map(parseFloat);
      const [a = 0, b = a, c = a, d = b] = parts;
      return [a, b, c, d];
    };
    const bw0 = parseFloat(from.borderWidth) || 0;
    const bw1 = parseFloat(to.borderWidth) || 0;
    const w0 = parseFloat(from.width);
    const h0 = parseFloat(from.height);
    // где окажется новая рамка в координатах снимка (стороны по отдельности)
    const sides = [
      toTop - fromTop,
      fromLeft + w0 - (toLeft + parseFloat(to.width)),
      fromTop + h0 - (toTop + parseFloat(to.height)),
      toLeft - fromLeft
    ].map((v) => Math.max(0, v));
    const clip = (ins, bw, r) =>
      `inset(${ins.map((v) => `${(v + bw).toFixed(2)}px`).join(" ")} round ${radii(r)
        .map((v) => `${Math.max(0, v - bw).toFixed(2)}px`)
        .join(" ")})`;
    const extra = [
      ghost.animate(
        [{ clipPath: clip([0, 0, 0, 0], bw0, from.borderRadius) }, { clipPath: clip(sides, bw1, to.borderRadius) }],
        { duration, easing: spring, fill: "forwards" }
      ),
      ghost.animate(
        [
          { opacity: 1, filter: "blur(0px)" },
          { opacity: 0, filter: "blur(6px)" }
        ],
        { duration: 280, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }
      )
    ];
    locked.forEach((c) => {
      extra.push(
        c.animate(
          [
            { opacity: 0, transform: "translateY(10px) scale(0.985)" },
            { opacity: 1, transform: "none" }
          ],
          { duration: 600, delay: 70, easing: expo, fill: "backwards" }
        )
      );
    });
    if (opts.stagger) {
      $$(opts.stagger, frame).forEach((el, i) => {
        extra.push(
          el.animate(
            [
              { opacity: 0, transform: "translateY(14px)" },
              { opacity: 1, transform: "none" }
            ],
            { duration: 620, delay: 130 + i * 55, easing: expo, fill: "backwards" }
          )
        );
      });
    }

    const cleanup = () => {
      if (frame._morphCleanup !== cleanup) return;
      frame._morphCleanup = null;
      extra.forEach((a) => a.cancel());
      ghost.remove();
      locked.forEach((c) => {
        c.style.removeProperty("width");
        c.style.removeProperty("flex-shrink");
        c.style.removeProperty("margin-left");
      });
      frame.style.removeProperty("max-width");
      frame.style.removeProperty("min-height");
      if (wasFlexed) frame.style.removeProperty("flex");
      anim.cancel();
      void frame.offsetWidth;
      frame.style.removeProperty("transition");
    };
    frame._morphCleanup = cleanup;
    anim.onfinish = cleanup;
  }

  function triggerEntranceClass(el, className) {
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  function renderDeviceLab(animateFold = false, deviceChanged = false) {
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

    const isFold = state.labDevice === "foldable";
    const foldStage = $("#fold-stage");

    if (subtoggle) {
      subtoggle.hidden = !isFold;
    }
    syncFoldChips(animateFold);

    // Рамка была видна до переключения — тогда она перетекает в новое устройство (морфинг)
    const frameWasShown = !!frame && !frame.hidden && frame.offsetParent !== null;

    if (foldStage) {
      const stageWasHidden = foldStage.hidden;
      foldStage.hidden = !isFold;
      if (isFold && deviceChanged && stageWasHidden && !animateFold) riseIn(foldStage);
    }
    if (frame) {
      if (isFold && frame._morphCleanup) frame._morphCleanup();
      frame.hidden = isFold;
    }
    if (isFold) {
      buildFoldScreens();
      setFoldState(state.foldMode === "unfolded", animateFold);
    }

    const renderFrameScreen = () => {
      frame.className = `lab-frame ${spec.frameClass}`;
      if (content) content.innerHTML = labFrameScreenHtml(spec);
    };
    if (frame && !isFold) {
      if (deviceChanged && frameWasShown) {
        morphDeviceFrame(frame, renderFrameScreen, { stagger: ".lab-ui-tile" });
      } else {
        renderFrameScreen();
        if (deviceChanged) riseIn(frame);
      }
    }

    if (info) {
      info.innerHTML = labInfoHtml(spec);
    }
  }

  function labFrameScreenHtml(spec) {
    return `
        <div class="lab-ui-shell ${spec.dualPane ? "is-dual" : ""}">
          <div class="lab-ui-pane">
            <div class="lab-ui-bar">
              <strong>Ваш сайт</strong>
              <span>${escapeHtml(spec.badge.split("·")[0].trim())}</span>
            </div>
            <div class="lab-ui-photo" style="background-image:url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80')"></div>
            <h4 class="lab-ui-title">
              ${spec.dualPane ? "Левая половина" : "Подстроился под экран"}
            </h4>
            <p class="lab-ui-text">
              ${spec.dualPane ? "Фото и заголовок — слева от сгиба." : "Колонки, фото и отступы перестроились сами."}
            </p>
            <div class="lab-ui-cta">Написать в WhatsApp</div>
          </div>

          <div class="lab-ui-pane">
            ${
              spec.dualPane
                ? `<div class="lab-ui-bar"><strong>Правая половина</strong><span>Форматы</span></div>`
                : ""
            }
            <div class="lab-ui-grid ${spec.colsClass}">
              <div class="lab-ui-tile">
                <strong>Лендинг</strong>
                <span>Один продукт или услуга</span>
              </div>
              <div class="lab-ui-tile">
                <strong>5 страниц</strong>
                <span>Сайт компании</span>
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

  function labInfoHtml(spec) {
    return `
        <div class="lab-info-inner">
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

  function initDeviceLab() {
    const ctrl = $('[data-segmented="device-lab"]');
    const subtoggle = $("#fold-subtoggle");
    const frame = $("#lab-frame");
    const foldStage = $("#fold-stage");
    placeFoldSeg = initLiquidSegment($("#fold-seg"), "[data-fold-state]");

    if (frame) {
      frame.addEventListener("animationend", (e) => {
        if (e.target === frame && e.animationName === "deviceStageEnter") {
          frame.classList.remove("is-device-entering");
        }
      });
    }
    if (foldStage) {
      foldStage.addEventListener("animationend", (e) => {
        if (e.target === foldStage && e.animationName === "deviceStageEnter") {
          foldStage.classList.remove("is-device-entering");
        }
      });
    }

    if (ctrl) {
      $$("[data-device]", ctrl).forEach((btn) => {
        btn.addEventListener("click", () => {
          const nextDev = btn.dataset.device;
          if (!nextDev || nextDev === state.labDevice) return;
          $$(".seg-btn", ctrl).forEach((b) => {
            b.classList.remove("is-active");
            b.setAttribute("aria-selected", "false");
          });
          btn.classList.add("is-active");
          btn.setAttribute("aria-selected", "true");
          positionSegmentedThumb(ctrl);
          // Вкладка «Складной» всегда начинается со сложенного телефона (внешний экран)
          if (nextDev === "foldable") {
            state.foldMode = "cover";
          }
          state.labDevice = nextDev;
          renderDeviceLab(false, true);
        });
      });
    }

    function switchFold(mode) {
      if (state.foldMode === mode) return;
      state.foldMode = mode;
      renderDeviceLab(true, false);
    }

    if (subtoggle) {
      $$("[data-fold-state]", subtoggle).forEach((btn) => {
        btn.addEventListener("click", () => switchFold(btn.dataset.foldState));
      });
    }

    // Можно раскрыть/сложить и нажатием на сам телефон
    const rig = $("#fold-rig");
    if (rig) {
      const toggleFold = () => switchFold(state.foldMode === "cover" ? "unfolded" : "cover");
      rig.addEventListener("click", toggleFold);
      rig.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleFold();
        }
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

    if (pv.type === "showcase") {
      return `
        <div class="card-preview-window">
          <div class="cpw-top">
            <span class="cpw-brand">${escapeHtml(pv.brand)}</span>
            <span>${escapeHtml(pv.hero.eyebrow)}</span>
          </div>
          <div class="cpw-split">
            <div class="cpw-split-copy">
              <div class="cpw-hero-line">${escapeHtml(pv.hero.title.join(" "))}</div>
              <div class="cpw-swatches">
                <span class="cpw-price-tag">${escapeHtml(pv.navCta)}</span>
              </div>
            </div>
            <div class="cpw-photo" style="background-image:url('${escapeHtml(cover)}')" role="img" aria-label="${escapeHtml(project.title)}"></div>
          </div>
        </div>
      `;
    }

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
            <span>5 страниц подряд</span>
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

  function renderPortfolio(withStagger = false) {
    const grid = $("#portfolio-grid");
    if (!grid) return;

    const list =
      state.filter === "all"
        ? PROJECTS
        : PROJECTS.filter((p) => p.category === state.filter);

    const animateCards = withStagger && state.animMotion && state.animGlow;

    grid.innerHTML = list
      .map((p, idx) => {
        const th = p.theme;
        const styleVars = [
          `--card-bg:${th.bg}`,
          `--card-surface:${th.cardBg}`,
          `--card-text:${th.text}`,
          `--card-muted:${th.muted}`,
          `--card-accent:${th.accent}`,
          `--card-accent-soft:${th.accentSoft}`,
          `--card-border:${th.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
          `--stagger-d:${idx * 55}ms`
        ].join(";");

        return `
          <article
            class="project-card spotlight-card ${th.dark ? "is-dark" : ""} ${animateCards ? "is-stagger-in" : ""}"
            style="${styleVars}"
            tabindex="0"
            role="button"
            aria-label="Открыть демо ${escapeHtml(p.title)}"
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
              <span>Открыть демо</span>
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
          renderPortfolio(true);
        });
      });
    }
    renderPortfolio();
  }

  /* ========================================================================
     7. INTERACTIVE QUICK-LOOK MODAL PREVIEWER
     ======================================================================== */
  let lastFocusedEl = null;

  /* Шаблон «showcase»: одна разметка, три характера — mono (минимализм на чёрном),
     brutal (жирные рамки и жёсткие тени), editorial (журнальная вёрстка).
     Подстраивается под ширину экрана через container queries, а не под окно браузера. */
  function renderShowcaseHtml(pv) {
    const h = pv.hero;
    const pad2 = (n) => String(n).padStart(2, "0");
    const marqueeRun = pv.marquee.map((w) => `<span>${escapeHtml(w)}</span><i aria-hidden="true">✦</i>`).join("");
    return `
      <div class="sc-page sc-${escapeHtml(pv.style)}">
        <div class="sc-inner">
          <header class="sc-nav">
            <strong class="sc-brand">${escapeHtml(pv.brand)}</strong>
            <nav class="sc-links">${pv.nav.map((n) => `<span>${escapeHtml(n)}</span>`).join("")}</nav>
            <button type="button" class="sc-btn sc-btn-sm" data-sc-cta>${escapeHtml(pv.navCta)}</button>
          </header>

          <section class="sc-hero">
            <div class="sc-hero-copy">
              <span class="sc-eyebrow">${escapeHtml(h.eyebrow)}</span>
              <h2 class="sc-display">${h.title.map((l) => `<span>${escapeHtml(l)}</span>`).join("")}</h2>
              <p class="sc-lead">${escapeHtml(h.lead)}</p>
              <div class="sc-ctas">
                <button type="button" class="sc-btn" data-sc-cta>${escapeHtml(h.ctas[0])}</button>
                <button type="button" class="sc-btn sc-btn-ghost" data-sc-cta>${escapeHtml(h.ctas[1])}</button>
              </div>
            </div>
            <figure class="sc-hero-media" style="background-image:url('${escapeHtml(h.image)}')"></figure>
            <dl class="sc-stats">
              ${h.stats.map((s) => `<div><dt>${escapeHtml(s.v)}</dt><dd>${escapeHtml(s.l)}</dd></div>`).join("")}
            </dl>
          </section>

          <div class="sc-marquee" aria-hidden="true"><div class="sc-marquee-track">${marqueeRun}${marqueeRun}</div></div>

          <section class="sc-section">
            <span class="sc-kicker">${escapeHtml(pv.section.kicker)}</span>
            <h3 class="sc-h2">${escapeHtml(pv.section.title)}</h3>
            <ol class="sc-steps">
              ${pv.section.items
                .map(
                  (it, i) => `
                <li class="sc-step">
                  <span class="sc-num">${pad2(i + 1)}</span>
                  <strong>${escapeHtml(it.title)}</strong>
                  <p>${escapeHtml(it.text)}</p>
                </li>`
                )
                .join("")}
            </ol>
          </section>

          <section class="sc-section">
            <span class="sc-kicker">${escapeHtml(pv.cards.kicker)}</span>
            <h3 class="sc-h2">${escapeHtml(pv.cards.title)}</h3>
            <div class="sc-cards">
              ${pv.cards.list
                .map(
                  (c, i) => `
                <article class="sc-card">
                  ${c.image ? `<div class="sc-card-media" style="background-image:url('${escapeHtml(c.image)}')"></div>` : ""}
                  <span class="sc-num">${pad2(i + 1)}</span>
                  <strong>${escapeHtml(c.title)}</strong>
                  <span class="sc-meta">${escapeHtml(c.meta)}</span>
                </article>`
                )
                .join("")}
            </div>
          </section>

          <section class="sc-section sc-quote-wrap">
            <blockquote class="sc-quote">
              <p>«${escapeHtml(pv.quote.text)}»</p>
              <footer><strong>${escapeHtml(pv.quote.author)}</strong> · ${escapeHtml(pv.quote.role)}</footer>
            </blockquote>
          </section>

          <section class="sc-section">
            <span class="sc-kicker">Вопросы</span>
            <div class="sc-faq">
              ${pv.faq
                .map(
                  (f, i) => `
                <details class="sc-faq-item" ${i === 0 ? "open" : ""}>
                  <summary>${escapeHtml(f.q)}</summary>
                  <p>${escapeHtml(f.a)}</p>
                </details>`
                )
                .join("")}
            </div>
          </section>

          <section class="sc-cta">
            <h3 class="sc-cta-title">${escapeHtml(pv.cta.title)}</h3>
            <button type="button" class="sc-btn sc-btn-lg" data-sc-cta>${escapeHtml(pv.cta.button)}</button>
            <span class="sc-cta-note">${escapeHtml(pv.cta.note)}</span>
          </section>

          <footer class="sc-foot">
            <span>${escapeHtml(pv.brand)} · демо-сайт SiteGen</span>
            <span>© 2026</span>
          </footer>
        </div>
      </div>`;
  }

  // target — куда рисовать: по умолчанию окно примеров; первый экран передаёт свои «экраны» устройств
  function renderModalContent(target) {
    const project = target ? target.project : state.modalProject;
    const container = target ? target.container : $("#modal-screen-content");
    const shell = target ? target.shell : $("#modal-device-shell");
    if (!project || !container || !shell) return;

    const th = project.theme;
    shell.style.setProperty("--pv-bg", th.bg);
    shell.style.setProperty("--pv-card", th.cardBg);
    shell.style.setProperty("--pv-text", th.text);
    shell.style.setProperty("--pv-muted", th.muted);
    shell.style.setProperty("--pv-accent", th.accent);
    shell.style.setProperty("--pv-accent-soft", th.accentSoft);
    shell.style.setProperty("--pv-on-accent", readableTextOn(th.accent));

    const pv = project.preview;
    // обработчик прокрутки нужен только демо на 5 страниц
    container.onscroll = null;

    // 0. SHOWCASE — гибкий шаблон в трендовых стилях (минимализм, брутализм, редакционный)
    if (pv.type === "showcase") {
      container.innerHTML = renderShowcaseHtml(pv);
      $$("[data-sc-cta]", container).forEach((b) =>
        b.addEventListener("click", () => showToast(`Демо-заявка: ${pv.brand} — «${b.textContent.trim()}»`))
      );
      return;
    }

    // 1. LANDING INTERACTIVE PREVIEW
    if (pv.type === "landing") {
      const variant = pv.variants[state.modalVariantIdx] || pv.variants[0];
      const mode = pv.modes[state.modalModeIdx] || pv.modes[0];

      container.innerHTML = `
        <div class="pv-wrap">
          <div class="pv-nav">
            <span class="pv-brand">${escapeHtml(pv.brand)}</span>
            <span style="font-size:0.78rem; color:var(--pv-muted);">Демо-лендинг</span>
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

    // 2. 5-PAGE PREVIEW — все пять страниц идут подряд, их листают прокруткой.
    //    Шапка с названиями страниц липкая и только показывает, где вы сейчас.
    if (pv.type === "five-page") {
      const total = pv.pages.length;
      const pagesHtml = pv.pages
        .map((page, idx) => {
          const img = page.heroImage;
          return `
          <section class="pv-page ${idx === 0 ? "" : "is-pending"}" data-pv-page-idx="${idx}" aria-label="Страница ${idx + 1} из ${total}: ${escapeHtml(page.title)}">
            <div class="pv-page-head">
              <span class="pv-page-num">${escapeHtml(page.num)}</span>
              <span>${escapeHtml(page.title)}</span>
              <span class="pv-page-line" aria-hidden="true"></span>
            </div>
            <div class="pv-hero-grid ${img ? "" : "is-text-only"}">
              <div>
                <h2 class="pv-h1">${escapeHtml(page.heroTitle)}</h2>
                <p class="pv-lead">${escapeHtml(page.heroLead)}</p>
              </div>
              ${img ? `<div class="pv-page-banner" style="background-image:url('${escapeHtml(img)}')" role="img" aria-label="${escapeHtml(page.title)}"></div>` : ""}
            </div>
            ${renderFivePageBody(page)}
          </section>`;
        })
        .join("");

      container.innerHTML = `
        <div class="pv-wrap pv-multipage">
          <header class="pv-nav pv-nav-sticky">
            <div class="pv-nav-row">
              <div>
                <span class="pv-brand">${escapeHtml(pv.brand)}</span>
                <span class="pv-tagline">${escapeHtml(pv.tagline)}</span>
              </div>
              <span class="pv-page-counter" id="pv-page-counter">1 / ${total}</span>
            </div>
            <nav class="pv-tabs pv-page-nav" aria-label="Страницы сайта">
              ${pv.pages
                .map(
                  (pg, idx) => `
                  <button type="button" class="pv-tab-btn ${idx === 0 ? "is-active" : ""}" data-pv-goto="${idx}" aria-current="${idx === 0 ? "true" : "false"}">
                    ${escapeHtml(pg.title)}
                  </button>`
                )
                .join("")}
            </nav>
            <span class="pv-progress" aria-hidden="true"><i id="pv-progress-bar"></i></span>
          </header>

          ${pagesHtml}

          <footer class="pv-site-footer">
            <span>© ${escapeHtml(pv.brand)} · демо-сайт</span>
            <button type="button" class="pv-tab-btn js-pv-top">Наверх ↑</button>
          </footer>

          <div class="pv-scroll-hint-wrap" aria-hidden="true">
            <span class="pv-scroll-hint">
              Листайте вниз — ещё ${total - 1} страницы
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M12 19L6 13M12 19L18 13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
          </div>
        </div>
      `;

      setupFivePageScroll(container);
      $$(".js-pv-slot", container).forEach((b) =>
        b.addEventListener("click", () => {
          showToast(`Демо-заявка: ${b.textContent.trim()}`);
        })
      );
      return;
    }

    // 3. MARKETPLACE INTERACTIVE PREVIEW
    renderMarketplace(project, pv, container);
  }

  // Содержимое одной страницы демо-сайта на 5 страниц (карточки / цифры / список / запись)
  function renderFivePageBody(page) {
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
      return bodyHtml;
  }

  // Прокрутка демо-сайта на 5 страниц: подсветка текущей страницы, прогресс, плавное появление
  function setupFivePageScroll(container) {
    const sections = $$(".pv-page", container);
    const navBtns = $$("[data-pv-goto]", container);
    const navStrip = $(".pv-page-nav", container);
    const header = $(".pv-nav-sticky", container);
    const counter = $("#pv-page-counter", container);
    const bar = $("#pv-progress-bar", container);
    const hint = $(".pv-scroll-hint-wrap", container);
    let current = 0;
    let ticking = false;

    const offsetIn = (el) =>
      el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;

    function update() {
      ticking = false;
      const headerH = header ? header.offsetHeight : 0;
      const line = container.scrollTop + headerH + 60;
      let idx = 0;
      sections.forEach((s, i) => {
        if (offsetIn(s) <= line) idx = i;
      });
      const max = container.scrollHeight - container.clientHeight;
      if (max > 0 && container.scrollTop >= max - 4) idx = sections.length - 1;

      if (idx !== current) {
        current = idx;
        navBtns.forEach((b, i) => {
          b.classList.toggle("is-active", i === idx);
          b.setAttribute("aria-current", String(i === idx));
        });
        if (counter) counter.textContent = `${idx + 1} / ${sections.length}`;
        // на узком экране вкладки прокручиваются — держим активную в поле зрения
        const active = navBtns[idx];
        if (navStrip && active && navStrip.scrollWidth > navStrip.clientWidth) {
          navStrip.scrollTo({ left: active.offsetLeft - 12, behavior: prefersReducedMotion ? "auto" : "smooth" });
        }
      }
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, container.scrollTop / max) : 0})`;
      if (hint) hint.classList.toggle("is-hidden", container.scrollTop > 60);

      // Запасной вариант к IntersectionObserver: всё, до чего долистали, точно проявляется
      const bottom = container.scrollTop + container.clientHeight;
      sections.forEach((s) => {
        if (s.classList.contains("is-pending") && offsetIn(s) < bottom) s.classList.remove("is-pending");
      });
    }

    // onscroll (а не addEventListener), чтобы при перерисовке окна обработчики не копились
    container.onscroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    // Нажатие на название страницы просто долистывает до неё
    navBtns.forEach((b) =>
      b.addEventListener("click", () => {
        const s = sections[Number(b.dataset.pvGoto)];
        if (!s) return;
        const headerH = header ? header.offsetHeight : 0;
        container.scrollTo({
          top: Math.max(0, offsetIn(s) - headerH + 1),
          behavior: prefersReducedMotion ? "auto" : "smooth"
        });
      })
    );

    const topBtn = $(".js-pv-top", container);
    if (topBtn) {
      topBtn.addEventListener("click", () =>
        container.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
      );
    }

    // Страницы мягко проявляются, когда до них долистали
    const pending = sections.filter((s) => s.classList.contains("is-pending"));
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      pending.forEach((s) => s.classList.remove("is-pending"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.remove("is-pending");
              io.unobserve(entry.target);
            }
          });
        },
        { root: container, threshold: 0.08 }
      );
      pending.forEach((s) => io.observe(s));
    }
  }

  function renderMarketplace(project, pv, container) {
    container.innerHTML = `
      <div class="pv-wrap">
        <div class="pv-nav">
          <div>
            <span class="pv-brand">${escapeHtml(pv.brand)}</span>
            <span style="display:block; font-size:0.72rem; color:var(--pv-muted);">${escapeHtml(pv.tagline)} · ${escapeHtml(pv.sellersCount)}</span>
          </div>
          <div class="pv-cart-pill" id="pv-cart-summary"></div>
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

        <div class="pv-cards-grid" id="pv-market-grid"></div>
      </div>
    `;

    const grid = $("#pv-market-grid", container);
    const cartPill = $("#pv-cart-summary", container);

    function renderCart() {
      const cartTotal = state.marketCart.reduce((sum, item) => sum + item.price, 0);
      if (cartPill) cartPill.textContent = `Корзина: ${state.marketCart.length} · ${formatRub(cartTotal)}`;
    }

    // Перерисовываем только сетку товаров, чтобы поле поиска не теряло фокус и ввод (в т.ч. IME/автозамену)
    function renderGrid() {
      if (!grid) return;
      const q = state.marketQuery.trim().toLowerCase();
      const filteredProducts = pv.products.filter((prod) => {
        const matchCat = state.marketCategory === "Все" || prod.category === state.marketCategory;
        const matchSearch =
          !q ||
          prod.name.toLowerCase().includes(q) ||
          prod.seller.toLowerCase().includes(q);
        return matchCat && matchSearch;
      });

      grid.innerHTML = filteredProducts.length
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
              : `<div class="pv-card"><p>Ничего не нашлось. Попробуйте другой запрос.</p></div>`;
    }

    renderCart();
    renderGrid();

    const searchInput = $("#pv-market-search", container);
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        state.marketQuery = e.target.value;
        renderGrid();
      });
    }

    $$("[data-pv-mcat]", container).forEach((b) =>
      b.addEventListener("click", () => {
        state.marketCategory = b.dataset.pvMcat;
        $$("[data-pv-mcat]", container).forEach((x) => x.classList.toggle("is-active", x === b));
        renderGrid();
      })
    );

    if (grid) {
      grid.addEventListener("click", (e) => {
        const b = e.target.closest(".js-add-cart");
        if (!b) return;
        const prod = pv.products.find((x) => x.id === b.dataset.prodId);
        if (prod) {
          state.marketCart.push(prod);
          showToast(`Добавлено в корзину: ${prod.name}`);
          renderCart();
        }
      });
    }
  }

  function modalDeviceLabel(dev, foldMode) {
    const labels = {
      desktop: "Компьютер",
      tablet: "Планшет",
      foldable: foldMode === "cover" ? "Складной · внешний экран" : "Складной · раскрыт",
      mobile: "Телефон"
    };
    return labels[dev] || labels.desktop;
  }

  function setModalDevice(dev, animateSwitch = false) {
    state.modalDevice = dev;
    const shell = $("#modal-device-shell");
    const badge = $("#modal-shell-badge");
    const modalFoldBar = $("#modal-fold-subtoggle");

    const shellClass =
      dev === "foldable"
        ? state.modalFoldMode === "cover"
          ? "is-fold-cover"
          : "is-foldable"
        : `is-${dev}`;

    // Всё, что меняет размер рамки (в том числе появление переключателя экранов над ней),
    // делаем внутри морфинга — тогда рамка перетекает в новое устройство одним движением
    const apply = () => {
      if (modalFoldBar) {
        const wasHidden = modalFoldBar.hidden;
        modalFoldBar.hidden = dev !== "foldable";
        // переключатель только что появился — сразу ставим ползунок на место
        if (wasHidden && !modalFoldBar.hidden) placeModalFoldSeg(false);
      }
      if (shell) shell.className = `modal-device-shell ${shellClass}`;
      if (badge) badge.textContent = modalDeviceLabel(dev, state.modalFoldMode);
    };
    if (animateSwitch && shell) morphDeviceFrame(shell, apply);
    else {
      if (shell && shell._morphCleanup) shell._morphCleanup();
      apply();
    }

    $$(".mdev-btn").forEach((b) => {
      const on = b.dataset.modalDev === dev;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    // Смена ширины экрана меняет высоту страниц — обновляем индикатор прокрутки
    const screenEl = $("#modal-screen-content");
    if (screenEl && typeof screenEl.onscroll === "function") screenEl.onscroll();
  }

  let modalHideTimer = null;
  let placeModalFoldSeg = () => {};

  function syncModalFoldChips(animate) {
    $$("[data-modal-fold]").forEach((b) => {
      const on = b.dataset.modalFold === state.modalFoldMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const seg = $("#modal-fold-seg");
    if (seg) seg.dataset.state = state.modalFoldMode;
    placeModalFoldSeg(animate);
  }

  /* ---------- Предпросмотр примеров: раскрытие складного телефона с оптикой iPhone Duo ----------
     Та же хореография и та же проекция, что в лаборатории устройств. Только экраны здесь — живая
     вёрстка примера (лендинг, 5 страниц, маркетплейс), поэтому на время анимации берутся её копии:
     - правая половина неподвижна и показывает правую часть раскрытой страницы;
     - створка — «окно» на неподвижную картинку: копия страницы лежит в плоскости правой половины
       и обрезается по силуэту створки (clip-path), который виден сквозь неё из глаза зрителя;
     - к дальнему от шарнира краю растут размытие и OLED-тень, как в лаборатории.
     По окончании движения копии убираются, и снова показывается живой интерактивный экран. */
  let modalFold = null;

  function ensureModalFoldStage() {
    if (modalFold) return modalFold;
    const area = $(".modal-stage-area");
    if (!area) return null;

    const el = document.createElement("div");
    el.className = "mfold";
    el.hidden = true;
    el.setAttribute("aria-hidden", "true");
    // в копиях есть кнопки — фокус с клавиатуры в них попадать не должен
    el.setAttribute("inert", "");
    const windowHtml = (pane) => `
      <div class="mfold-window" data-pane="${pane}">
        <div class="mfold-ref mfold-ref-blur"></div>
        <div class="mfold-ref mfold-ref-sharp"></div>
        <div class="mfold-shade"></div>
      </div>`;
    el.innerHTML = `
      <div class="mfold-lift">
        <div class="mfold-rig">
          <div class="mfold-half mfold-left">
            <div class="mfold-face mfold-inner-left"></div>
            <div class="mfold-face mfold-cover"></div>
          </div>
          <div class="mfold-half mfold-right">
            <div class="mfold-face mfold-inner-right"><div class="mfold-slot"></div></div>
          </div>
        </div>
      </div>
      <div class="mfold-lift mfold-lift-glass">
        <div class="mfold-rig mfold-rig-glass">${windowHtml("cover")}${windowHtml("left")}</div>
      </div>`;
    area.appendChild(el);

    const win = (pane) => {
      const w = el.querySelector(`.mfold-window[data-pane="${pane}"]`);
      return {
        el: w,
        blur: w.querySelector(".mfold-ref-blur"),
        sharp: w.querySelector(".mfold-ref-sharp"),
        shade: w.querySelector(".mfold-shade")
      };
    };
    modalFold = {
      el,
      lifts: $$(".mfold-lift", el),
      rigs: $$(".mfold-rig", el),
      leftHalf: el.querySelector(".mfold-left"),
      innerLeftFace: el.querySelector(".mfold-inner-left"),
      coverFace: el.querySelector(".mfold-cover"),
      slot: el.querySelector(".mfold-slot"),
      windows: { cover: win("cover"), left: win("left") },
      active: false,
      raf: null,
      openAmt: 1,
      geo: null,
      scrollFor: { unfolded: 0, cover: 0 },
      lastBlur: { cover: "", left: "" }
    };
    return modalFold;
  }

  // Индексы прокручиваемых элементов живого экрана (основная прокрутка, ряд вкладок и т. п.)
  function findModalScrollers(liveShell) {
    const all = $$("*", liveShell);
    const idx = [];
    all.forEach((n, i) => {
      const cs = window.getComputedStyle(n);
      if (/(auto|scroll)/.test(cs.overflowX + cs.overflowY)) idx.push(i);
    });
    return { all, idx };
  }

  // Копия экрана примера в нужном режиме — без рамки, ровно размером с экран.
  // Прокручиваемые области становятся неподвижными (overflow: hidden): в 3D-сцене браузер выносит
  // их в отдельные слои и может не обрезать по силуэту створки, а для снимка прокрутка не нужна.
  function cloneModalScreen(liveShell, scrollers, mode, isSourceMode, w, h) {
    const clone = liveShell.cloneNode(true);
    clone.removeAttribute("id");
    $$("[id]", clone).forEach((n) => n.removeAttribute("id"));
    clone.className = `modal-device-shell ${mode === "cover" ? "is-fold-cover" : "is-foldable"} mfold-clone`;
    clone.style.width = `${w}px`;
    clone.style.height = `${h}px`;
    clone.style.removeProperty("opacity");
    clone.style.removeProperty("pointer-events");
    clone.style.removeProperty("transition");
    $$(".is-device-switching", clone).forEach((n) => n.classList.remove("is-device-switching"));
    const badge = clone.querySelector(".modal-shell-badge");
    if (badge) badge.textContent = modalDeviceLabel("foldable", mode);
    // введённый текст (поиск в маркетплейсе) cloneNode не копирует
    const srcFields = $$("input, textarea, select", liveShell);
    $$("input, textarea, select", clone).forEach((f, i) => {
      if (srcFields[i]) f.value = srcFields[i].value;
    });

    const cloneAll = $$("*", clone);
    const pending = scrollers.idx.map((i) => {
      const node = cloneAll[i];
      if (node) node.style.overflow = "hidden";
      return { node, src: scrollers.all[i] };
    });
    // смещения прокрутки выставляются после вставки копии в документ
    clone._mfoldRestoreScroll = () => {
      pending.forEach(({ node, src }) => {
        if (!node || !src) return;
        // в исходном режиме вёрстка та же — переносим прокрутку как есть; основную прокрутку другого
        // режима выставляет вызывающий (в той же доле страницы)
        if (isSourceMode) {
          node.scrollTop = src.scrollTop;
          node.scrollLeft = src.scrollLeft;
        } else if (!node.classList.contains("modal-screen-scroll")) {
          node.scrollLeft = src.scrollLeft;
        }
      });
    };
    return clone;
  }

  // Контур экрана на створке в координатах (d — от шарнира, y): у шарнира углы прямые, снаружи скруглены
  function foldScreenOutline(dNear, dFar, yTop, yBot, r) {
    const pts = [[dNear, yTop]];
    const rr = Math.max(0, Math.min(r, (dFar - dNear) / 2, (yBot - yTop) / 2));
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI / 2 + (Math.PI / 2) * (i / steps);
      pts.push([dFar - rr + rr * Math.cos(a), yTop + rr + rr * Math.sin(a)]);
    }
    for (let i = 0; i <= steps; i++) {
      const a = (Math.PI / 2) * (i / steps);
      pts.push([dFar - rr + rr * Math.cos(a), yBot - rr + rr * Math.sin(a)]);
    }
    pts.push([dNear, yBot]);
    return pts;
  }

  // Маска резкой копии: у шарнира резко, к дальнему краю проступает размытая копия под ней
  function foldSharpMask(hingeX, extent, dir) {
    const stops = [0, 0.25, 0.5, 0.75, 1].map((p) => {
      const x = hingeX + dir * p * extent;
      return { x, a: 1 - Math.pow(p, 1.35) };
    });
    if (dir < 0) stops.reverse();
    const parts = stops.map((s) => `rgba(0,0,0,${s.a.toFixed(3)}) ${s.x.toFixed(1)}px`);
    return `linear-gradient(to right, ${parts.join(", ")})`;
  }

  // OLED-тень: та же кривая, что в шейдере лаборатории
  function foldShadeGradient(motion, toward) {
    const stops = [];
    for (let i = 0; i <= 10; i++) {
      const p = i / 10;
      const a = Math.min(1, 2 * motion * Math.pow(clampVal((p - 0.2) / 0.8, 0, 1), 1.35));
      stops.push(`rgba(0,0,0,${a.toFixed(3)}) ${(p * 100).toFixed(0)}%`);
    }
    return `linear-gradient(${toward}, ${stops.join(", ")})`;
  }

  // Размеры сцены: раскрытый телефон = рамка .is-foldable, сложенный = его правая половина
  function layoutModalFold(mf) {
    const area = $(".modal-stage-area");
    const shell = $("#modal-device-shell");
    if (!area || !shell) return null;
    const cs = window.getComputedStyle(area);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const areaRect = area.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    // окно ещё «въезжает» (масштаб) — геометрия не та, обойдёмся без 3D
    if (!area.offsetWidth || Math.abs(areaRect.width / area.offsetWidth - 1) > 0.01) return null;

    const contentW = area.clientWidth - padL - padR;
    const maxW = parseFloat(cs.getPropertyValue("--mfold-max")) || 720;
    const coverMin = parseFloat(cs.getPropertyValue("--mfold-cover-min")) || 300;
    // на узком экране внешний экран не равен половине раскрытого — там остаётся простой переход
    if (contentW / 2 < coverMin) return null;

    const rigW = Math.min(maxW, contentW);
    const rigH = shellRect.height;
    if (rigH < 160) return null;

    Object.assign(mf.el.style, {
      left: `${padL + (contentW - rigW) / 2}px`,
      top: `${shellRect.top - areaRect.top - area.clientTop}px`,
      width: `${rigW}px`,
      height: `${rigH}px`
    });
    mf.el.hidden = false;

    const elCs = window.getComputedStyle(mf.el);
    const origin = String(elCs.perspectiveOrigin || "").split(" ").map(parseFloat);
    const persp = parseFloat(elCs.perspective);
    const hinge = rigW / 2;
    const b = mf.innerLeftFace.clientTop;
    const bc = mf.coverFace.clientTop;
    const rInner = parseFloat(window.getComputedStyle(mf.innerLeftFace).borderTopLeftRadius) || 0;
    const rCover = parseFloat(window.getComputedStyle(mf.coverFace).borderTopRightRadius) || 0;

    return {
      persp: persp > 0 ? persp : 2200,
      eyeX: Number.isFinite(origin[0]) ? origin[0] : rigW * 0.5,
      eyeY: Number.isFinite(origin[1]) ? origin[1] : rigH * 0.35,
      liftX: 0,
      liftY: 0,
      liftW: rigW,
      liftH: rigH,
      rigX: 0,
      rigY: 0,
      rigW,
      rigH,
      hinge,
      bezel: b,
      coverBezel: bc,
      inner: { w: rigW - 2 * b, h: rigH - 2 * b },
      cover: { w: hinge - 2 * bc, h: rigH - 2 * bc },
      outline: {
        left: foldScreenOutline(0, hinge - b, b, rigH - b, Math.max(0, rInner - b)),
        cover: foldScreenOutline(bc, hinge - bc, bc, rigH - bc, Math.max(0, rCover - bc))
      }
    };
  }

  function applyModalFoldPose(openAmt) {
    const mf = modalFold;
    const g = mf.geo;
    const pose = foldPoseFor(openAmt);

    const liftTf = foldLiftTransform(pose);
    mf.lifts.forEach((l) => (l.style.transform = liftTf));
    const rigTf = `translateX(${(-pose.shift * 100).toFixed(3)}%)`;
    mf.rigs.forEach((r) => (r.style.transform = rigTf));
    mf.leftHalf.style.transform = `rotateY(${pose.phi.toFixed(3)}deg) translateZ(${pose.leafZ.toFixed(3)}px)`;

    const showCover = pose.phi > 90;
    const pane = showCover ? "cover" : "left";
    const win = mf.windows[pane];
    win.el.style.visibility = "visible";
    mf.windows[showCover ? "left" : "cover"].el.style.visibility = "hidden";

    // Силуэт экрана створки, каким его видит зритель, — на неподвижной плоскости
    const eye = foldEyeInRig(g, pose.liftZ, pose.liftTilt, -pose.shift * g.rigW);
    const rad = (pose.phi * Math.PI) / 180;
    const cosPhi = Math.cos(rad);
    const sinPhi = Math.sin(rad);
    const poly = g.outline[pane].map(([d, y]) => {
      const p = foldRayToPlane(eye, g.hinge, cosPhi, sinPhi, pose.leafZ, d, y);
      return `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`;
    });
    win.el.style.clipPath = `polygon(${poly.join(", ")})`;

    const tilt = showCover ? 180 - pose.phi : pose.phi;
    const motion = smoothstep01(Math.min(tilt, 89.5) / 90);
    const size = showCover ? g.cover : g.inner;
    const sigma = Math.round(0.025 * Math.min(size.w, size.h) * motion * 4) / 4;
    const blur = sigma > 0.1 ? `blur(${sigma}px)` : "none";
    if (mf.lastBlur[pane] !== blur) {
      win.blur.style.filter = blur;
      mf.lastBlur[pane] = blur;
    }
    win.shade.style.background = foldShadeGradient(motion, showCover ? "to right" : "to left");
  }

  function finishModalFold() {
    const mf = modalFold;
    if (!mf || !mf.active) return;
    if (mf.raf) cancelAnimationFrame(mf.raf);
    mf.raf = null;
    mf.active = false;

    const shell = $("#modal-device-shell");
    const screen = $("#modal-screen-content");
    if (screen) {
      screen.scrollTop = mf.scrollFor[state.modalFoldMode] || 0;
      if (typeof screen.onscroll === "function") screen.onscroll();
    }
    if (shell) {
      shell.style.removeProperty("opacity");
      shell.style.removeProperty("pointer-events");
      void shell.offsetWidth;
      shell.style.removeProperty("transition");
    }

    mf.el.hidden = true;
    mf.slot.innerHTML = "";
    Object.values(mf.windows).forEach((w) => {
      w.blur.innerHTML = "";
      w.sharp.innerHTML = "";
      w.el.style.visibility = "hidden";
    });
  }

  function runModalFold(target) {
    const mf = modalFold;
    if (mf.raf) cancelAnimationFrame(mf.raf);
    const from = mf.openAmt;
    const duration = Math.max(380, Math.round(FOLD_DURATION * Math.abs(target - from)));
    const startMs = performance.now();
    applyModalFoldPose(from);

    const tick = (now) => {
      const linearT = clampVal((now - startMs) / duration, 0, 1);
      const eased = solveCubicBezier(FOLD_EASE[0], FOLD_EASE[1], FOLD_EASE[2], FOLD_EASE[3], linearT);
      mf.openAmt = from + (target - from) * eased;
      if (linearT < 1) {
        applyModalFoldPose(mf.openAmt);
        mf.raf = requestAnimationFrame(tick);
      } else {
        mf.raf = null;
        mf.openAmt = target;
        finishModalFold();
      }
    };
    mf.raf = requestAnimationFrame(tick);
  }

  // Запускает раскрытие/складывание. false — анимация недоступна, экран переключается как раньше.
  function playModalFold(fromMode, toMode) {
    if (prefersReducedMotion || !state.animMotion) return false;
    const mf = ensureModalFoldStage();
    if (!mf) return false;
    const target = toMode === "unfolded" ? 1 : 0;

    // Смена направления посреди движения: копии уже на месте, просто разворачиваем створку
    if (mf.active) {
      setModalDevice("foldable", false);
      runModalFold(target);
      return true;
    }

    const shell = $("#modal-device-shell");
    const screen = $("#modal-screen-content");
    if (!shell || !screen) return false;
    const geo = layoutModalFold(mf);
    if (!geo) {
      mf.el.hidden = true;
      return false;
    }
    mf.geo = geo;
    mf.openAmt = fromMode === "unfolded" ? 1 : 0;

    const g = geo;
    const b = g.bezel;
    const bc = g.coverBezel;
    const place = (box, x, y, w, h) =>
      Object.assign(box.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });

    // Там, где взгляд сквозь створку проходит мимо картинки, виден фон самого сайта
    mf.el.style.setProperty("--pv-bg", window.getComputedStyle(shell).getPropertyValue("--pv-bg"));

    // Копии страницы: раскрытая (правая половина + створка) и внешний экран (створка)
    const scrollers = findModalScrollers(shell);
    const inner = () =>
      cloneModalScreen(shell, scrollers, "unfolded", fromMode === "unfolded", g.inner.w, g.inner.h);
    const cover = () => cloneModalScreen(shell, scrollers, "cover", fromMode === "cover", g.cover.w, g.cover.h);
    mf.slot.style.left = `${b - g.hinge}px`;
    mf.slot.appendChild(inner());

    const wl = mf.windows.left;
    const wc = mf.windows.cover;
    [wl.blur, wl.sharp].forEach((box) => {
      place(box, b, b, g.inner.w, g.inner.h);
      box.appendChild(inner());
    });
    [wc.blur, wc.sharp].forEach((box) => {
      place(box, g.hinge + bc, bc, g.cover.w, g.cover.h);
      box.appendChild(cover());
    });
    // в координатах копии шарнир левой створки — на x = hinge - b, внешнего экрана — на x = -bc
    const maskLeft = foldSharpMask(g.hinge - b, g.hinge, -1);
    const maskCover = foldSharpMask(-bc, g.hinge, 1);
    wl.sharp.style.webkitMaskImage = wl.sharp.style.maskImage = maskLeft;
    wc.sharp.style.webkitMaskImage = wc.sharp.style.maskImage = maskCover;
    place(wl.shade, 0, 0, g.hinge, g.rigH);
    place(wc.shade, g.hinge, 0, g.hinge, g.rigH);
    mf.lastBlur = { cover: "", left: "" };

    // Прокрутка: исходный режим — ровно как сейчас, другой — в той же доле страницы
    const maxScroll = Math.max(1, screen.scrollHeight - screen.clientHeight);
    const ratio = clampVal(screen.scrollTop / maxScroll, 0, 1);
    mf.scrollFor = { unfolded: 0, cover: 0 };
    mf.scrollFor[fromMode] = screen.scrollTop;
    const syncScroll = (cloneShell, mode) => {
      if (typeof cloneShell._mfoldRestoreScroll === "function") cloneShell._mfoldRestoreScroll();
      const sc = cloneShell.querySelector(".modal-screen-scroll");
      if (!sc || mode === fromMode) return;
      sc.scrollTop = Math.round(ratio * Math.max(0, sc.scrollHeight - sc.clientHeight));
      mf.scrollFor[mode] = sc.scrollTop;
    };
    [mf.slot, wl.blur, wl.sharp].forEach((box) => syncScroll(box.firstElementChild, "unfolded"));
    [wc.blur, wc.sharp].forEach((box) => syncScroll(box.firstElementChild, "cover"));

    // Живой экран прячем на время движения и сразу переводим в новый режим (без своих переходов).
    // Именно opacity, а не visibility: у кнопок примеров transition: all, и они «доигрывали» бы
    // унаследованную visibility ещё 0,2 с, просвечивая поверх сцены.
    shell.style.transition = "none";
    shell.style.opacity = "0";
    shell.style.pointerEvents = "none";
    setModalDevice("foldable", false);

    mf.active = true;
    runModalFold(target);
    return true;
  }

  function openPreviewModal(projectId) {
    const project = PROJECTS.find((p) => p.id === projectId);
    const modal = $("#preview-modal");
    if (!project || !modal) return;

    finishModalFold();
    lastFocusedEl = document.activeElement;
    state.modalProject = project;
    state.modalFoldMode = "cover"; // складной всегда начинается со сложенного телефона
    state.modalVariantIdx = 0;
    state.modalModeIdx = 0;
    state.marketCategory = "Все";
    state.marketQuery = "";
    state.marketCart = [];

    syncModalFoldChips(false);

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

    // Если модалку закрыли и сразу открыли снова — отменяем отложенное скрытие
    clearTimeout(modalHideTimer);
    modal.hidden = false;
    // Каждый пример открывается с начала, а не с места, где листали предыдущий
    const screenEl = $("#modal-screen-content");
    if (screenEl) screenEl.scrollTop = 0;
    // Принудительный reflow вместо requestAnimationFrame: переход срабатывает, и класс
    // гарантированно ставится сразу (rAF может не прийти в фоновой вкладке)
    void modal.offsetWidth;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    const closeBtn = $("#modal-close-btn");
    if (closeBtn) closeBtn.focus();
  }

  function closePreviewModal() {
    const modal = $("#preview-modal");
    if (!modal || modal.hidden) return;
    finishModalFold();
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    clearTimeout(modalHideTimer);
    modalHideTimer = setTimeout(() => {
      modal.hidden = true;
      // preventScroll: иначе после «Хочу такой же» страницу отбрасывает обратно к карточке
      if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
        lastFocusedEl.focus({ preventScroll: true });
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
      if (!modal || modal.hidden) return;
      if (e.key === "Escape") {
        closePreviewModal();
        return;
      }
      // Держим фокус клавиатуры внутри открытого окна
      if (e.key === "Tab") {
        const focusables = $$(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
          modal
        ).filter((el) => el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    const screenEl = $("#modal-screen-content");
    if (screenEl) {
      screenEl.addEventListener("animationend", (e) => {
        if (e.target === screenEl && e.animationName === "modalDeviceSwitch") {
          screenEl.classList.remove("is-device-switching");
        }
      });
    }

    $$(".mdev-btn").forEach((b) =>
      b.addEventListener("click", () => {
        const nextDev = b.dataset.modalDev;
        if (!nextDev || nextDev === state.modalDevice) return;
        finishModalFold();
        // при выборе «Складной» телефон всегда сначала сложен — раскрывается только по нажатию
        if (nextDev === "foldable" && state.modalFoldMode !== "cover") {
          state.modalFoldMode = "cover";
          syncModalFoldChips(false);
        }
        setModalDevice(nextDev, true);
      })
    );

    if (modalFoldBar) {
      placeModalFoldSeg = initLiquidSegment($("#modal-fold-seg"), "[data-modal-fold]");
      $$("[data-modal-fold]", modalFoldBar).forEach((btn) => {
        btn.addEventListener("click", () => {
          if (state.modalFoldMode === btn.dataset.modalFold) return;
          const fromMode = state.modalFoldMode;
          state.modalFoldMode = btn.dataset.modalFold;
          syncModalFoldChips(true);
          // складной телефон раскрывается «книжкой» с оптикой iPhone Duo; если нельзя — как раньше
          if (!playModalFold(fromMode, state.modalFoldMode)) setModalDevice("foldable", true);
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
          selectWaFormat(mapFmt[proj.category] || "Лендинг", `как в примере ${proj.title}`);
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
    const note = state.waNote.trim().replace(/[.!\s]+$/, "");
    const notePart = note ? ` Сфера / пожелания: ${note}.` : "";
    const greeting = CONFIG.defaultGreeting || "Здравствуйте! Хочу заказать сайт.";
    const text = `${greeting} Формат: ${state.waFormat}.${notePart}`;

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

    if (CONFIG.isPlaceholderNumber) {
      console.warn("SiteGen: в config.js указан демонстрационный номер WhatsApp — замените whatsappNumber и whatsappDisplay на свой.");
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
    const lightSections = $$(".section-light, .section-white, .section-contact, .site-footer");

    function setDrawer(open) {
      if (!toggle || !drawer) return;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
      drawer.classList.toggle("is-open", open);
      drawer.setAttribute("aria-hidden", String(!open));
      // inert убирает ссылки закрытого меню из Tab-навигации
      drawer.inert = !open;
      document.body.style.overflow = open ? "hidden" : "";
    }

    function isDrawerOpen() {
      return toggle && toggle.getAttribute("aria-expanded") === "true";
    }

    if (toggle && drawer) {
      toggle.addEventListener("click", () => setDrawer(!isDrawerOpen()));

      $$(".drawer-link", drawer).forEach((link) => {
        link.addEventListener("click", () => setDrawer(false));
      });

      // Клик по пустому месту вокруг меню закрывает его
      drawer.addEventListener("click", (e) => {
        if (e.target === drawer) setDrawer(false);
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isDrawerOpen()) {
          setDrawer(false);
          toggle.focus();
        }
      });

      // Если повернули планшет / расширили окно до десктопа — закрываем меню
      window.addEventListener("resize", () => {
        if (isDrawerOpen() && getComputedStyle(toggle).display === "none") setDrawer(false);
      });
    }

    const progressBar = $("#scroll-progress-bar");
    const contactSection = $("#contact");

    function updateScrollChrome() {
      const y = window.scrollY;
      if (progressBar) {
        const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const ratio = Math.min(1, Math.max(0, y / docH));
        progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }
      if (bottomBar) {
        // в блоке контактов своя большая кнопка WhatsApp — панель там только дублирует её
        let contactInView = false;
        if (contactSection) {
          const r = contactSection.getBoundingClientRect();
          contactInView = r.top < window.innerHeight * 0.75 && r.bottom > window.innerHeight * 0.25;
        }
        const show = y > 440 && !contactInView;
        if (bottomBar.classList.contains("is-visible") !== show) {
          bottomBar.classList.toggle("is-visible", show);
          bottomBar.setAttribute("aria-hidden", String(!show));
          bottomBar.inert = !show;
        }
      }
      if (header) {
        // цвет шапки — по секции под ней: сверху на компьютере, снизу на телефоне
        const bar = header.firstElementChild || header;
        const br = bar.getBoundingClientRect();
        const probeY = br.height ? br.top + br.height / 2 : 44;
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
    if ("IntersectionObserver" in window && state.animMotion) {
      const io = new IntersectionObserver(
        (entries) => {
          // Блоки, появившиеся вместе, идут волной (если задержка не задана в разметке)
          let wave = 0;
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            if (!el.style.getPropertyValue("--d")) {
              el.style.setProperty("--d", `${Math.min(wave, 5) * 80}ms`);
              wave++;
            }
            el.classList.add("is-revealed");
            io.unobserve(el);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      items.forEach((el) => io.observe(el));
    } else {
      items.forEach((el) => el.classList.add("is-revealed"));
    }

    // Apple cursor glass reflection + subtle 3D depth on cards
    let activeTiltCard = null;
    function clearTilt() {
      if (!activeTiltCard) return;
      activeTiltCard.classList.remove("is-3d-tilt");
      activeTiltCard.style.transform = "";
      activeTiltCard = null;
    }

    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || !state.animDepth) {
        clearTilt();
        return;
      }
      const spot = e.target.closest(".spotlight-card");
      if (spot) {
        const sr = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - sr.left}px`);
        spot.style.setProperty("--my", `${e.clientY - sr.top}px`);
      }

      const card = e.target.closest(".project-card, .format-card, .bento-card");
      if (activeTiltCard && activeTiltCard !== card) {
        clearTilt();
      }
      if (!card) return;
      activeTiltCard = card;
      card.classList.add("is-3d-tilt");
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const rx = (-py * 3.8).toFixed(2);
      const ry = (px * 3.8).toFixed(2);
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
    });

    document.addEventListener("pointerleave", clearTilt);
    window.addEventListener("blur", clearTilt);

    // Interactive motion switches inside #craft («Почувствуйте разницу сами»)
    const root = document.documentElement;
    const switches = $$("[data-anim-toggle]");
    const replayBtn = $("#craft-replay-btn");
    const craftSection = $("#craft");

    function triggerBentoGlint() {
      if (!craftSection) return;
      $$(".bento-card", craftSection).forEach((card, idx) => {
        card.classList.remove("is-glinting");
        void card.offsetWidth;
        setTimeout(() => {
          card.classList.add("is-glinting");
          setTimeout(() => card.classList.remove("is-glinting"), 950);
        }, idx * 80);
      });
    }

    function applyAnimPrefs(save) {
      const anyOn = state.animMotion || state.animDepth || state.animGlow;
      root.classList.toggle("anim-force-on", anyOn);
      root.classList.toggle("anim-motion-off", !state.animMotion);
      root.classList.toggle("anim-depth-off", !state.animDepth);
      root.classList.toggle("anim-glow-off", !state.animGlow);

      switches.forEach((sw) => {
        const key = sw.dataset.animToggle;
        const on =
          key === "motion"
            ? state.animMotion
            : key === "depth"
              ? state.animDepth
              : state.animGlow;
        sw.classList.toggle("is-on", on);
        sw.setAttribute("aria-checked", String(on));
      });

      if (!state.animDepth) {
        clearTilt();
      }
      if (!state.animMotion) {
        items.forEach((el) => el.classList.add("is-revealed"));
        const stage = $("#hero-devices-stage");
        if (stage) stage.style.setProperty("--scroll-p", "0");
      }

      syncHeroAurora();

      if (save) {
        try {
          localStorage.setItem(
            "sitegen_anim_prefs",
            JSON.stringify({
              motion: state.animMotion,
              depth: state.animDepth,
              glow: state.animGlow
            })
          );
        } catch {
          // Ignore storage failures
        }
      }
    }

    switches.forEach((sw) => {
      sw.addEventListener("click", () => {
        const key = sw.dataset.animToggle;
        if (key === "motion") {
          state.animMotion = !state.animMotion;
          applyAnimPrefs(true);
          if (state.animMotion) triggerBentoGlint();
          showToast(state.animMotion ? "Плавные анимации включены" : "Плавные анимации выключены");
        } else if (key === "depth") {
          state.animDepth = !state.animDepth;
          applyAnimPrefs(true);
          if (state.animDepth) triggerBentoGlint();
          showToast(state.animDepth ? "3D-глубина и блик включены" : "3D-глубина и блик выключены");
        } else if (key === "glow") {
          state.animGlow = !state.animGlow;
          applyAnimPrefs(true);
          showToast(state.animGlow ? "Живой свет и отклик включены" : "Живой свет и отклик выключены");
        }
      });
    });

    if (replayBtn && craftSection) {
      replayBtn.addEventListener("click", () => {
        if (!state.animMotion) {
          state.animMotion = true;
          applyAnimPrefs(true);
        }
        replayBtn.classList.add("is-spinning");
        setTimeout(() => replayBtn.classList.remove("is-spinning"), 520);

        const cards = $$(".reveal-up", craftSection);
        cards.forEach((el, idx) => {
          el.classList.remove("is-revealed");
          el.style.setProperty("--d", `${idx * 90}ms`);
        });
        void craftSection.offsetWidth;
        requestAnimationFrame(() => {
          cards.forEach((el) => el.classList.add("is-revealed"));
          if (state.animDepth) triggerBentoGlint();
        });
      });
    }

    applyAnimPrefs(false);
  }

  /* ========================================================================
     BOOTSTRAP
     ======================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    const yearEl = $("#footer-year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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


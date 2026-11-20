(function () {
  "use strict";

  const CONFIG = window.SITEGEN_CONFIG || {
    brandName: "SiteGen",
    whatsappNumber: "77000000000",
    whatsappDisplay: "+7 (700) 000-00-00",
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
    heroMode: "landing",
    labDevice: "desktop",
    foldMode: "cover",
    filter: "all",
    waFormat: "Лендинг",
    waNote: "",
    modalProject: null,
    modalDevice: "desktop",
    modalFoldMode: "unfolded",
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
    landing: {
      url: "sitegen.studio / aura-landing",
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

  /* ---------- Складной телефон: пространственная проекция HingeLab (WebGL) ---------- */
  const HINGE_SWITCH_ANGLE = 55;
  const HINGE_MAX_TILT = 89.5;
  const HINGE_TAU_S = 0.045;
  const HINGE_RAMP_MS = 1150;

  let foldLab = null;

  function clampVal(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function coverTiltForHinge(angle) {
    return clampVal(angle, 0, HINGE_MAX_TILT);
  }

  function earlyInnerTilt(angle) {
    const progress = clampVal((angle - 55) / 120, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    return HINGE_MAX_TILT * (1 - eased);
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

  function drawCoverTexture(canvas, photoImg) {
    const w = 520;
    const h = 820;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#10131b");
    bgGrad.addColorStop(1, "#090b10");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Status bar
    ctx.fillStyle = "#9ca3af";
    ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif';
    ctx.textBaseline = "top";
    ctx.fillText("9:41", 34, 48);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(w - 64 + i * 14, 59, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hero card photo area
    const px = 30;
    const py = 98;
    const pw = w - 60;
    const ph = 228;
    ctx.save();
    drawRoundedRectPath(ctx, px, py, pw, ph, 26);
    ctx.clip();

    const artGrad = ctx.createLinearGradient(px, py, px + pw, py + ph);
    artGrad.addColorStop(0, "#1d2c48");
    artGrad.addColorStop(0.55, "#263858");
    artGrad.addColorStop(1, "#131a29");
    ctx.fillStyle = artGrad;
    ctx.fillRect(px, py, pw, ph);

    // Architectural studio glass pavilion silhouette (clean fallback + underlay)
    ctx.fillStyle = "rgba(120, 175, 255, 0.16)";
    ctx.beginPath();
    ctx.arc(px + pw * 0.78, py + ph * 0.3, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 204, 138, 0.28)";
    ctx.fillRect(px + 42, py + 84, pw - 84, 96);
    ctx.fillStyle = "rgba(15, 20, 32, 0.75)";
    ctx.fillRect(px + 30, py + 76, pw - 60, 14);
    ctx.fillRect(px + 42, py + 174, pw - 84, 54);

    if (photoImg && photoImg.complete && photoImg.naturalWidth > 0) {
      const imgRatio = photoImg.naturalWidth / photoImg.naturalHeight;
      const boxRatio = pw / ph;
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
      ctx.drawImage(photoImg, sx, sy, sw, sh, px, py, pw, ph);
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 2;
    drawRoundedRectPath(ctx, px, py, pw, ph, 26);
    ctx.stroke();

    // Title & subtitle
    ctx.fillStyle = "#f5f5f7";
    ctx.font = '700 38px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif';
    const nextY = drawWrappedText(ctx, "Ваш сайт на любом экране", 32, 358, w - 64, 46);

    ctx.fillStyle = "#9ca3af";
    ctx.font = '400 24px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif';
    drawWrappedText(
      ctx,
      "Текст и кнопки не обрезаются — ни на узком, ни на раскрытом экране.",
      32,
      nextY + 62,
      w - 64,
      34
    );

    // Bottom CTA pill
    const btnY = h - 104;
    const btnH = 68;
    ctx.fillStyle = "#ffffff";
    drawRoundedRectPath(ctx, 30, btnY, w - 60, btnH, 34);
    ctx.fill();

    ctx.fillStyle = "#0d0d10";
    ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Написать", w * 0.5, btnY + btnH * 0.5 + 1);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  function drawInnerTexture(canvas, coverCanvas) {
    const w = 1040;
    const h = 820;
    const halfW = 520;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#10131b");
    bgGrad.addColorStop(1, "#090b10");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, halfW, h);

    // Left pane: header + title + 3 format tiles
    ctx.fillStyle = "#9ca3af";
    ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif';
    ctx.textBaseline = "top";
    ctx.fillText("Ваш сайт", 32, 48);
    ctx.textAlign = "right";
    ctx.fillText("Форматы", halfW - 34, 48);
    ctx.textAlign = "left";

    ctx.fillStyle = "#f5f5f7";
    ctx.font = '700 36px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif';
    drawWrappedText(ctx, "Больше места — больше информации", 32, 106, halfW - 64, 44);

    const tiles = [
      { title: "Лендинг", desc: "Один продукт или услуга" },
      { title: "5 страниц", desc: "Сайт компании" },
      { title: "Маркетплейс", desc: "Каталог и корзина" }
    ];

    tiles.forEach((tile, idx) => {
      const ty = 248 + idx * 168;
      const th = 142;
      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      drawRoundedRectPath(ctx, 30, ty, halfW - 64, th, 24);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#f5f5f7";
      ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif';
      ctx.fillText(tile.title, 54, ty + 32);

      ctx.fillStyle = "#9ca3af";
      ctx.font = '400 23px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif';
      ctx.fillText(tile.desc, 54, ty + 78);
    });

    // Right pane: continuity of the cover screen
    ctx.drawImage(coverCanvas, halfW, 0, halfW, h);
  }

  function initFoldEngine() {
    if (foldLab) return foldLab;

    const rig = $("#fold-rig");
    const canvas = $("#fold-gl-canvas");
    const slider = $("#fold-angle-slider");
    const angleVal = $("#fold-angle-val");
    const hint = $("#fold-hint");
    if (!rig || !canvas) return null;

    const coverCanvas = document.createElement("canvas");
    const innerCanvas = document.createElement("canvas");
    let loadedImg = null;

    function rebuildTextures() {
      drawCoverTexture(coverCanvas, loadedImg);
      drawInnerTexture(innerCanvas, coverCanvas);
    }

    rebuildTextures();

    const photo = new Image();
    photo.crossOrigin = "anonymous";
    photo.onload = () => {
      loadedImg = photo;
      try {
        rebuildTextures();
        uploadTextures();
        renderFrame();
      } catch {
        // Fallback if canvas ever becomes tainted
        loadedImg = null;
        rebuildTextures();
      }
    };
    photo.src =
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80";

    // Initialize WebGL 1.0 shader ported from Dasojj/HingeLab spatial_projection.agsl
    const gl = canvas.getContext("webgl", { antialias: true, alpha: false }) ||
      canvas.getContext("experimental-webgl", { antialias: true, alpha: false });

    let glState = null;

    function uploadTextures() {
      if (!gl || !glState) return;
      const upload = (tex, srcCanvas) => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);
      };
      upload(glState.coverTex, coverCanvas);
      upload(glState.innerTex, innerCanvas);
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

      const fsSource = `
        precision highp float;
        varying vec2 v_uv;
        uniform sampler2D u_tex;
        uniform vec2 u_resolution;
        uniform float u_tiltDegrees;
        uniform float u_eyeDistancePx;
        uniform float u_hingePos;
        uniform float u_eyeX;
        uniform float u_paneSide;
        uniform float u_blurSpread;
        uniform float u_softInner;

        const float GOLDEN_ANGLE = 2.39996322972865332;
        const float TWO_PI = 6.28318530717958648;

        vec3 sampleDecal(vec2 px) {
          vec2 uv = px / u_resolution;
          if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            return vec3(0.0);
          }
          return texture2D(u_tex, uv).rgb;
        }

        void main() {
          vec2 p = v_uv * u_resolution;
          if (u_resolution.x <= 1.0 || u_resolution.y <= 1.0) {
            gl_FragColor = vec4(sampleDecal(p), 1.0);
            return;
          }

          float tilt = radians(clamp(u_tiltDegrees, 0.0, 89.5));
          if (tilt < 0.0001) {
            gl_FragColor = vec4(sampleDecal(p), 1.0);
            return;
          }

          float side = p.x >= u_hingePos ? 1.0 : -1.0;
          if (u_paneSide * side < -0.5) {
            gl_FragColor = vec4(sampleDecal(p), 1.0);
            return;
          }

          float d = abs(p.x - u_hingePos);
          vec2 glass = vec2(u_hingePos + side * d * cos(tilt), p.y);
          float gap = d * sin(tilt);
          vec2 eye = vec2(u_eyeX, u_resolution.y * 0.5);
          float depth = u_eyeDistancePx - gap;
          if (depth <= 0.001) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
          }

          vec2 hitS = eye + (glass - eye) * (u_eyeDistancePx / depth);

          if (u_softInner > 0.5) {
            float extent = side > 0.0 ? (u_resolution.x - u_hingePos) : u_hingePos;
            float endDepth = max(u_eyeDistancePx - extent * sin(tilt), 1.0);
            float endHit = u_eyeX + (u_hingePos + side * extent * cos(tilt) - u_eyeX) * u_eyeDistancePx / endDepth;
            float denom = endHit - u_hingePos;
            float fraction = abs(denom) > 0.001 ? clamp((hitS.x - u_hingePos) / denom, 0.0, 1.0) : 0.0;
            vec2 contained = vec2(u_hingePos + side * extent * fraction, p.y);
            hitS = mix(hitS, contained, 0.28);
          }

          float radius = u_blurSpread * gap;
          if (
            hitS.x < -radius || hitS.y < -radius ||
            hitS.x > u_resolution.x + radius || hitS.y > u_resolution.y + radius
          ) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
          }

          float paneMax = max(side > 0.0 ? (u_resolution.x - u_hingePos) : u_hingePos, 1.0);
          float shade = clamp(1.0 - 0.52 * sin(tilt) * (d / paneMax), 0.2, 1.0);

          if (radius < 0.5) {
            gl_FragColor = vec4(sampleDecal(hitS) * shade, 1.0);
            return;
          }

          float tapsF = clamp(radius * 2.0, 6.0, 32.0);
          float rotation = fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453) * TWO_PI;
          vec3 sum = vec3(0.0);
          float wsum = 0.0;

          for (int i = 0; i < 32; i++) {
            float fi = float(i);
            float w = 1.0 - step(tapsF, fi);
            float r = radius * sqrt((fi + 0.5) / tapsF);
            float a = fi * GOLDEN_ANGLE + rotation;
            sum += sampleDecal(hitS + r * vec2(cos(a), sin(a))) * w;
            wsum += w;
          }

          vec3 avg = sum / max(wsum, 1.0);
          gl_FragColor = vec4(avg * shade, 1.0);
        }
      `;

      function compileShader(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          gl.deleteShader(sh);
          return null;
        }
        return sh;
      }

      const vs = compileShader(gl.VERTEX_SHADER, vsSource);
      const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
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

          glState = {
            prog,
            coverTex: gl.createTexture(),
            innerTex: gl.createTexture(),
            u_tex: gl.getUniformLocation(prog, "u_tex"),
            u_resolution: gl.getUniformLocation(prog, "u_resolution"),
            u_tiltDegrees: gl.getUniformLocation(prog, "u_tiltDegrees"),
            u_eyeDistancePx: gl.getUniformLocation(prog, "u_eyeDistancePx"),
            u_hingePos: gl.getUniformLocation(prog, "u_hingePos"),
            u_eyeX: gl.getUniformLocation(prog, "u_eyeX"),
            u_paneSide: gl.getUniformLocation(prog, "u_paneSide"),
            u_blurSpread: gl.getUniformLocation(prog, "u_blurSpread"),
            u_softInner: gl.getUniformLocation(prog, "u_softInner")
          };
          gl.useProgram(prog);
          uploadTextures();
        }
      }
    }

    const ctx2d = !glState ? canvas.getContext("2d") : null;

    let currentAngle = 0;
    let targetAngle = 0;
    let rafId = null;
    let lastTimeMs = 0;
    let rampActive = false;
    let rampFrom = 0;
    let rampTo = 0;
    let rampStartMs = 0;
    let lastIsInner = false;

    function syncSize() {
      const rect = rig.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(rect.width * dpr);
      const ch = Math.round(rect.height * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
    }

    function updatePhaseUI(angle, notifyLabInfo) {
      const isInner = angle >= HINGE_SWITCH_ANGLE;
      rig.classList.toggle("is-inner-phase", isInner);
      rig.classList.toggle("is-cover-phase", !isInner);
      rig.dataset.state = isInner ? "open" : "closed";
      rig.setAttribute("aria-label", isInner ? "Сложить телефон" : "Раскрыть складной телефон");

      const rounded = Math.round(angle);
      if (angleVal) angleVal.textContent = `${rounded}°`;
      if (slider && document.activeElement !== slider) {
        slider.value = String(rounded);
      }
      if (hint) {
        hint.textContent = isInner
          ? "Нажмите на экран или верните ползунок к 0°, чтобы сложить"
          : "Нажмите на экран или двигайте ползунок угла (0°–180°)";
      }

      if (isInner !== lastIsInner) {
        lastIsInner = isInner;
        state.foldMode = isInner ? "unfolded" : "cover";
        syncFoldChips(true);
        if (notifyLabInfo) renderDeviceLabInfoOnly();
      }
    }

    function renderFrame() {
      syncSize();
      const w = canvas.width;
      const h = canvas.height;
      if (w < 2 || h < 2) return;

      const isInner = currentAngle >= HINGE_SWITCH_ANGLE;
      const tilt = isInner ? earlyInnerTilt(currentAngle) : coverTiltForHinge(currentAngle);
      const hingePos = isInner ? w * 0.5 : 0;
      const eyeX = w * 0.5;
      const paneSide = isInner ? -1 : 1;
      const softInner = isInner ? 1 : 0;
      const eyeDistPx = Math.max(w, h) * 1.45;

      if (gl && glState) {
        gl.viewport(0, 0, w, h);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, isInner ? glState.innerTex : glState.coverTex);
        gl.uniform1i(glState.u_tex, 0);
        gl.uniform2f(glState.u_resolution, w, h);
        gl.uniform1f(glState.u_tiltDegrees, tilt);
        gl.uniform1f(glState.u_eyeDistancePx, eyeDistPx);
        gl.uniform1f(glState.u_hingePos, hingePos);
        gl.uniform1f(glState.u_eyeX, eyeX);
        gl.uniform1f(glState.u_paneSide, paneSide);
        gl.uniform1f(glState.u_blurSpread, 0.12);
        gl.uniform1f(glState.u_softInner, softInner);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else if (ctx2d) {
        ctx2d.fillStyle = "#000000";
        ctx2d.fillRect(0, 0, w, h);
        const src = isInner ? innerCanvas : coverCanvas;
        const cosT = Math.cos((tilt * Math.PI) / 180);
        const blurPx = Math.round(Math.sin((tilt * Math.PI) / 180) * 14);
        if (isInner) {
          ctx2d.drawImage(src, src.width * 0.5, 0, src.width * 0.5, src.height, w * 0.5, 0, w * 0.5, h);
          ctx2d.save();
          if ("filter" in ctx2d) ctx2d.filter = blurPx > 0 ? `blur(${blurPx}px)` : "none";
          const lw = (w * 0.5) * cosT;
          ctx2d.drawImage(src, 0, 0, src.width * 0.5, src.height, w * 0.5 - lw, 0, lw, h);
          ctx2d.restore();
        } else {
          ctx2d.save();
          if ("filter" in ctx2d) ctx2d.filter = blurPx > 0 ? `blur(${blurPx}px)` : "none";
          ctx2d.drawImage(src, 0, 0, src.width, src.height, 0, 0, w * cosT, h);
          ctx2d.restore();
        }
      }
    }

    function step(nowMs) {
      rafId = null;
      if (!lastTimeMs) lastTimeMs = nowMs;
      const dt = clampVal((nowMs - lastTimeMs) / 1000, 0, 0.05);
      lastTimeMs = nowMs;

      if (rampActive) {
        const t = clampVal((nowMs - rampStartMs) / HINGE_RAMP_MS, 0, 1);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        currentAngle = rampFrom + (rampTo - rampFrom) * eased;
        if (t >= 1) {
          currentAngle = rampTo;
          rampActive = false;
        }
      } else {
        currentAngle += (targetAngle - currentAngle) * (1 - Math.exp(-dt / HINGE_TAU_S));
        if (Math.abs(targetAngle - currentAngle) < 0.08) {
          currentAngle = targetAngle;
        }
      }

      updatePhaseUI(currentAngle, true);
      renderFrame();

      if (rampActive || Math.abs(targetAngle - currentAngle) > 0.05) {
        rafId = requestAnimationFrame(step);
      } else {
        lastTimeMs = 0;
      }
    }

    function startLoop() {
      if (!rafId) {
        lastTimeMs = 0;
        rafId = requestAnimationFrame(step);
      }
    }

    function animateTo(angle, animate) {
      targetAngle = clampVal(angle, 0, 180);
      if (!animate || prefersReducedMotion || !state.animMotion) {
        rampActive = false;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        currentAngle = targetAngle;
        updatePhaseUI(currentAngle, false);
        renderFrame();
        return;
      }
      rampFrom = currentAngle;
      rampTo = targetAngle;
      rampStartMs = performance.now();
      rampActive = true;
      startLoop();
    }

    function scrubTo(angle) {
      rampActive = false;
      targetAngle = clampVal(angle, 0, 180);
      if (!state.animMotion) {
        currentAngle = targetAngle;
        updatePhaseUI(currentAngle, true);
        renderFrame();
        return;
      }
      startLoop();
    }

    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => renderFrame()).observe(rig);
    }

    if (slider) {
      slider.addEventListener("input", (e) => {
        scrubTo(Number(e.target.value));
      });
    }

    foldLab = {
      setOpen(open, animate) {
        animateTo(open ? 180 : 0, animate);
      },
      redraw: renderFrame
    };

    updatePhaseUI(0, false);
    renderFrame();
    return foldLab;
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

  function renderDeviceLabInfoOnly() {
    const info = $("#device-lab-info");
    if (!info) return;
    const key =
      state.labDevice === "foldable"
        ? state.foldMode === "cover"
          ? "foldable_cover"
          : "foldable_unfolded"
        : state.labDevice;
    const spec = DEVICE_LAB_SPECS[key];
    if (!spec) return;

    info.innerHTML = `
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
    const subtoggle = $("#fold-subtoggle");

    const isFold = state.labDevice === "foldable";
    const foldStage = $("#fold-stage");

    if (subtoggle) {
      subtoggle.hidden = !isFold;
    }
    syncFoldChips(animateFold);

    if (foldStage) {
      foldStage.hidden = !isFold;
      if (isFold && animateFold) {
        foldStage.classList.remove("is-device-entering");
      } else if (isFold && deviceChanged && state.animMotion) {
        triggerEntranceClass(foldStage, "is-device-entering");
      }
    }
    if (frame) frame.hidden = isFold;

    if (isFold) {
      const engine = initFoldEngine();
      if (engine) {
        engine.setOpen(state.foldMode === "unfolded", animateFold);
        requestAnimationFrame(() => engine.redraw());
      }
    }

    if (frame && !isFold) {
      frame.className = `lab-frame ${spec.frameClass}`;
      if (deviceChanged && state.animMotion) {
        triggerEntranceClass(frame, "is-device-entering");
      }
    }

    if (content && !isFold) {
      content.innerHTML = `
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

    renderDeviceLabInfoOnly();
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
      syncFoldChips(true);
      const engine = initFoldEngine();
      if (engine) {
        engine.setOpen(mode === "unfolded", true);
      }
      renderDeviceLabInfoOnly();
    }

    if (subtoggle) {
      $$("[data-fold-state]", subtoggle).forEach((btn) => {
        btn.addEventListener("click", () => switchFold(btn.dataset.foldState));
      });
    }

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
    shell.style.setProperty("--pv-on-accent", readableTextOn(th.accent));

    const pv = project.preview;
    // обработчик прокрутки нужен только демо на 5 страниц
    container.onscroll = null;

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

  function setModalDevice(dev, animateSwitch = false) {
    state.modalDevice = dev;
    const shell = $("#modal-device-shell");
    const badge = $("#modal-shell-badge");
    const modalFoldBar = $("#modal-fold-subtoggle");

    if (modalFoldBar) {
      const wasHidden = modalFoldBar.hidden;
      modalFoldBar.hidden = dev !== "foldable";
      // переключатель только что появился — сразу ставим ползунок на место
      if (wasHidden && !modalFoldBar.hidden) placeModalFoldSeg(false);
    }

    const shellClass =
      dev === "foldable"
        ? state.modalFoldMode === "cover"
          ? "is-fold-cover"
          : "is-foldable"
        : `is-${dev}`;

    const labels = {
      desktop: "Компьютер",
      tablet: "Планшет",
      foldable: state.modalFoldMode === "cover" ? "Складной · внешний экран" : "Складной · раскрыт",
      mobile: "Телефон"
    };

    if (shell) {
      shell.className = `modal-device-shell ${shellClass}`;
    }
    if (badge) {
      badge.textContent = labels[dev] || labels.desktop;
    }
    $$(".mdev-btn").forEach((b) => {
      const on = b.dataset.modalDev === dev;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    // Смена ширины экрана меняет высоту страниц — обновляем индикатор прокрутки
    const screenEl = $("#modal-screen-content");
    if (screenEl) {
      if (animateSwitch && state.animMotion) {
        triggerEntranceClass(screenEl, "is-device-switching");
      }
      if (typeof screenEl.onscroll === "function") screenEl.onscroll();
    }
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

  function openPreviewModal(projectId) {
    const project = PROJECTS.find((p) => p.id === projectId);
    const modal = $("#preview-modal");
    if (!project || !modal) return;

    lastFocusedEl = document.activeElement;
    state.modalProject = project;
    state.modalFoldMode = "unfolded";
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
        setModalDevice(nextDev, true);
      })
    );

    if (modalFoldBar) {
      placeModalFoldSeg = initLiquidSegment($("#modal-fold-seg"), "[data-modal-fold]");
      $$("[data-modal-fold]", modalFoldBar).forEach((btn) => {
        btn.addEventListener("click", () => {
          if (state.modalFoldMode === btn.dataset.modalFold) return;
          state.modalFoldMode = btn.dataset.modalFold;
          syncModalFoldChips(true);
          setModalDevice("foldable", true);
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
    const lightSections = $$(".section-light, .section-white, .section-contact");

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
    if ("IntersectionObserver" in window && state.animMotion) {
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


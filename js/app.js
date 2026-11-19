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
    window.addEventListener("resize", () => {
      resize();
      // При изменении размера canvas очищается; без анимации его нужно перерисовать вручную
      if (prefersReducedMotion) drawFrame();
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

  /* ---------- Складной телефон: раскрытие как у книжки ---------- */
  const FOLD_DURATION = 1350; // должно совпадать с --fold-dur в CSS
  let foldTimer = null;
  let foldBuilt = false;

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
    // Тот же контент всегда остаётся на правой внутренней половине
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
  }

  function syncFoldChips() {
    $$("[data-fold-state]").forEach((b) => {
      const on = b.dataset.foldState === state.foldMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  // animate=false — мгновенно (при входе во вкладку), true — с анимацией раскрытия/складывания
  function setFoldState(open, animate) {
    const rig = $("#fold-rig");
    const lift = $("#fold-lift");
    const hint = $("#fold-hint");
    if (!rig) return;

    const nextState = open ? "open" : "closed";
    clearTimeout(foldTimer);

    rig.setAttribute("aria-label", open ? "Сложить телефон" : "Раскрыть складной телефон");
    if (hint) hint.textContent = open ? "Нажмите ещё раз, чтобы сложить" : "Нажмите на телефон, чтобы раскрыть";

    if (!animate || prefersReducedMotion) {
      rig.classList.add("no-anim");
      rig.dataset.state = nextState;
      void rig.offsetWidth;
      rig.classList.remove("no-anim");
      rig.classList.remove("is-awake");
      void rig.offsetWidth;
      rig.classList.add("is-awake");
      return;
    }

    const PHASES = ["is-opening", "is-closing", "is-cover-waking"];
    const startLift = () => {
      if (!lift) return;
      lift.classList.remove("is-moving");
      void lift.offsetWidth;
      lift.classList.add("is-moving");
    };
    const finish = () => {
      rig.classList.remove(...PHASES);
      if (lift) lift.classList.remove("is-moving");
      rig.classList.add("is-awake");
    };

    if (rig.dataset.state === nextState) {
      // Передумали в самом начале анимации — просто возвращаем экран
      finish();
      return;
    }

    rig.classList.remove("is-awake", ...PHASES);

    if (open) {
      // Раскрытие (вся хореография — в CSS по классу .is-opening):
      // • внешний экран остаётся включённым и, пока половина откидывается, медленно уходит в размытие;
      // • внутренний экран «загорается» от шарнира: сначала правая половина (тот же контент,
      //   что был на внешнем экране), затем левая — из размытия и темноты.
      rig.classList.add("is-opening");
      startLift();
      foldTimer = setTimeout(() => {
        rig.dataset.state = "open";
        // ждём, пока закончится включение левой половины (задержка 0.45s + 1.3s в CSS)
        foldTimer = setTimeout(finish, 1800);
      }, 60);
    } else {
      // Складывание: левая половина гаснет в размытие, правая остаётся как есть,
      // телефон закрывается, и под конец внешний экран медленно включается.
      rig.classList.add("is-closing");
      foldTimer = setTimeout(() => {
        startLift();
        rig.dataset.state = "closed";
        foldTimer = setTimeout(() => {
          rig.classList.add("is-cover-waking");
          foldTimer = setTimeout(finish, 1050);
        }, Math.round(FOLD_DURATION * 0.55));
      }, 300);
    }
  }

  function renderDeviceLab(animateFold = false) {
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
    syncFoldChips();

    // Складной телефон рисуется отдельной 3D-моделью вместо обычной рамки
    if (foldStage) foldStage.hidden = !isFold;
    if (frame) frame.hidden = isFold;
    if (isFold) {
      buildFoldScreens();
      setFoldState(state.foldMode === "unfolded", animateFold);
    }

    if (frame && !isFold) {
      frame.className = `lab-frame ${spec.frameClass}`;
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
          // Вкладка «Складной» всегда начинается со сложенного телефона (внешний экран)
          if (btn.dataset.device === "foldable" && state.labDevice !== "foldable") {
            state.foldMode = "cover";
          }
          state.labDevice = btn.dataset.device;
          renderDeviceLab();
        });
      });
    }

    function switchFold(mode) {
      if (state.foldMode === mode) return;
      state.foldMode = mode;
      renderDeviceLab(true);
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
    if (screenEl && typeof screenEl.onscroll === "function") screenEl.onscroll();
  }

  let modalHideTimer = null;

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

    function updateScrollChrome() {
      const y = window.scrollY;
      if (progressBar) {
        const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const ratio = Math.min(1, Math.max(0, y / docH));
        progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }
      if (bottomBar) {
        const show = y > 440;
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


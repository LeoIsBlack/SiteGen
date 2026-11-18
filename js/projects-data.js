/**
 * Курируемая коллекция примеров SiteGen:
 * 2 Лендинга · 2 Сайта на 5 страниц · 2 Маркетплейса
 * Каждый кейс содержит живые фотографии и интерактивную модель для предпросмотра.
 */
window.SITEGEN_PROJECTS = [
  // ==========================================
  // 1. ЛЕНДИНГ — AURA Sound
  // ==========================================
  {
    id: "aura-sound",
    category: "landing",
    categoryLabel: "Лендинг",
    title: "AURA Studio One",
    niche: "Премиальные беспроводные наушники",
    coverImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
    summary:
      "Одностраничный флагманский лендинг с крупными студийными фото, выбором цвета корпуса в реальном времени и предзаказом в один клик.",
    theme: {
      dark: true,
      bg: "#07080b",
      cardBg: "#12141a",
      text: "#f5f5f7",
      muted: "#8e929b",
      accent: "#5e9eff",
      accentSoft: "rgba(94, 158, 255, 0.16)",
      gradient: "radial-gradient(circle at 70% 25%, rgba(94,158,255,0.28), rgba(160,120,255,0.12) 45%, transparent 72%)"
    },
    metrics: [
      { value: "8.4%", label: "Конверсия в заказ" },
      { value: "0.6 сек", label: "Загрузка экрана" },
      { value: "5 дней", label: "Срок разработки" }
    ],
    features: [
      "Интерактивный конфигуратор цвета с живым фото",
      "Скролл-анимация акустических характеристик",
      "Моментальная заявка в WhatsApp и оплата"
    ],
    preview: {
      type: "landing",
      brand: "AURA",
      badge: "Spatial Audio · Gen 2",
      headline: "Тишина звучит иначе.",
      subhead: "Адаптивное шумоподавление до 48 дБ, 45 часов работы и титановое оголовье весом 240 г.",
      ctaText: "Оформить предзаказ",
      variants: [
        {
          id: "titanium",
          label: "Натуральный титан",
          swatch: "#c7c3bc",
          glow: "rgba(215, 210, 200, 0.35)",
          price: "29 900 ₽",
          delivery: "Доставка завтра",
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85"
        },
        {
          id: "midnight",
          label: "Обсидиан",
          swatch: "#262b36",
          glow: "rgba(94, 158, 255, 0.35)",
          price: "29 900 ₽",
          delivery: "В наличии",
          image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=85"
        },
        {
          id: "amber",
          label: "Тёплая бронза",
          swatch: "#b88a68",
          glow: "rgba(218, 156, 108, 0.38)",
          price: "32 500 ₽",
          delivery: "Лимитированная серия",
          image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=85"
        }
      ],
      modes: [
        { id: "anc", label: "ANC Pro", db: "-48 дБ", desc: "Полное отсечение городского шума и гула самолёта." },
        { id: "trans", label: "Прозрачность", db: "1:1", desc: "Естественная передача голоса собеседника без снятия наушников." },
        { id: "studio", label: "Мастеринг", db: "24-bit", desc: "Чистая неокрашенная АЧХ для работы со звуком." }
      ],
      highlights: [
        { title: "45 часов", desc: "Автономности с активным шумоподавлением" },
        { title: "BT 5.4 Lossless", desc: "Нулевая задержка при монтаже и играх" },
        { title: "USB-C Fast", desc: "10 минут зарядки = 6 часов музыки" }
      ]
    }
  },

  // ==========================================
  // 2. ЛЕНДИНГ — NORDIC Roasters
  // ==========================================
  {
    id: "nordic-roast",
    category: "landing",
    categoryLabel: "Лендинг",
    title: "NORDIC Roasters",
    niche: "Подписка на свежий спешелти-кофе",
    coverImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85",
    summary:
      "Тёплый минималистичный лендинг кофейни и обжарщика с атмосферными фото зерна, квизом вкуса и подпиской в 2 клика.",
    theme: {
      dark: false,
      bg: "#f9f7f4",
      cardBg: "#ffffff",
      text: "#1d1a16",
      muted: "#70685f",
      accent: "#b5652a",
      accentSoft: "rgba(181, 101, 42, 0.12)",
      gradient: "radial-gradient(circle at 75% 20%, rgba(214,142,82,0.22), rgba(240,224,204,0.3) 50%, transparent 75%)"
    },
    metrics: [
      { value: "×2.6", label: "Рост повторных заказов" },
      { value: "15 сек", label: "Подбор вкуса в квизе" },
      { value: "6 дней", label: "Срок разработки" }
    ],
    features: [
      "Интерактивный подбор обжарки и помола",
      "Калькулятор веса и регулярности доставки",
      "Светлая типографика и аппетитная подача"
    ],
    preview: {
      type: "landing",
      brand: "NORDIC",
      badge: "Обжарка каждую среду",
      headline: "Кофе, настроенный под ваше утро.",
      subhead: "Отбираем микролоты из Эфиопии и Колумбии, обжариваем под заказ и доставляем за 24 часа.",
      ctaText: "Собрать свою подписку",
      variants: [
        {
          id: "filter",
          label: "Светлая · Фильтр",
          swatch: "#d49b63",
          glow: "rgba(212, 155, 99, 0.28)",
          price: "1 490 ₽ / 250 г",
          delivery: "Ноты бергамота и жасмина",
          image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85"
        },
        {
          id: "espresso",
          label: "Средняя · Эспрессо",
          swatch: "#8c5128",
          glow: "rgba(140, 81, 40, 0.28)",
          price: "1 390 ₽ / 250 г",
          delivery: "Ноты тёмного шоколада и фундука",
          image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=85"
        },
        {
          id: "drip",
          label: "Дрип-бокс (10 шт)",
          swatch: "#3d2b1f",
          glow: "rgba(61, 43, 31, 0.22)",
          price: "1 190 ₽ / бокс",
          delivery: "Готово за 2 минуты в поездке",
          image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=85"
        }
      ],
      modes: [
        { id: "weekly", label: "Раз в неделю", db: "-15%", desc: "Свежая пачка каждую пятницу с бесплатной доставкой." },
        { id: "biweekly", label: "Раз в 2 недели", db: "-10%", desc: "Оптимально для дома: 1–2 чашки каждое утро." },
        { id: "once", label: "Разовый заказ", db: "0%", desc: "Попробуйте любой сорт без подписки и обязательств." }
      ],
      highlights: [
        { title: "87+ баллов", desc: "Оценка Q-грейдеров у каждого лота" },
        { title: "Бесплатный помол", desc: "Под турку, рожок, воронку или френч-пресс" },
        { title: "Пауза в 1 клик", desc: "Управление доставкой прямо через WhatsApp" }
      ]
    }
  },

  // ==========================================
  // 3. САЙТ НА 5 СТРАНИЦ — ARCTEC Architects
  // ==========================================
  {
    id: "arctec-studio",
    category: "five-page",
    categoryLabel: "5 страниц",
    title: "ARCTEC Bureau",
    niche: "Архитектурное бюро и частные резиденции",
    coverImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85",
    summary:
      "Полноценный корпоративный сайт на 5 страниц с фотографиями построенных вилл, презентацией бюро, этапами работ и контактами.",
    theme: {
      dark: true,
      bg: "#0c0d10",
      cardBg: "#16181e",
      text: "#f4f4f6",
      muted: "#9599a6",
      accent: "#e2e5ec",
      accentSoft: "rgba(255, 255, 255, 0.1)",
      gradient: "radial-gradient(circle at 25% 20%, rgba(255,255,255,0.12), rgba(140,160,200,0.08) 45%, transparent 72%)"
    },
    metrics: [
      { value: "5 страниц", label: "Полная структура" },
      { value: "42 объекта", label: "В портфолио" },
      { value: "10 дней", label: "Срок разработки" }
    ],
    features: [
      "Пять проработанных страниц: Главная, О бюро, Услуги, Проекты, Контакты",
      "Галерея объектов с адаптацией под планшеты и раскладные экраны",
      "Быстрая запись на консультацию с архитектором"
    ],
    preview: {
      type: "five-page",
      brand: "ARCTEC",
      tagline: "Архитектура света и тишины",
      pages: [
        {
          id: "home",
          num: "01",
          title: "Главная",
          heroTitle: "Проектируем пространства, которые не стареют.",
          heroLead: "Частные виллы, павильоны и минималистичные офисы с авторским надзором до выдачи ключей.",
          heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85",
          cards: [
            {
              tag: "2026 · Алматы",
              title: "Villa Horizon",
              meta: "640 м² · Монолитный бетон и панорамное стекло",
              image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=700&q=80"
            },
            {
              tag: "2025 · Астана",
              title: "Pavilion Nord",
              meta: "1 200 м² · Общественная резиденция и сад",
              image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=80"
            }
          ]
        },
        {
          id: "about",
          num: "02",
          title: "О бюро",
          heroTitle: "12 лет инженерной точности и чистоты линий.",
          heroLead: "В команде ARCTEC — 18 архитекторов, конструкторов и светодизайнеров. Мы ведём не более 6 крупных объектов в год.",
          heroImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
          stats: [
            { num: "12", label: "Лет практики" },
            { num: "42", label: "Построенных дома" },
            { num: "9", label: "Международных премий" }
          ],
          note: "Каждый узел просчитывается в 3D BIM-модели до выхода строительной техники на участок."
        },
        {
          id: "services",
          num: "03",
          title: "Услуги",
          heroTitle: "От концепции участка до мебели под заказ.",
          heroLead: "Прозрачные этапы проектирования с фиксированной сметой и графиком.",
          heroImage: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80",
          list: [
            { title: "Архитектурный проект", term: "6–8 недель", desc: "Планировки, 3D-визуализация естественного света и посадка дома на рельеф." },
            { title: "Рабочая документация BIM", term: "8 недель", desc: "Конструктив, инженерные сети и ведомости всех фасадных материалов." },
            { title: "Авторский надзор", term: "Весь цикл", desc: "Регулярные выезды на стройку, контроль подрядчиков и приёмка узлов." }
          ]
        },
        {
          id: "projects",
          num: "04",
          title: "Проекты",
          heroTitle: "Избранные резиденции и коммерческие объекты.",
          heroLead: "Реализованные дома со сдержанной геометрией и натуральными материалами.",
          cards: [
            {
              tag: "Резиденция",
              title: "Glass Forest House",
              meta: "480 м² · Кедр и панорамное остекление",
              image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=700&q=80"
            },
            {
              tag: "Бутик-отель",
              title: "Kolsay Retreat",
              meta: "1 850 м² · Натуральный камень и террасы",
              image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=700&q=80"
            },
            {
              tag: "Штаб-квартира",
              title: "Linear Tech Hub",
              meta: "2 400 м² · Стеклянный атриум и переговорные",
              image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=700&q=80"
            },
            {
              tag: "Вилла",
              title: "Caspian Dune",
              meta: "520 м² · Травертин и консольный бассейн",
              image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=700&q=80"
            }
          ]
        },
        {
          id: "contacts",
          num: "05",
          title: "Контакты",
          heroTitle: "Обсудим ваш участок и задачи.",
          heroLead: "Отвечаем в течение 30 минут, проводим первую встречу онлайн или в нашей мастерской.",
          heroImage: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
          office: "Пн–Сб · 10:00–19:00 · Индивидуальные проекты по всему миру",
          slots: ["Консультация по участку", "Расчёт стоимости проектирования", "Встреча с главным архитектором"]
        }
      ]
    }
  },

  // ==========================================
  // 4. САЙТ НА 5 СТРАНИЦ — VELA Dental & Aesthetic
  // ==========================================
  {
    id: "vela-clinic",
    category: "five-page",
    categoryLabel: "5 страниц",
    title: "VELA Clinic",
    niche: "Цифровая стоматология и эстетика",
    coverImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=85",
    summary:
      "Светлый 5-страничный сайт клиники премиум-класса: фотографии кабинетов и врачей, прозрачные направления и запись со смартфона.",
    theme: {
      dark: false,
      bg: "#f5f8fa",
      cardBg: "#ffffff",
      text: "#0f1c24",
      muted: "#5f717d",
      accent: "#0b84fe",
      accentSoft: "rgba(11, 132, 254, 0.1)",
      gradient: "radial-gradient(circle at 80% 15%, rgba(11,132,254,0.14), rgba(86,204,242,0.1) 48%, transparent 72%)"
    },
    metrics: [
      { value: "5 страниц", label: "Понятный путь клиента" },
      { value: "+140%", label: "Записей с телефона" },
      { value: "11 дней", label: "Срок разработки" }
    ],
    features: [
      "Пять разделов с живыми фото клиники и специалистов",
      "Удобные карточки врачей и фильтрация услуг",
      "Запись на приём в 2 касания с телефона"
    ],
    preview: {
      type: "five-page",
      brand: "VELA",
      tagline: "Эстетическая стоматология без стресса",
      pages: [
        {
          id: "home",
          num: "01",
          title: "Главная",
          heroTitle: "Здоровая улыбка с цифровой точностью.",
          heroLead: "3D-сканирование без слепков, микроскопия Leica и бережное лечение в спокойной атмосфере.",
          heroImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=85",
          cards: [
            {
              tag: "Диагностика",
              title: "3D КТ и цифровой скан за 15 мин",
              meta: "Точный фотопротокол и план лечения в день визита",
              image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=700&q=80"
            },
            {
              tag: "Комфорт",
              title: "Лечение без боли и тревоги",
              meta: "Тихие кабинеты, седация и чуткий персонал",
              image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=700&q=80"
            }
          ]
        },
        {
          id: "about",
          num: "02",
          title: "Клиника",
          heroTitle: "Стерильность и сервис уровня пятизвёздочного отеля.",
          heroLead: "Собственная цифровая зуботехническая лаборатория и официальная гарантия на реставрации до 10 лет.",
          heroImage: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80",
          stats: [
            { num: "4.9★", label: "Рейтинг пациентов" },
            { num: "7", label: "Врачей узкого профиля" },
            { num: "100%", label: "Лечение под увеличением" }
          ],
          note: "Принимаем взрослых и детей, полная смета фиксируется до начала любых процедур."
        },
        {
          id: "services",
          num: "03",
          title: "Направления",
          heroTitle: "Все ключевые услуги в одной клинике.",
          heroLead: "Выберите направление, чтобы узнать сроки и особенности процедуры.",
          heroImage: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=900&q=80",
          list: [
            { title: "Виниры и дизайн улыбки", term: "2 визита", desc: "Ультратонкая керамика E.max с примеркой будущей улыбки до начала работы." },
            { title: "Имплантация по шаблону", term: "40 минут", desc: "Бесшовная установка через навигационный 3D-шаблон с приживаемостью 99.2%." },
            { title: "Элайнеры и ортодонтия", term: "от 6 мес.", desc: "Прозрачные капы вместо брекетов с 3D-прогнозом результата по неделям." }
          ]
        },
        {
          id: "doctors",
          num: "04",
          title: "Врачи",
          heroTitle: "Команда врачей с международной практикой.",
          heroLead: "Над каждым кейсом работает консилиум из ортопеда, хирурга и терапевта-микроскописта.",
          cards: [
            {
              tag: "Главврач · Ортопед",
              title: "Алина Серова",
              meta: "Стаж 14 лет · Эстетические реставрации",
              image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=80"
            },
            {
              tag: "Хирург-имплантолог",
              title: "Тимур Каримов",
              meta: "Стаж 11 лет · Навигационная хирургия",
              image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=500&q=80"
            },
            {
              tag: "Врач-ортодонт",
              title: "Елена Маркова",
              meta: "Стаж 9 лет · Элайнеры и цифровая окклюзия",
              image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=500&q=80"
            },
            {
              tag: "Терапевт-микроскопист",
              title: "Данияр Нурланов",
              meta: "Стаж 8 лет · Сложная эндодонтия Leica",
              image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=500&q=80"
            }
          ]
        },
        {
          id: "booking",
          num: "05",
          title: "Запись",
          heroTitle: "Запишитесь на удобное время онлайн.",
          heroLead: "Администратор подтвердит приём в WhatsApp за 5 минут и отправит схему парковки.",
          heroImage: "https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=900&q=80",
          office: "Ежедневно 09:00–21:00 · Собственная парковка у входа",
          slots: ["Первичная 3D-консультация", "Профессиональная гигиена AirFlow", "Консультация по винирам"]
        }
      ]
    }
  },

  // ==========================================
  // 5. МАРКЕТПЛЕЙС — MODULAR Market
  // ==========================================
  {
    id: "modular-market",
    category: "marketplace",
    categoryLabel: "Маркетплейс",
    title: "MODULAR Market",
    niche: "Маркетплейс дизайнерской мебели и декора",
    coverImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=85",
    summary:
      "Торговая площадка для 120+ мебельных студий: живые фото интерьеров, фильтрация по категориям, карточки продавцов и умная корзина.",
    theme: {
      dark: false,
      bg: "#f6f5f2",
      cardBg: "#ffffff",
      text: "#181818",
      muted: "#6d6b66",
      accent: "#1d1d1f",
      accentSoft: "rgba(29, 29, 31, 0.08)",
      gradient: "radial-gradient(circle at 75% 25%, rgba(210,198,178,0.35), rgba(240,237,230,0.4) 50%, transparent 75%)"
    },
    metrics: [
      { value: "120+", label: "Продавцов на площадке" },
      { value: "0.3 сек", label: "Живая фильтрация" },
      { value: "21 день", label: "Срок разработки" }
    ],
    features: [
      "Каталог с фотографиями товаров, поиском и витринами брендов",
      "Интерактивная корзина и моментальный подсчёт заказа",
      "Удобная сетка карточек на ПК, планшетах и Fold-экранах"
    ],
    preview: {
      type: "marketplace",
      brand: "MODULAR",
      tagline: "Авторский интерьер от локальных студий",
      sellersCount: "124 мастерских",
      categories: ["Все", "Свет", "Кресла", "Столы", "Декор"],
      products: [
        {
          id: "m1",
          name: "Кресло Oslo Bouclé",
          seller: "Forma Studio",
          category: "Кресла",
          price: 48900,
          rating: "4.9",
          badge: "Хит",
          swatch: "#dfd8ce",
          image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "m2",
          name: "Лампа Dome Brass",
          seller: "SvetLab",
          category: "Свет",
          price: 16400,
          rating: "5.0",
          badge: "Новинка",
          swatch: "#cfa968",
          image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "m3",
          name: "Стол Travertine Low",
          seller: "StoneCraft",
          category: "Столы",
          price: 39200,
          rating: "4.8",
          badge: "В наличии",
          swatch: "#c9c1b4",
          image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "m4",
          name: "Керамическая ваза Monolith",
          seller: "Clay & Co",
          category: "Декор",
          price: 6800,
          rating: "4.9",
          badge: "-17%",
          swatch: "#9d8d7f",
          image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "m5",
          name: "Торшер Arc Minimal",
          seller: "SvetLab",
          category: "Свет",
          price: 24500,
          rating: "4.9",
          badge: "Топ-продавец",
          swatch: "#2e2f34",
          image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "m6",
          name: "Стул массив дуба Nord",
          seller: "NordWood",
          category: "Кресла",
          price: 21900,
          rating: "4.8",
          badge: "Эко",
          swatch: "#b78b5e",
          image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80"
        }
      ]
    }
  },

  // ==========================================
  // 6. МАРКЕТПЛЕЙС — KINETIX Gear
  // ==========================================
  {
    id: "kinetix-gear",
    category: "marketplace",
    categoryLabel: "Маркетплейс",
    title: "KINETIX Tech Market",
    niche: "Маркетплейс электроники и Pro-аксессуаров",
    coverImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85",
    summary:
      "Тёмный высокоскоростной маркетплейс гаджетов с реальными фото техники, рейтингом магазинов, фильтрами и смарт-корзиной.",
    theme: {
      dark: true,
      bg: "#090a0e",
      cardBg: "#13161e",
      text: "#f5f5f7",
      muted: "#8f96a6",
      accent: "#34d399",
      accentSoft: "rgba(52, 211, 153, 0.14)",
      gradient: "radial-gradient(circle at 70% 20%, rgba(52,211,153,0.2), rgba(59,130,246,0.14) 48%, transparent 72%)"
    },
    metrics: [
      { value: "4 800+", label: "Позиций в каталоге" },
      { value: "99.9%", label: "Скорость отклика UI" },
      { value: "24 дня", label: "Срок разработки" }
    ],
    features: [
      "Верифицированные продавцы и живые фото устройств",
      "Мгновенный поиск, фильтры и сортировка",
      "Смарт-корзина, готовая к оплате в пару касаний"
    ],
    preview: {
      type: "marketplace",
      brand: "KINETIX",
      tagline: "Проверенные магазины техники в одном окне",
      sellersCount: "68 магазинов",
      categories: ["Все", "Ноутбуки", "Аудио", "Зарядки", "Рабочее место"],
      products: [
        {
          id: "k1",
          name: "Монитор и док-станция Studio 5K",
          seller: "ProPort Store",
          category: "Рабочее место",
          price: 64900,
          rating: "4.9",
          badge: "Verified",
          swatch: "#4b5563",
          image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "k2",
          name: "GaN Зарядная станция 140W",
          seller: "VoltDirect",
          category: "Зарядки",
          price: 7400,
          rating: "5.0",
          badge: "Хит",
          swatch: "#1f2937",
          image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "k3",
          name: "Ультрабук AirPro 14 M-Series",
          seller: "iPoint Official",
          category: "Ноутбуки",
          price: 139000,
          rating: "5.0",
          badge: "Гарантия",
          swatch: "#9ca3af",
          image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "k4",
          name: "Акустика Studio Reference S2",
          seller: "AcousticHub",
          category: "Аудио",
          price: 34500,
          rating: "4.8",
          badge: "Top Rated",
          swatch: "#374151",
          image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "k5",
          name: "Механическая клавиатура Low-Profile",
          seller: "KeyCraft",
          category: "Рабочее место",
          price: 15900,
          rating: "4.9",
          badge: "-14%",
          swatch: "#6b7280",
          image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "k6",
          name: "Магнитный PowerBank 10K Qi2",
          seller: "VoltDirect",
          category: "Зарядки",
          price: 5900,
          rating: "4.9",
          badge: "Qi2",
          swatch: "#10b981",
          image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80"
        }
      ]
    }
  }
];

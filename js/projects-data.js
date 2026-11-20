/**
 * Реальные сайты из интернета в разделе «Примеры» (по форматам SiteGen):
 * 3 Лендинга · 2 Сайта на 5 страниц · 2 Маркетплейса
 * У каждого есть скриншоты адаптации под ПК, планшет, складной и обычный смартфон.
 */
window.SITEGEN_PROJECTS = [
  // ==========================================
  // 1. ЛЕНДИНГ · ПРЕМИУМ — Teenage Engineering
  // ==========================================
  {
    id: "teenage-engineering",
    category: "landing",
    categoryLabel: "Лендинг · Премиум",
    title: "Teenage Engineering",
    niche: "Дизайн-студия аудиотехники",
    domain: "teenage.engineering",
    liveUrl: "https://teenage.engineering/",
    heroShot: "assets/hero/teenage-desktop.jpg",
    coverImage: "assets/hero/teenage-desktop.jpg",
    shots: {
      desktop: "assets/sites/teenage-desktop.jpg",
      tablet: "assets/sites/teenage-tablet.jpg",
      foldable: "assets/sites/teenage-foldable.jpg",
      cover: "assets/sites/teenage-phone.jpg",
      mobile: "assets/sites/teenage-phone.jpg"
    },
    summary:
      "Смелый промышленный минимализм: глубокий чёрный фон, крупный продукт в центре, минимум текста и адаптация под 4 типа экранов.",
    theme: {
      dark: true,
      bg: "#050507",
      cardBg: "#121318",
      text: "#f5f5f7",
      muted: "#9497a1",
      accent: "#ff5a1f",
      accentSoft: "rgba(255, 90, 31, 0.16)",
      gradient: "radial-gradient(circle at 70% 20%, rgba(255,90,31,0.22), rgba(255,255,255,0.06) 48%, transparent 72%)"
    },
    metrics: [
      { value: "4 экрана", label: "ПК → телефон" },
      { value: "0 шума", label: "Продукт в центре" },
      { value: "от 5 дней", label: "Срок аналога" }
    ],
    features: [
      "Подача товара на тёмном студийном фоне без визуального мусора",
      "Сверхудобная мобильная и складная версия",
      "Можно сделать в этом же стиле под ваш продукт + заявки в WhatsApp"
    ],
    preview: { type: "real-site" }
  },

  // ==========================================
  // 2. ЛЕНДИНГ — Linear
  // ==========================================
  {
    id: "linear-app",
    category: "landing",
    categoryLabel: "Лендинг · IT-продукт",
    title: "Linear",
    niche: "Система управления проектами",
    domain: "linear.app",
    liveUrl: "https://linear.app/",
    heroShot: "assets/hero/linear-desktop.jpg",
    coverImage: "assets/hero/linear-desktop.jpg",
    shots: {
      desktop: "assets/sites/linear-desktop.jpg",
      tablet: "assets/sites/linear-tablet.jpg",
      foldable: "assets/sites/linear-foldable.jpg",
      cover: "assets/sites/linear-phone.jpg",
      mobile: "assets/sites/linear-phone.jpg"
    },
    summary:
      "Эталон продуктового лендинга: мощный первый заголовок, живой интерфейс сервиса под ним, логотипы клиентов и тёмная премиальная палитра.",
    theme: {
      dark: true,
      bg: "#08090a",
      cardBg: "#131519",
      text: "#f7f8f8",
      muted: "#8a8f98",
      accent: "#5e6ad2",
      accentSoft: "rgba(94, 106, 210, 0.18)",
      gradient: "radial-gradient(circle at 65% 22%, rgba(94,106,210,0.24), rgba(140,170,255,0.08) 48%, transparent 72%)"
    },
    metrics: [
      { value: "1 экран", label: "Суть за 3 сек" },
      { value: "UI-показ", label: "Продукт в деле" },
      { value: "от 5 дней", label: "Срок аналога" }
    ],
    features: [
      "Контрастная типографика и чёткая иерархия внимания",
      "Блок доверия с логотипами партнёров и понятным сценарием",
      "Чистая перестройка интерфейса на планшете и телефоне"
    ],
    preview: { type: "real-site" }
  },

  // ==========================================
  // 3. ЛЕНДИНГ — Vercel
  // ==========================================
  {
    id: "vercel-platform",
    category: "landing",
    categoryLabel: "Лендинг · Минимализм",
    title: "Vercel",
    niche: "Облачная платформа для веб-сервисов",
    domain: "vercel.com",
    liveUrl: "https://vercel.com/",
    heroShot: "assets/sites/vercel-desktop.jpg",
    coverImage: "assets/sites/vercel-desktop.jpg",
    shots: {
      desktop: "assets/sites/vercel-desktop.jpg",
      tablet: "assets/sites/vercel-tablet.jpg",
      foldable: "assets/sites/vercel-foldable.jpg",
      cover: "assets/sites/vercel-phone.jpg",
      mobile: "assets/sites/vercel-phone.jpg"
    },
    summary:
      "Швейцарская сетка на светлом фоне: тонкие разделители, два ясных целевых действия, полоса брендов и модульная структура блоков.",
    theme: {
      dark: false,
      bg: "#fafafa",
      cardBg: "#ffffff",
      text: "#111111",
      muted: "#666666",
      accent: "#111111",
      accentSoft: "rgba(17, 17, 17, 0.08)",
      gradient: "radial-gradient(circle at 70% 20%, rgba(0,112,243,0.12), rgba(0,0,0,0.04) 48%, transparent 72%)"
    },
    metrics: [
      { value: "2 CTA", label: "Сразу вверху" },
      { value: "Сетка", label: "Точная геометрия" },
      { value: "от 5 дней", label: "Срок аналога" }
    ],
    features: [
      "Высокая читаемость на светлом фоне и акцент на главном действии",
      "Лента доверия брендов прямо на первом экране",
      "Мгновенно читается с любого смартфона"
    ],
    preview: { type: "real-site" }
  },

  // ==========================================
  // 4. САЙТ НА 5 СТРАНИЦ — Stripe
  // ==========================================
  {
    id: "stripe-fintech",
    category: "five-page",
    categoryLabel: "5 страниц · Финтех",
    title: "Stripe",
    niche: "Платёжная инфраструктура для бизнеса",
    domain: "stripe.com",
    liveUrl: "https://stripe.com/",
    heroShot: "assets/hero/stripe-desktop.jpg",
    coverImage: "assets/hero/stripe-desktop.jpg",
    shots: {
      desktop: "assets/sites/stripe-desktop.jpg",
      tablet: "assets/sites/stripe-tablet.jpg",
      foldable: "assets/sites/stripe-foldable.jpg",
      cover: "assets/sites/stripe-phone.jpg",
      mobile: "assets/sites/stripe-phone.jpg"
    },
    summary:
      "Образцовый корпоративный сайт с верхним меню на 5 ключевых разделов (Продукты, Решения, Разработчикам, Ресурсы, Цены) и ярким градиентом.",
    theme: {
      dark: false,
      bg: "#ffffff",
      cardBg: "#f6f9fc",
      text: "#0a2540",
      muted: "#425466",
      accent: "#635bff",
      accentSoft: "rgba(99, 91, 255, 0.12)",
      gradient: "radial-gradient(circle at 75% 20%, rgba(99,91,255,0.2), rgba(255,140,80,0.14) 50%, transparent 75%)"
    },
    metrics: [
      { value: "5 разделов", label: "Понятное меню" },
      { value: "Бренды", label: "Блок доверия" },
      { value: "от 10 дней", label: "Срок аналога" }
    ],
    features: [
      "Логичная структура для компании: услуги, решения, цены и связь",
      "Убедительный первый экран с заметной кнопкой старта",
      "Адаптивное мобильное меню на узких и складных экранах"
    ],
    preview: { type: "real-site" }
  },

  // ==========================================
  // 5. САЙТ НА 5 СТРАНИЦ — Supabase
  // ==========================================
  {
    id: "supabase-cloud",
    category: "five-page",
    categoryLabel: "5 страниц · Платформа",
    title: "Supabase",
    niche: "Облачная платформа и сервисы",
    domain: "supabase.com",
    liveUrl: "https://supabase.com/",
    heroShot: "assets/sites/supabase-desktop.jpg",
    coverImage: "assets/sites/supabase-desktop.jpg",
    shots: {
      desktop: "assets/sites/supabase-desktop.jpg",
      tablet: "assets/sites/supabase-tablet.jpg",
      foldable: "assets/sites/supabase-foldable.jpg",
      cover: "assets/sites/supabase-phone.jpg",
      mobile: "assets/sites/supabase-phone.jpg"
    },
    summary:
      "Многораздельный сайт компании на базе бенто-карточек: сразу видны все 7 направлений услуг и переходы на разделы Документация, Цены и Решения.",
    theme: {
      dark: false,
      bg: "#f8f9fa",
      cardBg: "#ffffff",
      text: "#171717",
      muted: "#6b7280",
      accent: "#24b47e",
      accentSoft: "rgba(36, 180, 126, 0.12)",
      gradient: "radial-gradient(circle at 75% 20%, rgba(36,180,126,0.18), rgba(16,185,129,0.08) 50%, transparent 75%)"
    },
    metrics: [
      { value: "Bento", label: "Витрина услуг" },
      { value: "5+ секций", label: "Меню и карты" },
      { value: "от 10 дней", label: "Срок аналога" }
    ],
    features: [
      "Каждая услуга оформлена наглядной карточкой со схемой",
      "На телефоне сетка плавно перестраивается в удобную ленту",
      "Легко масштабировать под ваш каталог услуг и кейсов"
    ],
    preview: { type: "real-site" }
  },

  // ==========================================
  // 6. МАРКЕТПЛЕЙС — Apple Store
  // ==========================================
  {
    id: "apple-store",
    category: "marketplace",
    categoryLabel: "Маркетплейс · Витрина",
    title: "Apple Store",
    niche: "Официальный магазин техники",
    domain: "apple.com/store",
    liveUrl: "https://www.apple.com/store",
    heroShot: "assets/hero/applestore-desktop.jpg",
    coverImage: "assets/hero/applestore-desktop.jpg",
    shots: {
      desktop: "assets/sites/applestore-desktop.jpg",
      tablet: "assets/sites/applestore-tablet.jpg",
      foldable: "assets/sites/applestore-foldable.jpg",
      cover: "assets/sites/applestore-phone.jpg",
      mobile: "assets/sites/applestore-phone.jpg"
    },
    summary:
      "Чистая витрина интернет-магазина: горизонтальная лента категорий с фото товаров и крупные цветные карточки новинок.",
    theme: {
      dark: false,
      bg: "#f5f5f7",
      cardBg: "#ffffff",
      text: "#1d1d1f",
      muted: "#6e6e73",
      accent: "#0071e3",
      accentSoft: "rgba(0, 113, 227, 0.12)",
      gradient: "radial-gradient(circle at 75% 20%, rgba(0,113,227,0.14), rgba(190,40,90,0.1) 50%, transparent 75%)"
    },
    metrics: [
      { value: "Категории", label: "С фото товаров" },
      { value: "Карточки", label: "Серии и цены" },
      { value: "от 21 дня", label: "Срок аналога" }
    ],
    features: [
      "Быстрый доступ к категориям одним нажатием",
      "Фокус на фотографиях товара и понятных ценниках",
      "Идеальная адаптация под планшеты, складные экраны и телефоны"
    ],
    preview: { type: "real-site" }
  },

  // ==========================================
  // 7. МАРКЕТПЛЕЙС — Shopify App Store
  // ==========================================
  {
    id: "shopify-app-store",
    category: "marketplace",
    categoryLabel: "Маркетплейс · Каталог",
    title: "Shopify App Store",
    niche: "Площадка приложений и продавцов",
    domain: "apps.shopify.com",
    liveUrl: "https://apps.shopify.com/",
    heroShot: "assets/sites/shopifyapps-desktop.jpg",
    coverImage: "assets/sites/shopifyapps-desktop.jpg",
    shots: {
      desktop: "assets/sites/shopifyapps-desktop.jpg",
      tablet: "assets/sites/shopifyapps-tablet.jpg",
      foldable: "assets/sites/shopifyapps-foldable.jpg",
      cover: "assets/sites/shopifyapps-phone.jpg",
      mobile: "assets/sites/shopifyapps-phone.jpg"
    },
    summary:
      "Реальный русскоязычный маркетплейс сервисов: поиск по каталогу, бейджи, рейтинги ★, отзывы, подборки и адаптивная сетка продавцов.",
    theme: {
      dark: true,
      bg: "#07162b",
      cardBg: "#0f223d",
      text: "#f5f7fa",
      muted: "#9eb2cc",
      accent: "#00c88a",
      accentSoft: "rgba(0, 200, 138, 0.16)",
      gradient: "radial-gradient(circle at 70% 20%, rgba(0,200,138,0.22), rgba(59,130,246,0.18) 48%, transparent 72%)"
    },
    metrics: [
      { value: "Поиск", label: "По всему каталогу" },
      { value: "Рейтинг ★", label: "Отзывы и теги" },
      { value: "от 21 дня", label: "Срок аналога" }
    ],
    features: [
      "Контрастный верхний блок «выбор площадки» + светлый каталог ниже",
      "Сетка из 3 колонок на ПК плавно сжимается в 2 и 1 колонку",
      "Готовая логика для магазина или площадки с несколькими продавцами"
    ],
    preview: { type: "real-site" }
  }
];

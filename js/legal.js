/**
 * Документы сайта: публичная оферта, политика конфиденциальности, согласие на обработку
 * персональных данных, сведения о cookie. Реквизиты берутся из config.js (legal).
 * Документ открывается в окне по ссылке в подвале или по адресу вида #offer, #privacy.
 *
 * Тексты — типовой шаблон. Перед запуском проверьте их с юристом под свою страну и форму бизнеса.
 */
(function () {
  "use strict";

  const CONFIG = window.SITEGEN_CONFIG || {};
  const LEGAL = Object.assign(
    {
      sellerName: "ИП Фамилия Имя Отчество",
      taxIdLabel: "ИНН",
      taxId: "000000000000",
      city: "г. Город",
      email: "hello@sitegen.studio",
      workHours: "Пн–Пт, 10:00–19:00",
      documentsDate: "20 ноября 2026 г.",
      isPlaceholder: true
    },
    CONFIG.legal || {}
  );
  const BRAND = CONFIG.brandName || "SiteGen";
  const PHONE = CONFIG.whatsappDisplay || "";

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const seller = esc(LEGAL.sellerName);
  const taxLine = `${esc(LEGAL.taxIdLabel)} ${esc(LEGAL.taxId)}`;
  const site = esc(location.hostname || BRAND);

  const requisites = `
    <h4>Реквизиты и контакты</h4>
    <ul class="legal-requisites">
      <li><span>Исполнитель</span><strong>${seller}</strong></li>
      <li><span>${esc(LEGAL.taxIdLabel)}</span><strong>${esc(LEGAL.taxId)}</strong></li>
      <li><span>Местонахождение</span><strong>${esc(LEGAL.city)}</strong></li>
      <li><span>Электронная почта</span><strong><a href="mailto:${esc(LEGAL.email)}">${esc(LEGAL.email)}</a></strong></li>
      <li><span>WhatsApp</span><strong>${esc(PHONE)}</strong></li>
      <li><span>Время работы</span><strong>${esc(LEGAL.workHours)}</strong></li>
    </ul>`;

  const DOCS = {
    offer: {
      title: "Публичная оферта на оказание услуг по разработке сайтов",
      html: `
        <p class="legal-meta">Редакция от ${esc(LEGAL.documentsDate)}</p>
        <p>
          Настоящий документ — официальное предложение (публичная оферта) ${seller}
          (далее — «Исполнитель») заключить договор на оказание услуг по разработке сайтов
          на изложенных ниже условиях с любым лицом, принявшим оферту (далее — «Заказчик»).
        </p>

        <h4>1. Термины</h4>
        <ol>
          <li><b>Сайт</b> — результат услуг: лендинг (одностраничный сайт), сайт до пяти страниц или маркетплейс (каталог с корзиной).</li>
          <li><b>Бриф</b> — согласованное с Заказчиком описание задачи: структура, тексты, материалы, пожелания к дизайну и функциям.</li>
          <li><b>Канал связи</b> — переписка в WhatsApp по номеру ${esc(PHONE)} или по электронной почте ${esc(LEGAL.email)}.</li>
        </ol>

        <h4>2. Акцепт оферты</h4>
        <ol>
          <li>Акцептом оферты является оплата предоплаты по счёту или ссылке, выставленной Исполнителем после согласования брифа.</li>
          <li>С момента акцепта договор считается заключённым на условиях оферты и согласованного брифа. Бриф, смета и сроки, согласованные в канале связи, являются неотъемлемой частью договора.</li>
        </ol>

        <h4>3. Предмет договора</h4>
        <ol>
          <li>Исполнитель разрабатывает Сайт по брифу и передаёт его Заказчику, а Заказчик принимает и оплачивает услуги.</li>
          <li>Сайт адаптируется под компьютеры, планшеты, смартфоны и складные устройства. Заявки с Сайта могут приходить в WhatsApp Заказчика.</li>
          <li>Покупка домена, хостинга, платных сервисов и лицензий третьих лиц в стоимость не входит, если иное не указано в смете.</li>
        </ol>

        <h4>4. Порядок и сроки</h4>
        <ol>
          <li>Заказчик оставляет заявку в канале связи. Исполнитель уточняет задачу, готовит бриф, смету и сроки.</li>
          <li>Ориентировочные сроки: лендинг — от 5 рабочих дней, сайт на 5 страниц — от 10 рабочих дней, маркетплейс — от 21 рабочего дня. Точный срок фиксируется в смете.</li>
          <li>Срок начинает течь со дня поступления предоплаты и всех материалов, необходимых для работы (тексты, фотографии, логотип, доступы). Задержка материалов переносит срок на тот же период.</li>
          <li>Исполнитель показывает промежуточный результат по ссылке на демо-версию. В стоимость включены два круга правок в рамках брифа; изменения брифа и дополнительные правки оплачиваются отдельно по согласованию.</li>
        </ol>

        <h4>5. Стоимость и оплата</h4>
        <ol>
          <li>Стоимость определяется индивидуально и фиксируется в смете до начала работ.</li>
          <li>Оплата производится в два этапа: предоплата 50% — до начала работ, оставшиеся 50% — после согласования готового Сайта и до его публикации или передачи.</li>
          <li>Обязанность по оплате считается исполненной с момента поступления денег Исполнителю.</li>
        </ol>

        <h4>6. Приёмка</h4>
        <ol>
          <li>О готовности Сайта Исполнитель сообщает в канале связи и предоставляет ссылку для проверки.</li>
          <li>Заказчик в течение 3 рабочих дней принимает Сайт или направляет мотивированные замечания в рамках брифа. Если замечания не поступили в этот срок, услуги считаются принятыми.</li>
        </ol>

        <h4>7. Права на результат</h4>
        <ol>
          <li>Исключительные права на Сайт (дизайн и вёрстку, созданные для Заказчика) переходят Заказчику после полной оплаты.</li>
          <li>Заказчик гарантирует, что у него есть права на переданные материалы (тексты, фото, логотипы, товарные знаки), и отвечает за их содержание.</li>
          <li>Исполнитель вправе показывать Сайт в своём портфолио, если стороны не договорились об ином.</li>
        </ol>

        <h4>8. Отказ от услуг и возврат</h4>
        <ol>
          <li>Если Заказчик отказывается от услуг до начала работ, предоплата возвращается полностью.</li>
          <li>Если отказ поступил после начала работ, Исполнитель возвращает предоплату за вычетом стоимости фактически выполненной работы.</li>
          <li>Возврат производится тем же способом, которым была внесена оплата, в течение 10 рабочих дней после получения запроса.</li>
        </ol>

        <h4>9. Ответственность</h4>
        <ol>
          <li>Стороны отвечают за неисполнение обязательств в соответствии с применимым законодательством.</li>
          <li>Исполнитель не отвечает за перебои в работе хостинга, мессенджеров, платёжных и других сервисов третьих лиц, а также за результат продаж Заказчика.</li>
          <li>Общая ответственность Исполнителя ограничена суммой, фактически оплаченной Заказчиком по договору.</li>
        </ol>

        <h4>10. Персональные данные</h4>
        <p>
          Исполнитель обрабатывает персональные данные Заказчика в соответствии с
          <a href="#privacy" data-legal="privacy">Политикой конфиденциальности</a>.
        </p>

        <h4>11. Споры и прочие условия</h4>
        <ol>
          <li>Споры решаются переговорами. Срок ответа на претензию — 10 рабочих дней. Если спор не урегулирован, он передаётся в суд по месту нахождения Исполнителя в соответствии с применимым законодательством.</li>
          <li>Исполнитель вправе изменить оферту, опубликовав новую редакцию на сайте. Новая редакция не меняет условий уже заключённых договоров.</li>
        </ol>
        ${requisites}`
    },

    privacy: {
      title: "Политика конфиденциальности",
      html: `
        <p class="legal-meta">Редакция от ${esc(LEGAL.documentsDate)}</p>
        <p>
          Политика описывает, какие персональные данные ${seller} (далее — «Оператор») получает
          от посетителей сайта ${site} и клиентов, зачем и как их обрабатывает и защищает.
        </p>

        <h4>1. Какие данные мы получаем</h4>
        <ol>
          <li>Данные, которые вы сами сообщаете в WhatsApp или по почте: имя, номер телефона, название компании, описание задачи и материалы для сайта.</li>
          <li>Технические данные, которые браузер передаёт при загрузке страниц: IP-адрес, тип браузера и устройства. Их получают сервисы, с которых загружаются шрифты и изображения (см. раздел 5).</li>
          <li>Сайт не использует рекламные и аналитические счётчики и не просит вводить персональные данные в формы на самом сайте.</li>
        </ol>

        <h4>2. Зачем мы их обрабатываем</h4>
        <ol>
          <li>Чтобы ответить на ваш вопрос, подготовить смету и сроки.</li>
          <li>Чтобы заключить и исполнить договор по <a href="#offer" data-legal="offer">публичной оферте</a>: разработать, согласовать и передать сайт.</li>
          <li>Чтобы выполнять требования закона (бухгалтерский и налоговый учёт).</li>
        </ol>

        <h4>3. Основания обработки</h4>
        <p>Ваше согласие, которое вы даёте, когда пишете нам первыми, а также заключение и исполнение договора с вами.</p>

        <h4>4. Сроки хранения</h4>
        <p>
          Данные хранятся, пока это нужно для целей из раздела 2, но не дольше 3 лет после последнего
          общения или окончания договора, если более долгий срок не требуется по закону. После этого данные удаляются.
        </p>

        <h4>5. Передача третьим лицам</h4>
        <ol>
          <li>Мы не продаём и не передаём ваши данные третьим лицам для рекламы.</li>
          <li>Переписка идёт через WhatsApp (Meta) — сервис обрабатывает данные по своим правилам.</li>
          <li>Шрифты загружаются с Google Fonts, изображения — с Unsplash; эти сервисы технически получают IP-адрес вашего устройства.</li>
          <li>Данные могут быть переданы государственным органам, только если этого требует закон.</li>
        </ol>

        <h4>6. Ваши права</h4>
        <p>
          Вы можете узнать, какие ваши данные у нас есть, попросить исправить или удалить их и отозвать согласие —
          напишите на <a href="mailto:${esc(LEGAL.email)}">${esc(LEGAL.email)}</a> или в WhatsApp. Мы ответим в течение 10 рабочих дней.
        </p>

        <h4>7. Защита данных</h4>
        <p>
          Доступ к переписке и материалам есть только у Оператора и исполнителей, которые работают над вашим проектом.
          Мы используем защищённые учётные записи и не храним данные в открытом доступе.
        </p>

        <h4>8. Изменения</h4>
        <p>Новая редакция политики действует с момента публикации на сайте.</p>
        ${requisites}`
    },

    consent: {
      title: "Согласие на обработку персональных данных",
      html: `
        <p class="legal-meta">Редакция от ${esc(LEGAL.documentsDate)}</p>
        <p>
          Отправляя сообщение в WhatsApp или на электронную почту, указанные на сайте ${site}, я свободно,
          своей волей и в своём интересе даю ${seller} (${taxLine}, далее — «Оператор») согласие
          на обработку моих персональных данных на следующих условиях.
        </p>
        <ol>
          <li><b>Данные:</b> имя, номер телефона, адрес электронной почты, название компании, содержание переписки и переданные материалы.</li>
          <li><b>Цели:</b> ответ на обращение, подготовка сметы, заключение и исполнение договора на разработку сайта.</li>
          <li><b>Действия:</b> сбор, запись, систематизация, хранение, уточнение, использование, удаление и уничтожение — с использованием средств автоматизации и без них.</li>
          <li><b>Срок:</b> согласие действует до достижения целей обработки, но не более 3 лет с момента последнего обращения.</li>
          <li><b>Отзыв:</b> согласие можно отозвать в любой момент, написав на <a href="mailto:${esc(LEGAL.email)}">${esc(LEGAL.email)}</a> или в WhatsApp.</li>
        </ol>
        <p>
          Порядок обработки данных описан в <a href="#privacy" data-legal="privacy">Политике конфиденциальности</a>.
        </p>
        ${requisites}`
    },

    storage: {
      title: "Cookie и локальное хранилище",
      html: `
        <p class="legal-meta">Редакция от ${esc(LEGAL.documentsDate)}</p>
        <p>Сайт ${site} не использует cookie для рекламы и аналитики.</p>
        <ol>
          <li>
            В локальном хранилище вашего браузера (localStorage) сохраняются только настройки анимаций сайта,
            которые вы выбираете в разделе «Подход». Эти данные не покидают ваше устройство и не передаются нам.
          </li>
          <li>Сторонние сервисы, с которых загружаются шрифты и изображения (Google Fonts, Unsplash), могут работать по своим правилам.</li>
          <li>Очистить сохранённые настройки можно в настройках браузера: удалить данные этого сайта.</li>
        </ol>
        <p>Подробнее — в <a href="#privacy" data-legal="privacy">Политике конфиденциальности</a>.</p>`
    }
  };

  /* ---------- Подвал: реквизиты и контакты из config.js ---------- */
  function fillFooter() {
    const entity = document.querySelector("[data-footer-entity]");
    if (entity) entity.textContent = `${LEGAL.sellerName} · ${LEGAL.taxIdLabel} ${LEGAL.taxId}`;
    const phone = document.querySelector("[data-footer-phone]");
    if (phone && PHONE) phone.textContent = PHONE;
    const email = document.querySelector("[data-footer-email]");
    if (email) {
      email.textContent = LEGAL.email;
      email.href = `mailto:${LEGAL.email}`;
    }
    const hours = document.querySelector("[data-footer-hours]");
    if (hours) hours.textContent = LEGAL.workHours;
    if (LEGAL.isPlaceholder) {
      console.warn("SiteGen: в config.js (legal) указаны демонстрационные реквизиты — замените их на свои.");
    }
  }

  /* ---------- Окно документов ---------- */
  const modal = document.getElementById("legal-modal");
  const titleEl = document.getElementById("legal-title");
  const bodyEl = document.getElementById("legal-body");
  const closeBtn = document.getElementById("legal-close");
  let lastFocus = null;
  let hideTimer = null;

  function syncTabs(key) {
    document.querySelectorAll("[data-legal-tab]").forEach((tab) => {
      const on = tab.dataset.legalTab === key;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-pressed", String(on));
    });
  }

  function show(key) {
    const doc = DOCS[key];
    if (!doc || !modal) return false;
    titleEl.textContent = doc.title;
    bodyEl.innerHTML = doc.html;
    bodyEl.scrollTop = 0;
    syncTabs(key);
    return true;
  }

  function openDoc(key, updateHash = true) {
    if (!show(key)) return;
    if (modal.hidden) {
      lastFocus = document.activeElement;
      clearTimeout(hideTimer);
      modal.hidden = false;
      void modal.offsetWidth;
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }
    if (updateHash && location.hash !== `#${key}`) {
      // полный путь — чтобы адрес не зависел от <base> и т. п.
      try {
        history.replaceState(null, "", `${location.pathname}${location.search}#${key}`);
      } catch {
        /* адрес не обновится — документ всё равно открыт */
      }
    }
  }

  function closeDoc() {
    if (!modal || modal.hidden) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    if (DOCS[location.hash.slice(1)]) {
      try {
        history.replaceState(null, "", location.pathname + location.search);
      } catch {
        /* ничего страшного: адрес просто останется с #документом */
      }
    }
    hideTimer = setTimeout(() => {
      modal.hidden = true;
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus({ preventScroll: true });
    }, 320);
  }

  function init() {
    fillFooter();
    if (!modal) return;

    // Ссылки на документы — и в подвале, и внутри самих документов
    document.addEventListener("click", (e) => {
      const link = e.target.closest("[data-legal]");
      if (!link) return;
      e.preventDefault();
      openDoc(link.dataset.legal);
    });
    document.querySelectorAll("[data-legal-tab]").forEach((tab) => {
      tab.addEventListener("click", () => openDoc(tab.dataset.legalTab));
    });
    closeBtn.addEventListener("click", closeDoc);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeDoc();
    });
    document.addEventListener("keydown", (e) => {
      if (modal.hidden) return;
      if (e.key === "Escape") {
        closeDoc();
        return;
      }
      if (e.key === "Tab") {
        const items = Array.from(modal.querySelectorAll("button, [href]")).filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Прямая ссылка вида site/#offer открывает документ сразу
    const fromHash = () => {
      const key = location.hash.slice(1);
      if (DOCS[key]) openDoc(key, false);
    };
    window.addEventListener("hashchange", fromHash);
    fromHash();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

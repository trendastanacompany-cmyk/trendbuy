# SEO-аудит проекта trendbuy.kz (читаемая версия)

Дата: 18 апреля 2026
Статус: аудит по коду и структуре проекта (без live-crawl и Lighthouse)

---

## 1. Краткий вывод

Сайт уже может индексироваться, но текущая архитектура сильно ограничивает SEO-рост.
Главная причина: основной коммерческий контент живет в `public/index.html`, а корневой маршрут Next.js делает редирект на этот статический файл.

Из-за этого:
- сложно масштабировать SEO под категории/товары;
- не используется сильная сторона Next.js (metadata API, динамические SEO-страницы, ISR);
- отсутствуют базовые SEO-файлы (`robots`, `sitemap`) и системная каноникализация.

---

## 2. Что обнаружено в проекте

### 2.1 Архитектура и рендеринг

Текущее состояние:
- `apps/web/app/page.tsx` -> `redirect("/index.html")`
- `apps/web/app/admin/page.tsx` -> `redirect("/admin.html")`
- Основной контент витрины находится в `apps/web/public/index.html`
- Каталог товаров собирается клиентским JS из API (`/api/categories`, `/api/products`)

Риск для SEO:
- нет нормальных индексируемых URL для категорий и товаров;
- нет page-level metadata под конкретные поисковые интенты;
- сложнее управлять canonical/hreflang/структурированными данными.

### 2.2 Индексация

Проблемы:
- отсутствуют `robots.txt` и `sitemap.xml` (или `app/robots.ts`, `app/sitemap.ts`)
- нет явного запрета индексации `/admin`

Риск:
- слабый контроль обхода сайта роботами;
- медленная/неполная индексация после расширения страниц;
- риск попадания служебных URL в индекс.

### 2.3 Метатеги и разметка

Проблемы:
- отсутствуют `canonical` и `hreflang`
- нет `metadataBase` в корневом layout
- нет Open Graph / Twitter Cards на уровне Next metadata
- нет JSON-LD (Schema.org)
- на главной отсутствует корректный SEO `H1`
- в старом HTML использовался `meta keywords` (не нужен)

### 2.4 Производительность и CWV (по коду)

Потенциальные узкие места:
- много изображений через `<img>`, без `next/image`
- hero-слайдер и внешние скрипты вносят нагрузку
- клиентская отрисовка каталога может ухудшать INP на больших объёмах

Ожидаемые риски:
- LCP: тяжелый первый экран
- CLS: сдвиги из-за изображений/динамического контента
- INP: задержки при фильтрации/интеракциях

---

## 3. Приоритетные задачи (P0)

1. Перенести витрину из `public/index.html` в App Router страницы Next.js.
2. Ввести SEO-структуру URL:
   - `/catalog`
   - `/catalog/[categorySlug]`
   - `/catalog/[categorySlug]/[productSlug]`
3. Добавить `robots` + `sitemap`.
4. Добавить `canonical`, `metadataBase`, Open Graph, Twitter.
5. Закрыть админку от индексации (`noindex, nofollow`).
6. Добавить JSON-LD: `Organization/LocalBusiness`, затем `Product`, `BreadcrumbList`.

---

## 4. Technical SEO: практическая реализация

### 4.1 Robots

```ts
// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/uploads/private"],
      },
    ],
    sitemap: "https://trendbuy.kz/sitemap.xml",
    host: "https://trendbuy.kz",
  };
}
```

### 4.2 Sitemap

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://trendbuy.kz";

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
```

### 4.3 Базовые metadata в layout

```ts
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://trendbuy.kz"),
  title: {
    default: "Одноразовые товары для гостиниц в Казахстане | Trend Astana",
    template: "%s | Trend Astana",
  },
  description:
    "Оптовые поставки гостиничной продукции: шампуни, гели, тапочки, наборы. Доставка по Казахстану.",
  alternates: {
    canonical: "/",
    languages: {
      "ru-KZ": "/",
      "x-default": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    siteName: "Trend Astana",
    url: "https://trendbuy.kz",
    title: "Trend Astana",
    description: "Оптовый каталог товаров для гостиниц",
    images: [{ url: "/og/main.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trend Astana",
    description: "Товары для гостиниц оптом",
    images: ["/og/main.jpg"],
  },
};
```

### 4.4 noindex для админки

```ts
// app/admin/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};
```

### 4.5 JSON-LD (локальный бизнес)

```tsx
const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Trend Astana",
  url: "https://trendbuy.kz",
  telephone: "+77055845339",
  address: {
    "@type": "PostalAddress",
    streetAddress: "пр. Республики 30",
    addressLocality: "Астана",
    addressCountry: "KZ",
  },
  sameAs: ["https://www.instagram.com/eliteclasskz/"],
};
```

---

## 5. On-Page SEO

### 5.1 Формулы Title

Главная:
- `Одноразовые товары для гостиниц в Астане | Trend Astana`

Категория:
- `{Категория} для гостиниц оптом в Казахстане — цены и доставка | Trend Astana`

Товар:
- `{Товар} {характеристика} — купить оптом в Казахстане | Trend Astana`

### 5.2 Формулы Description

Главная:
- `Поставляем одноразовую продукцию для гостиниц и отелей: шампуни, гели, наборы, тапочки. Оптовые цены, быстрый расчёт и доставка по Казахстану.`

Категория:
- `Купить {категорию} для гостиниц оптом. Актуальные цены, подбор под ваш формат отеля и доставка по РК.`

Товар:
- `{Товар} для отелей и гостиниц оптом. Характеристики, цена и условия поставки по Казахстану.`

### 5.3 Структура заголовков

Рекомендуемый каркас главной:
- H1: Одноразовые товары для гостиниц и отелей в Казахстане
- H2: Категории продукции
- H2: Почему выбирают Trend Astana
- H2: Доставка и оплата
- H2: FAQ
- H2: Контакты

### 5.4 Внутренняя перелинковка

Сделать обязательно:
- Главная -> ключевые категории
- Категория -> карточки товаров + связанные категории
- Карточка -> похожие товары + возврат в категорию
- FAQ/блог -> ссылки на коммерческие посадочные

---

## 6. Content Strategy

### 6.1 Кластеры

1. Коммерческие категории
- шампуни для гостиниц
- гели для душа для отелей
- зубные наборы
- тапочки
- халаты
- косметические наборы

2. Сегменты клиентов
- товары для отелей
- товары для хостелов
- товары для апартаментов
- товары для SPA

3. Информационные материалы
- как рассчитать расход на номер
- как выбрать комплектацию для класса отеля
- как снизить cost-per-room

4. Региональные страницы
- Астана / Алматы / Шымкент / и т.д.

### 6.2 Пример страницы категории

URL:
- `/catalog/shampuni-dlya-gostinic`

Контент-блоки:
- краткий SEO-интро (5-7 предложений)
- ассортимент (типы/объёмы/упаковки)
- преимущества поставки
- FAQ (3-5 вопросов)
- CTA: запрос прайса

---

## 7. Programmatic SEO

Применимо, потому что у вас есть структура `категории + товары`.

Рекомендуемые URL:
- `/catalog`
- `/catalog/[categorySlug]`
- `/catalog/[categorySlug]/[productSlug]`
- `/regions/[citySlug]/[categorySlug]`

Ключевые правила качества:
- не создавать страницы без уникальной ценности
- для тонких страниц ставить `noindex`
- canonical на базовый URL без мусорных параметров

---

## 8. Next.js SEO (практика)

Что внедрить:
- `metadata` в root layout
- `generateMetadata()` для динамических страниц
- `generateStaticParams()` для категорий/товаров
- ISR (`revalidate`) для обновления контента

Пример `generateMetadata()` для категории:

```ts
import type { Metadata } from "next";

type Params = { categorySlug: string };

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { categorySlug } = await params;
  const categoryName = categorySlug.replaceAll("-", " ");

  const title = `${categoryName} для гостиниц оптом`;
  const description = `Купить ${categoryName} для гостиниц и отелей. Оптовые цены и доставка по Казахстану.`;

  return {
    title,
    description,
    alternates: { canonical: `/catalog/${categorySlug}` },
    openGraph: { title, description, url: `/catalog/${categorySlug}` },
    twitter: { title, description },
  };
}
```

---

## 9. Performance SEO

### 9.1 LCP

- hero-картинку отдавать оптимизированной и приоритетной
- заменить `<img>` на `next/image` там, где критично для первого экрана
- минимизировать блокирующие стили/скрипты

### 9.2 CLS

- фиксировать размеры изображений
- резервировать место под карточки/баннеры
- не вставлять контент выше уже отрисованного блока

### 9.3 INP

- упростить клиентские обработчики фильтров
- не рендерить сразу слишком большой DOM
- по мере роста каталога включить виртуализацию списка

---

## 10. Off-Page SEO

Базовый план:
- отраслевые каталоги HoReCa (качественные)
- партнёрские публикации в B2B медиа
- кейсы клиентов на сайте + дистрибуция
- работа с отзывами и репутацией

KPI:
- рост доменов-доноров
- рост non-brand трафика
- рост запросов в ТОП-10 по money pages

---

## 11. Local SEO

Сделать:
- оформить Google Business Profile полностью
- единый NAP (название/адрес/телефон) на сайте и картах
- публиковать фото и обновления профиля
- собирать отзывы и отвечать в SLA 24-48 часов
- создать локальные посадочные под ключевые города

---

## 12. Roadmap

### Quick Wins (1-3 дня)

1. Добавить `robots` и `sitemap`.
2. Добавить `metadataBase`, canonical, OG/Twitter.
3. Закрыть `/admin` от индексации.
4. Добавить корректный `H1` на главной.
5. Удалить `meta keywords` и дубликаты технических мета-тегов.
6. Добавить базовый JSON-LD (`Organization/LocalBusiness`).

### Medium (1-2 недели)

1. Перенести витрину из `public/index.html` в Next App Router.
2. Запустить категории как отдельные SEO-URL.
3. Внедрить шаблоны метаданных для категорий.
4. Улучшить контент категорий + FAQ.
5. Настроить мониторинг Web Vitals.

### Long-term (1-3 месяца)

1. Запустить карточки товаров как индексируемые URL.
2. Запустить programmatic SEO по городам и сегментам.
3. Построить контент-хаб (гайды/кейсы/сравнения).
4. Масштабировать off-page кампанию.

---

## 13. Checklist для команд

### DEV

- [ ] Перенести storefront в App Router
- [ ] Добавить `robots.ts`, `sitemap.ts`
- [ ] Внедрить metadata templates
- [ ] Внедрить canonical/hreflang
- [ ] Добавить JSON-LD
- [ ] Закрыть admin от индексации
- [ ] Оптимизировать изображения и скрипты
Q
### CONTENT

- [ ] Собрать keyword mapping по категориям
- [ ] Написать уникальные тексты категорий
- [ ] Добавить FAQ
- [ ] Добавить блоки сравнения/выбора
- [ ] Добавить региональные посадочные

### MARKETING

- [ ] Запустить outreach по отраслевым площадкам
- [ ] Настроить репутационный контур (карты/отзывы)
- [ ] Публиковать кейсы клиентов
- [ ] Вести KPI-отчёт по SEO ежемесячно

---

## 14. Следующий шаг (рекомендую)

Сначала сделать технический минимум (Quick Wins), затем переходить к миграции витрины в App Router и запуску категорийных URL.
Это даст самый быстрый рост видимости и снимет архитектурные ограничения.

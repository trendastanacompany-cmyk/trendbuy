export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://trendbuy.kz";
export const SITE_NAME = "Trend Astana";
export const DEFAULT_TITLE =
  "Одноразовые товары для гостиниц в Казахстане | Trend Astana";
export const DEFAULT_DESCRIPTION =
  "Оптовые поставки гостиничной продукции: шампуни, гели, тапочки, наборы и аксессуары. Доставка по Казахстану.";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function languageAlternates(path: string) {
  return {
    canonical: path,
    languages: {
      "ru-KZ": path,
      "x-default": path
    }
  };
}

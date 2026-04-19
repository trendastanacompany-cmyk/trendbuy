import type { Metadata } from "next";
import Image from "next/image";
import AboutSection from "../components/home/AboutSection";
import ContactSection from "../components/home/ContactSection";
import HeroSlider from "../components/home/HeroSlider";
import SiteFooter from "../components/layout/SiteFooter";
import SiteHeader from "../components/layout/SiteHeader";
import JsonLd from "../components/ui/JsonLd";
import ProductCatalog from "../components/catalog/ProductCatalog";
import { getCatalogData } from "../lib/catalog";
import { DEFAULT_DESCRIPTION, languageAlternates } from "../lib/seo";

export const metadata: Metadata = {
  title: "Одноразовые товары для гостиниц в Астане",
  description: DEFAULT_DESCRIPTION,
  alternates: languageAlternates("/"),
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Trend Astana",
  url: "https://trendbuy.kz",
  telephone: "+77055845339",
  image: "https://trendbuy.kz/img/logo.svg",
  address: {
    "@type": "PostalAddress",
    streetAddress: "пр. Республики 30",
    addressLocality: "Астана",
    addressCountry: "KZ",
  },
  sameAs: ["https://www.instagram.com/eliteclasskz/"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Trend Astana",
  url: "https://trendbuy.kz",
  inLanguage: "ru-KZ",
};

export default async function HomePage() {
  const { categories } = await getCatalogData();

  return (
    <div className="wrapper">
      <JsonLd data={localBusinessJsonLd} />
      <JsonLd data={websiteJsonLd} />

      <SiteHeader />

      <main className="main-page">
        <HeroSlider />
        <ProductCatalog categories={categories} />
        <AboutSection />
        <ContactSection />
      </main>

      <SiteFooter />

      <ul className="additional__items">
        <li className="additional__item">
          <a
            href="https://wa.me/77055845339"
            target="_blank"
            className="additional__link"
            rel="noreferrer"
          >
            <Image
              src="/img/icons/whatsapp.svg"
              alt="Whatsapp"
              width={48}
              height={48}
              loading="lazy"
            />
          </a>
        </li>
      </ul>
    </div>
  );
}

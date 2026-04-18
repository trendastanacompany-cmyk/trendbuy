import Image from "next/image";
import JsonLd from "../components/JsonLd";
import ProductCatalog from "../components/ProductCatalog";
import SiteHeader from "../components/SiteHeader";
import { getCatalogData } from "../lib/catalog";
import { DEFAULT_DESCRIPTION, languageAlternates } from "../lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Одноразовые товары для гостиниц в Астане",
  description: DEFAULT_DESCRIPTION,
  alternates: languageAlternates("/")
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
    addressCountry: "KZ"
  },
  sameAs: ["https://www.instagram.com/eliteclasskz/"]
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Trend Astana",
  url: "https://trendbuy.kz",
  inLanguage: "ru-KZ"
};

export default async function HomePage() {
  const { categories, products } = await getCatalogData();

  return (
    <div className="wrapper">
      <JsonLd data={localBusinessJsonLd} />
      <JsonLd data={websiteJsonLd} />

      <SiteHeader />

      <main className="main-page">
        <section id="home" className="main-page__slider slider">
          <div className="slider__container">
            <div className="slider__swiper swiper">
              <div className="swiper-wrapper">
                <div className="swiper-slide">
                  <div className="swiper-slide__bg">
                    <Image
                      src="/img/slider/bg-slide01.jpg"
                      alt="Товары для гостиниц оптом"
                      width={1920}
                      height={700}
                      priority
                      sizes="100vw"
                    />
                  </div>
                  <div className="swiper-slide__content">
                    <h1 className="swiper-slide__title">Одноразовые товары для гостиниц и отелей в Казахстане</h1>
                    <p className="swiper-slide__subtitile">
                      Поставляем гостиничную косметику, текстиль, наборы и аксессуары. Быстрый расчёт, стабильные
                      поставки и доставка по Казахстану.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ProductCatalog categories={categories} />

        <section id="about" className="main-page__about about">
          <div className="about__container _container">
            <h2 className="about__title main-title">
              <span>Почему выбирают Trend Astana</span>
            </h2>
            <div className="about__body body-about">
              <ul className="body-about__list">
                <li className="body-about__item">
                  <div className="body-about__img">
                    <Image src="/img/about/favorite.svg" alt="Ассортимент" width={56} height={56} loading="lazy" />
                  </div>
                  <h3 className="body-about__title">Широкий ассортимент</h3>
                  <p className="body-about__description">Категории для любых форматов: от хостелов до бизнес-отелей.</p>
                </li>
                <li className="body-about__item">
                  <div className="body-about__img">
                    <Image src="/img/about/sale.svg" alt="Оптовые цены" width={56} height={56} loading="lazy" />
                  </div>
                  <h3 className="body-about__title">Оптовые условия</h3>
                  <p className="body-about__description">Прозрачные цены и индивидуальные условия на регулярные закупки.</p>
                </li>
                <li className="body-about__item">
                  <div className="body-about__img">
                    <Image src="/img/about/support.svg" alt="Поддержка" width={56} height={56} loading="lazy" />
                  </div>
                  <h3 className="body-about__title">Оперативная поддержка</h3>
                  <p className="body-about__description">Помогаем подобрать позиции под ваш формат объекта и бюджет.</p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="contact" className="main-page__contact contact">
          <div className="contact__container">
            <div className="contact__body body-contact">
              <h2 className="body-contact__title">Контакты и заказ</h2>
              <div className="body-contact__items">
                <div className="body-contact__item body-contact__item_call">
                  <div className="body-contact__icon">
                    <Image src="/img/icons/contact-call.svg" alt="Телефон" width={24} height={24} loading="lazy" />
                  </div>
                  <div className="body-contact__info">
                    <a href="tel:+77055845339" className="body-contact__item-info">
                      +7 705 584 5339
                    </a>
                    <a href="tel:+77777048989" className="body-contact__item-info">
                      +7 777 704 8989
                    </a>
                  </div>
                </div>
                <div className="body-contact__item">
                  <div className="body-contact__icon">
                    <Image src="/img/icons/contact-mail.svg" alt="Почта" width={24} height={24} loading="lazy" />
                  </div>
                  <div className="body-contact__info">
                    <a href="mailto:trendastanacompany@gmail.com" className="body-contact__item-info">
                      trendastanacompany@gmail.com
                    </a>
                  </div>
                </div>
                <div className="body-contact__item">
                  <div className="body-contact__icon">
                    <Image src="/img/icons/contact-location.svg" alt="Адрес" width={24} height={24} loading="lazy" />
                  </div>
                  <div className="body-contact__info">
                    <a href="https://go.2gis.com/hKQIT" target="_blank" className="body-contact__item-info">
                      г. Астана, пр. Республики 30
                    </a>
                  </div>
                </div>
              </div>
              <p className="body-contact__item-info">
                В каталоге: {categories.length} категорий, {products.length} товаров.
              </p>
            </div>
            <div className="contact__map map">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2132.218564708032!2d71.42492716107782!3d51.167488421200744!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x424586d4a501edc1%3A0x78e5d29f7524d06b!2z0L_RgNC-0YHQvy4g0KDQtdGB0L_Rg9Cx0LvQuNC60LggMzAsINCQ0YHRgtCw0L3QsCAwMjAwMDA!5e0!3m2!1sru!2skz!4v1746160874955!5m2!1sru!2skz"
                referrerPolicy="no-referrer-when-downgrade"
                title="Карта офиса Trend Astana"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__container _container">
          <div className="footer__body body-footer">
            <a href="#home" className="body-footer__logo">
              <Image src="/img/logo-white.svg" alt="Trend Astana" width={188} height={52} loading="lazy" />
            </a>
            <ul className="menu__list menu__list_footer">
              <li className="menu__item">
                <a href="#products" className="menu__link menu__link_white">
                  Каталог
                </a>
              </li>
              <li className="menu__item">
                <a href="#about" className="menu__link menu__link_white">
                  Преимущества
                </a>
              </li>
              <li className="menu__item">
                <a href="#contact" className="menu__link menu__link_white">
                  Контакты
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      <ul className="additional__items">
        <li className="additional__item">
          <a href="https://wa.me/77055845339" target="_blank" className="additional__link" rel="noreferrer">
            <Image src="/img/icons/whatsapp.svg" alt="Whatsapp" width={48} height={48} loading="lazy" />
          </a>
        </li>
      </ul>
    </div>
  );
}

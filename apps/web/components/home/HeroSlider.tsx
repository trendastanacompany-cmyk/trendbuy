"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import "swiper/css/bundle";

const slides = [
  {
    bg: "/img/slider/bg-slide01.jpg",
    title: "Всё для комфорта ваших гостей — быстро, удобно, надежно",
    subtitle:
      "Полный ассортимент товаров для гостиничного сервиса: от полотенец до гигиенических наборов. Упрощаем закупки — вы сосредотачиваетесь на качестве обслуживания",
  },
  {
    bg: "/img/slider/bg-slide02.jpg",
    title: "Создаём уют с первых минут пребывания",
    subtitle:
      "Предметы гигиены, текстиль и аксессуары — всё, чтобы гость почувствовал заботу с порога. Удобные решения для отелей, хостелов и апартаментов",
  },
  {
    bg: "/img/slider/bg-slide03.jpg",
    title: "Полный комплект заботы о гостях — от полотенца до шампуня",
    subtitle:
      "Предлагаем всё необходимое для оснащения гостиничных номеров. Комплексный подход, который помогает создать атмосферу уюта и чистоты",
  },
];

export default function HeroSlider() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let instance: { destroy: (a: boolean, b: boolean) => void } | null = null;

    import("swiper/bundle").then(({ default: Swiper }) => {
      if (!containerRef.current) return;
      instance = new (Swiper as new (
        el: HTMLElement,
        config: object
      ) => { destroy: (a: boolean, b: boolean) => void })(containerRef.current, {
        loop: true,
        parallax: true,
        autoplay: { delay: 6000, disableOnInteraction: false },
        pagination: { el: ".swiper-pagination", clickable: true },
      });
    });

    return () => {
      instance?.destroy(true, true);
    };
  }, []);

  return (
    <section id="home" className="main-page__slider slider">
      <div className="slider__container">
        <div ref={containerRef} className="slider__swiper swiper">
          <div className="swiper-wrapper">
            {slides.map((slide, index) => (
              <div className="swiper-slide" key={index}>
                <div className="swiper-slide__bg">
                  <Image
                    src={slide.bg}
                    alt={slide.title}
                    width={1920}
                    height={700}
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="100vw"
                  />
                </div>
                <div className="swiper-slide__content">
                  <h2 className="swiper-slide__title" data-swiper-parallax="-600">
                    {slide.title}
                  </h2>
                  <p className="swiper-slide__subtitile" data-swiper-parallax="-400">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="swiper-pagination" />
        </div>
      </div>
    </section>
  );
}

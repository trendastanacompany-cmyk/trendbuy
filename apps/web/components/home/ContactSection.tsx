"use client";

import Image from "next/image";
import { useState } from "react";

const contactItems = [
  {
    icon: "/img/icons/contact-location.svg",
    alt: "Локация",
    href: "https://go.2gis.com/hKQIT",
    label: "г. Астана, пр. Республики 30",
    external: true,
  },
  {
    icon: "/img/icons/contact-clock.svg",
    alt: "Часы",
    href: "https://go.2gis.com/hKQIT",
    label: "Ежедневно с 10:00 до 20:00",
    external: true,
  },
  {
    icon: "/img/icons/contact-mail.svg",
    alt: "Email",
    href: "mailto:trendastanacompany@gmail.com",
    label: "trendastanacompany@gmail.com",
    external: false,
  },
  {
    icon: "/img/icons/contact-instagram.svg",
    alt: "Instagram",
    href: "https://www.instagram.com/trendbuy_astana?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    label: "@trendbuy",
    external: true,
  },
];

const phones = [{ href: "tel:+77777048989", label: "+7 777 704 8989" }];

const mapLinks = [
  {
    href: "https://maps.app.goo.gl/btrc4Nq28uyBPqMY6",
    icon: "/img/icons/google-maps.svg",
    alt: "Google Maps",
  },
  {
    href: "https://go.2gis.com/tDhyn",
    icon: "/img/icons/2gis.svg",
    alt: "2GIS",
  },
  {
    href: "https://yandex.kz/maps/ru/-/CHrAy60c",
    icon: "/img/icons/yandex-maps.svg",
    alt: "Яндекс Карты",
  },
];

const MAP_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2132.218564708032!2d71.42492716107782!3d51.167488421200744!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x424586d4a501edc1%3A0x78e5d29f7524d06b!2z0L_RgNC-0YHQvy4g0KDQtdGB0L_Rg9Cx0LvQuNC60LggMzAsINCQ0YHRgtCw0L3QsCAwMjAwMDA!5e0!3m2!1sru!2skz!4v1746160874955!5m2!1sru!2skz";

export default function ContactSection() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (res.ok) {
        setName("");
        setPhone("");
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="main-page__contact contact">
      <div className="contact__container">
        <div className="contact__body body-contact">
          <h2 className="body-contact__title">Заказать звонок</h2>

          <div className="body-contact__items">
            <div className="body-contact__item body-contact__item_call">
              <div className="body-contact__icon">
                <Image
                  src="/img/icons/contact-call.svg"
                  alt="Звонок"
                  width={24}
                  height={24}
                  loading="lazy"
                />
              </div>
              <div className="body-contact__info">
                {phones.map((p) => (
                  <a
                    key={p.href}
                    href={p.href}
                    className="body-contact__item-info"
                  >
                    {p.label}
                  </a>
                ))}
              </div>
            </div>

            {contactItems.map((item) => (
              <div className="body-contact__item" key={item.alt}>
                <div className="body-contact__icon">
                  <Image
                    src={item.icon}
                    alt={item.alt}
                    width={24}
                    height={24}
                    loading="lazy"
                  />
                </div>
                <div className="body-contact__info">
                  <a
                    href={item.href}
                    className="body-contact__item-info"
                    {...(item.external
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                  >
                    {item.label}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <form className="body-contact__form form" onSubmit={handleSubmit}>
            <input
              autoComplete="off"
              type="text"
              required
              placeholder="Имя"
              className="form__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              autoComplete="off"
              type="text"
              required
              placeholder="Номер телефона"
              className="form__input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button className="form__btn" disabled={status === "sending"}>
              {status === "sending" ? "Отправка..." : "Отправить"}
            </button>
            {status === "sent" && (
              <p style={{ color: "green", marginTop: "0.5rem" }}>
                Данные отправлены. Ожидайте звонка.
              </p>
            )}
            {status === "error" && (
              <p style={{ color: "red", marginTop: "0.5rem" }}>
                Произошла ошибка. Повторите попытку.
              </p>
            )}
          </form>

          <div className="body-contact__maps-links">
            {mapLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="body-contact__map-link"
                target="_blank"
                rel="noreferrer"
              >
                <Image
                  src={link.icon}
                  alt={link.alt}
                  width={40}
                  height={40}
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>

        <div className="contact__map map">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            src={MAP_EMBED}
            referrerPolicy="no-referrer-when-downgrade"
            title="Карта офиса Trend Astana"
          />
        </div>
      </div>
    </section>
  );
}

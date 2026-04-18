"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "#home", label: "Главная" },
  { href: "#products", label: "Продукция" },
  { href: "#about", label: "Почему мы" },
  { href: "#contact", label: "Контакты" },
  { href: "/catalog", label: "SEO-каталог" }
];

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("lock", isMenuOpen);
    return () => document.body.classList.remove("lock");
  }, [isMenuOpen]);

  return (
    <header className="header">
      <div className="header__container _container">
        <div className="header__body body-header">
          <a href="#home" className="body-header__logo">
            <Image src="/img/logo.svg" alt="Trend Astana" width={188} height={52} priority />
          </a>

          <div className="body-header__menu menu">
            <nav className={`menu__body ${isMenuOpen ? "active" : ""}`}>
              <ul className="menu__list">
                {links.map((link) => (
                  <li className="menu__item" key={link.href}>
                    {link.href.startsWith("/") ? (
                      <Link href={link.href} className="menu__link" onClick={() => setIsMenuOpen(false)}>
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="menu__link" onClick={() => setIsMenuOpen(false)}>
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <button
              type="button"
              className={`menu__icon icon-menu ${isMenuOpen ? "active" : ""}`}
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-label="Открыть меню"
            >
              <span />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

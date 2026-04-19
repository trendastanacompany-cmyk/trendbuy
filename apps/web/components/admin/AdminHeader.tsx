"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "#admin-categories", label: "Категории" },
  { href: "#admin-products", label: "Товары" },
  { href: "/", label: "На сайт" },
];

export default function AdminHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("lock", isMenuOpen);
    return () => document.body.classList.remove("lock");
  }, [isMenuOpen]);

  return (
    <header className="header admin-header">
      <div className="header__container _container">
        <div className="header__body body-header">
          <Link href="/" className="body-header__logo">
            <Image
              src="/img/logo.svg"
              alt="Trend Astana"
              width={100}
              height={70}
              priority
            />
          </Link>

          <div className="body-header__menu menu">
            <nav className={`menu__body ${isMenuOpen ? "active" : ""}`}>
              <ul className="menu__list">
                {navLinks.map((link) => (
                  <li className="menu__item" key={link.href}>
                    <a
                      href={link.href}
                      className="menu__link"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <button
              type="button"
              className={`menu__icon icon-menu ${isMenuOpen ? "active" : ""}`}
              onClick={() => setIsMenuOpen((v) => !v)}
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

import Image from "next/image";

const footerLinks = [
  { href: "#home", label: "Главная" },
  { href: "#products", label: "Продукция" },
  { href: "#about", label: "Почему мы" },
  { href: "#contact", label: "Контакты" },
];

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__container _container">
        <div className="footer__body body-footer">
          <a href="#home" className="body-footer__logo">
            <Image
              src="/img/logo-white.svg"
              alt="Trend Astana"
              width={188}
              height={52}
              loading="lazy"
            />
          </a>
          <ul className="menu__list menu__list_footer">
            {footerLinks.map((link) => (
              <li className="menu__item" key={link.href}>
                <a href={link.href} className="menu__link menu__link_white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

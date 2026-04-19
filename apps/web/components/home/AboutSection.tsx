import Image from "next/image";

const items = [
  {
    icon: "/img/about/favorite.svg",
    title: "Ассортимент",
    description: "У нас вы можете в любом количестве как оптом, так и в розницу",
  },
  {
    icon: "/img/about/bascet.svg",
    title: "Образцы",
    description: "Предоставляем бесплатные образцы товара, отправка по всему Казахстану",
  },
  {
    icon: "/img/about/cards.svg",
    title: "Оплата любым способом",
    description: "Наличными курьеру, наложенный платеж, оплата на карточку, безналичный расчет",
  },
  {
    icon: "/img/about/sale.svg",
    title: "Скидки на крупный заказ",
    description: "При заказе от 10 000 единиц товара — специальная скидка",
  },
  {
    icon: "/img/about/support.svg",
    title: "Поддержка 24/7",
    description: "Мы всегда на связи — поможем, подскажем, решим вопрос",
  },
  {
    icon: "/img/about/cooperation.svg",
    title: "Гибкие условия сотрудничества",
    description: "Индивидуальные цены и предложения для постоянных клиентов и оптовиков",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="main-page__about about">
      <div className="about__container _container">
        <h2 className="about__title main-title">
          <span>Почему мы</span>
        </h2>
        <div className="about__body body-about">
          <ul className="body-about__list">
            {items.map((item) => (
              <li className="body-about__item" key={item.title}>
                <div className="body-about__img">
                  <Image src={item.icon} alt={item.title} width={56} height={56} loading="lazy" />
                </div>
                <h3 className="body-about__title">{item.title}</h3>
                <p className="body-about__description">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

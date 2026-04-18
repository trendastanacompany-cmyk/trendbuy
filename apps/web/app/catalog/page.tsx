import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getCatalogData, normalizeImagePath } from "../../lib/catalog";
import { languageAlternates } from "../../lib/seo";

export const metadata: Metadata = {
  title: "Каталог товаров для гостиниц",
  description: "Категории продукции для отелей и гостиниц: косметика, наборы, текстиль и аксессуары.",
  alternates: languageAlternates("/catalog")
};

export default async function CatalogPage() {
  const { categories } = await getCatalogData();

  return (
    <main className="main-page">
      <section className="main-page__products">
        <div className="products__container _container">
          <h1 className="main-title">
            <span>Каталог товаров для гостиниц</span>
          </h1>

          <ul className="body-products__products products">
            {categories.map((category) => (
              <li className="products__item" key={category.id}>
                <article>
                  <Link href={`/catalog/${category.slug}`} className="products__image">
                    <Image
                      src={normalizeImagePath(category.products[0]?.image || "/img/products/product-01.png")}
                      alt={category.name}
                      width={420}
                      height={420}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 20vw"
                    />
                  </Link>
                  <div className="products__description">
                    <h2 className="products__name">{category.name}</h2>
                    <span className="additional-information">Товаров: {category.products.length}</span>
                    <div className="products__info">
                      <Link href={`/catalog/${category.slug}`} className="menu__link">
                        Перейти в категорию
                      </Link>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

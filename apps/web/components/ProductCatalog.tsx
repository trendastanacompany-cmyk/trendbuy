"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CatalogCategory } from "../lib/catalog";
import { normalizeImagePath } from "../lib/catalog";

type Props = {
  categories: CatalogCategory[];
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export default function ProductCatalog({ categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const visibleProducts = useMemo(() => {
    if (selectedCategory === "all") {
      return categories.flatMap((category) =>
        category.products.map((product) => ({
          ...product,
          categoryName: category.name,
          categorySlug: category.slug
        }))
      );
    }

    const target = categories.find((category) => category.slug === selectedCategory);
    if (!target) return [];

    return target.products.map((product) => ({
      ...product,
      categoryName: target.name,
      categorySlug: target.slug
    }));
  }, [categories, selectedCategory]);

  return (
    <section id="products" className="main-page__products">
      <div className="products__container _container">
        <h2 className="products__title main-title">
          <span>Каталог продукции</span>
        </h2>

        <div className="products__body body-products">
          <div className="body-products__filter-wrapper">
            <ul className="body-products__filter filter">
              <li
                className={`filter__item ${selectedCategory === "all" ? "active" : ""}`}
                onClick={() => setSelectedCategory("all")}
              >
                Все
              </li>
              {categories.map((category) => (
                <li
                  key={category.id}
                  className={`filter__item ${selectedCategory === category.slug ? "active" : ""}`}
                  onClick={() => setSelectedCategory(category.slug)}
                >
                  {category.name}
                </li>
              ))}
            </ul>
          </div>

          <ul className="body-products__products products">
            {visibleProducts.map((product) => (
              <li className="products__item" key={product.id}>
                <article>
                  <Link href={`/catalog/${product.categorySlug}/${product.slug}`} className="products__image">
                    <Image
                      src={normalizeImagePath(product.image)}
                      alt={product.name}
                      width={420}
                      height={420}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 20vw"
                      loading="lazy"
                    />
                  </Link>
                  <div className="products__description">
                    <h3 className="products__name">{product.name}</h3>
                    <span className="additional-information">{product.description || product.categoryName}</span>
                    <div className="products__info">
                      <span className="regular">
                        {product.oldPrice ? <span>{formatPrice(product.oldPrice)} тг / </span> : null}
                      </span>
                      <span className="bold">{formatPrice(product.price)} тг</span>
                    </div>
                    <Link href={`/catalog/${product.categorySlug}`} className="menu__link">
                      Смотреть категорию
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

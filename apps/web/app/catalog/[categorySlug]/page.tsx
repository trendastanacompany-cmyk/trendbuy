import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, normalizeImagePath } from "../../../lib/catalog";
import { languageAlternates } from "../../../lib/seo";

type Params = {
  categorySlug: string;
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolved = await params;
  const category = await getCategoryBySlug(resolved.categorySlug);
  if (!category) return {};

  const path = `/catalog/${category.slug}`;

  return {
    title: `${category.name} для гостиниц оптом в Казахстане`,
    description: `Купить ${category.name} для гостиниц оптом. Актуальные цены, подбор под формат отеля и доставка по РК.`,
    alternates: languageAlternates(path)
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const resolved = await params;
  const category = await getCategoryBySlug(resolved.categorySlug);
  if (!category) notFound();

  return (
    <main className="main-page">
      <section className="main-page__products">
        <div className="products__container _container">
          <h1 className="main-title">
            <span>{category.name}</span>
          </h1>

          <p>
            <Link href="/catalog" className="menu__link">
              Все категории
            </Link>
          </p>

          <ul className="body-products__products products">
            {category.products.map((product) => (
              <li className="products__item" key={product.id}>
                <article>
                  <Link href={`/catalog/${category.slug}/${product.slug}`} className="products__image">
                    <Image
                      src={normalizeImagePath(product.image)}
                      alt={product.name}
                      width={420}
                      height={420}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 20vw"
                    />
                  </Link>
                  <div className="products__description">
                    <h2 className="products__name">{product.name}</h2>
                    <span className="additional-information">{product.description || category.name}</span>
                    <div className="products__info">
                      <span className="bold">{new Intl.NumberFormat("ru-RU").format(product.price)} тг</span>
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

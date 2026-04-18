import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "../../../../components/JsonLd";
import { getProductBySlugs, normalizeImagePath } from "../../../../lib/catalog";
import { languageAlternates } from "../../../../lib/seo";

type Params = {
  categorySlug: string;
  productSlug: string;
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolved = await params;
  const data = await getProductBySlugs(resolved.categorySlug, resolved.productSlug);
  if (!data) return {};

  const path = `/catalog/${data.category.slug}/${data.product.slug}`;

  return {
    title: `${data.product.name} — купить оптом в Казахстане`,
    description: `${data.product.name} для отелей и гостиниц оптом. Характеристики, цена и условия поставки по Казахстану.`,
    alternates: languageAlternates(path),
    openGraph: {
      images: [normalizeImagePath(data.product.image)]
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const resolved = await params;
  const data = await getProductBySlugs(resolved.categorySlug, resolved.productSlug);
  if (!data) notFound();

  const price = new Intl.NumberFormat("ru-RU").format(data.product.price);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Каталог", item: "https://trendbuy.kz/catalog" },
      {
        "@type": "ListItem",
        position: 2,
        name: data.category.name,
        item: `https://trendbuy.kz/catalog/${data.category.slug}`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: data.product.name,
        item: `https://trendbuy.kz/catalog/${data.category.slug}/${data.product.slug}`
      }
    ]
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.product.name,
    image: [`https://trendbuy.kz${normalizeImagePath(data.product.image)}`],
    description: data.product.description || data.category.name,
    category: data.category.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "KZT",
      price: data.product.price,
      availability: "https://schema.org/InStock",
      url: `https://trendbuy.kz/catalog/${data.category.slug}/${data.product.slug}`
    }
  };

  return (
    <main className="main-page">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={productJsonLd} />

      <section className="main-page__products">
        <div className="products__container _container">
          <h1 className="main-title">
            <span>{data.product.name}</span>
          </h1>

          <p>
            <Link href="/catalog" className="menu__link">
              Каталог
            </Link>{" "}
            /{" "}
            <Link href={`/catalog/${data.category.slug}`} className="menu__link">
              {data.category.name}
            </Link>
          </p>

          <article className="products__item" style={{ maxWidth: 560, margin: "30px auto" }}>
            <div className="products__image">
              <Image src={normalizeImagePath(data.product.image)} alt={data.product.name} width={640} height={640} priority />
            </div>
            <div className="products__description">
              <h2 className="products__name">{data.product.name}</h2>
              <span className="additional-information">{data.product.description || data.category.name}</span>
              <div className="products__info">
                {data.product.oldPrice ? (
                  <span className="regular">
                    <span>{new Intl.NumberFormat("ru-RU").format(data.product.oldPrice)} тг / </span>
                  </span>
                ) : null}
                <span className="bold">{price} тг</span>
              </div>
              <p>
                <a href="tel:+77055845339" className="menu__link">
                  Уточнить оптовую цену
                </a>
              </p>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

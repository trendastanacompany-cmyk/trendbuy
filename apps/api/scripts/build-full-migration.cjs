const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.resolve(__dirname, "..", "..", "..");
const legacyProductsPath = path.join(rootDir, "js", "products.js");
const catalogPath = path.join(rootDir, "data", "catalog.json");
const outPath = path.join(__dirname, "..", "migrations", "full-products-migration.json");

function loadLegacyGroups() {
  const code = fs.readFileSync(legacyProductsPath, "utf8");
  const transformed = code.replace(/^\s*export\s+const\s+products\s*=\s*/, "module.exports = ");
  const sandbox = { module: { exports: [] }, exports: {} };
  vm.runInNewContext(transformed, sandbox, { filename: legacyProductsPath });
  return Array.isArray(sandbox.module.exports) ? sandbox.module.exports : [];
}

function normalizeImagePath(image) {
  const raw = String(image || "").trim().replaceAll("\\", "/");
  if (!raw) return "";
  return raw.startsWith("/") ? raw.slice(1) : raw;
}

function normalizeNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function flattenLegacyProducts(groups) {
  const rows = [];
  for (const group of groups) {
    const categoryName = String(group?.category || "").trim();
    if (!categoryName) continue;

    for (const item of group?.items || []) {
      const name = String(item?.name || "").trim();
      const image = normalizeImagePath(item?.image);
      const variants = Array.isArray(item?.variants) && item.variants.length ? item.variants : [{ price: null, oldPrice: null, description: "" }];

      for (const variant of variants) {
        const price = normalizeNullableNumber(variant?.price);
        if (price === null) continue;
        rows.push({
          source: "legacy-js",
          categoryName,
          name,
          image,
          description: String(variant?.description || "").trim(),
          price,
          oldPrice: normalizeNullableNumber(variant?.oldPrice),
          createdAt: null,
          updatedAt: null
        });
      }
    }
  }
  return rows;
}

function flattenCatalogProducts() {
  if (!fs.existsSync(catalogPath)) return [];
  const db = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const categories = Array.isArray(db.categories) ? db.categories : [];
  const products = Array.isArray(db.products) ? db.products : [];
  const categoryMap = new Map(categories.map((cat) => [cat.id, String(cat.name || "").trim()]));

  return products
    .map((item) => {
      const categoryName = categoryMap.get(item.categoryId) || "";
      const price = normalizeNullableNumber(item.price);
      if (!categoryName || price === null) return null;
      return {
        source: "catalog-json",
        categoryName,
        name: String(item.name || "").trim(),
        image: normalizeImagePath(item.image),
        description: String(item.description || "").trim(),
        price,
        oldPrice: normalizeNullableNumber(item.oldPrice),
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null
      };
    })
    .filter(Boolean);
}

function uniqueProducts(rows) {
  const seen = new Set();
  const unique = [];
  for (const row of rows) {
    const key = [
      row.categoryName.toLowerCase(),
      row.name.toLowerCase(),
      row.image,
      row.description.toLowerCase(),
      row.price,
      row.oldPrice
    ].join("||");

    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return unique;
}

function buildCategories(rows) {
  const categories = [];
  const seen = new Set();
  for (const row of rows) {
    const key = row.categoryName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    categories.push({ name: row.categoryName });
  }
  categories.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  return categories;
}

function main() {
  const legacyRows = flattenLegacyProducts(loadLegacyGroups());
  const catalogRows = flattenCatalogProducts();
  const products = uniqueProducts([...legacyRows, ...catalogRows]);
  const categories = buildCategories(products);

  const migration = {
    version: 2,
    createdAt: new Date().toISOString(),
    sources: ["js/products.js", "data/catalog.json"],
    totals: {
      categories: categories.length,
      products: products.length,
      fromLegacyJs: legacyRows.length,
      fromCatalogJson: catalogRows.length
    },
    categories,
    products
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(migration, null, 2), "utf8");

  console.log(`Migration JSON created: ${outPath}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Products: ${products.length}`);
}

main();

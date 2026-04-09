const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Client } = require("pg");

const rootDir = path.resolve(__dirname, "..", "..", "..");
const envPath = path.join(__dirname, "..", ".env");
const migrationPath = path.join(__dirname, "..", "migrations", "full-products-migration.json");
const uploadsDir = path.join(__dirname, "..", "uploads", "products");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function normalizeImagePath(image) {
  const raw = String(image || "").trim().replaceAll("\\", "/");
  if (!raw) return "";
  return raw.startsWith("/") ? raw.slice(1) : raw;
}

function makeProductKey(categoryId, row, imagePath) {
  return [
    categoryId,
    String(row.name || "").trim().toLowerCase(),
    String(imagePath || "").trim(),
    String(row.description || "").trim().toLowerCase(),
    Number(row.price),
    row.oldPrice === null || row.oldPrice === undefined || row.oldPrice === "" ? "null" : Number(row.oldPrice)
  ].join("||");
}

function resolveLocalImagePath(sourcePath) {
  const normalized = normalizeImagePath(sourcePath);
  if (!normalized) return null;

  const candidates = [
    path.join(rootDir, normalized),
    path.join(rootDir, "apps", "web", "public", normalized)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function copyImageToUploads(sourcePath) {
  const normalized = normalizeImagePath(sourcePath);
  if (!normalized) return "";
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  if (normalized.startsWith("uploads/")) {
    return `/${normalized}`;
  }

  const localPath = resolveLocalImagePath(normalized);
  if (!localPath) {
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  }

  fs.mkdirSync(uploadsDir, { recursive: true });

  const ext = path.extname(localPath);
  const base = path.basename(localPath, ext);
  let fileName = `${base}${ext}`;
  let targetPath = path.join(uploadsDir, fileName);

  if (fs.existsSync(targetPath)) {
    const srcStat = fs.statSync(localPath);
    const dstStat = fs.statSync(targetPath);
    if (srcStat.size !== dstStat.size) {
      fileName = `${base}-${crypto.randomUUID().slice(0, 8)}${ext}`;
      targetPath = path.join(uploadsDir, fileName);
    }
  }

  if (!fs.existsSync(targetPath)) {
    fs.copyFileSync(localPath, targetPath);
  }

  return `/uploads/products/${fileName}`;
}

async function main() {
  loadEnv(envPath);

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }

  const payload = JSON.parse(fs.readFileSync(migrationPath, "utf8"));
  const categories = Array.isArray(payload.categories) ? payload.categories : [];
  const products = Array.isArray(payload.products) ? payload.products : [];

  const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "trendastana"
  });

  await client.connect();
  await client.query("BEGIN");

  try {
    const categoryRows = await client.query("SELECT id, name FROM categories");
    const categoryByName = new Map();
    for (const row of categoryRows.rows) {
      categoryByName.set(String(row.name).toLowerCase(), row.id);
    }

    let createdCategories = 0;
    for (const row of categories) {
      const name = String(row.name || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (categoryByName.has(key)) continue;

      const id = crypto.randomUUID();
      await client.query(
        "INSERT INTO categories (id, name, \"createdAt\", \"updatedAt\") VALUES ($1, $2, NOW(), NOW())",
        [id, name]
      );
      categoryByName.set(key, id);
      createdCategories += 1;
    }

    const existingProductsQuery = await client.query(
      "SELECT id, \"categoryId\", name, image, description, price, \"oldPrice\" FROM products"
    );
    const existingProductKeys = new Set();
    for (const row of existingProductsQuery.rows) {
      existingProductKeys.add(
        makeProductKey(row.categoryId, row, row.image)
      );
    }

    let createdProducts = 0;
    let copiedImages = 0;

    for (const row of products) {
      const categoryName = String(row.categoryName || "").trim();
      const categoryId = categoryByName.get(categoryName.toLowerCase());
      if (!categoryId) continue;

      const name = String(row.name || "").trim();
      if (!name) continue;

      const price = Number(row.price);
      if (!Number.isFinite(price)) continue;

      const imagePath = copyImageToUploads(row.image);
      if (imagePath.startsWith("/uploads/products/")) {
        copiedImages += 1;
      }

      const productKey = makeProductKey(categoryId, row, imagePath);
      if (existingProductKeys.has(productKey)) continue;

      const oldPrice =
        row.oldPrice === null || row.oldPrice === undefined || row.oldPrice === ""
          ? null
          : Number(row.oldPrice);

      await client.query(
        "INSERT INTO products (id, \"categoryId\", name, image, description, price, \"oldPrice\", \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::timestamptz, NOW()), COALESCE($9::timestamptz, NOW()))",
        [
          crypto.randomUUID(),
          categoryId,
          name,
          imagePath,
          String(row.description || "").trim(),
          price.toFixed(2),
          oldPrice === null || Number.isNaN(oldPrice) ? null : oldPrice.toFixed(2),
          row.createdAt || null,
          row.updatedAt || null
        ]
      );

      existingProductKeys.add(productKey);
      createdProducts += 1;
    }

    await client.query("COMMIT");

    console.log("Full migration completed.");
    console.log(`Created categories: ${createdCategories}`);
    console.log(`Created products: ${createdProducts}`);
    console.log(`Processed products: ${products.length}`);
    console.log(`Images copied to uploads: ${copiedImages}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

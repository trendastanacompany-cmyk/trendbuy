/* Burger */
const burger = document.querySelector(".menu__icon");
const menu = document.querySelector(".menu__body");
const menuItems = document.querySelectorAll(".menu__item");
const body = document.body;

menuItems.forEach((itemMenu) => {
  itemMenu.addEventListener("click", () => {
    burger.classList.remove("active");
    menu.classList.remove("active");
    body.classList.remove("lock");
  });
});

burger.addEventListener("click", () => {
  burger.classList.toggle("active");
  menu.classList.toggle("active");
  body.classList.toggle("lock");
});

/* Swiper */
import Swiper from "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.mjs";
new Swiper(".swiper", {
  loop: true,
  parallax: true,
  autoplay: {
    delay: 6000,
    disableOnInteraction: false
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true
  }
});

/* Telegram Message */
const form = document.querySelector(".form");
const formBtn = document.querySelector(".form__btn");

formBtn.addEventListener("click", (event) => {
  event.preventDefault();
  sendMessage(form);
});

async function sendMessage(targetForm) {
  const formData = new FormData(targetForm);
  const response = await fetch("sendmessage.php", {
    method: "POST",
    body: formData
  });

  if (response.ok) {
    targetForm.reset();
    alert("Данные отправлены. Ожидайте звонка.");
  } else {
    alert("Произошла ошибка. Повторите попытку.");
  }
}

/* Catalog */
const productsList = document.querySelector(".products");
const filterList = document.querySelector(".filter");
let selectedFilter = "all";

filterList.addEventListener("click", (event) => {
  const button = event.target.closest(".filter__item[data-filter]");
  if (!button) return;

  event.preventDefault();
  document
    .querySelectorAll(".filter__item")
    .forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");

  selectedFilter = button.dataset.filter;
  applyProductFilter(selectedFilter);

  const productsSection = document.getElementById("products");
  if (productsSection) {
    productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

initializeCatalog().catch(() => {});

async function initializeCatalog() {
  const products = await loadProducts();
  renderFilters(products.map((group) => group.category));
  renderProducts(products);
  applyProductFilter(selectedFilter);
}

async function loadProducts() {
  try {
    const [categoriesRes, productsRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/products")
    ]);
    if (!categoriesRes.ok || !productsRes.ok) {
      throw new Error("API unavailable");
    }

    const categories = await categoriesRes.json();
    const products = await productsRes.json();
    const categoryMap = new Map(categories.map((item) => [item.id, item.name]));
    const grouped = new Map();

    products.forEach((item) => {
      const categoryName = categoryMap.get(item.categoryId);
      if (!categoryName) return;
      if (!grouped.has(categoryName)) {
        grouped.set(categoryName, []);
      }
      grouped.get(categoryName).push({
        name: item.name,
        image: item.image,
        variants: [
          {
            price: item.price,
            oldPrice: item.oldPrice,
            description: item.description || ""
          }
        ]
      });
    });

    return [...grouped.entries()].map(([category, items]) => ({
      category,
      items
    }));
  } catch {
    const module = await import("./products.js");
    return module.products;
  }
}

function renderFilters(categories) {
  const uniqueCategories = [...new Set(categories)];
  const list = [
    `<li data-filter="all" class="filter__item active">Все</li>`,
    ...uniqueCategories.map(
      (category) =>
        `<li data-filter="${escapeHtml(category)}" class="filter__item">${escapeHtml(category)}</li>`
    )
  ];
  filterList.innerHTML = list.join("");
}

function renderProducts(products) {
  productsList.innerHTML = "";
  products.forEach(({ category, items }) => {
    items.forEach(({ name, image, variants }) => {
      const variantHTML = variants
        .map(
          (variant) => `
        <div class="products__info">
          ${variant.description ? `<span class="additional-information">${escapeHtml(variant.description)}</span>` : ""}
          <span class="regular">${variant.oldPrice ? `<span>${variant.oldPrice}тг</span> / ` : ""}</span>
          <span class="bold">${variant.price}тг</span>
        </div>
      `
        )
        .join("");

      const itemHTML = `
        <li class="products__item" data-category="${escapeHtml(category)}">
          <article>
            <div class="products__image">
              <img src="${escapeHtml(image)}" loading="lazy" alt="Продукт">
            </div>
            <div class="products__description">
              <h4 class="products__name">${escapeHtml(name)}</h4>
              ${variantHTML}
            </div>
          </article>
        </li>
      `;

      productsList.insertAdjacentHTML("beforeend", itemHTML);
    });
  });
}

function applyProductFilter(filterValue) {
  document.querySelectorAll(".products__item").forEach((item) => {
    const category = item.dataset.category;
    item.style.display =
      filterValue === "all" || category === filterValue ? "block" : "none";
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const state = {
  categories: [],
  products: [],
  editingCategoryId: null,
  editingProductId: null,
  categorySearch: "",
  productSearch: ""
};

const burger = document.querySelector(".menu__icon");
const menu = document.querySelector(".menu__body");
const menuItems = document.querySelectorAll(".menu__item");
const body = document.body;

if (burger && menu) {
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
}

const categoryForm = document.getElementById("category-form");
const categoryNameInput = document.getElementById("category-name");
const categorySortOrderInput = document.getElementById("category-sort-order");
const categorySubmit = document.getElementById("category-submit");
const categoryCancel = document.getElementById("category-cancel");
const categoriesTable = document.getElementById("categories-table");
const categorySearch = document.getElementById("category-search");
const categoryOpen = document.getElementById("category-open");
const categoryModal = document.getElementById("category-modal");
const categoryModalTitle = document.getElementById("category-modal-title");
const categoryFormHolder = document.getElementById("category-form-holder");

const productForm = document.getElementById("product-form");
const productCategory = document.getElementById("product-category");
const productName = document.getElementById("product-name");
const productSortOrder = document.getElementById("product-sort-order");
const productImage = document.getElementById("product-image");
const productImageFile = document.getElementById("product-image-file");
const productImageUpload = document.getElementById("product-image-upload");
const productImagePreviewWrap = document.getElementById("product-image-preview-wrap");
const productImagePreview = document.getElementById("product-image-preview");
const productPrice = document.getElementById("product-price");
const productOldPrice = document.getElementById("product-old-price");
const productDescription = document.getElementById("product-description");
const productSubmit = document.getElementById("product-submit");
const productCancel = document.getElementById("product-cancel");
const productsTable = document.getElementById("products-table");
const productSearch = document.getElementById("product-search");
const productOpen = document.getElementById("product-open");
const productModal = document.getElementById("product-modal");
const productModalTitle = document.getElementById("product-modal-title");
const productFormHolder = document.getElementById("product-form-holder");
const toast = document.getElementById("toast");
let draggedCategoryId = null;
let draggedProductId = null;
let draggedProductCategoryId = null;

init().catch((error) => {
  showToast(error.message || "Ошибка инициализации");
});

async function init() {
  mountForms();
  bindEvents();
  await refreshData();
}

function bindEvents() {
  categoryForm.addEventListener("submit", onCategorySubmit);
  categoryCancel.addEventListener("click", () => {
    resetCategoryForm();
    closeCategoryModal();
  });
  categoriesTable.addEventListener("click", onCategoryTableClick);
  categorySearch?.addEventListener("input", () => {
    state.categorySearch = categorySearch.value;
    renderCategories();
  });
  categoryOpen?.addEventListener("click", () => openCategoryModal());
  categoriesTable.addEventListener("dragover", onCategoryDragOver);
  categoriesTable.addEventListener("drop", onCategoryDrop);
  categoriesTable.addEventListener("dragend", onCategoryDragEnd);

  productForm.addEventListener("submit", onProductSubmit);
  productCancel.addEventListener("click", () => {
    resetProductForm();
    closeProductModal();
  });
  productsTable.addEventListener("click", onProductTableClick);
  productImageUpload?.addEventListener("click", () => {
    onImageUpload().catch(() => {});
  });
  productImageFile.addEventListener("change", onImageFileChange);
  productImage.addEventListener("input", () => updatePreview(productImage.value.trim()));
  productSearch?.addEventListener("input", () => {
    state.productSearch = productSearch.value;
    renderProducts();
  });
  productOpen?.addEventListener("click", () => openProductModal());
  productsTable.addEventListener("dragover", onProductDragOver);
  productsTable.addEventListener("drop", onProductDrop);
  productsTable.addEventListener("dragend", onProductDragEnd);

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-close");
      if (id === "category-modal") closeCategoryModal();
      if (id === "product-modal") closeProductModal();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (categoryModal?.classList.contains("is-open")) closeCategoryModal();
    if (productModal?.classList.contains("is-open")) closeProductModal();
  });
}

function mountForms() {
  if (categoryForm && categoryFormHolder && categoryForm.parentElement !== categoryFormHolder) {
    categoryForm.hidden = false;
    categoryFormHolder.appendChild(categoryForm);
  }
  if (productForm && productFormHolder && productForm.parentElement !== productFormHolder) {
    productForm.hidden = false;
    productFormHolder.appendChild(productForm);
  }
}

async function refreshData() {
  const [categories, products] = await Promise.all([
    request("/api/categories"),
    request("/api/products")
  ]);
  state.categories = categories;
  state.products = products;
  renderCategories();
  renderProductCategoryOptions();
  renderProducts();
}

function renderCategories() {
  const query = state.categorySearch.trim().toLowerCase();
  const items = query
    ? state.categories.filter((cat) => cat.name.toLowerCase().includes(query))
    : state.categories;

  if (!items.length) {
    const message = state.categories.length
      ? "Категорий не найдено"
      : "Категорий пока нет";
    categoriesTable.innerHTML = `<tr><td colspan='3'>${message}</td></tr>`;
    return;
  }

  categoriesTable.innerHTML = items
    .map(
      (cat) => `
      <tr data-id="${cat.id}" draggable="${query ? "false" : "true"}" class="${query ? "" : "is-draggable"}">
        <td data-label="Порядок"><span class="drag-handle" title="Перетащите для сортировки">⋮⋮</span>${cat.sortOrder ?? 0}</td>
        <td data-label="Название">${escapeHtml(cat.name)}</td>
        <td data-label="Действия">
          <div class="row-actions">
            <button type="button" data-action="edit" data-id="${cat.id}" class="ghost">Изменить</button>
            <button type="button" data-action="delete" data-id="${cat.id}" class="danger">Удалить</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");
  bindCategoryDragSources();
}

function renderProductCategoryOptions() {
  const options = [
    "<option value=''>Выберите категорию</option>",
    ...state.categories.map(
      (cat) => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`
    )
  ];
  productCategory.innerHTML = options.join("");
}

function renderProducts() {
  if (!state.products.length) {
    productsTable.innerHTML = "<tr><td colspan='8'>Товаров пока нет</td></tr>";
    return;
  }

  const categoryMap = new Map(state.categories.map((c) => [c.id, c.name]));
  const query = state.productSearch.trim().toLowerCase();
  const items = query
    ? state.products.filter((item) => {
        const catName = categoryMap.get(item.categoryId) || "";
        const haystack = [
          item.name,
          catName,
          item.description,
          item.image,
          item.sortOrder,
          item.price,
          item.oldPrice
        ]
          .map((value) => String(value ?? "").toLowerCase())
          .join(" ");
        return haystack.includes(query);
      })
    : state.products;

  if (!items.length) {
    productsTable.innerHTML = "<tr><td colspan='8'>Товаров не найдено</td></tr>";
    return;
  }

  productsTable.innerHTML = items
    .map((item) => {
      const catName = categoryMap.get(item.categoryId) || "Неизвестно";
      return `
        <tr data-id="${item.id}" data-category-id="${item.categoryId}" draggable="${query ? "false" : "true"}" class="${query ? "" : "is-draggable"}">
          <td data-label="Порядок"><span class="drag-handle" title="Перетащите для сортировки">⋮⋮</span>${item.sortOrder ?? 0}</td>
          <td data-label="Название">${escapeHtml(item.name)}</td>
          <td data-label="Категория">${escapeHtml(catName)}</td>
          <td data-label="Цена">${item.price}</td>
          <td data-label="Старая">${item.oldPrice ?? ""}</td>
          <td data-label="Описание">${escapeHtml(item.description || "")}</td>
          <td data-label="Изображение">${escapeHtml(item.image)}</td>
          <td data-label="Действия">
            <div class="row-actions">
              <button type="button" data-action="edit" data-id="${item.id}" class="ghost">Изменить</button>
              <button type="button" data-action="delete" data-id="${item.id}" class="danger">Удалить</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
  bindProductDragSources();
}

async function onCategorySubmit(event) {
  event.preventDefault();
  const payload = {
    name: categoryNameInput.value.trim(),
    sortOrder: Number(categorySortOrderInput.value || 0)
  };
  if (!payload.name) return;

  if (state.editingCategoryId) {
    await request(`/api/categories/${state.editingCategoryId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    showToast("Категория обновлена");
  } else {
    await request("/api/categories", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    showToast("Категория создана");
  }
  resetCategoryForm();
  closeCategoryModal();
  await refreshData();
}

function onCategoryTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;

  if (action === "edit") {
    const category = state.categories.find((item) => item.id === id);
    if (!category) return;
    state.editingCategoryId = id;
    categoryNameInput.value = category.name;
    categorySortOrderInput.value = String(category.sortOrder ?? 0);
    categorySubmit.textContent = "Сохранить";
    categoryCancel.hidden = false;
    openCategoryModal(true);
  }

  if (action === "delete") {
    deleteCategory(id).catch((error) => showToast(error.message));
  }
}

async function deleteCategory(id) {
  const ok = confirm("Удалить категорию? Связанные товары тоже будут удалены.");
  if (!ok) return;

  await request(`/api/categories/${id}`, { method: "DELETE" });
  if (state.editingCategoryId === id) resetCategoryForm();
  if (state.editingProductId) resetProductForm();

  showToast("Категория удалена");
  await refreshData();
}

function resetCategoryForm() {
  categoryForm.reset();
  state.editingCategoryId = null;
  categorySubmit.textContent = "Создать";
  categoryCancel.hidden = true;
}

function openCategoryModal(isEditing = false) {
  if (!isEditing) resetCategoryForm();
  if (categoryModalTitle) {
    categoryModalTitle.textContent = isEditing ? "Редактировать категорию" : "Новая категория";
  }
  openModal(categoryModal);
  categoryNameInput.focus();
}

function closeCategoryModal() {
  closeModal(categoryModal);
  resetCategoryForm();
}

async function onProductSubmit(event) {
  event.preventDefault();

  const payload = {
    categoryId: productCategory.value,
    name: productName.value.trim(),
    sortOrder: Number(productSortOrder.value || 0),
    image: productImage.value.trim(),
    price: productPrice.value,
    oldPrice: productOldPrice.value,
    description: productDescription.value.trim()
  };

  // If a file is selected but path is still empty, upload automatically on submit.
  if (!payload.image && productImageFile.files?.[0]) {
    try {
      payload.image = await onImageUpload(productImageFile.files[0], {
        showMessages: false
      });
    } catch {
      showToast("Не удалось загрузить изображение");
      return;
    }
  }

  if (!payload.categoryId || !payload.name || !payload.image) {
    showToast("Заполните обязательные поля и загрузите изображение");
    return;
  }

  if (state.editingProductId) {
    await request(`/api/products/${state.editingProductId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    showToast("Товар обновлен");
  } else {
    await request("/api/products", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    showToast("Товар создан");
  }

  resetProductForm();
  closeProductModal();
  await refreshData();
}

function onProductTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;

  if (action === "edit") {
    const product = state.products.find((item) => item.id === id);
    if (!product) return;
    state.editingProductId = id;
    productCategory.value = product.categoryId;
    productName.value = product.name;
    productSortOrder.value = String(product.sortOrder ?? 0);
    productImage.value = product.image;
    productPrice.value = String(product.price);
    productOldPrice.value = product.oldPrice ?? "";
    productDescription.value = product.description || "";
    updatePreview(product.image);
    productSubmit.textContent = "Сохранить";
    productCancel.hidden = false;
    openProductModal(true);
  }

  if (action === "delete") {
    deleteProduct(id).catch((error) => showToast(error.message));
  }
}

async function deleteProduct(id) {
  const ok = confirm("Удалить этот товар?");
  if (!ok) return;

  await request(`/api/products/${id}`, { method: "DELETE" });
  if (state.editingProductId === id) resetProductForm();

  showToast("Товар удален");
  await refreshData();
}

function resetProductForm() {
  productForm.reset();
  state.editingProductId = null;
  productSubmit.textContent = "Создать";
  productCancel.hidden = true;
  updatePreview("");
}

function openProductModal(isEditing = false) {
  if (!state.categories.length) {
    showToast("Сначала добавьте категорию");
    return;
  }
  if (!isEditing) resetProductForm();
  if (productModalTitle) {
    productModalTitle.textContent = isEditing ? "Редактировать товар" : "Новый товар";
  }
  openModal(productModal);
  productName.focus();
}

function closeProductModal() {
  closeModal(productModal);
  resetProductForm();
}

function onImageFileChange() {
  const file = productImageFile.files?.[0];
  if (!file) return;
  const objectUrl = URL.createObjectURL(file);
  updatePreview(objectUrl, true);
  onImageUpload(file).catch(() => {});
}

async function onImageUpload(selectedFile = null, options = {}) {
  const { showMessages = true } = options;
  const file = selectedFile || productImageFile.files?.[0];
  if (!file) {
    if (showMessages) {
      showToast("Сначала выберите файл изображения");
    }
    return;
  }

  const formData = new FormData();
  formData.append("image", file);
  productImageFile.disabled = true;
  if (productImageUpload) {
    productImageUpload.disabled = true;
    productImageUpload.textContent = "Загрузка...";
  }

  try {
    const result = await request("/api/uploads/image", {
      method: "POST",
      body: formData
    });

    const uploadedPath = String(result?.path || result?.image || "").trim();
    if (!uploadedPath) {
      throw new Error("Сервер не вернул путь к изображению");
    }

    productImage.value = uploadedPath;
    updatePreview(uploadedPath);
    if (showMessages) {
      showToast("Изображение загружено");
    }
    return uploadedPath;
  } catch (error) {
    if (showMessages) {
      showToast(error?.message || "Не удалось загрузить изображение");
    }
    throw error;
  } finally {
    productImageFile.disabled = false;
    if (productImageUpload) {
      productImageUpload.disabled = false;
      productImageUpload.textContent = "Загрузить файл";
    }
  }
}

function updatePreview(src, isObjectUrl = false) {
  if (!src) {
    productImagePreviewWrap.hidden = true;
    productImagePreview.src = "";
    return;
  }

  productImagePreviewWrap.hidden = false;
  productImagePreview.src = src;
  if (isObjectUrl) {
    productImagePreview.onload = () => URL.revokeObjectURL(src);
  }
}

function bindCategoryDragSources() {
  const rows = categoriesTable.querySelectorAll("tr[data-id]");
  rows.forEach((row) => {
    row.addEventListener("dragstart", onCategoryDragStart);
  });
}

function bindProductDragSources() {
  const rows = productsTable.querySelectorAll("tr[data-id]");
  rows.forEach((row) => {
    row.addEventListener("dragstart", onProductDragStart);
  });
}

function onCategoryDragStart(event) {
  const targetElement = getEventElement(event.target);
  const row = targetElement?.closest("tr[data-id]");
  if (!row || !targetElement?.closest(".drag-handle")) {
    event.preventDefault();
    return;
  }
  if (state.categorySearch.trim()) {
    event.preventDefault();
    showToast("Очистите поиск категорий перед сортировкой drag-and-drop");
    return;
  }

  draggedCategoryId = row.dataset.id;
  row.classList.add("is-dragging");
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedCategoryId || "");
  }
}

function onCategoryDragOver(event) {
  if (!draggedCategoryId) return;
  event.preventDefault();

  const draggingRow = categoriesTable.querySelector("tr.is-dragging");
  if (!draggingRow) return;

  const candidates = [...categoriesTable.querySelectorAll("tr[data-id]:not(.is-dragging)")];
  const nextRow = getNextRowByPointer(candidates, event.clientY);
  if (!nextRow) {
    categoriesTable.appendChild(draggingRow);
    return;
  }
  categoriesTable.insertBefore(draggingRow, nextRow);
}

function onCategoryDrop(event) {
  if (!draggedCategoryId) return;
  event.preventDefault();
}

async function onCategoryDragEnd() {
  const draggingRow = categoriesTable.querySelector("tr.is-dragging");
  if (draggingRow) draggingRow.classList.remove("is-dragging");
  if (!draggedCategoryId) return;

  draggedCategoryId = null;
  await persistCategoryOrder();
}

async function persistCategoryOrder() {
  const rows = [...categoriesTable.querySelectorAll("tr[data-id]")];
  const categoryById = new Map(state.categories.map((item) => [item.id, item]));

  const updates = rows
    .map((row, index) => {
      const item = categoryById.get(row.dataset.id);
      if (!item) return null;
      const nextOrder = index;
      if ((item.sortOrder ?? 0) === nextOrder) return null;
      return { item, nextOrder };
    })
    .filter(Boolean);

  if (!updates.length) return;

  try {
    await Promise.all(
      updates.map(({ item, nextOrder }) =>
        request(`/api/categories/${item.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: item.name,
            sortOrder: nextOrder
          })
        })
      )
    );

    showToast("Порядок категорий сохранен");
    await refreshData();
  } catch (error) {
    showToast(error?.message || "Не удалось сохранить порядок категорий");
    await refreshData();
  }
}

function onProductDragStart(event) {
  const targetElement = getEventElement(event.target);
  const row = targetElement?.closest("tr[data-id]");
  if (!row || !targetElement?.closest(".drag-handle")) {
    event.preventDefault();
    return;
  }
  if (state.productSearch.trim()) {
    event.preventDefault();
    showToast("Очистите поиск товаров перед сортировкой drag-and-drop");
    return;
  }

  draggedProductId = row.dataset.id;
  draggedProductCategoryId = row.dataset.categoryId;
  row.classList.add("is-dragging");
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedProductId || "");
  }
}

function onProductDragOver(event) {
  if (!draggedProductId || !draggedProductCategoryId) return;
  event.preventDefault();

  const draggingRow = productsTable.querySelector("tr.is-dragging");
  if (!draggingRow) return;

  const rowsInCategory = [
    ...productsTable.querySelectorAll(
      `tr[data-category-id="${draggedProductCategoryId}"]:not(.is-dragging)`
    )
  ];
  if (!rowsInCategory.length) return;

  const nextRow = getNextRowByPointer(rowsInCategory, event.clientY);
  if (!nextRow) {
    const lastRow = rowsInCategory[rowsInCategory.length - 1];
    productsTable.insertBefore(draggingRow, lastRow.nextSibling);
    return;
  }
  productsTable.insertBefore(draggingRow, nextRow);
}

function onProductDrop(event) {
  if (!draggedProductId) return;
  event.preventDefault();
}

async function onProductDragEnd() {
  const draggingRow = productsTable.querySelector("tr.is-dragging");
  if (draggingRow) draggingRow.classList.remove("is-dragging");
  if (!draggedProductId || !draggedProductCategoryId) return;

  const categoryId = draggedProductCategoryId;
  draggedProductId = null;
  draggedProductCategoryId = null;

  await persistProductOrder(categoryId);
}

async function persistProductOrder(categoryId) {
  const rows = [
    ...productsTable.querySelectorAll(`tr[data-category-id="${categoryId}"][data-id]`)
  ];
  const productById = new Map(state.products.map((item) => [item.id, item]));

  const updates = rows
    .map((row, index) => {
      const item = productById.get(row.dataset.id);
      if (!item) return null;
      const nextOrder = index;
      if ((item.sortOrder ?? 0) === nextOrder) return null;
      return { item, nextOrder };
    })
    .filter(Boolean);

  if (!updates.length) return;

  try {
    await Promise.all(
      updates.map(({ item, nextOrder }) =>
        request(`/api/products/${item.id}`, {
          method: "PUT",
          body: JSON.stringify({
            categoryId: item.categoryId,
            name: item.name,
            image: item.image,
            sortOrder: nextOrder,
            price: item.price,
            oldPrice: item.oldPrice,
            description: item.description || ""
          })
        })
      )
    );

    showToast("Порядок товаров сохранен");
    await refreshData();
  } catch (error) {
    showToast(error?.message || "Не удалось сохранить порядок товаров");
    await refreshData();
  }
}

function getNextRowByPointer(rows, clientY) {
  return rows.find((row) => {
    const rect = row.getBoundingClientRect();
    return clientY < rect.top + rect.height / 2;
  }) || null;
}

function getEventElement(target) {
  if (target instanceof Element) return target;
  if (target && "parentElement" in target) return target.parentElement;
  return null;
}

async function request(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers
  });
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }
  return data;
}

function showToast(message) {
  toast.hidden = false;
  toast.textContent = message;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2800);
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  body.classList.add("lock");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  body.classList.remove("lock");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}



const WHATSAPP_NUMBER = ""; // Shop ka WhatsApp number baad mein add karna

const grid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#product-search");
const filterButtons = document.querySelectorAll(".filter-button");
const favoritesButton = document.querySelector("#favorites-button");
const favoritesPanel = document.querySelector("#favorites-panel");
const favoritesList = document.querySelector("#favorites-list");
const favoritesCount = document.querySelector("#favorites-count");
const closeFavorites = document.querySelector("#close-favorites");
const siteMessage = document.querySelector("#site-message");

let products = [];
let activeCategory = "all";
let favorites = [];

try {
  favorites = JSON.parse(localStorage.getItem("sakshi-favorites-v1") || "[]");
  if (!Array.isArray(favorites)) favorites = [];
} catch {
  favorites = [];
}

function showMessage(message) {
  if (siteMessage) {
    siteMessage.textContent = message;
    siteMessage.hidden = false;
  } else {
    alert(message);
  }
}

function saveFavorites() {
  localStorage.setItem("sakshi-favorites-v1", JSON.stringify(favorites));
}

function money(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function getProductData(card) {
  return {
    id: String(card.dataset.id || ""),
    name: card.dataset.name || "Fashion Collection",
    price: card.dataset.price || "0",
    category: card.dataset.category || ""
  };
}


function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.dataset.id = String(product.id);
  card.dataset.name = product.name || "Fashion Collection";
  card.dataset.price = String(product.price ?? 0);
  card.dataset.category = product.category || "";
  card.style.cursor = "pointer";
  card.setAttribute("role", "link");
  card.setAttribute("tabindex", "0");
  card.setAttribute(
    "aria-label",
    `View details for ${product.name || "Fashion Collection"}`
  );

  // Clicking the card opens its product details page.
  function openProductPage() {
    if (product.id === undefined || product.id === null || product.id === "") {
      showMessage("Is product ki ID nahi mili. Admin panel mein product check karein.");
      return;
    }

    window.location.href =
      "/product.html?id=" + encodeURIComponent(String(product.id));
  }

  card.addEventListener("click", event => {
    // Favourite and enquiry buttons should keep their own actions.
    if (event.target.closest("button")) return;
    openProductPage();
  });

  card.addEventListener("keydown", event => {
    if (
      event.target === card &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      openProductPage();
    }
  });

  const imageBox = document.createElement("div");
  imageBox.className = "product-image";

  const imageUrl = product.image_url;

  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = product.name || "Fashion product";
    image.loading = "lazy";

    image.onerror = () => {
      image.remove();
      imageBox.classList.add("image-unavailable");
    };

    imageBox.appendChild(image);
  } else {
    imageBox.classList.add("image-unavailable");

    const placeholder = document.createElement("span");
    placeholder.textContent = "Sakshi Suit Collection";
    imageBox.appendChild(placeholder);
  }

  const fav = document.createElement("button");
  fav.type = "button";
  fav.className = "favorite-toggle";
  fav.textContent = "♡";
  fav.setAttribute("aria-label", "Toggle favourite");
  fav.setAttribute("aria-pressed", "false");

  fav.addEventListener("click", () => {
    const id = getProductData(card).id;

    favorites = favorites.includes(id)
      ? favorites.filter(item => item !== id)
      : [...favorites, id];

    saveFavorites();
    renderFavorites();
  });

  imageBox.appendChild(fav);

  const info = document.createElement("div");
  info.className = "product-info";

  const category = document.createElement("p");
  category.className = "product-category";
  category.textContent =
    (product.category || "Collection").toUpperCase();

  const name = document.createElement("h3");
  name.textContent = product.name || "Fashion Collection";

  const bottom = document.createElement("div");
  bottom.className = "product-bottom";

  const price = document.createElement("strong");
  price.textContent = `₹${money(product.price)}`;

  const enquire = document.createElement("button");
  enquire.type = "button";
  enquire.className = "enquire-button";
  enquire.textContent = "Enquire ↗";

  enquire.addEventListener("click", () => {
    if (!/^\d{10,15}$/.test(WHATSAPP_NUMBER)) {
      showMessage(
        "WhatsApp enquiry ke liye app.js mein shop ka WhatsApp number add karna hoga."
      );
      return;
    }

    const message =
      `Namaste! Mujhe ${product.name} ke baare mein jaankari chahiye. ` +
      `Listed price: ₹${money(product.price)}.`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  });

  bottom.append(price, enquire);
  info.append(category, name, bottom);
  card.append(imageBox, info);

  return card;
}

function renderProducts() {
  if (!grid) return;

  grid.replaceChildren();

  if (!products.length) {
    const empty = document.createElement("p");
    empty.className = "empty-products";
    empty.textContent = "Abhi collection update ho rahi hai. Kripya baad mein dobara dekhein.";
    grid.appendChild(empty);
    return;
  }

  products.forEach(product => grid.appendChild(createProductCard(product)));
  filterProducts();
  renderFavorites();
}

function filterProducts() {
  const query = (searchInput?.value || "").trim().toLowerCase();

  document.querySelectorAll("#product-grid .product-card").forEach(card => {
    const product = getProductData(card);
    const matchesCategory =
      activeCategory === "all" ||
      product.category.trim().toLowerCase() === activeCategory;

    const matchesSearch =
      `${product.name} ${product.category}`.toLowerCase().includes(query);

    card.hidden = !(matchesCategory && matchesSearch);
  });
}


function renderFavorites() {
  if (favoritesCount) {
    favoritesCount.textContent = favorites.length;
  }

  // Update heart buttons on product cards.
  document.querySelectorAll("#product-grid .favorite-toggle").forEach(button => {
    const card = button.closest(".product-card");
    if (!card) return;

    const isFavorite = favorites.includes(getProductData(card).id);

    button.setAttribute("aria-pressed", String(isFavorite));
    button.classList.toggle("is-favorite", isFavorite);
    button.textContent = isFavorite ? "♥" : "♡";
  });

  if (!favoritesList) return;

  favoritesList.replaceChildren();

  const savedProducts = products.filter(product =>
    favorites.includes(String(product.id))
  );

  if (!savedProducts.length) {
    const empty = document.createElement("p");
    empty.className = "favorites-empty";
    empty.textContent =
      "Abhi koi favourite nahi hai. Apne pasand ke products par ♡ dabao!";
    favoritesList.appendChild(empty);
    return;
  }

  savedProducts.forEach(product => {
    const item = document.createElement("article");
    item.className = "favorite-item";

    const imageLink = document.createElement("a");
    imageLink.className = "favorite-image-link";
    imageLink.href =
      "/product.html?id=" + encodeURIComponent(String(product.id));

    const image = document.createElement("img");
    image.className = "favorite-image";
    image.src = product.image_url || "";
    image.alt = product.name || "Favourite product";
    image.loading = "lazy";

    image.onerror = () => {
      image.onerror = null;
      image.style.display = "none";
      imageLink.classList.add("favorite-image-placeholder");
      imageLink.textContent = "Sakshi Suit Collection";
    };

    imageLink.appendChild(image);

    const details = document.createElement("div");
    details.className = "favorite-details";

    const name = document.createElement("h3");
    name.className = "favorite-name";
    name.textContent = product.name || "Fashion Collection";

    const price = document.createElement("p");
    price.className = "favorite-price";
    price.textContent = `₹${money(product.price)}`;

    const view = document.createElement("a");
    view.className = "favorite-view";
    view.href =
      "/product.html?id=" + encodeURIComponent(String(product.id));
    view.textContent = "View Product →";

    details.append(name, price, view);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "favorite-remove";
    remove.textContent = "♥ Remove";
    remove.setAttribute(
      "aria-label",
      `Remove ${product.name || "product"} from favourites`
    );

    remove.addEventListener("click", () => {
      favorites = favorites.filter(
        id => id !== String(product.id)
      );
      saveFavorites();
      renderFavorites();
    });

    item.append(imageLink, details, remove);
    favoritesList.appendChild(item);
  });
}

  savedProducts.forEach(product => {
    const item = document.createElement("div");
    item.className = "favorite-item";

    const details = document.createElement("span");
    details.textContent = `${product.name} — ₹${money(product.price)}`;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      favorites = favorites.filter(id => id !== String(product.id));
      saveFavorites();
      renderFavorites();
    });

    item.append(details, remove);
    favoritesList.appendChild(item);
  });
}

async function loadProducts() {
  if (!grid) return;

  grid.replaceChildren();
  const loading = document.createElement("p");
  loading.textContent = "Collection load ho rahi hai...";
  grid.appendChild(loading);

  try {
    const response = await fetch("/api/products", { cache: "no-store" });
    if (!response.ok) throw new Error(`Products request failed (${response.status})`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid products response");

    products = data;
    renderProducts();
  } catch (error) {
    console.error("Product loading failed:", error);
    grid.replaceChildren();
    const message = document.createElement("p");
    message.textContent = "Products load nahi ho paaye. Page refresh karke dobara try karein.";
    grid.appendChild(message);
  }
}

searchInput?.addEventListener("input", filterProducts);

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");

    const value = (button.dataset.filter || "all").trim().toLowerCase();
    activeCategory = value === "all" ? "all" : value;
    filterProducts();
  });
});

favoritesButton?.addEventListener("click", () => {
  if (favoritesPanel) favoritesPanel.hidden = false;
  renderFavorites();
});

closeFavorites?.addEventListener("click", () => {
  if (favoritesPanel) favoritesPanel.hidden = true;
});

document.querySelectorAll(".category-card").forEach(card => {
  card.addEventListener("click", () => {
    const category = (card.dataset.category || "").trim().toLowerCase();
    const button = [...filterButtons].find(
      item => (item.dataset.filter || "").trim().toLowerCase() === category
    );

    button?.click();
    document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
  });
});

const yearElement = document.querySelector("[data-current-year]");
if (yearElement) yearElement.textContent = new Date().getFullYear();

loadProducts();

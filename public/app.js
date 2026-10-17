
const WHATSAPP_NUMBER = ""; // Shop ka WhatsApp number baad mein add karna

const products = [...document.querySelectorAll(".product-card")];
const searchInput = document.querySelector("#product-search");
const filterButtons = document.querySelectorAll(".filter-button");
const favoritesButton = document.querySelector("#favorites-button");
const favoritesPanel = document.querySelector("#favorites-panel");
const favoritesList = document.querySelector("#favorites-list");
const favoritesCount = document.querySelector("#favorites-count");
const closeFavorites = document.querySelector("#close-favorites");
const siteMessage = document.querySelector("#site-message");

let activeCategory = "all";
let favorites = [];

try {
  favorites = JSON.parse(
    localStorage.getItem("sakshi-favorites-v1") || "[]"
  );
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
  try {
    localStorage.setItem(
      "sakshi-favorites-v1",
      JSON.stringify(favorites)
    );
  } catch {
    showMessage("Favourites save nahi ho paaye. Browser settings check karein.");
  }
}

function getProductData(card) {
  return {
    id: card.dataset.id,
    name: card.dataset.name || "Fashion Collection",
    price: card.dataset.price || "",
    category: card.dataset.category || "all"
  };
}

function renderFavorites() {
  if (favoritesCount) {
    favoritesCount.textContent = favorites.length;
  }

  document.querySelectorAll(".favorite-toggle").forEach(button => {
    const card = button.closest(".product-card");
    if (!card) return;

    const isFavorite = favorites.includes(getProductData(card).id);
    button.setAttribute("aria-pressed", String(isFavorite));
    button.classList.toggle("is-favorite", isFavorite);
    button.textContent = isFavorite ? "♥" : "♡";
  });

  if (!favoritesList) return;

  favoritesList.replaceChildren();

  const savedProducts = products.filter(card =>
    favorites.includes(getProductData(card).id)
  );

  if (savedProducts.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Abhi koi favourite product save nahi hai.";
    favoritesList.appendChild(empty);
    return;
  }

  savedProducts.forEach(card => {
    const product = getProductData(card);
    const item = document.createElement("div");
    item.className = "favorite-item";

    const details = document.createElement("span");
    details.textContent = `${product.name} — ₹${product.price}`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      favorites = favorites.filter(id => id !== product.id);
      saveFavorites();
      renderFavorites();
    });

    item.append(details, removeButton);
    favoritesList.appendChild(item);
  });
}

function filterProducts() {
  const query = (searchInput?.value || "").trim().toLowerCase();

  products.forEach(card => {
    const product = getProductData(card);
    const matchesCategory =
      activeCategory === "all" || product.category === activeCategory;

    const matchesSearch =
      `${product.name} ${product.category}`.toLowerCase().includes(query);

    card.hidden = !(matchesCategory && matchesSearch);
  });
}

searchInput?.addEventListener("input", filterProducts);

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");

    activeCategory = button.dataset.filter || "all";
    filterProducts();
  });
});

document.querySelectorAll(".favorite-toggle").forEach(button => {
  button.addEventListener("click", () => {
    const card = button.closest(".product-card");
    if (!card) return;

    const id = getProductData(card).id;
    if (!id) return;

    favorites = favorites.includes(id)
      ? favorites.filter(item => item !== id)
      : [...favorites, id];

    saveFavorites();
    renderFavorites();
  });
});

favoritesButton?.addEventListener("click", () => {
  if (favoritesPanel) favoritesPanel.hidden = false;
  renderFavorites();
});

closeFavorites?.addEventListener("click", () => {
  if (favoritesPanel) favoritesPanel.hidden = true;
});

document.querySelectorAll(".enquire-button").forEach(button => {
  button.addEventListener("click", () => {
    const card = button.closest(".product-card");
    if (!card) return;

    const product = getProductData(card);

    if (!/^\d{10,15}$/.test(WHATSAPP_NUMBER)) {
      showMessage(
        "WhatsApp enquiry chalu karne ke liye app.js mein WHATSAPP_NUMBER mein shop ka number add karna hoga."
      );
      return;
    }

    const message =
      `Namaste! Mujhe ${product.name} ke baare mein jaankari chahiye. Listed price: ₹${product.price}.`;

    const url =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  });
});

document.querySelectorAll("[data-category-card]").forEach(card => {
  card.addEventListener("click", () => {
    const category = card.dataset.categoryCard;
    const matchingButton = [...filterButtons].find(
      button => button.dataset.filter === category
    );

    matchingButton?.click();
    document.querySelector("#products")?.scrollIntoView({
      behavior: "smooth"
    });
  });
});

const yearElement = document.querySelector("[data-current-year]");
if (yearElement) yearElement.textContent = new Date().getFullYear();

renderFavorites();
filterProducts();

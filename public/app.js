
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
  const saved = JSON.parse(
    localStorage.getItem("sakshi-favorites-v1") || "[]"
  );
  favorites = Array.isArray(saved) ? saved.map(String) : [];
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
    return true;
  } catch (error) {
    console.error("Could not save favourites:", error);
    showMessage("Favourites save nahi ho pa rahe. Browser storage check karein.");
    return false;
  }
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

function productPageUrl(product) {
  return "/product.html?id=" + encodeURIComponent(String(product.id));
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.dataset.id = String(product.id);
  card.dataset.name = product.name || "Fashion Collection";
  card.dataset.price = String(product.price ?? 0);
  card.dataset.category = product.category || "";
  card.style.cursor = "pointer";

  // Clicking the card opens its detail page.
  card.addEventListener("click", event => {
    if (event.target.closest("button, a")) return;

    if (product.id === undefined || product.id === null) {
      showMessage("Product ID nahi mili.");
      return;
    }

    window.location.href = productPageUrl(product);
  });

  const imageBox = document.createElement("div");
  imageBox.className = "product-image";

  if (product.image_url) {
    const image = document.createElement("img");
    image.src = product.image_url;
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

  // Favourite heart button
  const fav = document.createElement("button");
  fav.type = "button";
  fav.className = "favorite-toggle";
  fav.setAttribute("aria-label", "Toggle favourite");

  function updateHeart() {
    const isSaved = favorites.includes(String(product.id));
    fav.textContent = isSaved ? "♥" : "♡";
    fav.setAttribute("aria-pressed", String(isSaved));
    fav.classList.toggle("is-favorite", isSaved);
  }

  updateHeart();

  fav.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();

    const id = String(product.id);

    if (id === "undefined" || id === "null" || id === "") {
      showMessage("Product ID nahi mili.");
      return;
    }

    if (favorites.includes(id)) {
      favorites = favorites.filter(item => item !== id);
    } else {
      favorites.push(id);
    }

    saveFavorites();
    updateHeart();
    renderFavorites();
  });

  imageBox.appendChild(fav);

  const info = document.createElement("div");
  info.className = "product-info";

  const category = document.createElement("p");
  category.className = "product-category";
  category.textContent = (product.category || "Collection").toUpperCase();

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

  enquire.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();

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
    empty.textContent =
      "Abhi collection update ho rahi hai. Kripya baad mein dobara dekhein.";
    grid.appendChild(empty);
    renderFavorites();
    return;
  }

  products.forEach(product => {
    grid.appendChild(createProductCard(product));
  });

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

  // Keep hearts synchronised with the saved list.
  document.querySelectorAll("#product-grid .favorite-toggle").forEach(button => {
    const card = button.closest(".product-card");
    if (!card) return;

    const isSaved = favorites.includes(getProductData(card).id);
    button.textContent = isSaved ? "♥" : "♡";
    button.setAttribute("aria-pressed", String(isSaved));
    button.classList.toggle("is-favorite", isSaved);
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
    imageLink.href = productPageUrl(product);

    const image = document.createElement("img");
    image.className = "favorite-image";
    image.alt = product.name || "Favourite product";
    image.loading = "lazy";

    if (product.image_url) {
      image.src = product.image_url;
    } else {
      image.style.display = "none";
      imageLink.classList.add("favorite-image-placeholder");
      imageLink.textContent = "Sakshi Suit Collection";
    }

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
    view.href = productPageUrl(product);
    view.textContent = "View Product →";

    details.append(name, price, view);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "favorite-remove";
    remove.textContent = "♥ Remove";

    remove.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

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

async function loadProducts() {
  if (!grid) return;

  grid.replaceChildren();

  const loading = document.createElement("p");
  loading.textContent = "Collection load ho rahi hai...";
  grid.appendChild(loading);

  try {
    const response = await fetch("/api/products", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Products request failed (${response.status})`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid products response");
    }

    products = data;
    renderProducts();
  } catch (error) {
    console.error("Product loading failed:", error);
    grid.replaceChildren();

    const message = document.createElement("p");
    message.textContent =
      "Products load nahi ho paaye. Page refresh karke dobara try karein.";

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

favoritesButton?.addEventListener("click", event => {
  event.preventDefault();

  if (favoritesPanel) {
    favoritesPanel.hidden = false;
    favoritesPanel.removeAttribute("hidden");
  }

  renderFavorites();
});

closeFavorites?.addEventListener("click", event => {
  event.preventDefault();

  if (favoritesPanel) {
    favoritesPanel.hidden = true;
  }
});

document.querySelectorAll(".category-card").forEach(card => {
  card.addEventListener("click", () => {
    const category = (card.dataset.category || "").trim().toLowerCase();

    const button = [...filterButtons].find(
      item => (item.dataset.filter || "").trim().toLowerCase() === category
    );

    button?.click();

    document.querySelector("#products")?.scrollIntoView({
      behavior: "smooth"
    });
  });
});

const yearElement = document.querySelector("[data-current-year]");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

loadProducts();

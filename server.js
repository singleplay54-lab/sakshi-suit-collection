
const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD"
];

const missing = required.filter(key => !process.env[key]);

if (missing.length) {
  console.error("Missing environment variables:", missing.join(", "));
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  console.error("Set SESSION_SECRET to a random secret of at least 32 characters.");
  process.exit(1);
}

const COOKIE_NAME = "sakshi_admin_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000;

function safeEqual(a, b) {
  const first = Buffer.from(String(a));
  const second = Buffer.from(String(b));
  return first.length === second.length &&
    crypto.timingSafeEqual(first, second);
}

function sign(value) {
  return crypto.createHmac("sha256", SESSION_SECRET)
    .update(value).digest("hex");
}

function makeSession() {
  const payload = Buffer.from(JSON.stringify({
    user: process.env.ADMIN_USERNAME,
    exp: Date.now() + SESSION_DURATION
  })).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function readCookie(req, name) {
  const cookies = (req.headers.cookie || "").split(";");

  for (const item of cookies) {
    const index = item.indexOf("=");
    if (index < 0) continue;

    if (item.slice(0, index).trim() === name) {
      return decodeURIComponent(item.slice(index + 1).trim());
    }
  }
  return "";
}

function requireAdmin(req, res, next) {
  const token = readCookie(req, COOKIE_NAME);
  const parts = token.split(".");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return res.status(401).json({ error: "Admin login required." });
  }

  if (!safeEqual(parts[1], sign(parts[0]))) {
    return res.status(401).json({ error: "Invalid session." });
  }

  try {
    const session = JSON.parse(
      Buffer.from(parts[0], "base64url").toString()
    );

    if (
      session.user !== process.env.ADMIN_USERNAME ||
      !Number.isFinite(session.exp) ||
      session.exp < Date.now()
    ) {
      return res.status(401).json({ error: "Session expired." });
    }

    next();
  } catch {
    return res.status(401).json({ error: "Invalid session." });
  }
}

function setSessionCookie(res, value) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}`
  );
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};

  const usernameMatch =
    typeof username === "string" &&
    safeEqual(username, process.env.ADMIN_USERNAME);

  const passwordMatch =
    typeof password === "string" &&
    safeEqual(password, process.env.ADMIN_PASSWORD);

  console.log("Admin login diagnostic:", {
    usernameMatch,
    passwordMatch,
    usernameReceived: typeof username === "string",
    passwordReceived: typeof password === "string"
  });

  if (!usernameMatch || !passwordMatch) {
    return res.status(401).json({
      error: "Incorrect username or password."
    });
  }

  setSessionCookie(res, makeSession());
  res.setHeader("Cache-Control", "no-store");
  res.json({ success: true });
});

app.post("/api/admin/logout", (req, res) => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`
  );

  res.json({ success: true });
});

app.get("/api/admin/check", requireAdmin, (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ authenticated: true });
});

app.get("/api/products", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,description,price,category,image_url,is_active,created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Product read failed:", error.message);
    return res.status(500).json({ error: "Could not load products." });
  }

  res.json(data);
});

app.get("/api/admin/products", requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin product read failed:", error.message);
    return res.status(500).json({ error: "Could not load products." });
  }

  res.json(data);
});


function validateProduct(body) {
  if (
    !body ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    body.name.length > 200 ||
    typeof body.category !== "string" ||
    !body.category.trim() ||
    body.category.length > 80 ||
    !Number.isFinite(Number(body.price)) ||
    Number(body.price) < 0 ||
    (body.description != null &&
      (typeof body.description !== "string" ||
        body.description.length > 5000)) ||
    (body.image_url != null &&
      (typeof body.image_url !== "string" ||
        body.image_url.length > 2000)) ||
    (body.image_urls != null && !Array.isArray(body.image_urls))
  ) {
    return null;
  }

  const imageUrls = Array.isArray(body.image_urls)
    ? body.image_urls
    : [];

  if (imageUrls.length > 4) return null;

  const cleanUrls = [];

  for (const value of imageUrls) {
    if (typeof value !== "string" || value.length > 2000) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) continue;

    try {
      const url = new URL(trimmed);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        return null;
      }
    } catch {
      return null;
    }

    cleanUrls.push(trimmed);
  }

  const mainImage = typeof body.image_url === "string"
    ? body.image_url.trim()
    : "";

  if (mainImage) {
    try {
      const url = new URL(mainImage);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        return null;
      }
    } catch {
      return null;
    }
  }

  if (mainImage && cleanUrls.length === 0) {
    cleanUrls.push(mainImage);
  }

  return {
    name: body.name.trim(),
    description: body.description || "",
    price: Number(body.price),
    category: body.category.trim(),
    image_url: cleanUrls[0] || mainImage || "",
    image_urls: cleanUrls,
    is_active: body.is_active !== false
  };
}

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  const product = validateProduct(req.body);
  if (!product) {
    return res.status(400).json({ error: "Please check product details." });
  }

  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) {
    console.error("Product insert failed:", error.message);
    return res.status(500).json({ error: "Could not save product." });
  }

  res.status(201).json(data);
});

app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const product = validateProduct(req.body);
  if (!product) {
    return res.status(400).json({ error: "Please check product details." });
  }

  const { data, error } = await supabase
    .from("products")
    .update(product)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) {
    console.error("Product update failed:", error.message);
    return res.status(500).json({ error: "Could not update product." });
  }

  res.json(data);
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", req.params.id);

  if (error) {
    console.error("Product delete failed:", error.message);
    return res.status(500).json({ error: "Could not delete product." });
  }

  res.json({ success: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Sakshi Suit Collection running on port ${PORT}`);
});

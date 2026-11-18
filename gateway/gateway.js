const express = require("express");
const crypto = require("crypto");
const { createProxyMiddleware } = require("http-proxy-middleware");
const swaggerUi = require("swagger-ui-express");

const app = express();

// URL service
const PRODUCT_TARGET =
  process.env.PRODUCT_SERVICE_TARGET || "http://127.0.0.1:3000";

const ORDER_TARGET =
  process.env.ORDER_SERVICE_TARGET || "http://127.0.0.1:3001";

// ==========================================
// 1. RATE LIMITING
// ==========================================

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 100;
const requestCounts = new Map();

app.use((req, res, next) => {
  if (req.path === "/health") return next();

  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";

  let entry = requestCounts.get(key);

  if (!entry || now - entry.start >= WINDOW_MS) {
    entry = { start: now, count: 0 };
  }

  entry.count += 1;
  requestCounts.set(key, entry);

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: "Terlalu banyak request, coba lagi nanti",
    });
  }

  next();
});

// ==========================================
// 2. API KEY
// ==========================================

app.use((req, res, next) => {
  // Dokumentasi dan halaman utama bisa diakses tanpa API key.
  if (
    req.path === "/" ||
    req.path === "/health" ||
    req.path === "/docs" ||
    req.path.startsWith("/docs/") ||
    req.path === "/openapi.json"
  ) {
    return next();
  }

  const expectedKey = process.env.API_KEY || "praktikum-key";
  const suppliedKey = req.get("X-API-Key");

  if (suppliedKey !== expectedKey) {
    return res.status(401).json({
      error: "API key tidak valid atau tidak ada",
    });
  }

  next();
});

// ==========================================
// 3. REQUEST ID + HEALTH (sebelum proxy)
// ==========================================

app.use((req, res, next) => {
  const id = req.headers["x-request-id"] || crypto.randomUUID();
  req.headers["x-request-id"] = id;
  res.setHeader("X-Request-Id", id);

  if (req.path !== "/health") {
    const t0 = process.hrtime.bigint();
    res.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      console.log(
        JSON.stringify({
          time: new Date().toISOString(),
          service: "gateway",
          id,
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          ms: Math.round(ms),
        }),
      );
    });
  }

  next();
});

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "gateway" }),
);

function forwardRequestId(proxyReq, req) {
  if (req.headers["x-request-id"]) {
    proxyReq.setHeader("X-Request-Id", req.headers["x-request-id"]);
  }
}

// ==========================================
// 4. MENGGABUNGKAN OPENAPI SPECIFICATION
// ==========================================

async function getOpenAPISpec() {
  const [productResponse, orderResponse] = await Promise.all([
    fetch(`${PRODUCT_TARGET}/openapi.json`, {
      signal: AbortSignal.timeout(2000),
    }),
    fetch(`${ORDER_TARGET}/openapi.json`, {
      signal: AbortSignal.timeout(2000),
    }),
  ]);

  if (!productResponse.ok || !orderResponse.ok) {
    throw new Error("Gagal mengambil dokumentasi dari service");
  }

  const productSpec = await productResponse.json();
  const orderSpec = await orderResponse.json();

  return {
    openapi: "3.0.3",

    info: {
      title: "Toko Microservices API",
      version: "1.0.0",
      description:
        "Dokumentasi gabungan Product Service dan Order Service melalui API Gateway.",
    },

    servers: [
      {
        url: "/",
      },
    ],

    tags: [{ name: "Product Service" }, { name: "Order Service" }],

    paths: {
      ...Object.fromEntries(
        Object.entries(productSpec.paths || {}).map(([path, methods]) => [
          `/product-service${path}`,
          methods,
        ]),
      ),

      ...Object.fromEntries(
        Object.entries(orderSpec.paths || {}).map(([path, methods]) => [
          `/order-service${path}`,
          methods,
        ]),
      ),
    },

    components: {
      schemas: {
        ...(productSpec.components?.schemas || {}),
        ...(orderSpec.components?.schemas || {}),
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
    },

    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  };
}

// Endpoint OpenAPI JSON
app.get("/openapi.json", async (req, res) => {
  try {
    const spec = await getOpenAPISpec();
    res.json(spec);
  } catch (error) {
    console.error("Gagal menggabungkan OpenAPI:", error.message);

    res.status(503).json({
      error: "Dokumentasi service belum dapat diambil",
      detail: error.message,
    });
  }
});

// ==========================================
// 5. SWAGGER UI
// ==========================================

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: "/openapi.json",
      persistAuthorization: true,
    },
  }),
);

// ==========================================
// 6. PROXY PRODUCT SERVICE
// ==========================================

app.use(
  "/product-service",
  createProxyMiddleware({
    target: PRODUCT_TARGET,
    changeOrigin: true,
    pathRewrite: {
      "^/product-service": "",
    },
    on: {
      proxyReq: forwardRequestId,
    },
  }),
);

// ==========================================
// 7. PROXY ORDER SERVICE
// ==========================================

app.use(
  "/order-service",
  createProxyMiddleware({
    target: ORDER_TARGET,
    changeOrigin: true,
    pathRewrite: {
      "^/order-service": "",
    },
    on: {
      proxyReq: forwardRequestId,
    },
  }),
);

// ==========================================
// 8. HALAMAN UTAMA GATEWAY
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "Toko API Gateway aktif",

    routes: {
      products: "/product-service/products",
      orders: "/order-service/orders",
      health: "/health",
      documentation: "/docs",
      openapi: "/openapi.json",
    },

    security: ["rate limiting", "API key"],
  });
});

// ==========================================
// 9. MENJALANKAN GATEWAY
// ==========================================

const PORT = Number(process.env.PORT || 8080);

app.listen(PORT, process.env.HOST || "0.0.0.0", () => {
  console.log(`API Gateway berjalan di port ${PORT}`);
});

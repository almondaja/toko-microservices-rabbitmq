const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(express.json());

// ==========================================
// DATA PRODUK
// category sudah ditambahkan untuk praktik
// Schema Drift.
// ==========================================

const products = [
  {
    id: 1,
    name: "Keyboard Mekanik",
    price: 450000,
    stock: 10,
    category: "Periferal",
  },
  {
    id: 2,
    name: "Mouse Wireless",
    price: 175000,
    stock: 25,
    category: "Periferal",
  },
  {
    id: 3,
    name: "Monitor 24 inci",
    price: 1850000,
    stock: 5,
    category: "Monitor",
  },
];

// ==========================================
// OPENAPI / SWAGGER CONFIGURATION
// ==========================================

const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Product Service API",
      version: "1.0.0",
      description: "Dokumentasi API untuk mengelola produk toko.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Product Service",
      },
    ],
  },
  apis: [__filename],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Endpoint OpenAPI JSON
app.get("/openapi.json", (req, res) => {
  res.json(swaggerSpec);
});

// Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==========================================
// SCHEMA OPENAPI
// category sengaja BELUM dimasukkan.
// Ini untuk menunjukkan Schema Drift.
// ==========================================

/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Keyboard Mekanik
 *         price:
 *           type: integer
 *           example: 450000
 *         stock:
 *           type: integer
 *           example: 10
 *         category:
 *           type: string
 *           example: Periferal
 */

// ==========================================
// GET SEMUA PRODUK
// ==========================================

/**
 * @openapi
 * /products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Daftar semua produk
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar produk
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */

app.get("/products", (req, res) => {
  res.json(products);
});

// ==========================================
// GET DETAIL PRODUK
// ==========================================

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Detail satu produk
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail produk
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Produk tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

app.get("/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({
      error: "Produk tidak ditemukan",
    });
  }

  res.json(product);
});

// ==========================================
// POST RESERVE STOK PRODUK
// ==========================================

/**
 * @openapi
 * /products/{id}/reserve:
 *   post:
 *     tags:
 *       - Products
 *     summary: Kurangi stok produk
 *     description: Dipanggil oleh service lain untuk mengurangi stok produk.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReserveRequest'
 *     responses:
 *       200:
 *         description: Stok berhasil dikurangi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Jumlah tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Produk tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Stok tidak cukup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

app.post("/products/:id/reserve", (req, res) => {
  const id = Number(req.params.id);
  const qty = Number(req.body.qty);

  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({
      error: "Produk tidak ditemukan",
    });
  }

  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({
      error: "qty harus berupa angka bulat lebih dari 0",
    });
  }

  if (product.stock < qty) {
    return res.status(409).json({
      error: "Stok tidak cukup",
    });
  }

  product.stock -= qty;

  res.json(product);
});

// ==========================================
// MENJALANKAN PRODUCT SERVICE
// ==========================================

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Product Service berjalan di port ${PORT}`);
});

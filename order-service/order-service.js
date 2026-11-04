const express = require("express");
const amqp = require("amqplib");

const app = express();
app.use(express.json());

const PRODUCT_URL = process.env.PRODUCT_SERVICE_URL || "http://127.0.0.1:3000";

const AMQP_URL = process.env.AMQP_URL;
const EXCHANGE = "orders";

const orders = [];

let rabbitConnection = null;
let rabbitChannel = null;
let reconnectTimer = null;
let connecting = false;

// Menghubungkan Order Service ke RabbitMQ
async function connectRabbitMQ() {
  if (connecting || rabbitChannel) return;

  if (!AMQP_URL) {
    console.error("AMQP_URL belum diatur di Replit Secrets");
    return;
  }

  connecting = true;

  try {
    const connection = await amqp.connect(AMQP_URL);
    const channel = await connection.createConfirmChannel();

    await channel.assertExchange(EXCHANGE, "fanout", {
      durable: true,
    });

    rabbitConnection = connection;
    rabbitChannel = channel;

    console.log("Order Service terhubung ke RabbitMQ");

    connection.on("error", (error) => {
      console.error("RabbitMQ connection error:", error.message);
    });

    connection.on("close", () => {
      console.log("Koneksi RabbitMQ terputus");
      rabbitConnection = null;
      rabbitChannel = null;
      scheduleReconnect();
    });

    channel.on("error", (error) => {
      console.error("RabbitMQ channel error:", error.message);
    });

    channel.on("close", () => {
      rabbitChannel = null;
      scheduleReconnect();
    });
  } catch (error) {
    console.error("Gagal terhubung ke RabbitMQ:", error.message);
    scheduleReconnect();
  } finally {
    connecting = false;
  }
}

// Mencoba menghubungkan kembali jika koneksi terputus
function scheduleReconnect() {
  if (reconnectTimer) return;

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await connectRabbitMQ();
  }, 5000);
}

// Mengirim event order.created ke exchange orders
async function publishOrderCreated(order) {
  if (!rabbitChannel) {
    console.error("Event tidak terkirim: RabbitMQ belum terhubung");
    return false;
  }

  const event = {
    type: "order.created",
    data: order,
  };

  try {
    await new Promise((resolve, reject) => {
      rabbitChannel.publish(
        EXCHANGE,
        "",
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          contentType: "application/json",
          messageId: `order-${order.id}`,
        },
        (error) => {
          if (error) reject(error);
          else resolve();
        },
      );
    });

    console.log(`Event order.created terkirim: order-${order.id}`);
    return true;
  } catch (error) {
    console.error("Gagal mengirim event:", error.message);
    return false;
  }
}

// Membuat pesanan
app.post("/orders", async (req, res) => {
  const { productId, qty } = req.body || {};

  if (
    !Number.isInteger(productId) ||
    productId < 1 ||
    !Number.isInteger(qty) ||
    qty < 1
  ) {
    return res.status(400).json({
      error: "productId dan qty harus bilangan bulat > 0",
    });
  }

  let productResponse;

  try {
    productResponse = await fetch(
      `${PRODUCT_URL}/products/${productId}/reserve`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty }),
        signal: AbortSignal.timeout(2000),
      },
    );
  } catch (error) {
    return res.status(503).json({
      error: "product-service tidak tersedia, coba lagi nanti",
    });
  }

  let product;

  try {
    product = await productResponse.json();
  } catch (error) {
    return res.status(502).json({
      error: "Respons product-service tidak valid",
    });
  }

  if (!productResponse.ok) {
    return res.status(productResponse.status).json(product);
  }

  const order = {
    id: orders.length + 1,
    productId,
    productName: product.name,
    qty,
    total: product.price * qty,
    createdAt: new Date().toISOString(),
  };

  orders.push(order);

  // Kirim event setelah pesanan berhasil dibuat
  await publishOrderCreated(order);

  return res.status(201).json(order);
});

// Melihat daftar pesanan
app.get("/orders", (req, res) => {
  res.json(orders);
});

const PORT = Number(process.env.PORT || 3001);

async function start() {
  await connectRabbitMQ();

  app.listen(PORT, process.env.HOST || "0.0.0.0", () => {
    console.log(`order-service berjalan di port ${PORT}`);
  });
}

start();

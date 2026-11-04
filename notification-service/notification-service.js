const amqp = require("amqplib");

const AMQP_URL = process.env.AMQP_URL || "amqp://localhost";

// Nama queue bisa diubah melalui argumen terminal
const QUEUE =
  process.argv.slice(2).find((arg) => !arg.startsWith("--")) ||
  "notification-queue";

// Untuk pengujian consumer crash
const CRASH = process.argv.includes("--crash");

// Menyimpan ID pesan yang sudah diproses
const processed = new Set();

async function main() {
  // Menghubungkan aplikasi ke RabbitMQ
  const conn = await amqp.connect(AMQP_URL);
  const ch = await conn.createChannel();

  // Membuat exchange orders dengan tipe fanout
  await ch.assertExchange("orders", "fanout", {
    durable: true,
  });

  // Membuat antrean notifikasi
  await ch.assertQueue(QUEUE, {
    durable: true,
  });

  // Menghubungkan queue dengan exchange
  await ch.bindQueue(QUEUE, "orders", "");

  // Satu consumer memproses satu pesan pada satu waktu
  ch.prefetch(1);

  console.log(`[${QUEUE}] menunggu pesan...`);

  // Menerima pesan dari RabbitMQ
  ch.consume(QUEUE, async (msg) => {
    if (!msg) return;

    let event;

    try {
      event = JSON.parse(msg.content.toString());
    } catch (error) {
      console.error("pesan rusak, dibuang");
      return ch.nack(msg, false, false);
    }

    const id = msg.properties.messageId;

    // Memeriksa pesan duplikat
    if (processed.has(id)) {
      console.log("duplikat, dilewati:", id);
      return ch.ack(msg);
    }

    // Simulasi proses pengiriman email selama 1 detik
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(
      `[${QUEUE}] email terkirim: pesanan #${event.data.id} ` +
        `${event.data.productName} x${event.data.qty}`,
    );

    // Menyimpan ID pesan yang sudah diproses
    processed.add(id);

    // Simulasi aplikasi mati sebelum ACK
    if (CRASH) {
      console.log("crash sebelum ack!");
      process.exit(1);
    }

    // Memberitahu RabbitMQ bahwa pesan sudah selesai
    ch.ack(msg);
  });
}

// Menjalankan consumer
main().catch((error) => {
  console.error("Kesalahan Notification Service:", error.message);
  process.exit(1);
});

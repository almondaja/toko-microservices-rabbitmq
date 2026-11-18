![CI](https://github.com/almondaja/toko-microservices-rabbitmq/actions/workflows/ci.yml/badge.svg)

# Toko Microservices

## 1. Deskripsi Proyek

Toko Microservices merupakan aplikasi sederhana berbasis arsitektur microservices yang membagi fungsi aplikasi toko menjadi beberapa service terpisah. Setiap service memiliki tanggung jawab masing-masing dan komunikasi antarlayanan dilakukan melalui API Gateway maupun message broker RabbitMQ.

Proyek ini dibuat untuk menerapkan konsep:
- Microservices Architecture
- API Gateway dan Reverse Proxy
- Dokumentasi API menggunakan OpenAPI dan Swagger
- Komunikasi asynchronous menggunakan RabbitMQ
- Event-driven architecture

## 2. Arsitektur Sistem

Proyek terdiri dari empat service utama:

| Service | Port | Fungsi |
|---|---:|---|
| Product Service | 3000 | Mengelola data produk dan reservasi stok |
| Order Service | 3001 | Mengelola pesanan dan mengirim event order |
| API Gateway | 5000 | Menjadi pintu masuk API, routing, rate limiting, dan API Key |
| Notification Service | - | Menerima event RabbitMQ dan memproses notifikasi |

API Gateway meneruskan permintaan ke Product Service dan Order Service. Ketika pesanan berhasil dibuat, Order Service mengirim event `order.created` melalui RabbitMQ untuk diproses oleh Notification Service.

## 3. Struktur Folder

```text
workspace/
├── product-service/
│   └── product-service.js
├── order-service/
│   └── order-service.js
├── gateway/
│   └── gateway.js
├── notification-service/
│   └── notification-service.js
├── start-services.js
├── smoke-test.js
├── openapi-gateway.json
├── DIAGRAM.md
├── package.json
└── README.md
```

## 4. Teknologi yang Digunakan

- Node.js
- Express.js
- HTTP Proxy Middleware
- Swagger UI
- OpenAPI 3.0
- RabbitMQ
- amqplib
- Postman

## 5. Instalasi

Pastikan Node.js dan npm sudah terpasang.

Clone repository:

```bash
git clone https://github.com/almondaja/toko-microservices-rabbitmq.git
cd toko-microservices-rabbitmq
```

Install dependency pada folder utama dan masing-masing service:

```bash
npm install

cd product-service
npm install
cd ..

cd order-service
npm install
cd ..

cd gateway
npm install
cd ..

cd notification-service
npm install
cd ..
```

## 6. Konfigurasi Environment

Sebelum menjalankan aplikasi, siapkan alamat koneksi RabbitMQ.

Variabel yang digunakan:

| Variabel | Fungsi | Nilai Default |
|---|---|---|
| `AMQP_URL` | Alamat koneksi RabbitMQ | Notification Service menggunakan `amqp://localhost` |
| `API_KEY` | Kunci akses API Gateway | `praktikum-key` |
| `PRODUCT_SERVICE_URL` | Alamat Product Service dari Order Service | `http://127.0.0.1:3000` |
| `PRODUCT_SERVICE_TARGET` | Target proxy Product Service | `http://127.0.0.1:3000` |
| `ORDER_SERVICE_TARGET` | Target proxy Order Service | `http://127.0.0.1:3001` |

Atur `AMQP_URL` menggunakan alamat RabbitMQ yang tersedia. Gunakan alamat yang sama untuk Order Service dan Notification Service.

Untuk Replit, konfigurasi dapat dimasukkan melalui Secrets atau Environment Variables.

## 7. Menjalankan Aplikasi

Pastikan RabbitMQ sudah aktif dan dapat diakses.

### A. Menjalankan Product Service, Order Service, dan API Gateway

Dari folder utama:

```bash
npm start
```

Perintah tersebut menjalankan `start-services.js`, yang mengaktifkan:

- Product Service pada port 3000.
- Order Service pada port 3001.
- API Gateway pada port 5000.

### B. Menjalankan Notification Service

Buka terminal terpisah dari folder utama:

```bash
node notification-service/notification-service.js
```

Notification Service akan terhubung ke RabbitMQ dan menunggu event yang diterbitkan oleh Order Service.

## 8. Dokumentasi API

Dokumentasi API menggunakan OpenAPI 3.0 dan Swagger UI.

| Service | Swagger UI | OpenAPI JSON |
|---|---|---|
| Product Service | `/docs` pada port 3000 | `/openapi.json` pada port 3000 |
| Order Service | `/docs` pada port 3001 | `/openapi.json` pada port 3001 |
| API Gateway | `/docs` pada port 5000 | `/openapi.json` pada port 5000 |

Contoh alamat lokal:

```text
http://localhost:5000/docs
http://localhost:5000/openapi.json
```

File `openapi-gateway.json` merupakan hasil ekspor dokumentasi API Gateway yang dapat digunakan untuk validasi melalui Swagger Editor dan diimpor ke Postman.

## 9. Keamanan API Gateway

API Gateway menerapkan beberapa mekanisme keamanan:

1. **API Key:** Memeriksa header `X-API-Key` pada permintaan API.
2. **Rate Limiting:** Membatasi jumlah permintaan untuk mengurangi penyalahgunaan API.
3. **Reverse Proxy:** Meneruskan permintaan ke service tujuan berdasarkan endpoint.

Contoh header API Key:

```http
X-API-Key: praktikum-key
```

Jika menggunakan API Key yang berbeda, sesuaikan dengan nilai environment variable `API_KEY`.

## 10. Pengujian API

Pengujian dapat dilakukan menggunakan Postman atau Swagger UI.

Beberapa endpoint yang tersedia melalui API Gateway:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/product-service/products` | Melihat seluruh produk |
| GET | `/product-service/products/{id}` | Melihat detail produk |
| POST | `/product-service/products/{id}/reserve` | Melakukan reservasi stok |
| GET | `/order-service/orders` | Melihat seluruh pesanan |
| POST | `/order-service/orders` | Membuat pesanan |

Jalankan pengujian otomatis dari folder utama (service harus sudah menyala):

```bash
npm test
```

Perintah itu menjalankan `tests/api.test.js` terhadap gateway di port 8080. Di Replit, setelah `npm start`, gateway ada di port 5000:

```bash
npm run test:replit
```

Pengujian lama yang hanya mencetak hasil masih ada lewat `npm run smoke`.

## 11. Komunikasi RabbitMQ

Order Service menggunakan RabbitMQ untuk mengirim event ketika pesanan berhasil dibuat.

Event yang digunakan:

```text
order.created
```

Notification Service bertindak sebagai consumer yang menerima dan memproses event tersebut.

Dengan pendekatan ini, proses notifikasi tidak harus dijalankan secara langsung dalam alur permintaan pembuatan pesanan.

## 12. Kesimpulan

Proyek ini menerapkan arsitektur microservices dengan pemisahan tanggung jawab pada setiap service. API Gateway digunakan untuk mengatur akses dan routing permintaan, sedangkan RabbitMQ digunakan untuk komunikasi asynchronous antarlayanan. Dokumentasi OpenAPI dan Swagger membantu menjelaskan kontrak API serta mempermudah proses pengujian menggunakan Postman. Health check, metrik, log ber-ID permintaan, dan test otomatis di GitHub Actions membuat sistem bisa membuktikan dirinya sehat setiap kali kode di-push.

## 13. Automated Testing, Health, dan Monitoring

Setiap service (`product-service` dan `order-service`) menyediakan:

- `GET /health` — status proses
- `GET /metrics` — jumlah request, error 5xx, dan rata-rata latensi
- log JSON per permintaan, termasuk `id` yang sama dengan header `X-Request-Id`

Gateway membuat `X-Request-Id` bila klien tidak mengirimnya, meneruskannya ke service, dan menjawab `GET /health`. Order service meneruskan ID yang sama saat memanggil product service.

Jalankan seluruh service, lalu dari folder akar:

```bash
npm test
```

Di Replit, `npm start` menaruh gateway di port 5000. Dari folder akar:

```bash
npm run test:replit
npm run monitor:replit
```

`monitor:replit` sama dengan `GATEWAY_URL=http://127.0.0.1:5000 node monitor.js`. Product service tetap di port 3000 dan order service di port 3001.

Jika service dijalankan satu per satu tanpa `start-services.js`, gateway memakai port 8080. Saat itu cukup `npm test` dan `npm run monitor`.

`monitor.js` memanggil `/health` tiap 5 detik dan mencetak `ALERT` / `RECOVERED` saat status berubah.

GitHub Actions (`.github/workflows/ci.yml`) menyalakan ketiga service di port 3000, 3001, dan 8080, lalu menjalankan `npm test` pada setiap push. Refleksi tugas ada di [REFLEKSI.md](REFLEKSI.md).

Jika badge di baris pertama masih menunjuk repository lain, ganti `almondaja/toko-microservices-rabbitmq` dengan `USERNAME/REPO` milik kelompok.

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

Jalankan pengujian otomatis dari folder utama:

```bash
npm test
```

Pengujian mencakup pemeriksaan produk dan proses pemesanan melalui API Gateway.

## 11. Komunikasi RabbitMQ

Order Service menggunakan RabbitMQ untuk mengirim event ketika pesanan berhasil dibuat.

Event yang digunakan:

```text
order.created
```

Notification Service bertindak sebagai consumer yang menerima dan memproses event tersebut.

Dengan pendekatan ini, proses notifikasi tidak harus dijalankan secara langsung dalam alur permintaan pembuatan pesanan.

## 12. Kesimpulan

Proyek ini menerapkan arsitektur microservices dengan pemisahan tanggung jawab pada setiap service. API Gateway digunakan untuk mengatur akses dan routing permintaan, sedangkan RabbitMQ digunakan untuk komunikasi asynchronous antarlayanan. Dokumentasi OpenAPI dan Swagger membantu menjelaskan kontrak API serta mempermudah proses pengujian menggunakan Postman.
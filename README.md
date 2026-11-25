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
| API Gateway | 8080 (langsung/Compose), 5000 (`npm start`) | Menjadi pintu masuk API, routing, rate limiting, dan API Key |
| Notification Service | - | Menerima event RabbitMQ dan memproses notifikasi |

API Gateway meneruskan permintaan ke Product Service dan Order Service. Ketika pesanan berhasil dibuat, Order Service mengirim event `order.created` melalui RabbitMQ untuk diproses oleh Notification Service.

## 3. Struktur Folder

```text
workspace/
├── product-service/
│   ├── Dockerfile
│   └── product-service.js
├── order-service/
│   ├── Dockerfile
│   └── order-service.js
├── gateway/
│   ├── Dockerfile
│   └── gateway.js
├── notification-service/
│   ├── Dockerfile
│   └── notification-service.js
├── docker-compose.yml
├── .env.example
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

| Variabel | Digunakan oleh | Nilai default / contoh |
|---|---|---|
| `PRODUCT_SERVICE_URL` | Order Service dan API Gateway | `http://localhost:3000` saat dijalankan manual |
| `ORDER_SERVICE_URL` | API Gateway | `http://localhost:3001` saat dijalankan manual |
| `PRODUCT_DOC_URL` | API Gateway untuk mengambil OpenAPI Product | `${PRODUCT_SERVICE_URL}/openapi.json` |
| `ORDER_DOC_URL` | API Gateway untuk mengambil OpenAPI Order | `${ORDER_SERVICE_URL}/openapi.json` |
| `AMQP_URL` | Order Service dan Notification Service | `amqp://localhost` untuk broker lokal |
| `API_KEY` | API Gateway | `praktikum-key` untuk praktikum |

Di Docker Compose, URL antar-service diarahkan ke nama service pada jaringan internal, misalnya `http://product-service:3000` dan `amqp://...@rabbitmq:5672`. Kredensial RabbitMQ untuk Compose dibaca dari `.env`; lihat bagian **Menjalankan Seluruh Sistem dengan Docker Compose**. Untuk Replit, konfigurasi dapat dimasukkan melalui Secrets atau Environment Variables.

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
| API Gateway | `/docs` pada port 5000 (`npm start`) atau 8080 (Compose) | `/openapi.json` pada port yang sama |

Contoh alamat lokal:

```text
http://localhost:5000/docs  # saat memakai npm start
http://localhost:8080/docs  # saat memakai Docker Compose
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

Perintah itu menjalankan `tests/api.test.js` terhadap gateway di port 8080. Saat memakai `npm start`, gateway ada di port 5000:

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

`npm start` menaruh gateway di port 5000. Dari folder akar:

```bash
npm run test:replit
npm run monitor:replit
```

`monitor:replit` sama dengan `GATEWAY_URL=http://127.0.0.1:5000 node monitor.js`. Product service tetap di port 3000 dan order service di port 3001.

Jika service dijalankan satu per satu tanpa `start-services.js`, gateway memakai port 8080. Saat itu cukup `npm test` dan `npm run monitor`.

`monitor.js` memanggil `/health` tiap 5 detik dan mencetak `ALERT` / `RECOVERED` saat status berubah.

GitHub Actions (`.github/workflows/ci.yml`) membangun dan menyalakan seluruh stack menggunakan Docker Compose, lalu menjalankan `npm test` pada setiap push atau pull request. Refleksi tugas ada di [REFLEKSI.md](REFLEKSI.md).

Jika badge di baris pertama masih menunjuk repository lain, ganti `almondaja/toko-microservices-rabbitmq` dengan `USERNAME/REPO` milik kelompok.


## 14. Menjalankan Seluruh Sistem dengan Docker Compose (Lab 13)

Bagian ini menjalankan gateway, Product Service, Order Service, RabbitMQ, dan Notification Service melalui satu konfigurasi Compose. Di dalam jaringan Compose, service saling berkomunikasi menggunakan nama service, bukan `localhost`.

### Prasyarat

- Docker Desktop sudah terpasang dan sedang berjalan.
- Docker Compose v2 tersedia (`docker compose version`).
- Node.js 22 tersedia untuk menjalankan `npm test` dari komputer host.
- Port host `8080` dan `15672` tidak sedang digunakan aplikasi lain.

### Konfigurasi lokal

Buat file `.env` dari template. Di PowerShell:

```powershell
Copy-Item .env.example .env
```

Di macOS/Linux:

```bash
cp .env.example .env
```

Buka `.env`, lalu isi `RABBITMQ_USER` dan `RABBITMQ_PASSWORD` dengan kredensial lokal yang kuat. Gunakan karakter alfanumerik (huruf dan angka) agar nilai tersebut dapat digunakan langsung pada URL AMQP. File `.env` sudah masuk `.gitignore`; jangan commit atau membagikan file ini. `.env.example` hanya template dan bukan tempat menyimpan kredensial asli. Untuk memastikan `npm test` pada komputer host memakai key yang sama, pertahankan `API_KEY=praktikum-key`. Proses npm pada host tidak otomatis membaca file `.env`; jika API Key diubah, atur juga environment variable `API_KEY` pada terminal tempat `npm test` dijalankan.

### Build dan jalankan

Pastikan service yang sebelumnya dijalankan manual sudah dihentikan dengan `Ctrl+C`, serta container RabbitMQ lama dari praktikum sebelumnya tidak lagi memakai port `15672`.

Dari folder akar repository:

```bash
docker compose config
docker compose up --build
```

Perintah pertama memeriksa hasil interpolasi konfigurasi. Perintah kedua membangun image dan menjalankan seluruh stack. Biarkan terminal tersebut tetap terbuka. Jika ingin menjalankan stack di background, gunakan:

```bash
docker compose up -d --build --wait
```

### Alamat layanan

| Layanan | Alamat dari komputer host | Keterangan |
|---|---|---|
| API Gateway | `http://localhost:8080` | Satu-satunya pintu masuk API |
| Swagger UI Gateway | `http://localhost:8080/docs` | Dokumentasi API gabungan |
| Health Gateway | `http://localhost:8080/health` | Pemeriksaan gateway |
| RabbitMQ Management | `http://localhost:15672` | Login memakai `RABBITMQ_USER` dan `RABBITMQ_PASSWORD` dari `.env` |

Product Service (`3000`) dan Order Service (`3001`) hanya tersedia di jaringan internal Compose dan tidak dipublikasikan ke host. Gateway meneruskan request ke `product-service:3000` dan `order-service:3001`. Order Service dan Notification Service terhubung ke broker melalui `rabbitmq:5672`.

### Memeriksa status dan menjalankan test

Buka terminal kedua pada folder akar repository:

```bash
docker compose ps
npm test
```

Service yang memiliki health check harus menunjukkan status `healthy`. Notification Service tidak memiliki health check HTTP karena tugasnya hanya menjadi consumer; pastikan status containernya `Up`. Seluruh test API menggunakan gateway pada `localhost:8080`, sehingga file test tidak perlu diubah.

Untuk melihat log beberapa service:

```bash
docker compose logs order-service product-service notification-service
```

Untuk mengikuti log secara langsung:

```bash
docker compose logs -f order-service product-service notification-service
```

Setelah membuat pesanan, cari `X-Request-Id` yang sama pada log gateway, order-service, dan product-service. Log Notification Service seharusnya menampilkan pesan `email terkirim` setelah event diterima dari RabbitMQ.

### Mencoba endpoint membuat pesanan

Contoh menggunakan `curl`:

```bash
curl -i -X POST http://localhost:8080/order-service/orders \
  -H "Content-Type: application/json" \
  -H "X-API-Key: praktikum-key" \
  -d "{\"productId\":2,\"qty\":1}"
```

Jika API Key pada `.env` diubah, gunakan nilai yang sama pada header `X-API-Key`. Respons berhasil membuat pesanan adalah HTTP `201`.

### Latihan kegagalan service

1. Hentikan Product Service:

   ```bash
   docker compose stop product-service
   docker compose ps
   ```

2. Kirim kembali request `POST /order-service/orders` melalui gateway. Order Service tidak dapat menghubungi Product Service dan seharusnya mengembalikan HTTP `503`.

3. Nyalakan kembali Product Service:

   ```bash
   docker compose start product-service
   docker compose ps
   ```

4. Tunggu sampai Product Service berstatus `healthy`, lalu kirim request pesanan yang sama. Respons seharusnya kembali menjadi HTTP `201`.

### Membuktikan image perlu dibangun ulang

Perubahan kode pada komputer host tidak otomatis masuk ke container karena image berisi salinan kode saat proses build. Untuk mengamati hal tersebut, ubah teks pesan pada Order Service, lalu jalankan:

```bash
docker compose up -d
```

Perubahan belum masuk ke image yang sedang digunakan. Bangun ulang service terkait:

```bash
docker compose up -d --build order-service
```

### Mematikan stack

```bash
docker compose down
```

Perintah ini menghentikan dan menghapus container serta jaringan Compose. Stok produk dan daftar pesanan pada aplikasi ini disimpan di memori, sehingga kembali ke data awal saat container dibuat ulang. Untuk menghapus volume yang terkait dengan stack juga, gunakan `docker compose down -v`.

### GitHub Actions / CI

Workflow `.github/workflows/ci.yml` telah diperbarui agar menggunakan stack Compose yang sama:

1. Checkout repository dan menyiapkan Node.js 22.
2. Membangun serta menyalakan stack dengan `docker compose up -d --build --wait`.
3. Menjalankan `npm test`.
4. Menampilkan log meskipun test gagal.
5. Mematikan stack dengan `docker compose down -v`.

Workflow menggunakan kredensial RabbitMQ sementara khusus CI yang hanya berlaku di runner GitHub Actions, jadi repository secrets tidak diperlukan. Kredensial lokal tetap disimpan di `.env` dan tidak boleh di-commit. Setelah perubahan di-commit dan di-push ke GitHub, buka tab **Actions** dan pastikan workflow berbasis Compose berstatus berhasil pada branch `main`.

### Berkas yang perlu di-commit

Commit perubahan berikut: `gateway/gateway.js`, empat `Dockerfile`, empat `.dockerignore`, `docker-compose.yml`, `.env.example`, `.github/workflows/ci.yml`, `README.md`, dan `REFLEKSI.md`. Jangan commit `.env`, `node_modules`, log, atau kredensial.

### Bukti pengumpulan

Siapkan bukti dari komputer yang menjalankan Docker Desktop dan repository GitHub kelompok:

1. Screenshot `docker compose ps` ketika seluruh service berjalan dan service ber-healthcheck menunjukkan `healthy`.
2. Screenshot terminal ketika `npm test` lulus.
3. Screenshot respons HTTP `503` saat Product Service dihentikan.
4. Screenshot respons HTTP `201` setelah Product Service dinyalakan kembali.
5. Tautan run GitHub Actions yang berhasil pada branch `main`.

### Pemecahan masalah

| Gejala | Penyebab umum | Tindakan |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop belum aktif | Jalankan Docker Desktop dan tunggu sampai siap |
| `port is already allocated` | Port `8080` atau `15672` dipakai proses/container lain | Hentikan service lama atau container RabbitMQ lama |
| Gateway memberi `502` / `ECONNREFUSED` | URL proxy salah atau service tujuan belum sehat | Periksa `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL`, lalu lihat `docker compose logs` |
| `ACCESS_REFUSED` dari RabbitMQ | Kredensial `.env` berbeda dengan user broker yang sudah tersimpan pada volume lama | Periksa `.env`; untuk reset lingkungan praktikum, hentikan stack dan gunakan `docker compose down -v` sebelum menjalankan ulang |
| Service `unhealthy` | Endpoint `/health` tidak aktif atau port health check salah | Periksa `docker compose logs nama-service` |
| `npm ci` gagal saat build | `package-lock.json` hilang atau tidak sinkron dengan `package.json` | Jalankan `npm install` pada folder service terkait, lalu commit lock file |
| Perubahan kode tidak terlihat | Image belum dibangun ulang | Jalankan `docker compose up -d --build nama-service` |
| CI gagal saat menyalakan stack | Konfigurasi Compose, file, atau health check bermasalah | Buka log langkah build dan langkah `Tampilkan log` di GitHub Actions |

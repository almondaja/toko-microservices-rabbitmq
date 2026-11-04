# Diagram Arsitektur

```mermaid
flowchart TD
    CLIENT["Client / User"]
    GW["API Gateway<br/>Port 8080"]

    PS["Product Service<br/>Port 3000"]
    OS["Order Service<br/>Port 3001"]

    EX[["RabbitMQ Exchange<br/>orders (fanout)"]]

    NQ[["Queue<br/>notification-queue"]]
    AQ[["Queue<br/>audit-queue"]]

    NS["Notification Service"]
    AS["Audit Consumer"]

    CLIENT -->|"HTTP Request"| GW

    GW -->|"/product-service/products"| PS
    GW -->|"/order-service/orders"| OS

    OS -->|"Reserve stock (HTTP)"| PS
    PS -->|"Stock response"| OS

    OS -->|"Publish order.created"| EX

    EX -->|"Binding"| NQ
    EX -->|"Binding"| AQ

    NQ --> NS
    AQ --> AS
```

Aturan batas service:
- `product-service` adalah pemilik tunggal data produk dan stok.
- `order-service` adalah pemilik tunggal data pesanan.
- `order-service` tidak membaca atau mengubah array produk secara langsung. Ia meminta reservasi stok melalui HTTP.
- Jika `product-service` tidak tersedia, pembuatan pesanan membalas `503`, sedangkan daftar pesanan tetap dapat dibaca.

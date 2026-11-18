# Running the imported shop API

This is an educational Node.js/Express microservices API, not a web storefront.
Keep the existing gateway, product-service, and order-service structure.

## Run on Replit

- Click **Run** to start the `Shop API` workflow, or run `npm start`.
- `start-services.js` starts product-service on 3000, order-service on 3001,
  and the public gateway on 5000. It stops the other services if one exits.
- The preview root returns the gateway's JSON status and route list.
- Only the gateway (port 5000) should be exposed publicly.
- Install dependencies in the root and in each service folder (`npm ci` or
  `npm install`). Each service resolves modules from its own `node_modules`.

## Check the API

- `npm run test:replit` runs `tests/api.test.js` against the gateway on port 5000.
  `npm test` expects the gateway on port 8080, which is what GitHub Actions uses.
- Tests create orders and reduce in-memory stock. Restart the services to reset data.
- Service routes require the `X-API-Key` header. The existing educational
  default is `praktikum-key`, documented in README.md.
- To use a custom key, set `API_KEY` through Replit Secrets and restart.
  Do not use the public lab default for a real deployment.
- `GET /product-service/products` lists products.
- `POST /order-service/orders` accepts `{"productId":1,"qty":2}`.
- `GET /order-service/orders` lists orders.
- `GET /health` on the gateway, and `/health` plus `/metrics` on each service.
- `npm run monitor:replit` polls those health endpoints.

All data remains in memory as specified by the lab and resets on restart.
No database is required. RabbitMQ is optional; without `AMQP_URL` the order
service still accepts orders and logs that the broker is not configured.

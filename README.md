# Phone Stock Manager
Express.js + MongoDB/Mongoose inventory and profit tracker.

## Run
1. Install Node.js 20+ and MongoDB, or use MongoDB Atlas.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.
3. Run `npm install` then `npm run dev`.
4. Open http://localhost:3000

The frontend is an installable PWA. In a Chromium-based browser, use the
browser install icon or menu option while visiting the app to add Stock
Manager to your desktop or Android home screen. The app shell is cached for
fast startup, while authenticated API data is always fetched from the server.

## API
GET /api/health
GET/POST/PATCH /api/products
GET/POST /api/purchases
GET/POST /api/sales
GET/POST /api/expenses
GET /api/dashboard
GET /api/products/compatible/search?model=Smart%207
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me (Bearer token required)

Send the JWT from login or registration in the protected-route header:
`Authorization: Bearer <token>`

All inventory, sales, purchases, expenses, and dashboard endpoints require
authentication and return only records owned by the logged-in user. The
health endpoint is public. Authentication endpoints are also public so users
can register and log in.

Records created before user ownership was added have no owner and are not
returned to authenticated users. Assign or migrate those records to a user
before using them with the new account system.

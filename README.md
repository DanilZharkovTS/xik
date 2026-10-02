# XIK App

A full-stack application organized as a monorepo:
- **Frontend**: Next.js 16 (React 19, Turbopack, Tailwind CSS)
- **Backend**: Node.js / Express 5 (TypeScript, Prisma 7)
- **Notification Service**: Node.js / Express 5 (TypeScript, Resend)
- **Database**: PostgreSQL 16
- **Containerization**: Docker & Docker Compose (dedicated `local` and `prod` configurations)

---

## Project Structure

```text
xik-app/
├── backend/                  # Express 5 & Prisma backend API
│   ├── Dockerfile            # Multi-stage Dockerfile (dev / prod targets)
│   ├── prisma/               # Prisma schema and SQL migrations
│   └── src/                  # Backend application source code
├── frontend/                 # Next.js 16 frontend application
│   ├── Dockerfile            # Multi-stage Dockerfile (dev / prod targets)
│   ├── app/                  # Next.js App Router pages and routes
│   └── src/                  # UI components, services, hooks, stores
├── notification_service/     # Express 5 email notifications service
│   ├── Dockerfile            # Multi-stage Dockerfile (dev / prod targets)
│   └── src/                  # Controllers, routes, email templates
├── docker/
│   └── postgres/data/        # Local PostgreSQL data files (git-ignored)
├── docker-compose.local.yml   # Docker Compose for local development
├── docker-compose.prod.yml    # Docker Compose for production deployment
├── .env.prod.example         # Template for production environment variables
└── README.md                 # Project documentation and run guide
```

---

## 🛠 1. Local Development (Docker)

The local environment is configured for rapid development:
- **Hot Reload**: Source code changes on your host machine instantly reflect inside the containers.
- **Explicit Bind Mounts**: PostgreSQL data is persisted locally in `./docker/postgres/data`.
- **Isolated Node Modules**: Container `node_modules` are preserved separately from host OS dependencies.
- **Automatic Migrations**: Prisma automatically applies pending database migrations on backend startup.

### Start the full development stack:

```bash
docker compose -f docker-compose.local.yml up -d --build
```

### Service URLs & Ports:

| Service | URL / Port | Description |
| :--- | :--- | :--- |
| **Frontend** | [http://localhost:3000](http://localhost:3000) | Next.js web application |
| **Backend API** | [http://localhost:5001](http://localhost:5001) | Express REST API endpoints |
| **Notifications** | [http://localhost:3002](http://localhost:3002) | Resend email notification service (internal: `http://notifications:3002`) |
| **PostgreSQL** | `localhost:5432` | Database (`user: postgres`, `password: 1234`, `db: xik_db`) |

> [!NOTE]
> The backend runs on port `5001` because port `5000` is reserved by default on macOS for AirPlay Receiver (`ControlCenter`).

### Common Development Commands:

- **Follow all logs in real time:**
  ```bash
  docker compose -f docker-compose.local.yml logs -f
  ```
- **Follow logs for a specific service (e.g. backend):**
  ```bash
  docker compose -f docker-compose.local.yml logs -f backend
  ```
- **Stop all local containers:**
  ```bash
  docker compose -f docker-compose.local.yml down
  ```
- **Rebuild and restart after updating package dependencies:**
  ```bash
  docker compose -f docker-compose.local.yml up -d --build backend
  # or for frontend:
  docker compose -f docker-compose.local.yml up -d --build frontend
  ```

---

## 🚀 2. Production Deployment (Docker)

The production configuration is optimized for security, performance, and minimal image size:
- Uses multi-stage builds (`target: prod`) without development dependencies.
- Application code is baked into the immutable image artifacts (no host directory mounts).
- Automatic container restarts (`restart: always`).
- Health checks ensure zero-downtime dependency startup.

### Step 1. Configure Environment Variables

Create a root `.env` file from the provided template:

```bash
cp .env.prod.example .env
```

Set your production secrets and domain URLs in `.env`:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_postgres_password
POSTGRES_DB=xik_db

FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
JWT_SECRET=your_production_jwt_secret
STRIPE_SECRET=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 2. Build and Start Production Containers

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 3. Verify Container Status

```bash
docker compose -f docker-compose.prod.yml ps
```

### Stop Production Stack:

```bash
docker compose -f docker-compose.prod.yml down
```

---

## 💻 3. Running Locally without Docker (Native Node.js)

If you prefer running the frontend or backend directly on your host machine for debugging:

1. **Start only the PostgreSQL database container:**
   ```bash
   docker compose -f docker-compose.local.yml up -d postgres
   ```

2. **Start the backend server:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run dev
   ```

3. **Start the frontend application:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🗄 4. Database & Prisma Migrations

When you make changes to `backend/prisma/schema.prisma`:

- **Generate a new migration:**
  ```bash
  docker compose -f docker-compose.local.yml exec backend npx prisma migrate dev --name <migration_name>
  ```
- **Launch Prisma Studio (visual database browser):**
  ```bash
  docker compose -f docker-compose.local.yml exec backend npx prisma studio --port 5555
  ```

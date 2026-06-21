# 🚀 SmartApply — AI-Powered Job Discovery & Application Platform

SmartApply is a modern, high-performance monorepo-based application designed to automate and optimize the job search and application lifecycle. By leveraging AI-powered resume matching, automated job scraping, and queue-based background workers, SmartApply helps developers and job seekers find and track matching opportunities effortlessly.

---

## 📂 Project Architecture & Walkthrough

SmartApply is structured as an npm workspaces monorepo. It cleanly splits concerns across the client application, API backend, database layer, background processors, AI logic, and external microservices.

```text
SmartApply/
├── apps/
│   ├── web/               # React + Vite client frontend
│   ├── api/               # Express + Express-Rate-Limit REST API
│   └── worker/            # BullMQ background worker (BullMQ + Redis)
├── packages/
│   ├── database/          # Prisma ORM schema and database client
│   ├── shared/            # Shared TypeScript contracts and interfaces
│   └── ai/                # OpenAI/LLM integration and match-score calculation
├── services/
│   └── scraper/           # Python-based job scraping microservice (Playwright)
├── docker-compose.yml     # Multi-container orchestration config
├── package.json           # Root package defining workspaces & scripts
└── tsconfig.json          # Core TypeScript configuration
```

### Monorepo Components

1. **`apps/web` (Frontend)**:
   - A React single-page application powered by Vite.
   - Built with **Tailwind CSS** for responsive styling and **Framer Motion** for animations.
   - Uses **Zustand** for state management and **React Query** for server-state synchronization.
   - Features dashboard analytics, resume uploads, skill-gap analysis, and application tracking boards.

2. **`apps/api` (Backend REST API)**:
   - Built on Node.js and Express with TypeScript.
   - Leverages **Prisma** to perform transactional operations on PostgreSQL.
   - Features JWT-based auth via secure **HTTP-Only cookies** for enhanced security.
   - Configured with security middleware (Helmet, CORS) and API rate limiting.

3. **`apps/worker` (Background Worker)**:
   - BullMQ worker listening to Redis-backed queues.
   - Offloads compute-heavy background tasks such as compiling matched skills, parsing resumes asynchronously, and queuing scrape synchronizations.

4. **`packages/database` (Data Modeling & ORM)**:
   - Contains the single source of truth database schema (`schema.prisma`).
   - Standardizes schema deployments across development and Docker contexts.
   - Exports the instantiated `@prisma/client` client utilized by backend services.

5. **`packages/shared` & `packages/ai` (Utility Packages)**:
   - `shared`: Stores shared models, validation schemas (Zod), and type definitions.
   - `ai`: Encapsulates resume text extraction, NLP skill parsing, and job matching scoring algorithms.

6. **`services/scraper` (Python Scraper)**:
   - A robust python script utilizing Playwright to scrape job postings from job boards.
   - Runs on a recurrent loop directly inserting newly found postings into Postgres.

---

## 🛠️ Local Development Setup

To run SmartApply on your local environment outside of Docker, follow these instructions.

### 📋 Prerequisites
* **Node.js** v18.0.0 or higher
* **npm** v9.0.0 or higher
* **PostgreSQL** running locally (or via Docker container)
* **Redis** running locally (or via Docker container)

### 1. Set Up Environment Variables
Create a `.env` file in the root directory. Copy the contents below and adjust the connection strings for your local Postgres and Redis instances:

```env
# Database connection URL (point to your local Postgres)
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/smartapply?schema=public"

# Redis queue settings
REDIS_HOST="localhost"
REDIS_PORT=6379

# API server configuration
PORT=5000
JWT_SECRET="smartapply-secret-key-12345"
CORS_ORIGIN="*"
```

### 2. Install Dependencies
Run the installation command in the project root to install dependencies across all workspaces:
```bash
npm install
```

### 3. Generate & Migrate Database Schema
SmartApply uses Prisma. Apply migrations and generate the Prisma Client:
```bash
# Apply database migrations to build tables
npm run db:migrate

# Generate the shared Prisma Client
npm run db:generate
```

### 4. Run Development Servers
You can launch development instances of the frontend, api, and worker concurrently, or individually.

#### Running everything in parallel (Recommended):
Use the root shortcut to run the API, Web frontend, Worker, and Extension compiler concurrently:
```bash
npm run dev
```

#### Running individually:
* **Frontend**: `npm run web:dev` (runs on [http://localhost:5173](http://localhost:5173))
* **REST API**: `npm run api:dev` (runs on [http://localhost:5000](http://localhost:5000))
* **Worker**: `npm run worker:dev`

---

## 🐳 Running with Docker

SmartApply includes a production-grade multi-container `docker-compose.yml` configuration. This sets up and links PostgreSQL, Redis, API, Worker, Scraper, and Web client containers out-of-the-box.

### 🚀 Docker Compose Commands

#### 1. Spin up the entire application stack:
Build and start all containers in the foreground to view real-time logs:
```bash
docker-compose up --build
```
*Once started, the Web client is served at **[http://localhost:3000](http://localhost:3000)**.*

#### 2. Run containers in detached mode (background):
```bash
docker-compose up -d --build
```

#### 3. View service-specific logs:
```bash
# Follow logs for all services
docker-compose logs -f

# Follow logs for the API service only
docker-compose logs -f api

# Follow logs for the background worker
docker-compose logs -f worker

# Follow logs for the scraper
docker-compose logs -f scraper
```

#### 4. Stop and clean up containers:
```bash
# Stop containers and preserve database volumes
docker-compose down

# Stop containers and destroy database volumes (clean database)
docker-compose down -v
```

#### 5. Apply migrations inside Docker container:
If you modify the database schema, apply migrations directly inside the database package container:
```bash
docker-compose exec api npm run db:migrate
```

---

## 🧪 Testing Infrastructure & Runner

SmartApply employs a robust testing setup using **Jest** and **React Testing Library** (RTL) to maintain software stability.

### 🏛️ Test Configuration
* **Web Frontend** (`apps/web`): Utilizes Jest + `jest-environment-jsdom` (simulated browser environment) + `@testing-library/react` + `ts-jest` for TypeScript compilation. Includes mocks for Vite's `import.meta.env` and storage configurations.
* **REST API** (`apps/api`): Utilizes Jest + `supertest` for end-to-end endpoint tests.

### 🏃 Running Tests

You can run the entire test suite globally from the root, or target specific workspaces.

#### 1. Run all tests in the workspace monorepo:
```bash
npm test
```

#### 2. Run tests for the Frontend Web App only:
```bash
npm test -w apps/web
```

#### 3. Run tests for the API Backend only:
```bash
npm test -w apps/api
```

#### 4. Run tests in watch mode (interactive):
```bash
npm run test -w apps/web -- --watch
```

#### 5. Generate Test Coverage reports:
```bash
npm run test -w apps/web -- --coverage
```

# Ecommerce CRUD + Bulk Upload

Full-stack assignment: Angular frontend, Node.js/Express backend, PostgreSQL database.

Features:
- User auth (register/login) with bcrypt-hashed passwords and JWT sessions.
- Category CRUD (auto-generated UUID `uniqueId`).
- Product CRUD, each product belonging to a category (auto-generated UUID `uniqueId`, optional image upload).
- Product list API: server-side pagination, sort by price (asc/desc), search by product name or category name.
- Bulk product upload via CSV: the upload request returns immediately (202) with a job id; parsing and inserting rows happens asynchronously in the background (batched `bulkCreate`), so large files never hit a request timeout (504). The client polls the job status endpoint for progress.
- Report generation (CSV/XLSX): generation is requested asynchronously the same way - a job id is returned immediately, the file is built on disk in the background, and the client downloads it once the job status is `completed`.

## Repo layout

```
backend/   Node.js + Express + Sequelize + PostgreSQL API
frontend/  Angular app (standalone components + Angular Material)
postman/   Postman collection + environment for API testing
```

## Running locally

### 1. Database

A local PostgreSQL 16 instance is expected. Create the database and user referenced in `backend/.env`:

```bash
sudo service postgresql start   # or: pg_ctlcluster 16 main start
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres createdb ecommerce_db
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # adjust DB credentials if needed
npm install
npm run dev             # http://localhost:5000
```

The server creates/updates all tables automatically on boot (`sequelize.sync({ alter: true })`) - no manual migration step is required.

### 3. Frontend

```bash
cd frontend
npm install
npm start                # http://localhost:4200
```

The Angular app expects the API at `http://localhost:5000/api` (see `src/environments/environment.ts`).

### 4. API testing

Import both files from `postman/` into Postman:
- `Ecommerce-CRUD-Bulk-Upload.postman_collection.json`
- `Ecommerce-CRUD-Bulk-Upload.postman_environment.json`

Run **Auth > Register** (or **Login** if the user already exists) first - the JWT is captured automatically into the `{{token}}` variable and reused by every other request. Then **Categories > Create Category** before exercising the Products folder.

## Design notes

- `users`, `categories`, `products`, `bulk_upload_jobs`, `report_jobs` tables. `categories`/`products` each carry an integer primary key plus a separate UUID `uniqueId` column.
- `products.categoryId` is a foreign key with `ON DELETE RESTRICT`; deleting a category that still has products returns `409` instead of a generic error.
- Bulk upload and report generation both follow the same pattern: the HTTP handler only persists a job row (and, for uploads, the file) and responds immediately; the actual work runs afterwards out-of-band. This is what avoids 504s on large payloads - the request/response cycle never waits on the slow part.

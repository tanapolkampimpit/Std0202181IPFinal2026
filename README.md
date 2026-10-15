# Std0202181IPFinal2026 — BlueHR

React Native + Expo frontend and Express + MySQL API for student `6730202181`.
Repository: https://github.com/tanapolkampimpit/Std0202181IPFinal2026

## Structure

- `frontend/`: Expo application: login, employee list/create/status/delete and salary clustering.
- `backend/`: persistent MySQL API, database login, employee/user CRUD, salary clustering and `run.sh`.
- [Backend deployment guide](backend/README.md): configuration, FileZilla, endpoints and tests.

The frontend follows the supplied BlueHR standalone HTML reference: forest/teal palette, curved login hero, compact employee rows, search, four-item navigation, and three salary groups with a chart. Employee data, counts and chart values come from the API. The reference's sample accounts and employee array are not part of the application.

The backend requires MySQL. It has no employee seed data, memory storage mode, fixed login or fixed bearer token. It reads the existing tables `Thanapol_Kha_Employee` and `Thanapol_Kha_Users` in `ip_std6730202181`. Starting the API does not create tables or insert users/employees.

## Backend

Requires Node.js 22.13+ and a reachable MySQL/MariaDB server.

```powershell
cd backend
npm ci
# For a new installation only: copy .env.example to .env and fill your settings.
# Preserve an existing .env.
npm run db:check
npm start
```

Configuration is read from `backend/.env`, including when started from another working directory. Existing process environment values take precedence.

| Setting | Purpose |
| --- | --- |
| APP_HOST / APP_PORT | Listen address and port (HOST / PORT also supported) |
| DB_HOST / DB_PORT | MySQL address reachable from the Node server |
| DB_NAME / DB_USER / DB_PASSWORD | Database and credentials |
| DB_CONNECTION_LIMIT | Connection pool size |
| JWT_SECRET | Stable random secret, at least 32 bytes |
| CORS_ORIGINS | `*`, comma-separated origins, or JSON array |

`localhost` means the machine/container running Node. phpMyAdmin and Node may run in different containers. Use the database host supplied by the hosting provider. Login uses an existing bcrypt password hash in the Users table. For an empty Users table, create an account deliberately with `bash run.sh create-admin admin` on the server. There are no default credentials.

## Frontend

```powershell
cd frontend
npm ci
# Set EXPO_PUBLIC_API_URL in your own .env to the API base URL.
npm start
```

Use a full base URL such as `http://YOUR_SERVER:YOUR_PORT`, without `/api`. Restart Expo after a config change. For a phone, use the API's reachable LAN/public address instead of localhost. Sign in with an account in the real Users table.

## FileZilla / Linux

Upload the backend contents into a new folder such as `/app/bluehr-api`; upload source, package files, scripts, SQL reference and `run.sh`. Exclude `node_modules`, test output and local `.env`. Configure the server's private `.env` separately. Do not overwrite another project's `/app/run.sh` or `/app/.env`.

```bash
cd /app/bluehr-api
bash run.sh
# On a new install this creates a private .env and stops for configuration.
# With a configured .env:
bash run.sh check
bash run.sh create-admin admin   # only when a new account is needed
bash run.sh
```

`run.sh` installs locked dependencies and starts the API in the foreground. Use an existing process manager to keep it running after SSH disconnects; see the backend guide. FileZilla transfers files; execution happens through SSH/Terminal.

## API

All write bodies are JSON. Login and health are public. Other routes require the signed token returned by login in `Authorization: Bearer <token>`.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | /api/health | Database readiness |
| POST | /api/login | Database username/password → signed token (8 hours) |
| GET / POST | /api/employees | List / create employee |
| GET / PUT / DELETE | /api/employees/:id | Read / update / delete employee |
| PUT | /api/employees/:id/status | Toggle Active ↔ On Leave |
| GET | /api/employees/salary-clusters | Three salary tiers from current SQL rows |
| GET / POST | /api/users | List / create users; Admin only |
| GET / PUT / DELETE | /api/users/:id | Read / update / delete users; Admin only |

Employee create/update: `{"name":"...","position":"...","salary":45000}`. Update optionally accepts `status`. New employees start Active. Salary is a positive JSON number with at most two decimal places and maximum `9999999999.99`; names/positions have at most 100 characters.

User create: `{"username":"...","password":"...","role":"User"}`. Update requires username; role/password are optional. Roles are Admin/User. Passwords are bcrypt hashes; API responses exclude them. Changing a password invalidates that user's existing sessions, deleting a user invalidates their sessions, and permission checks use the current database role. The last Admin cannot be deleted or demoted.

K-Means uses deterministic 1D Lloyd iteration with k=3. Empty datasets return three empty tiers; fewer than three salary levels produce empty padded tiers. Counts and centroids use current database data.

## Tests

```powershell
# backend: algorithm, config and validation tests
npm test

# backend: full HTTP + MySQL integration, on a LOCAL disposable DB server only
# Optional DB_TEST_HOST, DB_TEST_PORT, DB_TEST_USER, DB_TEST_PASSWORD.
npm run test:mysql

# frontend: isolated React Native component, validation and Fetch tests
npm test
```

The SQL integration suite creates a random `bluehr_test_*` database on a loopback server, tests employee/user CRUD, auth/roles, decimals, Unicode, invalid inputs, PHP bcrypt and a real API process restart, then drops only its own database. It never uses the exam `DB_NAME`.

Frontend live integration/browser tests require `BLUEHR_TEST_API_URL`, `BLUEHR_TEST_USERNAME` and `BLUEHR_TEST_PASSWORD` for a disposable environment; they create and remove their own employee record. Without these settings the live integration test is skipped. Component tests use isolated test fixtures; these are not application data.

For a complete visual/interaction check on a local SQL test server, run `npm run test:design` from `frontend/` with the same `DB_TEST_*` settings. It creates its own disposable database, builds an isolated web preview, checks widths 320/375/768/1024/1440 and real login/search/CRUD/analytics/logout, then removes its database. Screenshots and the result JSON are saved under ignored `frontend/test-results/design/`. It does not modify `.env` or connect to the shared exam database. Expo exports were also checked for Android/iOS; device appearance still needs Expo Go or an emulator.

## Deployment notes

The API uses parameterized SQL and validates inputs. Serve it behind HTTPS for remote login and configure CORS for the actual web origin. Do not publish `.env`, database credentials or JWT secrets. `.gitignore` excludes these files and dependencies.

Reference schema is in `backend/sql/schema.sql`; it is never run automatically. Existing tables/data remain in place. Start with `npm run db:check` before launching the server.

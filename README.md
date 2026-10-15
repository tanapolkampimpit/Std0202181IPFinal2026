# Std0202181IPFinal2026 — TNPKHR

React Native + Expo frontend and Express + MySQL API for student `6730202181`.
Repository: https://github.com/tanapolkampimpit/Std0202181IPFinal2026

## Structure

- `frontend/`: Expo application: login, employee list/create/edit/status/delete and salary clustering.
- `backend/`: persistent MySQL API, database login, employee/user CRUD, salary clustering and `run.sh`.
- [Backend deployment guide](backend/README.md): configuration, FileZilla, endpoints and tests.

The frontend follows the supplied standalone HTML reference: forest/teal palette, curved login hero, compact employee rows, search, four-item navigation, and selectable salary groups. Analytics adds the four charts from the supplied chart reference: average salary bars, employee distribution donut, salary range with centroid, and salary scatter plot. All interface text uses bundled Noto Sans Thai (Thai and Latin) with larger captions and inputs; the TNPKHR logo retains its own typeface. Employee data, counts and chart values come from the API. The reference's sample accounts and employee array are not part of the application.

The backend requires MySQL. It has no employee seed data, memory storage mode, fixed login or fixed bearer token. It reads the existing tables `Thanapol_Kha_Employee` and `Thanapol_Kha_Users` in `ip_std6730202181`. Starting the API does not create tables or insert users/employees.

## 1. Run Front — รันบนเครื่องตัวเอง

ติดตั้ง Node.js **22.13 ขึ้นไป** พร้อม npm ก่อน จากนั้นเปิด PowerShell ที่โฟลเดอร์โปรเจกต์ (ถ้ายังไม่มี source ให้ clone ก่อน):

```powershell
git clone https://github.com/tanapolkampimpit/Std0202181IPFinal2026.git
cd Std0202181IPFinal2026
cd frontend
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

ตั้งค่าใน `frontend/.env` แล้วบันทึกไฟล์:

```dotenv
EXPO_PUBLIC_API_URL=http://119.59.102.161:3019
```

เปิดแอปด้วยคำสั่ง:

```powershell
npm start -- --clear
```

- กด `w` ใน Terminal เพื่อเปิดเว็บ หรือใช้ `npm run web -- --clear` เพื่อเปิดเว็บโดยตรง
- มือถือ Android ใช้ Expo Go สแกน QR; iPhone ใช้กล้องสแกนแล้วเปิดด้วย Expo Go เวอร์ชันที่รองรับ Expo SDK ของโปรเจกต์
- คอมพิวเตอร์และมือถือควรอยู่ Wi-Fi เดียวกันสำหรับเชื่อมต่อ Expo
- เข้าระบบด้วยบัญชีจริงในตาราง `Thanapol_Kha_Users` ไม่มีบัญชีหรือรหัสผ่านตายตัว
- Backend ที่ URL ข้างต้นต้องรันอยู่จึงจะล็อกอินและโหลดข้อมูลได้ หากยังไม่รัน ให้ทำข้อ 2 ก่อน

URL นี้เป็นค่าที่ตั้งไว้สำหรับงานนี้ ไม่ใช่ผลยืนยันว่าเซิร์ฟเวอร์ออนไลน์อยู่ ใส่เฉพาะ base URL **ไม่ต่อ `/api`** และ restart Expo ทุกครั้งหลังเปลี่ยน `.env` ถ้าย้ายเซิร์ฟเวอร์ให้แก้ URL ตามที่อยู่ใหม่; ถ้าใช้ API บนเครื่องตัวเองกับมือถือ ให้ใช้ LAN IP ของคอมพิวเตอร์แทน `localhost`

## 2. เอา Backend ขึ้นเซิร์ฟเวอร์ผ่าน FileZilla

FileZilla ใช้อัปโหลดไฟล์ ส่วนคำสั่งรันต้องพิมพ์ใน **SSH/Terminal ของเซิร์ฟเวอร์** เครื่องเซิร์ฟเวอร์ต้องมี Node.js 22.13+, npm และเชื่อมต่อ MySQL ได้

### 2.1 เตรียมไฟล์บนคอมพิวเตอร์

เปิด PowerShell อีกหน้าที่โฟลเดอร์โปรเจกต์:

```powershell
cd backend
npm run package:filezilla -- ../../TNPKHR_API_FileZilla_upload
```

จะได้โฟลเดอร์ `TNPKHR_API_FileZilla_upload` อยู่ข้างโฟลเดอร์ repository เป็นชุด Backend จาก source ปัจจุบัน โดยไม่รวม `.env` และ `node_modules` ถ้าชื่อนี้มีอยู่แล้ว ให้เปลี่ยนเป็นชื่อใหม่ เช่น `TNPKHR_API_FileZilla_upload_v2`

### 2.2 อัปโหลดด้วย FileZilla

1. เชื่อมต่อด้วย Host, Username, Password/Key และ Port ที่ผู้ดูแลเซิร์ฟเวอร์ให้มา
2. ฝั่ง Remote สร้าง/เปิดโฟลเดอร์ของงานนี้ เช่น `/app/tnpkhr-api` (ถ้า hosting ให้ path อื่น ให้ใช้ path นั้นแทนทุกคำสั่งด้านล่าง)
3. ฝั่ง Local เปิด `TNPKHR_API_FileZilla_upload` แล้วอัปโหลด **ไฟล์และโฟลเดอร์ข้างใน** เข้า `/app/tnpkhr-api` โดยตรง
4. ตรวจว่ามี `/app/tnpkhr-api/run.sh`, `package.json`, `package-lock.json`, `.env.example`, `src/`, `scripts/` และ `sql/` หากไม่เห็น `.env.example` ให้เปิดการแสดงไฟล์ซ่อนใน FileZilla

ไม่อัปโหลด `.env` จากคอมพิวเตอร์หรือ `node_modules` และไม่ทับ `/app/run.sh` หรือ `/app/.env` ของงานอื่น หากอัปเดตงานเดิม ให้เก็บ `.env` ของเซิร์ฟเวอร์ไว้

### 2.3 ตั้งค่าครั้งแรกบนเซิร์ฟเวอร์

เข้า SSH ด้วยบัญชีที่ผู้ดูแลให้ แล้วพิมพ์:

```bash
cd /app/tnpkhr-api
node --version
npm --version
bash run.sh
```

หากยังไม่มี `.env` สคริปต์จะสร้างไฟล์ส่วนตัวจาก `.env.example` พร้อม `JWT_SECRET` สุ่ม แล้ว **หยุดให้ตั้งค่า** เป็นพฤติกรรมปกติของการติดตั้งครั้งแรก เปิดไฟล์ด้วย:

```bash
nano .env
```

ตั้งค่าพอร์ตให้ตรงกับ Frontend และกรอกข้อมูล MySQL ที่ผู้ดูแลให้:

```dotenv
APP_HOST=0.0.0.0
APP_PORT=3019
DB_HOST=YOUR_MYSQL_HOST
DB_PORT=3306
DB_NAME=ip_std6730202181
DB_USER=YOUR_DB_USER
DB_PASSWORD="YOUR_DB_PASSWORD"
DB_CONNECTION_LIMIT=5
CORS_ORIGINS=*
```

เก็บบรรทัด `JWT_SECRET` ที่สคริปต์สร้างไว้ด้วย ไม่ลบหรือแทนด้วยค่าว่าง หากใช้ nano ให้กด `Ctrl+O`, `Enter` เพื่อบันทึก แล้ว `Ctrl+X` เพื่อออก

`DB_HOST=127.0.0.1` ใช้ได้เมื่อ MySQL อยู่เครื่อง/container เดียวกับ Node เท่านั้น ถ้าแยกเครื่องให้ใช้ host ที่เซิร์ฟเวอร์ Node เชื่อมถึง ตารางจริงต้องมีอยู่แล้ว; ดู [schema อ้างอิง](backend/sql/schema.sql) และ [รายละเอียด Backend](backend/README.md)

### 2.4 คำสั่งตรวจและรัน Backend

```bash
cd /app/tnpkhr-api
bash run.sh check
bash run.sh
```

**คำสั่งรันคือ `bash run.sh`** สคริปต์ติดตั้ง dependencies ตาม lockfile แล้วเริ่ม API แบบ foreground ให้เปิด Terminal นี้ค้างไว้ ถ้า `check` ไม่ผ่าน ให้แก้ DB/config ตามข้อความก่อนเริ่ม API

เปิด SSH อีกหน้าหรือทดสอบจากคอมพิวเตอร์:

```bash
# บนเซิร์ฟเวอร์
curl http://127.0.0.1:3019/api/health
```

```powershell
# บนคอมพิวเตอร์
Invoke-RestMethod http://119.59.102.161:3019/api/health
```

ควรได้ HTTP 200 เมื่อ DB พร้อม หากภายในเซิร์ฟเวอร์ใช้ได้แต่จากคอมพิวเตอร์เข้าไม่ได้ ให้ตรวจพอร์ต 3019 / reverse proxy ตามที่ hosting จัดให้ แล้วกลับไปรัน Frontend ในข้อ 1

หากยังไม่มีบัญชี ให้หยุด API ด้วย `Ctrl+C` แล้วสร้างบัญชีอย่างตั้งใจ (ข้ามเมื่อมีบัญชีใช้อยู่แล้ว):

```bash
bash run.sh create-admin admin
bash run.sh
```

ระบบจะให้กรอกรหัสผ่านแบบซ่อนและยืนยันซ้ำ คำสั่งนี้เพิ่มบัญชีใหม่ ไม่เปลี่ยนรหัสผ่านบัญชีเดิม

### 2.5 ให้ทำงานต่อหลังปิด SSH (เมื่อเซิร์ฟเวอร์มี PM2)

ถ้ารัน foreground อยู่ ให้หยุดด้วย `Ctrl+C` ก่อน เพื่อให้พอร์ต 3019 ว่าง แล้วใช้:

```bash
cd /app/tnpkhr-api
pm2 start /app/tnpkhr-api/run.sh --interpreter bash --name tnpkhr-ip-final
pm2 logs tnpkhr-ip-final
```

หลังอัปโหลด source รุ่นใหม่ ใช้ `pm2 restart tnpkhr-ip-final` แล้วตรวจ health อีกครั้ง ถ้ายังไม่มี PM2 ให้ใช้ process manager ที่ hosting กำหนด การกลับมาทำงานหลัง reboot ต้องตั้ง startup ตามระบบของผู้ให้บริการ

## Backend บนเครื่องตัวเอง (ทางเลือก)

Requires Node.js 22.13+ and a reachable MySQL/MariaDB server.

```powershell
cd backend
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
# Fill in MySQL settings and a JWT_SECRET of at least 32 bytes before continuing.
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

## การใช้งาน Frontend และ session

In the employee actions menu, choose **Edit**, change the name/position/salary, and choose **Save Changes**. The app sends PUT to the API and reloads the current MySQL list after saving. Delete permanently removes the selected row after confirmation.

Sign-in is remembered across reloads and app restarts until the API token expires (currently 8 hours), the server rejects the session, or the user chooses Logout. Web stores the token and username in localStorage; Android/iOS use Expo SecureStore. Passwords and employee records are never included in session storage. The app waits for session restoration before showing sign-in, discards malformed/expired sessions and sessions for a different API address, and clears saved sign-in on Logout or HTTP 401. A network outage alone does not sign the user out. If device/browser storage is unavailable, sign-in still works for the current app session.

## API

All write bodies are JSON. Login and health are public. Other routes require the signed token returned by login in `Authorization: Bearer <token>`.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | /api/health | Database readiness |
| POST | /api/login | Database username/password → signed token (8 hours) |
| GET / POST | /api/employees | List / create employee |
| GET / PUT / DELETE | /api/employees/:id | Read / update / delete employee |
| PATCH | /api/employees/:id | Update selected fields, e.g. `{ "name": "New name" }` |
| PUT | /api/employees/:id/status | Toggle Active ↔ On Leave |
| GET | /api/employees/salary-clusters?k=3 | Select 1–10 salary groups from current SQL rows; default K=3 |
| GET / POST | /api/users | List / create users; Admin only |
| GET / PUT / DELETE | /api/users/:id | Read / update / delete users; Admin only |

Employee create/update: `{"name":"...","position":"...","salary":45000}`. Update optionally accepts `status`. New employees start Active. Salary is a positive JSON number with at most two decimal places and maximum `9999999999.99`; names/positions have at most 100 characters.

User create: `{"username":"...","password":"...","role":"User"}`. Update requires username; role/password are optional. Roles are Admin/User. Passwords are bcrypt hashes; API responses exclude them. Changing a password invalidates that user's existing sessions, deleting a user invalidates their sessions, and permission checks use the current database role. The last Admin cannot be deleted or demoted.

K-Means uses deterministic 1D Lloyd iteration with K selectable from 1 to 10 (default 3). Empty datasets return K empty groups; fewer than K distinct salaries produce empty padded groups. The authenticated analytics endpoint includes each cluster's assigned `salaries` alongside its count and centroid, so all four charts use the same assignment result. Selecting K recalculates through the API immediately. Scatter vertical jitter is display-only; salary remains the only clustering feature. Update both frontend and backend for the new charts.

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

The SQL integration suite creates a random `tnpkhr_test_*` database on a loopback server, tests employee/user CRUD, auth/roles, decimals, Unicode, invalid inputs, PHP bcrypt and a real API process restart, then drops only its own database. It never uses the exam `DB_NAME`.

Frontend live integration/browser tests require `TNPKHR_TEST_API_URL`, `TNPKHR_TEST_USERNAME` and `TNPKHR_TEST_PASSWORD` for a disposable environment; they create and remove their own employee record. Without these settings the live integration test is skipped. Component tests use isolated test fixtures; these are not application data.

For a complete visual/interaction check on a local SQL test server, run `npm run test:design` from `frontend/` with the same `DB_TEST_*` settings. It creates its own disposable database, builds an isolated web preview, checks widths 320/375/768/1024/1440 and real login/search/CRUD/analytics/logout, then removes its database. Screenshots and the result JSON are saved under ignored `frontend/test-results/design/`. It does not modify `.env` or connect to the shared exam database. Expo exports were also checked for Android/iOS; device appearance still needs Expo Go or an emulator.

## Deployment notes

The API uses parameterized SQL and validates inputs. Serve it behind HTTPS for remote login and configure CORS for the actual web origin. Do not publish `.env`, database credentials or JWT secrets. `.gitignore` excludes these files and dependencies.

Reference schema is in `backend/sql/schema.sql`; it is never run automatically. Existing tables/data remain in place. Start with `npm run db:check` before launching the server.

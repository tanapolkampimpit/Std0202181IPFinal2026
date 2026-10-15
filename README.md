# Std0202181IPFinal2026 — TNPKHR

โปรเจกต์จัดการพนักงานและวิเคราะห์เงินเดือน: Frontend ใช้ React Native + Expo, Backend ใช้ Express + MySQL

**ทำตามลำดับ: 1. อัปโหลดและรัน Backend → 2. เปิด Frontend → 3. ล็อกอิน**

Repository: https://github.com/tanapolkampimpit/Std0202181IPFinal2026

ถ้ายังไม่มี source ให้เปิด PowerShell บนคอมพิวเตอร์แล้วดาวน์โหลดก่อน (ข้ามถ้ามีโปรเจกต์อยู่แล้ว):

```powershell
git clone https://github.com/tanapolkampimpit/Std0202181IPFinal2026.git
```

## 1. เอา Backend ขึ้น FileZilla แล้วรันบนเซิร์ฟเวอร์

ใช้ Node.js **22.13 ขึ้นไป**, npm และ MySQL ที่มีตาราง `Thanapol_Kha_Employee` / `Thanapol_Kha_Users` ในฐานข้อมูล `ip_std6730202181` อยู่แล้ว การรัน API ไม่สร้างตารางหรือเพิ่มข้อมูลอัตโนมัติ

### 1.1 อัปโหลด Backend ด้วย FileZilla

1. เปิด FileZilla แล้วเชื่อมต่อด้วย Host, Username, Password/Key และ Port ที่ผู้ดูแลเซิร์ฟเวอร์ให้
2. ฝั่ง **Local (ซ้าย)** เปิดโฟลเดอร์ `Std0202181IPFinal2026/backend`
3. ฝั่ง **Remote (ขวา)** สร้าง/เปิดโฟลเดอร์ของงาน เช่น `/app/tnpkhr-api`
4. ลาก **ไฟล์และโฟลเดอร์ข้างใน `backend`** ไปไว้ใน `/app/tnpkhr-api` โดยตรง ยกเว้น `.env`, `node_modules`, coverage และผลทดสอบ
5. รอให้อัปโหลดเสร็จ ต้องเห็น `run.sh`, `package.json`, `package-lock.json`, `.env.example`, `src/`, `scripts/` และ `sql/` ในโฟลเดอร์ปลายทาง

หากไม่เห็น `.env.example` ให้เปิดการแสดงไฟล์ซ่อนใน FileZilla ถ้าอัปเดตงานเดิมให้เก็บ `.env` ของเซิร์ฟเวอร์ไว้ และใช้โฟลเดอร์ของงานนี้โดยไม่ทับ `/app/run.sh` หรือ `/app/.env` ของงานอื่น

**FileZilla ใช้อัปโหลดไฟล์ ส่วนคำสั่งด้านล่างให้พิมพ์ใน SSH/Terminal ของเซิร์ฟเวอร์** ใช้ Terminal ของ hosting หรือ PuTTY/SSH ตามที่ผู้ดูแลจัดให้

### 1.2 เข้าโฟลเดอร์ด้วย `ls` และ `cd`

หลังเปิด SSH/Terminal ของเซิร์ฟเวอร์แล้ว พิมพ์ทีละบรรทัด:

```bash
pwd
ls
cd /app
ls
cd tnpkhr-api
pwd
ls -la
```

- `pwd` แสดงว่าตอนนี้อยู่โฟลเดอร์ไหน
- `ls` แสดงไฟล์และโฟลเดอร์; `ls -la` แสดงไฟล์ซ่อนอย่าง `.env` ด้วย
- `cd` ใช้เข้าโฟลเดอร์; `cd ..` ใช้ถอยกลับหนึ่งระดับ

ตัวอย่างนี้ต้องได้ตำแหน่ง `/app/tnpkhr-api` และเห็น `run.sh` กับ `package.json` ถ้า Remote path ใน FileZilla ต่างจากตัวอย่าง ให้ใช้ path จริงนั้น เช่น `cd /home/YOUR_USER/tnpkhr-api` ถ้าเห็นโฟลเดอร์ `backend` อยู่ข้างในแทน ให้ `cd backend` แล้ว `ls -la` ก่อนรัน

### 1.3 ตั้งค่า Backend ครั้งแรก

เมื่ออยู่ในโฟลเดอร์ที่มี `run.sh` แล้ว:

```bash
node --version
npm --version
bash run.sh
```

ถ้ายังไม่มี `.env` สคริปต์จะสร้างไฟล์พร้อม `JWT_SECRET` สุ่ม แล้วหยุดให้กรอกข้อมูล เป็นขั้นตอนปกติของการติดตั้งครั้งแรก เปิดไฟล์ด้วย:

```bash
nano .env
```

กรอกค่าต่อไปนี้ให้ตรงกับเซิร์ฟเวอร์ โดย **เก็บบรรทัด `JWT_SECRET` ที่สคริปต์สร้างไว้ด้วย**:

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

ใช้ข้อมูล MySQL ที่ผู้ดูแลให้ `DB_HOST=127.0.0.1` ใช้เมื่อ MySQL อยู่เครื่อง/container เดียวกับ Node เท่านั้น บันทึกใน nano ด้วย `Ctrl+O`, `Enter` แล้วออกด้วย `Ctrl+X` ถ้ามี `.env` ที่ตั้งค่าถูกต้องแล้ว ให้ข้ามการตั้งค่าใหม่

### 1.4 ตรวจฐานข้อมูลและรัน Backend

```bash
bash run.sh check
bash run.sh
```

**คำสั่งเริ่ม Backend คือ `bash run.sh`** สคริปต์ติดตั้ง dependencies ตาม lockfile แล้วเปิด API พอร์ต `3019` ให้เปิด Terminal นี้ค้างไว้ ถ้า `check` ไม่ผ่าน ให้แก้ `.env` หรือการเชื่อมต่อ DB ตามข้อความก่อน

เปิด SSH อีกหน้าเพื่อตรวจว่า API พร้อม:

```bash
curl http://127.0.0.1:3019/api/health
```

บนคอมพิวเตอร์ เปิด PowerShell แล้วตรวจการเข้าถึงจากภายนอก:

```powershell
Invoke-RestMethod http://119.59.102.161:3019/api/health
```

ควรได้ HTTP 200 เมื่อฐานข้อมูลพร้อม หากเรียกในเซิร์ฟเวอร์ได้แต่จากคอมพิวเตอร์ไม่ได้ ให้ตรวจพอร์ต 3019 / reverse proxy ของ hosting URL นี้เป็นค่าของงานที่ตั้งไว้ หากย้ายเซิร์ฟเวอร์ให้เปลี่ยนตามที่อยู่ใหม่

### 1.5 บัญชีสำหรับหน้า Frontend

ใช้บัญชีที่ระบุสำหรับงานนี้:

| ช่องบนหน้า Login | ค่าที่กรอก |
| --- | --- |
| Username | `Admin` |
| Password | `password123` |

หากเป็นฐานข้อมูลใหม่ที่ยังไม่มีบัญชีนี้ ให้หยุด API ด้วย `Ctrl+C` แล้วรัน:

```bash
bash run.sh create-admin Admin
```

เมื่อขึ้น `New admin password (8+ characters):` ให้พิมพ์ `password123` แล้ว Enter จากนั้นพิมพ์ `password123` อีกครั้งเมื่อขึ้น `Confirm password:` ขณะพิมพ์จะไม่เห็นตัวอักษรบนหน้าจอ เมื่อสร้างสำเร็จให้เริ่ม API อีกครั้ง:

```bash
bash run.sh
```

หากมีบัญชีอยู่แล้วให้ข้ามการสร้าง บัญชีต้องมีอยู่ในตาราง `Thanapol_Kha_Users` พร้อมรหัสผ่านตรงกัน Backend ตรวจรหัสผ่านจากฐานข้อมูลจริง คำสั่ง `create-admin` ไม่เปลี่ยนรหัสผ่านบัญชีเดิม

### 1.6 ถ้าต้องการปิด SSH แล้ว Backend ยังทำงาน (กรณีมี PM2)

หยุดการรันแบบเดิมด้วย `Ctrl+C` ก่อน แล้วใช้ path จริงของโฟลเดอร์ที่อัปโหลด:

```bash
cd /app/tnpkhr-api
pm2 start /app/tnpkhr-api/run.sh --interpreter bash --name tnpkhr-ip-final
pm2 logs tnpkhr-ip-final
```

เมื่ออัปโหลดโค้ดใหม่ ใช้ `pm2 restart tnpkhr-ip-final` แล้วตรวจ health อีกครั้ง ถ้า hosting ใช้ process manager อื่น ให้ใช้ตามที่ผู้ดูแลกำหนด การเริ่มเองหลัง reboot ต้องตั้ง startup ตามระบบของ hosting

## 2. เปิด Frontend บนคอมพิวเตอร์

ติดตั้ง Node.js **22.13 ขึ้นไป** พร้อม npm แล้วเปิด PowerShell **อีกหน้าในโฟลเดอร์ `Std0202181IPFinal2026` บนคอมพิวเตอร์** โดยให้ Backend ทำงานค้างไว้บนเซิร์ฟเวอร์:

```powershell
ls
cd frontend
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

ตั้งค่า `frontend/.env` แล้วบันทึกไฟล์:

```dotenv
EXPO_PUBLIC_API_URL=http://119.59.102.161:3019
```

ใช้ base URL โดยไม่ต่อ `/api` และให้ตรงกับ Backend จากข้อ 1 จากนั้นรัน:

```powershell
npm start -- --clear
```

- กด `w` ใน Terminal เพื่อเปิดเว็บ หรือใช้ `npm run web -- --clear` เพื่อเปิดเว็บโดยตรง
- มือถือใช้ Expo Go เวอร์ชันที่รองรับ SDK ของโปรเจกต์สแกน QR โดยคอมพิวเตอร์และมือถือควรอยู่ Wi-Fi เดียวกัน
- เมื่อหน้า Login แสดง ให้กรอก **Username: `Admin` / Password: `password123`** แล้วกด **Sign In**
- หากล็อกอินไม่ได้ ให้ตรวจ health ในข้อ 1.4, URL ใน `frontend/.env` และบัญชีในฐานข้อมูลตามข้อ 1.5
- หลังเปลี่ยน `.env` ให้หยุด Expo ด้วย `Ctrl+C` แล้วรัน `npm start -- --clear` ใหม่

ดูรายละเอียด API และการตั้งค่าเพิ่มเติมที่ [backend/README.md](backend/README.md)

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

`localhost` means the machine/container running Node. phpMyAdmin and Node may run in different containers. Use the database host supplied by the hosting provider. Login uses an existing bcrypt password hash in the Users table. For a new database without the project account, use `bash run.sh create-admin Admin` on the server and enter the password listed in step 1.5. Existing accounts are not changed automatically.

## การใช้งาน Frontend และ session

In the employee actions menu, choose **Edit**, change the name/position/salary, and choose **Save Changes**. The app sends PUT to the API and reloads the current MySQL list after saving. Delete permanently removes the selected row after confirmation.

เปลี่ยนสถานะได้จากปุ่ม **Set On Leave / Set Active** บนการ์ดพนักงานโดยตรง พร้อมป้ายสถานะและไอคอนที่แยก Active / On Leave ชัดเจน กราฟ K-Means เลือก K ได้ 1–10 กลุ่ม แต่ละกลุ่มใช้สีต่างกัน และใช้สีเดียวกันสำหรับกลุ่มนั้นในทั้งสี่กราฟและการ์ดสรุป

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

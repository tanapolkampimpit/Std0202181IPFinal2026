# BlueHR MySQL API — FileZilla deployment

API นี้ใช้ตารางจริง `Thanapol_Kha_Employee` และ `Thanapol_Kha_Users` ในฐานข้อมูล `ip_std6730202181` ไม่มีข้อมูลพนักงานตัวอย่างหรือบัญชีล็อกอินตายตัว

## Config

ใช้ Node.js 22.13+ ตั้งค่าใน `.env` ที่อยู่ข้าง `package.json` ระบบอ่านไฟล์นี้โดยไม่แก้ไข และใช้ค่าจาก process environment ทับเมื่อมีการกำหนดไว้

```dotenv
APP_HOST=0.0.0.0
APP_PORT=3000
DB_HOST=YOUR_MYSQL_HOST
DB_PORT=3306
DB_NAME=ip_std6730202181
DB_USER=YOUR_DB_USER
DB_PASSWORD="YOUR_DB_PASSWORD"
DB_CONNECTION_LIMIT=5
JWT_SECRET=YOUR_STABLE_RANDOM_SECRET_AT_LEAST_32_BYTES
CORS_ORIGINS=*
```

รองรับ `HOST` / `PORT` เป็นชื่อสำรองของ `APP_HOST` / `APP_PORT` และรองรับ CORS แบบ JSON array เช่น `["http://localhost:8081"]` หรือ URL คั่นด้วย comma ค่าอื่นใน `.env` ที่ไม่เกี่ยวกับ API นี้จะไม่ถูกใช้

`DB_HOST=127.0.0.1` หมายถึง MySQL บนเครื่อง/container เดียวกับ Node ไม่ได้หมายถึงเครื่อง phpMyAdmin เสมอไป ถ้ารันบนคอมพิวเตอร์แต่ MySQL อยู่บนเซิร์ฟเวอร์ ต้องมี host/port ที่เปิดให้เชื่อม หรือ SSH tunnel ที่จัดเตรียมไว้

```bash
npm ci
npm run db:check
npm start
```

เช็ก schema เป็นการอ่านเท่านั้น ไม่มีการสร้าง/แก้ตารางหรือเพิ่มข้อมูล และการเริ่ม API จะหยุดหากตารางหรือการเชื่อมต่อไม่พร้อม

## FileZilla + run.sh

สร้างโฟลเดอร์สำหรับอัปโหลดจาก source ปัจจุบันได้ด้วย `npm run package:filezilla` จะได้ `BlueHR_API_FileZilla` ข้างโฟลเดอร์ repository โดยไม่คัดลอก `.env` หรือ `node_modules` หากโฟลเดอร์ปลายทางมีอยู่แล้ว ให้ระบุชื่อใหม่: `npm run package:filezilla -- /path/to/new-folder`

1. สร้างโฟลเดอร์ใหม่ เช่น `/app/bluehr-api` บนเซิร์ฟเวอร์ แล้วอัปโหลดไฟล์ backend เข้าไปทั้งหมด ยกเว้น `.env`, `node_modules`, coverage และผลทดสอบ ไม่ทับ `/app/run.sh` หรือ `.env` ของงานอื่น
2. เปิด SSH/Terminal แล้วเข้าโฟลเดอร์ใหม่
3. ถ้ามี `.env` ที่ตั้งค่าแล้ว ให้วางไว้ในโฟลเดอร์ใหม่นี้ด้วยตนเอง หากยังไม่มี รันครั้งแรกจะสร้างจาก `.env.example` พร้อม JWT secret สุ่ม แล้วหยุดให้กรอกข้อมูล MySQL

```bash
cd /app/bluehr-api
bash run.sh
# ตั้งค่า .env สำหรับเซิร์ฟเวอร์เมื่อเป็นการติดตั้งใหม่ แล้วตรวจการเชื่อมต่อ
bash run.sh check
# สร้างบัญชีเมื่อจำเป็นเท่านั้น รหัสผ่านจะให้กรอกแบบซ่อนและยืนยันซ้ำ
bash run.sh create-admin admin
# เริ่ม API
bash run.sh
```

`create-admin` เพิ่มบัญชีใหม่ ไม่เปลี่ยนรหัสผ่านบัญชีที่มีอยู่แล้ว API ไม่สร้างบัญชีอัตโนมัติ ไม่รีเซ็ตตาราง และไม่เพิ่มพนักงานอัตโนมัติ

`bash run.sh` รันแบบ foreground หากเซิร์ฟเวอร์มี PM2 และต้องการให้ทำงานต่อหลังปิด SSH ใช้ชื่อ process ใหม่ที่ไม่ทับงานเดิม:

```bash
pm2 start /app/bluehr-api/run.sh --interpreter bash --name bluehr-ip-final
pm2 logs bluehr-ip-final
```

ใช้พอร์ตที่ hosting กำหนดใน `APP_PORT` และชี้ reverse proxy มายังพอร์ตนั้นตามระบบของผู้ให้บริการ ไม่จำเป็นต้องเปิด API เป็นพอร์ตสาธารณะโดยตรง

## Endpoints

| Method | Path | รายละเอียด |
| --- | --- | --- |
| GET | `/api/health` | ตรวจ DB, 200 เมื่อพร้อม / 503 เมื่อเชื่อมไม่ได้ |
| POST | `/api/login` | `{username,password}` จาก Users → `{success:true,token}` |
| GET / POST | `/api/employees` | อ่านทั้งหมด / เพิ่ม |
| GET / PUT / DELETE | `/api/employees/:id` | อ่านหนึ่ง / แก้ไข / ลบ |
| PUT | `/api/employees/:id/status` | สลับ Active / On Leave |
| GET | `/api/employees/salary-clusters` | K-Means 3 กลุ่มจากเงินเดือนปัจจุบัน |
| GET / POST | `/api/users` | อ่านทั้งหมด / เพิ่ม — Admin เท่านั้น |
| GET / PUT / DELETE | `/api/users/:id` | อ่านหนึ่ง / แก้ไข / ลบ — Admin เท่านั้น |

ทุก endpoint ยกเว้น login/health ต้องส่ง `Authorization: Bearer <token>` ที่ได้จาก login Token มีอายุ 8 ชั่วโมง ตรวจสิทธิ์จาก DB ปัจจุบันทุก request และยกเลิก session เมื่อเปลี่ยนรหัสผ่านหรือลบบัญชี

ตัวอย่าง body สำหรับเพิ่มหรือแก้ไขพนักงาน:

```json
{"name":"ชื่อพนักงาน","position":"Software Engineer","salary":45000}
```

PUT อนุญาต `status` เพิ่มเติม (`Active` หรือ `On Leave`) ต้องส่ง name/position/salary ครบ ไม่รับ id จาก client ตอนเพิ่ม ข้อมูลที่เพิ่มจะใช้ AUTO_INCREMENT ของ MySQL

ตัวอย่าง body สำหรับ Users:

```json
{"username":"new-user","password":"YOUR_PASSWORD","role":"User"}
```

role เป็น Admin/User โดยบัญชีใหม่ผ่าน API มีค่าเริ่มต้น User; PUT ต้องส่ง username และอาจส่ง role/password ได้ รหัสผ่านยาวอย่างน้อย 8 ตัวอักษร ไม่เกิน 72 UTF-8 bytes ระบบเก็บ bcrypt ไม่คืน hash ใน response และไม่ให้ลบหรือลดสิทธิ์ Admin คนสุดท้าย รองรับ bcrypt `$2a$`, `$2b$` และ `$2y$` จาก PHP; hash แบบอื่นต้องใช้กระบวนการย้ายบัญชีที่เหมาะสม

FE เดิมใช้เส้นทางเดิมได้ ตั้ง `EXPO_PUBLIC_API_URL` ใน frontend ให้เป็น base URL ของ API โดยไม่มี `/api` ต่อท้าย จากนั้น restart Expo แล้วเข้าสู่ระบบด้วยบัญชีจริง

## ทดสอบ

```bash
npm test
npm run test:mysql
```

`npm test` ทดสอบ config/validation/K-Means โดยไม่แตะฐานข้อมูล ส่วน `test:mysql` ต้องใช้ MySQL/MariaDB สำหรับทดสอบบนเครื่อง local เท่านั้น กำหนด `DB_TEST_HOST` (loopback), `DB_TEST_PORT`, `DB_TEST_USER`, `DB_TEST_PASSWORD` ได้ ชุดทดสอบสร้าง DB ชื่อสุ่ม `bluehr_test_*` แยกจากงานจริงและลบเฉพาะ DB ของตนเองเมื่อจบ ต้องใช้บัญชีทดสอบที่มีสิทธิ์ CREATE/DROP DATABASE

ครอบคลุม HTTP CRUD พนักงาน/Users, decimal/ภาษาไทย, validation, SQL injection input, role, session revocation, bcrypt PHP และการ restart process API โดยข้อมูลยังอยู่ ไม่ทดสอบด้วยการลบข้อมูลใน `ip_std6730202181`

## เอกสารอ้างอิง

- [MySQL2: connection pools and prepared statements](https://sidorares.github.io/node-mysql2/docs)
- [Node.js: environment file support](https://nodejs.org/api/cli.html#--env-filefile)

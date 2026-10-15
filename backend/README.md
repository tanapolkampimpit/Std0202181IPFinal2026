# TNPKHR MySQL API — FileZilla deployment

API นี้ใช้ตารางจริง `Thanapol_Kha_Employee` และ `Thanapol_Kha_Users` ในฐานข้อมูล `ip_std6730202181` ไม่มีข้อมูลพนักงานตัวอย่างหรือบัญชีล็อกอินตายตัว

คู่มือเริ่มจากอัปโหลด Backend ด้วย FileZilla → ใช้ `ls` / `cd` ใน SSH → รัน Backend → เปิด Frontend และล็อกอิน อยู่ใน [README หลัก](../README.md) หากอ่านไฟล์นี้บนเซิร์ฟเวอร์ ให้เปิดคู่มือที่ [GitHub](https://github.com/tanapolkampimpit/Std0202181IPFinal2026#readme) คำสั่งรัน Backend บนเซิร์ฟเวอร์คือ `cd /app/Backend` แล้ว `bash run.sh` โดยเปลี่ยน path ให้ตรงกับโฟลเดอร์ที่อัปโหลดจริง

## Config

ใช้ Node.js 22.13+ ตั้งค่าใน `.env` ที่อยู่ข้าง `package.json` ระบบอ่านไฟล์นี้โดยไม่แก้ไข และใช้ค่าจาก process environment ทับเมื่อมีการกำหนดไว้

```dotenv
APP_HOST=0.0.0.0
APP_PORT=3019
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

ใช้โฟลเดอร์ **Backend ของโปรเจกต์ คือ [`backend/` บน GitHub](https://github.com/tanapolkampimpit/Std0202181IPFinal2026/tree/main/backend)** ดาวน์โหลดด้วย **Code → Download ZIP** แล้วแตก ZIP หรือใช้ source ที่ clone มา จะเห็น `backend` อยู่ข้าง `frontend` อัปโหลดไฟล์ข้างใน `backend/` ผ่าน FileZilla ได้โดยตรง ยกเว้น `.env`, `node_modules`, coverage และผลทดสอบ ไม่ต้องสร้างชุดอัปโหลดแยก

1. สร้างโฟลเดอร์ `Backend` เช่น `/app/Backend` บนเซิร์ฟเวอร์ แล้วอัปโหลดไฟล์ข้างใน `backend/` เข้าไปโดยตรง ให้ `run.sh` อยู่ที่ `/app/Backend/run.sh` ยกเว้น `.env`, `node_modules`, coverage และผลทดสอบ ไม่ทับ `/app/run.sh` หรือ `.env` ของงานอื่น FileZilla ใช้โอนไฟล์ ส่วนการรันใช้ SSH/Terminal
2. เปิด SSH/Terminal แล้วเข้าโฟลเดอร์ใหม่
3. ถ้ามี `.env` ที่ตั้งค่าแล้ว ให้วางไว้ในโฟลเดอร์ใหม่นี้ด้วยตนเอง หากยังไม่มี รันครั้งแรกจะสร้างจาก `.env.example` พร้อม JWT secret สุ่ม แล้วหยุดให้กรอกข้อมูล MySQL

```bash
pwd
ls
cd /app
ls
cd Backend
ls -la
bash run.sh
# หากเพิ่งสร้าง .env สคริปต์จะหยุด ให้แก้ข้อมูล DB และ APP_PORT=3019 ก่อน
nano .env
# เก็บ JWT_SECRET ที่สร้างไว้ แล้วตรวจการเชื่อมต่อ
bash run.sh check
# เริ่ม API
bash run.sh
```

`ls` ใช้ดูไฟล์/โฟลเดอร์, `cd` ใช้เข้าโฟลเดอร์ และ `ls -la` แสดงไฟล์ซ่อน เช่น `.env` ก่อนรันต้องเห็น `run.sh` และ `package.json` หากอัปโหลดไว้ path อื่น ให้ใช้ path นั้นแทน `/app/Backend` ชื่อบน Linux แยกตัวพิมพ์ใหญ่/เล็ก ให้พิมพ์ตรงกับชื่อใน FileZilla

บัญชีสำหรับหน้า Frontend ตามที่ระบุสำหรับงานนี้คือ **Username: `Admin` / Password: `password123`** ถ้าฐานข้อมูลยังไม่มีบัญชีนี้จึงค่อยใช้ `bash run.sh create-admin Admin` แล้วกรอก `password123` เมื่อถามรหัสผ่านและกรอกซ้ำเพื่อยืนยัน (ขณะพิมพ์ไม่แสดงตัวอักษร) หากมีบัญชีจริงอยู่แล้วให้ข้ามขั้นตอนนี้ บัญชีและรหัสผ่านต้องตรงกับข้อมูลใน `Thanapol_Kha_Users`

ตรวจ API ใน SSH อีกหน้าด้วย `curl http://127.0.0.1:3019/api/health` และตรวจจากเครื่องตัวเองด้วย URL `http://119.59.102.161:3019/api/health` ควรได้ HTTP 200 เมื่อฐานข้อมูลพร้อม URL นี้เป็นค่าที่ตั้งไว้ของงาน ไม่ใช่ผลยืนยันว่าเซิร์ฟเวอร์กำลังออนไลน์

`create-admin` เพิ่มบัญชีใหม่ ไม่เปลี่ยนรหัสผ่านบัญชีที่มีอยู่แล้ว API ไม่สร้างบัญชีอัตโนมัติ ไม่รีเซ็ตตาราง และไม่เพิ่มพนักงานอัตโนมัติ

`bash run.sh` รันแบบ foreground หากเซิร์ฟเวอร์มี PM2 และต้องการให้ทำงานต่อหลังปิด SSH ให้หยุด foreground ด้วย `Ctrl+C` ก่อน แล้วใช้ชื่อ process ใหม่ที่ไม่ทับงานเดิม:

```bash
pm2 start /app/Backend/run.sh --interpreter bash --name tnpkhr-ip-final
pm2 logs tnpkhr-ip-final
```

เมื่ออัปโหลด source รุ่นใหม่ ให้ใช้ `pm2 restart tnpkhr-ip-final` แล้วตรวจ health อีกครั้ง หากต้องการให้เริ่มเองหลัง reboot ให้ตั้ง startup ตามระบบของ hosting

ใช้พอร์ตที่ hosting กำหนดใน `APP_PORT` และชี้ reverse proxy มายังพอร์ตนั้นตามระบบของผู้ให้บริการ ไม่จำเป็นต้องเปิด API เป็นพอร์ตสาธารณะโดยตรง

## Endpoints

| Method | Path | รายละเอียด |
| --- | --- | --- |
| GET | `/api/health` | ตรวจ DB, 200 เมื่อพร้อม / 503 เมื่อเชื่อมไม่ได้ |
| POST | `/api/login` | `{username,password}` จาก Users → `{success:true,token}` |
| GET / POST | `/api/employees` | อ่านทั้งหมด / เพิ่ม |
| GET / PUT / DELETE | `/api/employees/:id` | อ่านหนึ่ง / แก้ไข / ลบ |
| PATCH | `/api/employees/:id` | แก้ไขเฉพาะฟิลด์ เช่น `{ "name": "ชื่อใหม่" }` |
| PUT | `/api/employees/:id/status` | สลับ Active / On Leave |
| GET | `/api/employees/salary-clusters?k=3` | K-Means ตามค่า K ที่เลือก 1–10 กลุ่ม (เริ่มต้น 3) จากเงินเดือนปัจจุบัน |
| GET / POST | `/api/users` | อ่านทั้งหมด / เพิ่ม — Admin เท่านั้น |
| GET / PUT / DELETE | `/api/users/:id` | อ่านหนึ่ง / แก้ไข / ลบ — Admin เท่านั้น |

ผลลัพธ์แต่ละกลุ่มมี `group`, `centroid`, `count` และ `salaries` (เงินเดือนสมาชิกจริงในกลุ่มนั้น) เพื่อให้กราฟค่าเฉลี่ย สัดส่วน ช่วงเงินเดือน และ Scatter ใช้ผล K-Means ชุดเดียวกัน ควรอัปเดต Backend พร้อม Frontend สำหรับกราฟทั้งสี่

ทุก endpoint ยกเว้น login/health ต้องส่ง `Authorization: Bearer <token>` ที่ได้จาก login Token มีอายุ 8 ชั่วโมง ตรวจสิทธิ์จาก DB ปัจจุบันทุก request และยกเลิก session เมื่อเปลี่ยนรหัสผ่านหรือลบบัญชี

ตัวอย่าง body สำหรับเพิ่มหรือแก้ไขพนักงาน:

```json
{"name":"ชื่อพนักงาน","position":"Software Engineer","salary":45000}
```

PUT อนุญาต `status` เพิ่มเติม (`Active` หรือ `On Leave`) ต้องส่ง name/position/salary ครบ ไม่รับ id จาก client ตอนเพิ่ม ข้อมูลที่เพิ่มจะใช้ AUTO_INCREMENT ของ MySQL

หากเปลี่ยนเฉพาะชื่อ ใช้ `PATCH /api/employees/:id` พร้อม `{ "name": "ชื่อใหม่" }` โดยฟิลด์ที่ไม่ได้ส่งจะคงค่าปัจจุบันจาก MySQL; PATCH ต้องมีอย่างน้อยหนึ่งฟิลด์จาก name/position/salary/status และไม่รับฟิลด์อื่น การแก้ไขบันทึกด้วย SQL UPDATE ส่วน DELETE ใช้ SQL DELETE ลบแถวถาวรออกจากตาราง ไม่มี soft delete เมื่อ GET อีกครั้งจะอ่านข้อมูลปัจจุบันจาก MySQL พร้อม `Cache-Control: no-store`

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

`npm test` ทดสอบ config/validation/K-Means โดยไม่แตะฐานข้อมูล ส่วน `test:mysql` ต้องใช้ MySQL/MariaDB สำหรับทดสอบบนเครื่อง local เท่านั้น กำหนด `DB_TEST_HOST` (loopback), `DB_TEST_PORT`, `DB_TEST_USER`, `DB_TEST_PASSWORD` ได้ ชุดทดสอบสร้าง DB ชื่อสุ่ม `tnpkhr_test_*` แยกจากงานจริงและลบเฉพาะ DB ของตนเองเมื่อจบ ต้องใช้บัญชีทดสอบที่มีสิทธิ์ CREATE/DROP DATABASE

ครอบคลุม HTTP CRUD พนักงาน/Users, decimal/ภาษาไทย, validation, SQL injection input, role, session revocation, bcrypt PHP และการ restart process API โดยข้อมูลยังอยู่ ไม่ทดสอบด้วยการลบข้อมูลใน `ip_std6730202181`

## เอกสารอ้างอิง

- [MySQL2: connection pools and prepared statements](https://sidorares.github.io/node-mysql2/docs)
- [Node.js: environment file support](https://nodejs.org/api/cli.html#--env-filefile)

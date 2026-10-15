import mysql from 'mysql2/promise';

// Fixed, case-sensitive names from the existing phpMyAdmin schema.
const EMPLOYEES = '`Thanapol_Kha_Employee`';
const USERS = '`Thanapol_Kha_Users`';
const employeeFields = '`id`, `name`, `position`, `status`, `salary`';
const publicUserFields = '`user_id`, `username`, `role`, `created_at`';
const validId = (id) => typeof id === 'string' && /^[1-9]\d{0,9}$/.test(id) && Number(id) <= 2147483647;
const employee = (row) => row ? { ...row, id: String(row.id), salary: Number(row.salary) } : null;
const publicUser = (row) => row ? { ...row, user_id: String(row.user_id) } : null;

export function createPool(config) { return mysql.createPool(config); }

export async function checkSchema(pool) {
  for (const [name, required, key] of [
    ['Thanapol_Kha_Employee', ['id', 'name', 'position', 'status', 'salary', 'created_at', 'updated_at'], 'id'],
    ['Thanapol_Kha_Users', ['user_id', 'username', 'password_hash', 'role', 'created_at'], 'user_id'],
  ]) {
    const [rows] = await pool.execute('SELECT COLUMN_NAME, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', [name]);
    const missing = required.filter((column) => !rows.some((row) => row.COLUMN_NAME === column));
    if (missing.length) throw new Error(`Table ${name} is missing columns: ${missing.join(', ')}. Compare sql/schema.sql with phpMyAdmin; no schema changes were made.`);
    if (!rows.find((row) => row.COLUMN_NAME === key)?.EXTRA.includes('auto_increment')) throw new Error(`${name}.${key} must be AUTO_INCREMENT.`);
  }
}

async function transaction(pool, action) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await action(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export function createEmployeeStore(pool) {
  const getWith = async (connection, id, lock = false) => {
    if (!validId(id)) return null;
    const [rows] = await connection.execute(`SELECT ${employeeFields} FROM ${EMPLOYEES} WHERE id = ?${lock ? ' FOR UPDATE' : ''}`, [id]);
    return employee(rows[0]);
  };
  return {
    async ping() { await pool.execute('SELECT 1'); return true; },
    async list() {
      const [rows] = await pool.execute(`SELECT ${employeeFields} FROM ${EMPLOYEES} ORDER BY id`);
      return rows.map(employee);
    },
    get(id) { return getWith(pool, id); },
    async create({ name, position, salary }) {
      return transaction(pool, async (connection) => {
        const [result] = await connection.execute(`INSERT INTO ${EMPLOYEES} (name, position, status, salary) VALUES (?, ?, 'Active', ?)`, [name, position, salary]);
        return getWith(connection, String(result.insertId));
      });
    },
    async update(id, data) {
      return transaction(pool, async (connection) => {
        const current = await getWith(connection, id, true);
        if (!current) return null;
        await connection.execute(`UPDATE ${EMPLOYEES} SET name = ?, position = ?, salary = ?, status = ? WHERE id = ?`, [data.name, data.position, data.salary, data.status ?? current.status, id]);
        return getWith(connection, id);
      });
    },
    async toggle(id) {
      return transaction(pool, async (connection) => {
        const current = await getWith(connection, id, true);
        if (!current) return null;
        await connection.execute(`UPDATE ${EMPLOYEES} SET status = ? WHERE id = ?`, [current.status === 'Active' ? 'On Leave' : 'Active', id]);
        return getWith(connection, id);
      });
    },
    async remove(id) {
      if (!validId(id)) return false;
      const [result] = await pool.execute(`DELETE FROM ${EMPLOYEES} WHERE id = ?`, [id]);
      return result.affectedRows === 1;
    },
  };
}

export function createUserStore(pool) {
  const getWith = async (connection, id, includeHash = false) => {
    if (!validId(id)) return null;
    const [rows] = await connection.execute(`SELECT ${publicUserFields}${includeHash ? ', password_hash' : ''} FROM ${USERS} WHERE user_id = ?`, [id]);
    return publicUser(rows[0]);
  };
  // Lock admins in one order before checking/removing/demoting the last admin.
  const lockedAdmins = async (connection) => {
    const [rows] = await connection.execute(`SELECT user_id FROM ${USERS} WHERE role = 'Admin' ORDER BY user_id FOR UPDATE`);
    return rows;
  };
  const lastAdminError = () => Object.assign(new Error('Cannot delete or demote the last Admin.'), { status: 409 });
  return {
    async list() {
      const [rows] = await pool.execute(`SELECT ${publicUserFields} FROM ${USERS} ORDER BY user_id`);
      return rows.map(publicUser);
    },
    get(id) { return getWith(pool, id); },
    getForAuth(id) { return getWith(pool, id, true); },
    async findByUsername(username) {
      const [rows] = await pool.execute(`SELECT user_id, username, password_hash, role FROM ${USERS} WHERE username = ? LIMIT 1`, [username]);
      return publicUser(rows[0]);
    },
    async create({ username, passwordHash, role }) {
      return transaction(pool, async (connection) => {
        const [result] = await connection.execute(`INSERT INTO ${USERS} (username, password_hash, role) VALUES (?, ?, ?)`, [username, passwordHash, role]);
        return getWith(connection, String(result.insertId));
      });
    },
    async update(id, data) {
      if (!validId(id)) return null;
      return transaction(pool, async (connection) => {
        const admins = await lockedAdmins(connection);
        const [rows] = await connection.execute(`SELECT ${publicUserFields} FROM ${USERS} WHERE user_id = ? FOR UPDATE`, [id]);
        const current = rows[0];
        if (!current) return null;
        if (current.role === 'Admin' && data.role && data.role !== 'Admin' && admins.length <= 1) throw lastAdminError();
        if (data.passwordHash) {
          await connection.execute(`UPDATE ${USERS} SET username = ?, role = ?, password_hash = ? WHERE user_id = ?`, [data.username, data.role ?? current.role, data.passwordHash, id]);
        } else await connection.execute(`UPDATE ${USERS} SET username = ?, role = ? WHERE user_id = ?`, [data.username, data.role ?? current.role, id]);
        return getWith(connection, id);
      });
    },
    async remove(id) {
      if (!validId(id)) return false;
      return transaction(pool, async (connection) => {
        const admins = await lockedAdmins(connection);
        const [rows] = await connection.execute(`SELECT role FROM ${USERS} WHERE user_id = ? FOR UPDATE`, [id]);
        if (!rows.length) return false;
        if (rows[0].role === 'Admin' && admins.length <= 1) throw lastAdminError();
        await connection.execute(`DELETE FROM ${USERS} WHERE user_id = ?`, [id]);
        return true;
      });
    },
  };
}

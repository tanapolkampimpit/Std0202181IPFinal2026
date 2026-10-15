export function employeeInput(body, { update = false, partial = false } = {}) {
  const errors = {};
  const data = {};
  const has = (field) => Object.prototype.hasOwnProperty.call(body ?? {}, field);
  if (partial) {
    const allowed = ['name', 'position', 'salary', 'status'];
    if (!body || typeof body !== 'object' || Array.isArray(body) || !allowed.some(has) || Object.keys(body).some((field) => !allowed.includes(field))) {
      errors.body = 'Provide one or more of name, position, salary or status only.';
    }
  }
  for (const field of ['name', 'position']) {
    if (partial && !has(field)) continue;
    if (typeof body?.[field] !== 'string' || !body[field].trim() || [...body[field].trim()].length > 100) {
      errors[field] = `${field} must contain 1–100 characters.`;
    } else data[field] = body[field].trim();
  }
  if (!partial || has('salary')) {
    const salary = body?.salary;
    if (typeof salary !== 'number' || !Number.isFinite(salary) || salary <= 0 || salary > 9999999999.99 || Number(salary.toFixed(2)) !== salary) {
      errors.salary = 'Salary must be a positive number up to 9999999999.99 with at most two decimal places.';
    } else data.salary = salary;
  }
  if (update && body?.status !== undefined) {
    if (!['Active', 'On Leave'].includes(body.status)) errors.status = 'Status must be Active or On Leave.';
    else data.status = body.status;
  }
  return { data, errors };
}

export function userInput(body, { update = false } = {}) {
  const errors = {};
  const data = {};
  if (typeof body?.username !== 'string' || !body.username.trim() || [...body.username.trim()].length > 50) {
    errors.username = 'Username must contain 1–50 characters.';
  } else data.username = body.username.trim();
  if (!update || body?.password !== undefined) {
    if (typeof body?.password !== 'string' || body.password.length < 8 || Buffer.byteLength(body.password) > 72) {
      errors.password = 'Password must be at least 8 characters and at most 72 UTF-8 bytes.';
    } else data.password = body.password;
  }
  const role = body?.role ?? (update ? undefined : 'User');
  if (role !== undefined) {
    if (!['Admin', 'User'].includes(role)) errors.role = 'Role must be Admin or User.';
    else data.role = role;
  }
  return { data, errors };
}

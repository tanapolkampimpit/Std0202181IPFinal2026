export function validateEmployee({ name, position, salary }) {
  const errors = {};
  if (!name?.trim()) errors.name = 'Please enter the employee’s name.';
  if (!position?.trim()) errors.position = 'Please enter a position.';
  const text = String(salary ?? '').trim();
  const number = Number(text);
  if (!text || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) || !Number.isFinite(number) || number <= 0) {
    errors.salary = 'Enter a valid salary greater than ฿0.';
  }
  return { errors, value: { name: name?.trim(), position: position?.trim(), salary: number } };
}

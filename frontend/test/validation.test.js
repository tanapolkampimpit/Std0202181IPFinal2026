import { validateEmployee } from '../src/validation';

test.each(['', ' ', 'abc', 'NaN', 'Infinity', '0', '-100', '1e309', '0xFF', '1,000', '12abc'])('rejects invalid salary %j', (salary) => {
  expect(validateEmployee({ name: 'Name', position: 'HR', salary }).errors.salary).toBeTruthy();
});
test('rejects whitespace names and positions', () => {
  const { errors } = validateEmployee({ name: '  ', position: '\t', salary: '1000' });
  expect(errors.name).toBeTruthy(); expect(errors.position).toBeTruthy();
});
test('trims text and converts salary to a finite Number', () => {
  expect(validateEmployee({ name: '  Jane Doe ', position: ' HR  ', salary: ' 45000.50 ' })).toEqual({ errors: {}, value: { name: 'Jane Doe', position: 'HR', salary: 45000.5 } });
});

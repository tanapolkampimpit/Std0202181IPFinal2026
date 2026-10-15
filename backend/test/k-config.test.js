import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kMeans1D, salaryClusters } from '../src/algorithms/kmeans.js';

for (const k of [1, 2, 3, 4, 6, 10]) {
  test(`K=${k}: preserves every salary, correct means, sorted groups and requested length`, () => {
    const salaries = [18000, 22000, 28000, 35000, 45000, 75000, 75000];
    const result = kMeans1D(salaries, { k });
    assert.equal(result.length, k);
    assert.deepEqual(result.flatMap((group) => group.values).sort((a, b) => a - b), salaries);
    for (const group of result) {
      assert.equal(group.count, group.values.length);
      if (group.count) assert.ok(Math.abs(group.centroid - group.values.reduce((a, b) => a + b, 0) / group.count) < 1e-8);
      else assert.equal(group.centroid, null);
    }
    const means = result.filter((group) => group.count).map((group) => group.centroid);
    assert.deepEqual(means, [...means].sort((a, b) => a - b));
    assert.equal(salaryClusters(salaries, { k }).length, k);
    const chartGroups = salaryClusters(salaries, { k, includeSalaries: true });
    assert.deepEqual(chartGroups.flatMap((group) => group.salaries).sort((a, b) => a - b), salaries);
    for (const group of chartGroups) {
      assert.equal(group.salaries.length, group.count);
      assert.equal(group.centroid, group.count ? Number((group.salaries.reduce((a, b) => a + b, 0) / group.count).toFixed(2)) : null);
    }
    assert.deepEqual(kMeans1D([], { k }), Array.from({ length: k }, () => ({ centroid: null, count: 0, values: [] })));
    assert.equal(kMeans1D([100, 100, 100], { k }).filter((group) => group.count).length, 1);
  });
}
test('invalid K values fail explicitly rather than truncating or defaulting', () => {
  for (const k of [0, -1, 11, 2.5, '3', NaN, Infinity, null]) assert.throws(() => salaryClusters([1, 2], { k }), /K must/);
});

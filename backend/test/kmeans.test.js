import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kMeans1D, salaryClusters } from '../src/algorithms/kmeans.js';

function verify(values) {
  const original = [...values];
  const clusters = kMeans1D(values);
  assert.equal(clusters.length, 3);
  assert.equal(clusters.reduce((sum, cluster) => sum + cluster.count, 0), values.length);
  assert.deepEqual(clusters.flatMap((cluster) => cluster.values).sort((a, b) => a - b), [...values].sort((a, b) => a - b));
  let previous = 0;
  for (const cluster of clusters) {
    assert.equal(cluster.count, cluster.values.length);
    if (!cluster.count) { assert.equal(cluster.centroid, null); continue; }
    const expected = cluster.values.reduce((sum, value) => sum + value / cluster.count, 0);
    assert.ok(Number.isFinite(cluster.centroid));
    assert.ok(Math.abs(cluster.centroid - expected) <= Math.max(1, expected) * 1e-12);
    assert.ok(cluster.centroid >= previous); previous = cluster.centroid;
    for (const salary of cluster.values) {
      for (const other of clusters.filter(({ count }) => count)) assert.ok(Math.abs(salary - cluster.centroid) <= Math.abs(salary - other.centroid) + 1e-6);
    }
  }
  assert.deepEqual(values, original);
  assert.deepEqual(kMeans1D(values), clusters);
  assert.deepEqual(kMeans1D([...values].reverse()), clusters);
  return clusters;
}
for (const [name, values] of [
  ['empty dataset', []], ['one employee', [45000]], ['two employees', [18000, 85000]],
  ['identical salaries', [20000, 20000, 20000, 20000]], ['two distinct salary levels', [20, 20, 80, 80, 80]],
  ['duplicate values', [10, 10, 20, 20, 30, 30, 30]], ['varied salaries', [18000, 22000, 45000, 48000, 85000, 98000]],
  ['decimal values', [0.01, 0.02, 10.12, 10.13, 70.777, 70.778]],
]) test(`K-Means handles ${name}: real memberships, means, sorted tiers, determinism`, () => verify(values));

test('centroids are rounded to two decimal places for the JSON contract', () => {
  assert.deepEqual(salaryClusters([100.001, 100.002, 500.111, 500.112, 900.999]), [
    { group: 'Tier 1', centroid: 100, count: 2 }, { group: 'Tier 2', centroid: 500.11, count: 2 }, { group: 'Tier 3', centroid: 901, count: 1 },
  ]);
});
test('very large finite salaries never produce Infinity or NaN', () => {
  for (const values of [[Number.MAX_VALUE], Array(100).fill(Number.MAX_VALUE), [1, Number.MAX_VALUE / 2, Number.MAX_VALUE]]) {
    for (const cluster of salaryClusters(values)) if (cluster.count) assert.ok(Number.isFinite(cluster.centroid));
  }
});
test('large datasets avoid argument-count overflow', () => {
  const result = kMeans1D(Array(150000).fill(45000));
  assert.equal(result[0].count, 150000); assert.ok(Math.abs(result[0].centroid - 45000) < 0.000001);
});
test('seeded varied datasets retain every salary and calculate real nearest-centroid groups', () => {
  let seed = 2026;
  for (let round = 0; round < 50; round += 1) {
    const values = Array.from({ length: round + 1 }, () => { seed = (seed * 16807) % 2147483647; return seed % 100000 + 1; });
    verify(values);
  }
});
test('invalid input and iteration options are rejected explicitly', () => {
  for (const values of [null, [NaN], [Infinity], [-10], [0], ['45']]) assert.throws(() => kMeans1D(values), TypeError);
  assert.throws(() => kMeans1D([10], { maxIterations: 0 }), TypeError);
});

// Deterministic Lloyd's algorithm in one dimension. Values remain available
// internally so tests can independently verify membership and centroid means.
function mean(values) {
  const scale = values.reduce((largest, value) => Math.max(largest, value), 0);
  // Scaled accumulation avoids overflow even for very large finite salaries.
  return Math.min(1, values.reduce((sum, value) => sum + value / scale / values.length, 0)) * scale;
}

export function kMeans1D(salaries, { maxIterations = 100, tolerance = 1e-10 } = {}) {
  if (!Array.isArray(salaries) || salaries.some((value) => typeof value !== 'number' || !Number.isFinite(value) || value <= 0)) {
    throw new TypeError('Salaries must be an array of positive finite numbers.');
  }
  if (!Number.isInteger(maxIterations) || maxIterations < 1 || !Number.isFinite(tolerance) || tolerance < 0) {
    throw new TypeError('Invalid K-Means iteration options.');
  }
  const sorted = [...salaries].sort((a, b) => a - b);
  const unique = [...new Set(sorted)];
  const k = Math.min(3, unique.length);
  if (k === 0) return Array.from({ length: 3 }, () => ({ centroid: null, count: 0, values: [] }));

  // Quantiles of distinct observed salaries give reproducible starting points.
  let centroids = Array.from({ length: k }, (_, i) => unique[Math.round(i * (unique.length - 1) / Math.max(1, k - 1))]);
  let groups = [];
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    groups = Array.from({ length: k }, () => []);
    for (const salary of sorted) {
      let nearest = 0;
      for (let i = 1; i < k; i += 1) {
        // Ties go to the lower-index (lower-salary) centroid.
        if (Math.abs(salary - centroids[i]) < Math.abs(salary - centroids[nearest])) nearest = i;
      }
      groups[nearest].push(salary);
    }
    // Preserve an empty seed during iteration; its final output is null/0.
    const updated = groups.map((values, i) => values.length ? mean(values) : centroids[i]);
    const converged = updated.every((value, i) => Math.abs(value - centroids[i]) / Math.max(1, value, centroids[i]) <= tolerance);
    centroids = updated;
    if (converged) break;
  }
  const result = groups.map((values) => ({ centroid: values.length ? mean(values) : null, count: values.length, values }));
  while (result.length < 3) result.push({ centroid: null, count: 0, values: [] });
  return result.sort((a, b) => a.centroid === null ? (b.centroid === null ? 0 : 1) : b.centroid === null ? -1 : a.centroid - b.centroid);
}

export function salaryClusters(salaries) {
  return kMeans1D(salaries).map(({ centroid, count }, index) => ({
    group: `Tier ${index + 1}`,
    centroid: centroid === null ? null : Number(centroid.toFixed(2)),
    count,
  }));
}

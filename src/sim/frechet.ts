/**
 * Fréchet–Hoeffding bounds for a finite union of events given only marginals.
 * No calibrated correlation is claimed from absent dependence data.
 *
 * For events A1..An with P(Ai)=p_i:
 *   lower: max( max_i p_i, sum p_i - (n-1) )   (and ≥ 0)
 *   upper: min( 1, sum p_i )
 *
 * These are exact sharp bounds over all joint distributions with those margins.
 * Annual-hazard independence is a distinct parametric assumption — not implied by these bounds.
 */

export function frechetUnionBounds(marginals: number[]): { low: number; high: number; n: number; sum: number } {
  const all = marginals.map((p) => Math.min(1, Math.max(0, p)));
  if (all.length === 0) return { low: 0, high: 0, n: 0, sum: 0 };
  const sum = all.reduce((a, b) => a + b, 0);
  const n = all.length;
  const maxP = Math.max(...all, 0);
  const low = Math.max(0, Math.max(maxP, sum - (n - 1)));
  const high = Math.min(1, sum);
  return { low, high, n, sum };
}

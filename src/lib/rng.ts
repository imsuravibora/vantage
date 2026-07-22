// Deterministic PRNG (mulberry32) so the synthetic dataset is reproducible across runs.
export function createRng(seed: number) {
  let a = seed;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(min: number, max: number) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(next() * arr.length)];
    },
    pickWeighted<T>(entries: [T, number][]): T {
      const total = entries.reduce((sum, [, w]) => sum + w, 0);
      let roll = next() * total;
      for (const [value, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return value;
      }
      return entries[entries.length - 1][0];
    },
    bool(probabilityTrue = 0.5) {
      return next() < probabilityTrue;
    },
    daysAgo(days: number) {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d;
    },
    dateBetween(start: Date, end: Date) {
      const t = start.getTime() + next() * (end.getTime() - start.getTime());
      return new Date(t);
    },
  };
}

export type Rng = ReturnType<typeof createRng>;

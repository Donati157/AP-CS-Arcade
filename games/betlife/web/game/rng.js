// Random numbers for the simulation. Production uses Math.random; tests pass a seed
// so the same life plays out every time (mulberry32 generator).
export function createRng(seed) {
  if (seed === undefined || seed === null) {
    return () => Math.random();
  }
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomIndex(rng, length) {
  return Math.floor(rng() * length);
}

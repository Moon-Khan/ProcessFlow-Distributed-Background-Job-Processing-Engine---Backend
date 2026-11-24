// ---- Numbers ----
export function round(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

export function nsToMs(ns: number): number {
  return round(ns / 1e6, 2);
}

export function bytesToMb(bytes: number): number {
  return round(bytes / 1024 / 1024, 1);
}

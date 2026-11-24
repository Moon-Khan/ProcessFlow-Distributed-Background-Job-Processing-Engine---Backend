import type { Bucket } from '../types/index.js';

// ---- Numbers ----
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function round(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

export function nsToMs(ns: number): number {
  return round(ns / 1e6, 2);
}

export function bytesToMb(bytes: number): number {
  return round(bytes / 1024 / 1024, 1);
}

export function elapsedMs(since: number): number {
  return Math.round(performance.now() - since);
}

// ---- Formatting ----
const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---- Buckets ----
export function addToBucket(buckets: Record<string, Bucket>, key: string, amount: number): void {
  const bucket = (buckets[key] ??= { count: 0, amount: 0 });
  bucket.count += 1;
  bucket.amount += amount;
}

export function roundBuckets(buckets: Record<string, Bucket>): Record<string, Bucket> {
  return Object.fromEntries(
    Object.entries(buckets).map(([key, b]) => [key, { count: b.count, amount: roundMoney(b.amount) }]),
  );
}

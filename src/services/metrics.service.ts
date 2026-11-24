import { monitorEventLoopDelay } from 'node:perf_hooks';
import { LOOP_DELAY_RESOLUTION_MS, POOL_SAMPLE_INTERVAL_MS } from '../constants/metrics.constants.js';
import { AppDataSource } from '../db/data-source.js';
import type { PgPool, RouteStats } from '../types/index.js';
import { bytesToMb, nsToMs, round } from '../utils/index.js';

// Event-loop delay: how late timers fire. If CPU work blocks the single JS thread,
// this goes up and *every* request waits. Key signal for Phase 1.
const loopDelay = monitorEventLoopDelay({ resolution: LOOP_DELAY_RESOLUTION_MS });
loopDelay.enable();

let routes: Record<string, RouteStats> = {};
let windowStartedAt = Date.now();
let cpuAtWindowStart = process.cpuUsage();
let poolPeak = { total: 0, waiting: 0 };

function getPool(): PgPool | undefined {
  // TypeORM exposes the underlying `pg` Pool as driver.master (typed as any).
  if (!AppDataSource.isInitialized) return undefined;
  return (AppDataSource.driver as unknown as { master?: PgPool }).master;
}

setInterval(() => {
  const pool = getPool();
  if (!pool) return;
  poolPeak.total = Math.max(poolPeak.total, pool.totalCount);
  poolPeak.waiting = Math.max(poolPeak.waiting, pool.waitingCount);
}, POOL_SAMPLE_INTERVAL_MS).unref();

export function recordRequest(routeKey: string, ms: number, statusCode: number): void {
  const stats = (routes[routeKey] ??= { count: 0, totalMs: 0, maxMs: 0, statuses: {} });
  stats.count += 1;
  stats.totalMs += ms;
  stats.maxMs = Math.max(stats.maxMs, ms);
  stats.statuses[statusCode] = (stats.statuses[statusCode] ?? 0) + 1;
}

function poolStats() {
  const pool = getPool();
  if (!pool) return null;
  return {
    total: pool.totalCount, // open connections right now
    idle: pool.idleCount, // open but unused right now
    waiting: pool.waitingCount, // queries waiting for a free connection right now
    peakTotal: poolPeak.total, // max open connections during the window
    peakWaiting: poolPeak.waiting, // max queued queries during the window (Phase 2!)
  };
}

// Numbers since the last reset (or since startup).
export function getMetricsSnapshot() {
  const windowSeconds = (Date.now() - windowStartedAt) / 1000;
  const cpu = process.cpuUsage(cpuAtWindowStart);
  const mem = process.memoryUsage();

  const routeSummary = Object.fromEntries(
    Object.entries(routes).map(([key, s]) => [
      key,
      { count: s.count, avgMs: round(s.totalMs / s.count, 2), maxMs: round(s.maxMs, 2), statuses: s.statuses },
    ]),
  );

  return {
    windowSeconds: round(windowSeconds, 1),
    eventLoopDelayMs: {
      p50: nsToMs(loopDelay.percentile(50)),
      p99: nsToMs(loopDelay.percentile(99)),
      max: nsToMs(loopDelay.max),
    },
    // % of one core used by this process during the window
    cpuPercent: round(((cpu.user + cpu.system) / 1000 / (windowSeconds * 1000)) * 100, 1),
    memoryMb: { rss: bytesToMb(mem.rss), heapUsed: bytesToMb(mem.heapUsed), heapTotal: bytesToMb(mem.heapTotal) },
    dbPool: poolStats(),
    routes: routeSummary,
  };
}

export function resetMetricsWindow(): void {
  loopDelay.reset();
  routes = {};
  poolPeak = { total: 0, waiting: 0 };
  windowStartedAt = Date.now();
  cpuAtWindowStart = process.cpuUsage();
}

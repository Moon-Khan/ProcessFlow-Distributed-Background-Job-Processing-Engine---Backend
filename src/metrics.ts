import type { RequestHandler } from 'express';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { AppDataSource } from './db/data-source.js';

// Event-loop delay: how late timers fire. If CPU work blocks the single JS thread,
// this goes up and *every* request waits. Key signal for Phase 1.
const loopDelay = monitorEventLoopDelay({ resolution: 10 });
loopDelay.enable();

type RouteStats = { count: number; totalMs: number; maxMs: number; statuses: Record<string, number> };
let routes: Record<string, RouteStats> = {};
let windowStartedAt = Date.now();
let cpuAtWindowStart = process.cpuUsage();

const logRequests = process.env.LOG_REQUESTS === 'true';

export const requestTiming: RequestHandler = (req, res, next) => {
  if (req.path === '/metrics') return next(); // don't measure the measuring
  const start = performance.now();
  res.on('finish', () => {
    const ms = performance.now() - start;
    // Route pattern (e.g. "/claims/") rather than the raw URL, so query strings don't explode the keys.
    const key = `${req.method} ${req.baseUrl}${req.route?.path ?? req.path}`;
    const stats = (routes[key] ??= { count: 0, totalMs: 0, maxMs: 0, statuses: {} });
    stats.count += 1;
    stats.totalMs += ms;
    stats.maxMs = Math.max(stats.maxMs, ms);
    stats.statuses[res.statusCode] = (stats.statuses[res.statusCode] ?? 0) + 1;
    // Off by default: console.log under heavy load is itself a bottleneck.
    if (logRequests) console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });
  next();
};

const toMs = (ns: number) => Number((ns / 1e6).toFixed(2));
const toMb = (bytes: number) => Number((bytes / 1024 / 1024).toFixed(1));

type PgPool = { totalCount: number; idleCount: number; waitingCount: number };

function getPool(): PgPool | undefined {
  // TypeORM exposes the underlying `pg` Pool as driver.master (typed as any).
  if (!AppDataSource.isInitialized) return undefined;
  return (AppDataSource.driver as unknown as { master?: PgPool }).master;
}

// A snapshot taken when /metrics is called (after a load test) would always look idle,
// so sample the pool every 50ms and keep the peaks for the window.
let poolPeak = { total: 0, waiting: 0 };
setInterval(() => {
  const pool = getPool();
  if (!pool) return;
  poolPeak.total = Math.max(poolPeak.total, pool.totalCount);
  poolPeak.waiting = Math.max(poolPeak.waiting, pool.waitingCount);
}, 50).unref();

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

// GET /metrics: numbers since the last call (or since startup). ?reset=false keeps the window open.
export const metricsHandler: RequestHandler = (req, res) => {
  const windowSeconds = (Date.now() - windowStartedAt) / 1000;
  const cpu = process.cpuUsage(cpuAtWindowStart);
  const mem = process.memoryUsage();

  const routeSummary = Object.fromEntries(
    Object.entries(routes).map(([key, s]) => [
      key,
      { count: s.count, avgMs: Number((s.totalMs / s.count).toFixed(2)), maxMs: Number(s.maxMs.toFixed(2)), statuses: s.statuses },
    ]),
  );

  res.json({
    windowSeconds: Number(windowSeconds.toFixed(1)),
    eventLoopDelayMs: {
      p50: toMs(loopDelay.percentile(50)),
      p99: toMs(loopDelay.percentile(99)),
      max: toMs(loopDelay.max),
    },
    // % of one core used by this process during the window
    cpuPercent: Number((((cpu.user + cpu.system) / 1000 / (windowSeconds * 1000)) * 100).toFixed(1)),
    memoryMb: { rss: toMb(mem.rss), heapUsed: toMb(mem.heapUsed), heapTotal: toMb(mem.heapTotal) },
    dbPool: poolStats(),
    routes: routeSummary,
  });

  if (req.query.reset !== 'false') {
    loopDelay.reset();
    routes = {};
    poolPeak = { total: 0, waiting: 0 };
    windowStartedAt = Date.now();
    cpuAtWindowStart = process.cpuUsage();
  }
};

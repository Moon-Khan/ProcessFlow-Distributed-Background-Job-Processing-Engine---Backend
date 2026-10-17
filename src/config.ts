function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (Number.isNaN(value)) throw new Error(`Env var ${name} must be a number, got "${raw}"`);
  return value;
}

function str(name: string, fallback: string): string {
  const raw = process.env[name];
  return raw === undefined || raw === '' ? fallback : raw;
}

export const config = {
  port: num('PORT', 3000),
  db: {
    host: str('DB_HOST', 'localhost'),
    port: num('DB_PORT', 5433),
    user: str('DB_USER', 'processflow'),
    password: str('DB_PASSWORD', 'processflow'),
    name: str('DB_NAME', 'processflow'),
    poolMax: num('DB_POOL_MAX', 10),
    logging: str('DB_LOGGING', 'false') === 'true',
  },
};

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (Number.isNaN(value)) throw new Error(`Env var ${name} must be a number, got "${raw}"`);
  return value;
}

export const config = {
  port: num('PORT', 3000),
};

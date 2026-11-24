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
  // Off by default: console.log under heavy load is itself a bottleneck.
  logRequests: str('LOG_REQUESTS', 'false') === 'true',
  // Where generated PDFs are written, relative to the working directory. Git-ignored.
  reportsDir: str('REPORTS_DIR', 'reports'),
  email: {
    // An IP, not "localhost": Nodemailer resolves hostnames through DNS (not the hosts file),
    // and a slow or offline DNS server then fails every email.
    smtpHost: str('SMTP_HOST', '127.0.0.1'),
    smtpPort: num('SMTP_PORT', 1025),
    from: str('EMAIL_FROM', 'ProcessFlow Reports <reports@securelife.test>'),
  },
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

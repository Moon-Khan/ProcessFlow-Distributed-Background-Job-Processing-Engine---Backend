import type { ValueTransformer } from 'typeorm';

// Postgres returns NUMERIC as a string to avoid precision loss; convert it to a JS number.
export const numericToNumber: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

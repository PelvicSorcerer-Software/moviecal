const PLACEHOLDER_ENV_VALUES = new Set(['replace-with-a-long-random-secret']);

const DISPOSABLE_CREDENTIALS_MESSAGE =
  'Replace placeholder values with a disposable or dev-only cron secret before using scheduled refresh helpers.';

export class CronEnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CronEnvironmentError';
  }
}

export interface ServerCronEnv {
  secret: string;
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new CronEnvironmentError(
      `Missing required environment variable ${name}. ${DISPOSABLE_CREDENTIALS_MESSAGE}`,
    );
  }

  if (PLACEHOLDER_ENV_VALUES.has(value)) {
    throw new CronEnvironmentError(
      `Environment variable ${name} is still using a placeholder value. ${DISPOSABLE_CREDENTIALS_MESSAGE}`,
    );
  }

  return value;
}

export function getServerCronEnv(): ServerCronEnv {
  return {
    secret: readRequiredEnv('CRON_SECRET'),
  };
}

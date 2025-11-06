import { Ledger } from '@daml/ledger';
import { env } from './environment.js';
import type { Result } from '../utils/result.js';
import { ok, err } from '../utils/result.js';
import { LedgerError } from '../utils/errors.js';

export interface LedgerConfig {
  readonly httpBaseUrl: string;
  readonly wsBaseUrl: string;
  readonly token?: string;
}

export const createLedgerConfig = (): LedgerConfig => {
  const httpBaseUrl = `http://${env.LEDGER_HOST}:${env.LEDGER_PORT}`;
  const wsBaseUrl = `ws://${env.LEDGER_HOST}:${env.LEDGER_PORT}`;

  return {
    httpBaseUrl,
    wsBaseUrl,
  };
};

export const createLedgerConnection = async (
  config: LedgerConfig,
  token: string
): Promise<Result<Ledger, LedgerError>> => {
  try {
    const ledger = new Ledger({
      token,
      httpBaseUrl: config.httpBaseUrl,
    });

    // Test connection
    await ledger.getTime();

    return ok(ledger);
  } catch (error) {
    return err(new LedgerError('Failed to connect to ledger', error));
  }
};

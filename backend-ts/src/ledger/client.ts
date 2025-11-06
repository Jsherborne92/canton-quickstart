import type { Ledger } from '@daml/ledger';
import type { Template, Choice, ContractId } from '@daml/types';
import type { Result } from '../utils/result.js';
import { ok, err } from '../utils/result.js';
import { LedgerError } from '../utils/errors.js';

export interface LedgerClient {
  readonly create: <T extends object>(
    template: Template<T>,
    payload: T
  ) => Promise<Result<ContractId<T>, LedgerError>>;

  readonly exercise: <T extends object, C, R>(
    choice: Choice<T, C, R>,
    contractId: ContractId<T>,
    argument: C
  ) => Promise<Result<R, LedgerError>>;

  readonly query: <T extends object>(
    template: Template<T>
  ) => Promise<Result<readonly { contractId: ContractId<T>; payload: T }[], LedgerError>>;

  readonly fetch: <T extends object>(
    template: Template<T>,
    contractId: ContractId<T>
  ) => Promise<Result<T | null, LedgerError>>;
}

export const createLedgerClient = (ledger: Ledger, party: string): LedgerClient => {
  return {
    create: async (template, payload) => {
      try {
        const result = await ledger.create(template, payload);
        return ok(result.contractId);
      } catch (error) {
        return err(new LedgerError('Failed to create contract', error));
      }
    },

    exercise: async (choice, contractId, argument) => {
      try {
        const result = await ledger.exercise(choice, contractId, argument);
        return ok(result.exerciseResult);
      } catch (error) {
        return err(new LedgerError('Failed to exercise choice', error));
      }
    },

    query: async (template) => {
      try {
        const result = await ledger.query(template, { party });
        return ok(result);
      } catch (error) {
        return err(new LedgerError('Failed to query contracts', error));
      }
    },

    fetch: async (template, contractId) => {
      try {
        const result = await ledger.fetch(template, contractId);
        return ok(result?.payload ?? null);
      } catch (error) {
        return err(new LedgerError('Failed to fetch contract', error));
      }
    },
  };
};

export type Result<TData, TError extends Error> =
  | { ok: true; value: TData }
  | { ok: false; error: TError };

export const ok = <TData>(value: TData): Result<TData, never> => ({
  ok: true,
  value,
});

export const err = <TError extends Error>(error: TError): Result<never, TError> => ({
  ok: false,
  error,
});

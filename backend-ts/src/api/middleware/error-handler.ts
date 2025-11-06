import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { DomainError } from '../../utils/errors.js';

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void => {
  // Log error
  request.log.error({
    err: error,
    url: request.url,
    method: request.method,
  });

  // Handle domain errors
  if (error instanceof DomainError) {
    reply.code(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  // Handle Fastify validation errors
  if ((error as any).validation) {
    reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: (error as any).validation,
      },
    });
    return;
  }

  // Default error handler
  reply.code(error.statusCode ?? 500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
    },
  });
};

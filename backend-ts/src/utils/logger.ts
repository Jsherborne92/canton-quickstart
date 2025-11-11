import type { FastifyBaseLogger } from 'fastify';

export interface Logger extends FastifyBaseLogger {
  readonly child: (bindings: Record<string, unknown>) => Logger;
}

// Pino logger configuration
export const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            colorize: true,
          },
        }
      : undefined,
  serializers: {
    req(request: any) {
      return {
        method: request.method,
        url: request.url,
        headers: request.headers,
        hostname: request.hostname,
        remoteAddress: request.ip,
        remotePort: request.socket?.remotePort,
      };
    },
    res(reply: any) {
      return {
        statusCode: reply.statusCode,
      };
    },
  },
};

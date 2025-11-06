import { createServer } from './server.js';
import { env } from './config/environment.js';

const start = async (): Promise<void> => {
  try {
    const server = await createServer();

    await server.listen({
      port: parseInt(env.BACKEND_PORT),
      host: '0.0.0.0',
    });

    server.log.info(
      `Backend service started on port ${env.BACKEND_PORT} in ${env.NODE_ENV} mode`
    );

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      server.log.info(`Received ${signal}, starting graceful shutdown`);

      try {
        await server.close();
        server.log.info('Server closed successfully');
        process.exit(0);
      } catch (error) {
        server.log.error(error, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

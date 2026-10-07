import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_req, reply) => {
    // Touch the database so a broken volume shows up here, not on first login.
    app.db.prepare('SELECT 1').get();
    return reply.header('Cache-Control', 'no-store').send({ status: 'ok' });
  });
}

import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Estado de salud de la API
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API funcionando correctamente
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'ubicame-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @openapi
 * /health/db:
 *   get:
 *     summary: Probar conexión real con PostgreSQL
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Conexión con PostgreSQL exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 database:
 *                   type: string
 *                   example: connected
 *       503:
 *         description: Error de conexión con la base de datos
 */
router.get('/health/db', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Probar conexión real ejecutando una consulta liviana
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      database: 'connected',
    });
  } catch (error) {
    // Log interno seguro sin exponer URL ni contraseñas en la respuesta HTTP
    console.error('[HealthCheck DB Error]: No se pudo conectar a PostgreSQL', error);

    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: 'No se pudo establecer conexión con la base de datos PostgreSQL',
    });
  }
});

export default router;
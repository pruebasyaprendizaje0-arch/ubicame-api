import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

/**
 * Extrae información segura de la cadena DATABASE_URL sin revelar contraseñas ni secretos.
 */
function parseSafeDbInfo(rawUrl?: string) {
  if (!rawUrl) {
    return {
      hasDatabaseUrl: false,
      host: 'NO_CONFIGURADO',
      port: 'NO_CONFIGURADO',
      database: 'NO_CONFIGURADO',
      user: 'NO_CONFIGURADO',
    };
  }

  try {
    const parsed = new URL(rawUrl);
    return {
      hasDatabaseUrl: true,
      host: parsed.hostname || 'desconocido',
      port: parsed.port || '5432',
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'desconocido',
      user: parsed.username || 'desconocido',
    };
  } catch (err) {
    return {
      hasDatabaseUrl: true,
      host: 'FORMATO_URL_INVALIDO',
      port: 'FORMATO_URL_INVALIDO',
      database: 'FORMATO_URL_INVALIDO',
      user: 'FORMATO_URL_INVALIDO',
    };
  }
}

/**
 * Sanitiza el mensaje de error para evitar fugas accionales de credenciales en logs.
 */
function sanitizeError(error: any) {
  const name = error?.name || 'Error';
  const code = error?.code;
  let message = error?.message || String(error);

  // Sanitizar cualquier URL de conexión que contenga usuario y contraseña
  message = message.replace(/postgresql:\/\/[^:]+:[^@]+@/gi, 'postgresql://***:***@');
  message = message.replace(/:\/\/[^:]+:[^@]+@/gi, '://***:***@');

  return { name, code, message };
}

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
  const dbInfo = parseSafeDbInfo(process.env.DATABASE_URL);

  console.log('[HealthCheck DB Diagnostic]:', {
    hasDatabaseUrl: dbInfo.hasDatabaseUrl,
    host: dbInfo.host,
    port: dbInfo.port,
    database: dbInfo.database,
    user: dbInfo.user,
  });

  try {
    // Probar conexión real ejecutando consulta liviana en PostgreSQL
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      database: 'connected',
    });
  } catch (error) {
    const safeErr = sanitizeError(error);

    console.error('[HealthCheck DB Error]: Fallo de conexión con PostgreSQL', {
      hasDatabaseUrl: dbInfo.hasDatabaseUrl,
      host: dbInfo.host,
      port: dbInfo.port,
      database: dbInfo.database,
      errorCode: safeErr.code,
      errorName: safeErr.name,
      errorMessage: safeErr.message,
    });

    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: 'No se pudo establecer conexión con la base de datos PostgreSQL',
    });
  }
});

export default router;
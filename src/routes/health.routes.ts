import { Router, Request, Response } from 'express';

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: ubicame-api
 *                 timestamp:
 *                   type: string
 *                   example: 2026-08-26T23:00:00.000Z
 *                 uptime:
 *                   type: number
 *                   example: 12.34
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'ubicame-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
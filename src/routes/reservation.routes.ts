import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticateJWT } from '../middleware/auth';
import { ReservationStatus } from '@prisma/client';

const router = Router();

const createReservationSchema = z.object({
  customerName: z.string().min(1, 'El nombre del cliente es obligatorio'),
  customerEmail: z.string().email('Email inválido').optional(),
  customerPhone: z.string().optional(),
  serviceName: z.string().optional(),
  resourceName: z.string().optional(),
  staffName: z.string().optional(),
  startsAt: z.string().datetime('Fecha de inicio inválida (ISO 8601)'),
  endsAt: z.string().datetime('Fecha de fin inválida (ISO 8601)'),
  notes: z.string().optional(),
  source: z.string().default('web'),
});

const updateReservationStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'CHECKED_IN',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ]),
});

/**
 * @openapi
 * /v1/branches/{branchId}/reservations:
 *   get:
 *     summary: Listar reservaciones de una sucursal
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de reservaciones
 */
router.get('/branches/:branchId/reservations', authenticateJWT, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = req.params.branchId as string;
    const status = req.query.status as string | undefined;

    const reservations = await prisma.reservation.findMany({
      where: {
        branchId,
        ...(status && { status: status as ReservationStatus }),
      },
      orderBy: {
        startsAt: 'asc',
      },
    });

    res.json({ reservations });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /v1/branches/{branchId}/reservations:
 *   post:
 *     summary: Crear una nueva reservación
 *     tags:
 *       - Reservations
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - startsAt
 *               - endsAt
 *             properties:
 *               customerName:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               serviceName:
 *                 type: string
 *               resourceName:
 *                 type: string
 *               staffName:
 *                 type: string
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *               endsAt:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reservación creada exitosamente
 */
router.post('/branches/:branchId/reservations', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = req.params.branchId as string;
    const data = createReservationSchema.parse(req.body);

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      res.status(404).json({ error: 'NotFound', message: 'Sucursal no encontrada' });
      return;
    }

    const reservation = await prisma.reservation.create({
      data: {
        branchId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        serviceName: data.serviceName,
        resourceName: data.resourceName,
        staffName: data.staffName,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        source: data.source,
        notes: data.notes,
        status: ReservationStatus.PENDING,
      },
    });

    res.status(201).json({ reservation });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /v1/reservations/{reservationId}/status:
 *   patch:
 *     summary: Actualizar estado de una reservación
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, NO_SHOW]
 *     responses:
 *       200:
 *         description: Reservación actualizada
 */
router.patch('/reservations/:reservationId/status', authenticateJWT, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reservationId = req.params.reservationId as string;
    const { status } = updateReservationStatusSchema.parse(req.body);

    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: status as ReservationStatus },
    });

    res.json({ reservation: updatedReservation });
  } catch (error) {
    next(error);
  }
});

export default router;
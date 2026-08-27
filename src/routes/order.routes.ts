import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticateJWT } from '../middleware/auth';
import { OrderStatus } from '@prisma/client';

const router = Router();

const createOrderItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, 'El nombre del producto es requerido'),
  unitPrice: z.number().positive('El precio debe ser positivo'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
});

const createOrderSchema = z.object({
  tableName: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  paymentMethod: z.string().default('EFECTIVO'),
  notes: z.string().optional(),
  tip: z.number().min(0).default(0),
  items: z.array(createOrderItemSchema).min(1, 'El pedido debe tener al menos un ítem'),
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'PREPARING',
    'IN_TRANSIT',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
  ]),
});

/**
 * @openapi
 * /v1/branches/{branchId}/orders:
 *   post:
 *     summary: Crear un nuevo pedido para una sucursal
 *     tags:
 *       - Orders
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
 *               - items
 *             properties:
 *               tableName:
 *                 type: string
 *               customerName:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               customerAddress:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productName
 *                     - unitPrice
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     unitPrice:
 *                       type: number
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Pedido creado exitosamente
 */
router.post('/branches/:branchId/orders', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = req.params.branchId as string;
    const data = createOrderSchema.parse(req.body);

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      res.status(404).json({ error: 'NotFound', message: 'Sucursal no encontrada' });
      return;
    }

    // Calculate totals
    const subtotalNum = data.items.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    );

    const ivaPercent = Number(branch.ivaPercent) || 0;
    const servicePercent = Number(branch.servicePercent) || 0;
    const deliveryCostNum = Number(branch.deliveryCost) || 0;

    const ivaNum = (subtotalNum * ivaPercent) / 100;
    const serviceChargeNum = (subtotalNum * servicePercent) / 100;
    const totalNum = subtotalNum + ivaNum + serviceChargeNum + data.tip + deliveryCostNum;

    const order = await prisma.order.create({
      data: {
        branchId,
        tableName: data.tableName,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        subtotal: subtotalNum,
        iva: ivaNum,
        serviceCharge: serviceChargeNum,
        tip: data.tip,
        deliveryCost: deliveryCostNum,
        total: totalNum,
        status: OrderStatus.PENDING,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.unitPrice * item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /v1/branches/{branchId}/orders:
 *   get:
 *     summary: Listar pedidos de una sucursal
 *     tags:
 *       - Orders
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
 *         description: Lista de pedidos
 */
router.get('/branches/:branchId/orders', authenticateJWT, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = req.params.branchId as string;
    const status = req.query.status as string | undefined;

    const orders = await prisma.order.findMany({
      where: {
        branchId,
        ...(status && { status: status as OrderStatus }),
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /v1/orders/{orderId}/status:
 *   patch:
 *     summary: Actualizar estado de un pedido
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *                 enum: [PENDING, PREPARING, IN_TRANSIT, DELIVERED, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Pedido actualizado
 */
router.patch('/orders/:orderId/status', authenticateJWT, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderId = req.params.orderId as string;
    const { status } = updateOrderStatusSchema.parse(req.body);

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
      include: { items: true },
    });

    res.json({ order: updatedOrder });
  } catch (error) {
    next(error);
  }
});

export default router;
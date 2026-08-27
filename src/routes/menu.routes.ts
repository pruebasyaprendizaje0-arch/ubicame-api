import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

const router = Router();

/**
 * @openapi
 * /v1/branches/{branchId}/menu:
 *   get:
 *     summary: Obtener el menú completo (categorías y productos) de una sucursal
 *     tags:
 *       - Menu
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sucursal o slug
 *     responses:
 *       200:
 *         description: Menú de la sucursal con categorías y productos
 *       404:
 *         description: Sucursal o menú no encontrado
 */
router.get('/:branchId/menu', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchIdStr = req.params.branchId as string;

    // Direct lookup by ID or slug
    const branch = await prisma.branch.findFirst({
      where: {
        OR: [{ id: branchIdStr }, { slug: branchIdStr }],
        isActive: true,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            coverUrl: true,
          },
        },
        menus: {
          where: { isActive: true },
          include: {
            categories: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              include: {
                products: {
                  where: { isAvailable: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!branch) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Sucursal no encontrada',
      });
      return;
    }

    res.json({
      branch: {
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
        address: branch.address,
        phone: branch.phone,
        business: branch.business,
      },
      menus: branch.menus,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
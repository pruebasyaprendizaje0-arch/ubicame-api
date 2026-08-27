import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { menuController } from '../controllers/menu.controller';

const router = Router();

/**
 * @openapi
 * /v1/branches/{branchId}/menu:
 *   get:
 *     summary: Obtener el menú público completo (categorías y productos) de una sucursal
 *     description: Endpoint público sin autenticación para consultar el menú digital QR.
 *     tags:
 *       - Menu
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID (UUID) o Slug de la sucursal
 *     responses:
 *       200:
 *         description: Menú completo de la sucursal
 *       404:
 *         description: Sucursal o menú no encontrado
 */
router.get('/branches/:branchId/menu', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchIdStr = req.params.branchId as string;

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

// --- GESTIÓN DE CATEGORÍAS (REQUIERE AUTH) ---

/**
 * @openapi
 * /v1/branches/{branchId}/categories:
 *   post:
 *     summary: Crear una nueva categoría en el menú de la sucursal
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Entradas y Entremeses
 *               order:
 *                 type: integer
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *       403:
 *         description: No tienes permiso para editar el menú de esta sucursal
 */
router.post('/branches/:branchId/categories', requireAuth, menuController.createCategory);

/**
 * @openapi
 * /v1/branches/{branchId}/categories:
 *   get:
 *     summary: Listar todas las categorías de una sucursal
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de categorías obtenida exitosamente
 */
router.get('/branches/:branchId/categories', requireAuth, menuController.getCategories);

/**
 * @openapi
 * /v1/categories/{categoryId}:
 *   put:
 *     summary: Actualizar una categoría existente
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               order:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 */
router.put('/categories/:categoryId', requireAuth, menuController.updateCategory);

/**
 * @openapi
 * /v1/categories/{categoryId}:
 *   delete:
 *     summary: Eliminar una categoría
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría eliminada exitosamente
 */
router.delete('/categories/:categoryId', requireAuth, menuController.deleteCategory);

// --- GESTIÓN DE PRODUCTOS (REQUIERE AUTH) ---

/**
 * @openapi
 * /v1/branches/{branchId}/products:
 *   post:
 *     summary: Crear un nuevo producto en una sucursal
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
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
 *               - categoryId
 *               - name
 *               - price
 *             properties:
 *               categoryId:
 *                 type: string
 *               name:
 *                 type: string
 *                 example: Pizza Pepperoni Grande
 *               description:
 *                 type: string
 *                 example: Salsa de tomate, mozzarella y pepperoni importado
 *               price:
 *                 type: number
 *                 example: 12.99
 *               imageUrl:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *               order:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 */
router.post('/branches/:branchId/products', requireAuth, menuController.createProduct);

/**
 * @openapi
 * /v1/branches/{branchId}/products:
 *   get:
 *     summary: Listar productos de una sucursal
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filtrar por ID de categoría
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
 */
router.get('/branches/:branchId/products', requireAuth, menuController.getProducts);

/**
 * @openapi
 * /v1/products/{productId}:
 *   get:
 *     summary: Obtener detalle de un producto por ID
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle del producto
 */
router.get('/products/:productId', requireAuth, menuController.getProductById);

/**
 * @openapi
 * /v1/products/{productId}:
 *   put:
 *     summary: Actualizar un producto existente
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 */
router.put('/products/:productId', requireAuth, menuController.updateProduct);

/**
 * @openapi
 * /v1/products/{productId}/availability:
 *   patch:
 *     summary: Cambiar disponibilidad de un producto (Activar / Desactivar)
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Disponibilidad del producto actualizada exitosamente
 */
router.patch('/products/:productId/availability', requireAuth, menuController.setProductAvailability);

/**
 * @openapi
 * /v1/products/{productId}:
 *   delete:
 *     summary: Eliminar un producto
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 */
router.delete('/products/:productId', requireAuth, menuController.deleteProduct);

export default router;
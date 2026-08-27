import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9 -]/g, '')     // Eliminar caracteres especiales
    .replace(/\s+/g, '-')            // Reemplazar espacios por guiones
    .replace(/-+/g, '-');            // Eliminar guiones duplicados
};

const createBusinessSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres').optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
  plan: z.string().optional().default('FREE'),
});

const updateBusinessSchema = createBusinessSchema.partial();

const createBranchSchema = z.object({
  name: z.string().min(2, 'El nombre de la sucursal debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug de la sucursal debe tener al menos 2 caracteres').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  provincia: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  tablesConfig: z.string().optional(),
  schedule: z.string().optional(),
  localSchedule: z.string().optional(),
  deliverySchedule: z.string().optional(),
  deliveryEnabled: z.boolean().optional(),
  deliveryCost: z.number().optional(),
  ivaPercent: z.number().optional(),
  servicePercent: z.number().optional(),
  bankName: z.string().optional(),
  bankAccountType: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountDocument: z.string().optional(),
  bankAccountEmail: z.string().optional(),
  qrCobroUrl: z.string().optional(),
});

/**
 * @openapi
 * /v1/businesses:
 *   post:
 *     summary: Crear un nuevo negocio
 *     tags:
 *       - Business
 *     security:
 *       - bearerAuth: []
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
 *                 example: Pizzería Bella Italia
 *               slug:
 *                 type: string
 *                 example: pizzeria-bella-italia
 *               industry:
 *                 type: string
 *                 example: RESTAURANTE
 *               description:
 *                 type: string
 *                 example: Especialidad en pizzas artesanales e italianas
 *               whatsapp:
 *                 type: string
 *                 example: "+593991234567"
 *     responses:
 *       201:
 *         description: Negocio creado exitosamente
 *       400:
 *         description: Slug duplicado o datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data = createBusinessSchema.parse(req.body);
    const finalSlug = slugify(data.slug || data.name);

    // Validar slug único
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: finalSlug },
    });

    if (existingBusiness) {
      res.status(400).json({
        error: 'BadRequest',
        message: `El slug '${finalSlug}' ya se encuentra registrado`,
      });
      return;
    }

    const business = await prisma.business.create({
      data: {
        ownerId: userId,
        name: data.name,
        slug: finalSlug,
        industry: data.industry,
        description: data.description,
        logoUrl: data.logoUrl,
        coverUrl: data.coverUrl,
        whatsapp: data.whatsapp,
        instagram: data.instagram,
        facebook: data.facebook,
        tiktok: data.tiktok,
        plan: data.plan,
        branches: {
          create: {
            name: 'Sucursal Principal',
            slug: 'principal',
            menus: {
              create: {
                name: 'Menú Principal',
              },
            },
          },
        },
      },
      include: {
        branches: true,
      },
    });

    res.status(201).json({ business });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /v1/businesses:
 *   get:
 *     summary: Listar negocios (del propietario autenticado o todos si es ADMIN)
 *     tags:
 *       - Business
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de negocios
 *       401:
 *         description: No autenticado
 */
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    const whereCondition = isAdmin ? {} : { ownerId: userId };

    const businesses = await prisma.business.findMany({
      where: whereCondition,
      include: {
        branches: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ businesses });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /v1/businesses/{businessId}:
 *   get:
 *     summary: Obtener detalle de un negocio por ID o Slug
 *     tags:
 *       - Business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID o Slug del negocio
 *     responses:
 *       200:
 *         description: Detalle del negocio
 *       403:
 *         description: No tienes acceso a este negocio
 *       404:
 *         description: Negocio no encontrado
 */
router.get('/:businessId', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const businessId = req.params.businessId as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const business = await prisma.business.findFirst({
      where: {
        OR: [{ id: businessId }, { slug: businessId }],
      },
      include: {
        branches: true,
      },
    });

    if (!business) {
      res.status(404).json({ error: 'NotFound', message: 'Negocio no encontrado' });
      return;
    }

    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && business.ownerId !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'No tienes permiso para acceder a este negocio' });
      return;
    }

    res.json({ business });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /v1/businesses/{businessId}:
 *   put:
 *     summary: Actualizar información de un negocio
 *     tags:
 *       - Business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
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
 *               industry:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Negocio actualizado exitosamente
 *       403:
 *         description: No tienes permiso para editar este negocio
 *       404:
 *         description: Negocio no encontrado
 */
router.put('/:businessId', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const businessId = req.params.businessId as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const existingBusiness = await prisma.business.findFirst({
      where: {
        OR: [{ id: businessId }, { slug: businessId }],
      },
    });

    if (!existingBusiness) {
      res.status(404).json({ error: 'NotFound', message: 'Negocio no encontrado' });
      return;
    }

    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && existingBusiness.ownerId !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'No tienes permiso para modificar este negocio' });
      return;
    }

    const data = updateBusinessSchema.parse(req.body);

    if (data.slug && data.slug !== existingBusiness.slug) {
      const formattedSlug = slugify(data.slug);
      const slugConflict = await prisma.business.findUnique({
        where: { slug: formattedSlug },
      });

      if (slugConflict && slugConflict.id !== existingBusiness.id) {
        res.status(400).json({ error: 'BadRequest', message: `El slug '${formattedSlug}' ya está registrado` });
        return;
      }
      data.slug = formattedSlug;
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: existingBusiness.id },
      data,
      include: {
        branches: true,
      },
    });

    res.json({ business: updatedBusiness });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /v1/businesses/{businessId}/branches:
 *   post:
 *     summary: Crear una nueva sucursal para un negocio
 *     tags:
 *       - Business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
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
 *                 example: Sucursal Quito Norte
 *               slug:
 *                 type: string
 *                 example: quito-norte
 *               address:
 *                 type: string
 *                 example: Av. Amazonas y República
 *               phone:
 *                 type: string
 *                 example: "+59322234567"
 *     responses:
 *       201:
 *         description: Sucursal creada exitosamente
 *       403:
 *         description: No tienes permiso para agregar sucursales a este negocio
 *       404:
 *         description: Negocio no encontrado
 */
router.post('/:businessId/branches', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const businessId = req.params.businessId as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const business = await prisma.business.findFirst({
      where: {
        OR: [{ id: businessId }, { slug: businessId }],
      },
    });

    if (!business) {
      res.status(404).json({ error: 'NotFound', message: 'Negocio no encontrado' });
      return;
    }

    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && business.ownerId !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'No tienes permiso para agregar sucursales a este negocio' });
      return;
    }

    const data = createBranchSchema.parse(req.body);
    const branchSlug = slugify(data.slug || data.name);

    // Validar slug único dentro de este negocio
    const existingBranch = await prisma.branch.findUnique({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: branchSlug,
        },
      },
    });

    if (existingBranch) {
      res.status(400).json({
        error: 'BadRequest',
        message: `El slug '${branchSlug}' ya existe para este negocio`,
      });
      return;
    }

    const branch = await prisma.branch.create({
      data: {
        businessId: business.id,
        name: data.name,
        slug: branchSlug,
        address: data.address,
        city: data.city,
        provincia: data.provincia,
        lat: data.lat,
        lng: data.lng,
        phone: data.phone,
        email: data.email,
        tablesConfig: data.tablesConfig || '1,2,3,4,5,6,7,8,9,10',
        schedule: data.schedule,
        localSchedule: data.localSchedule,
        deliverySchedule: data.deliverySchedule,
        deliveryEnabled: data.deliveryEnabled ?? true,
        deliveryCost: data.deliveryCost ?? 0.0,
        ivaPercent: data.ivaPercent ?? 15.0,
        servicePercent: data.servicePercent ?? 10.0,
        bankName: data.bankName,
        bankAccountType: data.bankAccountType,
        bankAccountNumber: data.bankAccountNumber,
        bankAccountName: data.bankAccountName,
        bankAccountDocument: data.bankAccountDocument,
        bankAccountEmail: data.bankAccountEmail,
        qrCobroUrl: data.qrCobroUrl,
        menus: {
          create: {
            name: 'Menú Principal',
          },
        },
      },
    });

    res.status(201).json({ branch });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /v1/businesses/{businessId}/branches:
 *   get:
 *     summary: Listar sucursales de un negocio
 *     tags:
 *       - Business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de sucursales del negocio
 *       403:
 *         description: No tienes acceso a las sucursales de este negocio
 *       404:
 *         description: Negocio no encontrado
 */
router.get('/:businessId/branches', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const businessId = req.params.businessId as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const business = await prisma.business.findFirst({
      where: {
        OR: [{ id: businessId }, { slug: businessId }],
      },
    });

    if (!business) {
      res.status(404).json({ error: 'NotFound', message: 'Negocio no encontrado' });
      return;
    }

    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && business.ownerId !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'No tienes permiso para ver las sucursales de este negocio' });
      return;
    }

    const branches = await prisma.branch.findMany({
      where: {
        businessId: business.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({ branches });
  } catch (error) {
    next(error);
  }
});

export default router;
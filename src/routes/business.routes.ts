import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { businessController } from '../controllers/business.controller';

const router = Router();

/**
 * @openapi
 * /v1/public/businesses/{slug}:
 *   get:
 *     summary: Obtener información pública de un negocio por su slug
 *     description: Endpoint público sin autenticación para que misreservaciones consulte la información de un comercio y sus sucursales activas.
 *     tags:
 *       - Businesses
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug del negocio (ej. pizzeria-bella-italia, pigro)
 *     responses:
 *       200:
 *         description: Detalle del negocio obtenido exitosamente
 *       404:
 *         description: Negocio no encontrado
 */
router.get('/public/businesses/:slug', businessController.getPublicBusinessBySlug);

/**
 * @openapi
 * /v1/businesses:
 *   post:
 *     summary: Crear un nuevo negocio
 *     description: El ownerId se asigna automáticamente a partir del usuario autenticado en el JWT. El cliente no puede enviarlo.
 *     tags:
 *       - Businesses
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
 *               instagram:
 *                 type: string
 *                 example: "@pizzeriabellaitalia"
 *     responses:
 *       201:
 *         description: Negocio creado exitosamente
 *       400:
 *         description: Slug duplicado o datos inválidos
 *       401:
 *         description: Token no provisto o inválido
 */
router.post('/businesses', requireAuth, businessController.createBusiness);

/**
 * @openapi
 * /v1/businesses:
 *   get:
 *     summary: Listar negocios
 *     description: Retorna la lista de negocios del usuario autenticado (o todos los negocios si el usuario tiene rol ADMIN).
 *     tags:
 *       - Businesses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de negocios obtenida exitosamente
 *       401:
 *         description: Token no provisto o inválido
 */
router.get('/businesses', requireAuth, businessController.getBusinesses);

/**
 * @openapi
 * /v1/businesses/{businessId}:
 *   get:
 *     summary: Obtener detalle de un negocio
 *     description: Permite consultar un negocio por su ID (UUID) o Slug.
 *     tags:
 *       - Businesses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID (UUID) o Slug del negocio
 *     responses:
 *       200:
 *         description: Detalle del negocio obtenido exitosamente
 *       403:
 *         description: No tienes permiso para acceder a este negocio
 *       404:
 *         description: Negocio no encontrado
 */
router.get('/businesses/:businessId', requireAuth, businessController.getBusinessById);

/**
 * @openapi
 * /v1/businesses/{businessId}:
 *   put:
 *     summary: Actualizar información de un negocio
 *     description: Actualiza los campos permitidos del negocio. Requiere ser propietario del negocio o tener rol ADMIN.
 *     tags:
 *       - Businesses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID (UUID) o Slug del negocio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Pizzería Bella Italia Pro
 *               industry:
 *                 type: string
 *                 example: RESTAURANTE
 *               description:
 *                 type: string
 *                 example: Pizzas gourmet al horno de leña
 *     responses:
 *       200:
 *         description: Negocio actualizado exitosamente
 *       403:
 *         description: No tienes permiso para editar este negocio
 *       404:
 *         description: Negocio no encontrado
 */
router.put('/businesses/:businessId', requireAuth, businessController.updateBusiness);

/**
 * @openapi
 * /v1/businesses/{businessId}/branches:
 *   post:
 *     summary: Crear una nueva sucursal
 *     description: Agrega una nueva sucursal a un negocio existente.
 *     tags:
 *       - Businesses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID (UUID) o Slug del negocio
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
 *                 example: Av. Amazonas N34-120
 *               phone:
 *                 type: string
 *                 example: "+59322234567"
 *               deliveryCost:
 *                 type: number
 *                 example: 2.50
 *     responses:
 *       201:
 *         description: Sucursal creada exitosamente
 *       403:
 *         description: No tienes permiso para agregar sucursales a este negocio
 *       404:
 *         description: Negocio no encontrado
 */
router.post('/businesses/:businessId/branches', requireAuth, businessController.createBranch);

/**
 * @openapi
 * /v1/businesses/{businessId}/branches:
 *   get:
 *     summary: Listar sucursales de un negocio
 *     tags:
 *       - Businesses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID (UUID) o Slug del negocio
 *     responses:
 *       200:
 *         description: Lista de sucursales obtenida exitosamente
 *       403:
 *         description: No tienes permiso para ver las sucursales de este negocio
 *       404:
 *         description: Negocio no encontrado
 */
router.get('/businesses/:businessId/branches', requireAuth, businessController.getBranches);

export default router;
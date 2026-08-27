import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth, getJwtSecret } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).optional().default(UserRole.ADMIN),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

/**
 * @openapi
 * /v1/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@restaurante.com
 *               password:
 *                 type: string
 *                 example: Secret123456
 *               phone:
 *                 type: string
 *                 example: "+593991234567"
 *               role:
 *                 type: string
 *                 enum: [SUPERADMIN, ADMIN, MANAGER, STAFF, CUSTOMER]
 *                 example: ADMIN
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente con JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *                     email:
 *                       type: string
 *                       example: admin@restaurante.com
 *                     name:
 *                       type: string
 *                       example: Juan Pérez
 *                     phone:
 *                       type: string
 *                       example: "+593991234567"
 *                     role:
 *                       type: string
 *                       example: ADMIN
 *                     createdAt:
 *                       type: string
 *                       example: "2026-08-26T21:00:00.000Z"
 *       400:
 *         description: Email duplicado o datos inválidos
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    const normalizedEmail = data.email.toLowerCase().trim();

    // Validar email duplicado
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'El correo electrónico ya se encuentra registrado',
      });
      return;
    }

    // Cifrar contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crear usuario en base de datos
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: normalizedEmail,
        password: hashedPassword,
        phone: data.phone,
        role: data.role,
      },
    });

    // Generar JWT con token firmado
    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /v1/auth/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@restaurante.com
 *               password:
 *                 type: string
 *                 example: Secret123456
 *     responses:
 *       200:
 *         description: Login exitoso con JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *                     email:
 *                       type: string
 *                       example: admin@restaurante.com
 *                     name:
 *                       type: string
 *                       example: Juan Pérez
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: ADMIN
 *                     createdAt:
 *                       type: string
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Credenciales inválidas',
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Credenciales inválidas',
      });
      return;
    }

    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /v1/auth/me:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                     businesses:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Token no provisto o inválido
 */
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
            industry: true,
            branches: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'NotFound', message: 'Usuario no encontrado' });
      return;
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
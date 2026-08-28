import { prisma } from '../prisma';

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9 -]/g, '')     // Eliminar caracteres especiales
    .replace(/\s+/g, '-')            // Reemplazar espacios por guiones
    .replace(/-+/g, '-');            // Eliminar guiones duplicados
};

export interface CreateBusinessInput {
  name: string;
  slug?: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  plan?: string;
}

export interface UpdateBusinessInput {
  name?: string;
  slug?: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  plan?: string;
}

export interface CreateBranchInput {
  name: string;
  slug?: string;
  address?: string;
  city?: string;
  provincia?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
  tablesConfig?: string;
  schedule?: string;
  localSchedule?: string;
  deliverySchedule?: string;
  deliveryEnabled?: boolean;
  deliveryCost?: number;
  ivaPercent?: number;
  servicePercent?: number;
  bankName?: string;
  bankAccountType?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  bankAccountDocument?: string;
  bankAccountEmail?: string;
  qrCobroUrl?: string;
}

export class BusinessService {
  /**
   * Crear un nuevo negocio asignando ownerId automáticamente del usuario autenticado
   */
  async createBusiness(ownerId: string, input: CreateBusinessInput) {
    const finalSlug = slugify(input.slug || input.name);

    const existing = await prisma.business.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      const error: any = new Error(`El slug '${finalSlug}' ya se encuentra registrado`);
      error.statusCode = 400;
      throw error;
    }

    return prisma.business.create({
      data: {
        ownerId, // El cliente NO envía ownerId; se toma del JWT
        name: input.name,
        slug: finalSlug,
        industry: input.industry,
        description: input.description,
        logoUrl: input.logoUrl,
        coverUrl: input.coverUrl,
        whatsapp: input.whatsapp,
        instagram: input.instagram,
        facebook: input.facebook,
        tiktok: input.tiktok,
        plan: input.plan || 'FREE',
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
  }

  /**
   * Listar negocios: Un usuario solo ve sus propios negocios, ADMIN ve todos
   */
  async getBusinesses(userId: string, userRole: string) {
    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    const where = isAdmin ? {} : { ownerId: userId };

    return prisma.business.findMany({
      where,
      include: {
        branches: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Obtener detalle de negocio por ID o Slug
   */
  async getBusinessByIdOrSlug(businessId: string, userId: string, userRole: string) {
    const business = await prisma.business.findFirst({
      where: {
        OR: [{ id: businessId }, { slug: businessId }],
      },
      include: {
        branches: true,
      },
    });

    if (!business) {
      const error: any = new Error('Negocio no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && business.ownerId !== userId) {
      const error: any = new Error('No tienes permiso para acceder a este negocio');
      error.statusCode = 403;
      throw error;
    }

    return business;
  }

  /**
   * Actualizar información de negocio
   */
  async updateBusiness(businessId: string, userId: string, userRole: string, input: UpdateBusinessInput) {
    const business = await this.getBusinessByIdOrSlug(businessId, userId, userRole);

    if (input.slug && input.slug !== business.slug) {
      const formattedSlug = slugify(input.slug);
      const conflict = await prisma.business.findUnique({
        where: { slug: formattedSlug },
      });

      if (conflict && conflict.id !== business.id) {
        const error: any = new Error(`El slug '${formattedSlug}' ya está registrado`);
        error.statusCode = 400;
        throw error;
      }
      input.slug = formattedSlug;
    }

    return prisma.business.update({
      where: { id: business.id },
      data: input,
      include: {
        branches: true,
      },
    });
  }

  /**
   * Crear sucursal en un negocio
   */
  async createBranch(businessId: string, userId: string, userRole: string, input: CreateBranchInput) {
    const business = await this.getBusinessByIdOrSlug(businessId, userId, userRole);
    const branchSlug = slugify(input.slug || input.name);

    const existingBranch = await prisma.branch.findUnique({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: branchSlug,
        },
      },
    });

    if (existingBranch) {
      const error: any = new Error(`El slug '${branchSlug}' ya existe para este negocio`);
      error.statusCode = 400;
      throw error;
    }

    return prisma.branch.create({
      data: {
        businessId: business.id,
        name: input.name,
        slug: branchSlug,
        address: input.address,
        city: input.city,
        provincia: input.provincia,
        lat: input.lat,
        lng: input.lng,
        phone: input.phone,
        email: input.email,
        tablesConfig: input.tablesConfig || '1,2,3,4,5,6,7,8,9,10',
        schedule: input.schedule,
        localSchedule: input.localSchedule,
        deliverySchedule: input.deliverySchedule,
        deliveryEnabled: input.deliveryEnabled ?? true,
        deliveryCost: input.deliveryCost ?? 0.0,
        ivaPercent: input.ivaPercent ?? 15.0,
        servicePercent: input.servicePercent ?? 10.0,
        bankName: input.bankName,
        bankAccountType: input.bankAccountType,
        bankAccountNumber: input.bankAccountNumber,
        bankAccountName: input.bankAccountName,
        bankAccountDocument: input.bankAccountDocument,
        bankAccountEmail: input.bankAccountEmail,
        qrCobroUrl: input.qrCobroUrl,
        menus: {
          create: {
            name: 'Menú Principal',
          },
        },
      },
    });
  }

  /**
   * Listar sucursales de un negocio
   */
  async getBranches(businessId: string, userId: string, userRole: string) {
    const business = await this.getBusinessByIdOrSlug(businessId, userId, userRole);

    return prisma.branch.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Consultar información pública de un negocio por su slug
   */
  async getPublicBusinessBySlug(slug: string) {
    const business = await prisma.business.findFirst({
      where: {
        slug: {
          equals: slug,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        ownerId: true,
        name: true,
        slug: true,
        industry: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        whatsapp: true,
        instagram: true,
        facebook: true,
        tiktok: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
        branches: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!business) {
      const error: any = new Error('Negocio no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return business;
  }
}

export const businessService = new BusinessService();
import { prisma } from '../prisma';
import { businessService } from './business.service';

export interface CreateServiceInput {
  industry?: string;
  name: string;
  description?: string;
  durationMin?: number;
  priceCents?: number;
  currency?: string;
  capacity?: number;
  active?: boolean;
  metadata?: any;
}

export interface CreateResourceInput {
  type?: string;
  name: string;
  capacity?: number;
  active?: boolean;
  metadata?: any;
}

export interface CreateStaffInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  active?: boolean;
  serviceIds?: string[];
  metadata?: any;
}

export interface AvailabilityRuleInput {
  staffId?: string;
  weekday: number;
  startMin: number;
  endMin: number;
  active?: boolean;
}

export class CatalogService {
  // --- SERVICIOS ---
  async createService(branchId: string, userId: string, userRole: string, input: CreateServiceInput) {
    await businessService.getBranchById(branchId, userId, userRole);
    return prisma.service.create({
      data: {
        branchId,
        industry: input.industry,
        name: input.name,
        description: input.description,
        durationMin: input.durationMin ?? 60,
        priceCents: input.priceCents ?? 0,
        currency: input.currency ?? 'USD',
        capacity: input.capacity ?? 1,
        active: input.active ?? true,
        metadata: input.metadata,
      },
    });
  }

  async getBranchServices(branchId: string) {
    return prisma.service.findMany({
      where: { branchId, active: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateService(serviceId: string, userId: string, userRole: string, input: Partial<CreateServiceInput>) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { branch: { include: { business: true } } },
    });
    if (!service) {
      const error: any = new Error('Servicio no encontrado');
      error.statusCode = 404;
      throw error;
    }
    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && service.branch.business.ownerId !== userId) {
      const error: any = new Error('No tienes permiso para editar este servicio');
      error.statusCode = 403;
      throw error;
    }

    return prisma.service.update({
      where: { id: serviceId },
      data: input,
    });
  }

  async deleteService(serviceId: string, userId: string, userRole: string) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { branch: { include: { business: true } } },
    });
    if (!service) {
      const error: any = new Error('Servicio no encontrado');
      error.statusCode = 404;
      throw error;
    }
    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && service.branch.business.ownerId !== userId) {
      const error: any = new Error('No tienes permiso para eliminar este servicio');
      error.statusCode = 403;
      throw error;
    }

    return prisma.service.update({
      where: { id: serviceId },
      data: { active: false },
    });
  }

  // --- RECURSOS ---
  async createResource(branchId: string, userId: string, userRole: string, input: CreateResourceInput) {
    await businessService.getBranchById(branchId, userId, userRole);
    return prisma.resource.create({
      data: {
        branchId,
        type: input.type || 'MESA',
        name: input.name,
        capacity: input.capacity ?? 1,
        active: input.active ?? true,
        metadata: input.metadata,
      },
    });
  }

  async getBranchResources(branchId: string) {
    return prisma.resource.findMany({
      where: { branchId, active: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateResource(resourceId: string, userId: string, userRole: string, input: Partial<CreateResourceInput>) {
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { branch: { include: { business: true } } },
    });
    if (!resource) {
      const error: any = new Error('Recurso no encontrado');
      error.statusCode = 404;
      throw error;
    }
    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && resource.branch.business.ownerId !== userId) {
      const error: any = new Error('No tienes permiso para editar este recurso');
      error.statusCode = 403;
      throw error;
    }

    return prisma.resource.update({
      where: { id: resourceId },
      data: input,
    });
  }

  async deleteResource(resourceId: string, userId: string, userRole: string) {
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { branch: { include: { business: true } } },
    });
    if (!resource) {
      const error: any = new Error('Recurso no encontrado');
      error.statusCode = 404;
      throw error;
    }
    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && resource.branch.business.ownerId !== userId) {
      const error: any = new Error('No tienes permiso para eliminar este recurso');
      error.statusCode = 403;
      throw error;
    }

    return prisma.resource.update({
      where: { id: resourceId },
      data: { active: false },
    });
  }

  // --- PERSONAL (STAFF) ---
  async createStaff(branchId: string, userId: string, userRole: string, input: CreateStaffInput) {
    await businessService.getBranchById(branchId, userId, userRole);
    const staff = await prisma.staff.create({
      data: {
        branchId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        active: input.active ?? true,
        metadata: input.metadata,
      },
    });

    if (input.serviceIds && input.serviceIds.length > 0) {
      await prisma.staffService.createMany({
        data: input.serviceIds.map((serviceId) => ({
          staffId: staff.id,
          serviceId,
        })),
        skipDuplicates: true,
      });
    }

    return prisma.staff.findUnique({
      where: { id: staff.id },
      include: { services: { include: { service: true } } },
    });
  }

  async getBranchStaff(branchId: string) {
    return prisma.staff.findMany({
      where: { branchId, active: true },
      include: { services: { include: { service: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async updateStaff(staffId: string, userId: string, userRole: string, input: Partial<CreateStaffInput>) {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { branch: { include: { business: true } } },
    });
    if (!staff) {
      const error: any = new Error('Personal no encontrado');
      error.statusCode = 404;
      throw error;
    }
    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && staff.branch.business.ownerId !== userId) {
      const error: any = new Error('No tienes permiso para editar este personal');
      error.statusCode = 403;
      throw error;
    }

    const { serviceIds, ...data } = input;
    const updated = await prisma.staff.update({
      where: { id: staffId },
      data,
    });

    if (serviceIds) {
      await prisma.staffService.deleteMany({ where: { staffId } });
      if (serviceIds.length > 0) {
        await prisma.staffService.createMany({
          data: serviceIds.map((serviceId) => ({ staffId, serviceId })),
          skipDuplicates: true,
        });
      }
    }

    return prisma.staff.findUnique({
      where: { id: staffId },
      include: { services: { include: { service: true } } },
    });
  }

  async deleteStaff(staffId: string, userId: string, userRole: string) {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { branch: { include: { business: true } } },
    });
    if (!staff) {
      const error: any = new Error('Personal no encontrado');
      error.statusCode = 404;
      throw error;
    }
    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && staff.branch.business.ownerId !== userId) {
      const error: any = new Error('No tienes permiso para eliminar este personal');
      error.statusCode = 403;
      throw error;
    }

    return prisma.staff.update({
      where: { id: staffId },
      data: { active: false },
    });
  }

  // --- DISPONIBILIDAD Y HORARIOS ---
  async getBranchAvailability(branchId: string) {
    const [rules, exceptions] = await Promise.all([
      prisma.availabilityRule.findMany({
        where: { branchId, active: true },
        orderBy: [{ weekday: 'asc' }, { startMin: 'asc' }],
      }),
      prisma.availabilityException.findMany({
        where: { branchId },
        orderBy: { date: 'asc' },
      }),
    ]);
    return { rules, exceptions };
  }

  async setBranchAvailability(branchId: string, userId: string, userRole: string, rules: AvailabilityRuleInput[]) {
    await businessService.getBranchById(branchId, userId, userRole);

    await prisma.availabilityRule.deleteMany({ where: { branchId } });

    if (rules.length > 0) {
      await prisma.availabilityRule.createMany({
        data: rules.map((r) => ({
          branchId,
          staffId: r.staffId || null,
          weekday: r.weekday,
          startMin: r.startMin,
          endMin: r.endMin,
          active: r.active ?? true,
        })),
      });
    }

    return this.getBranchAvailability(branchId);
  }

  async createAvailabilityException(
    branchId: string,
    userId: string,
    userRole: string,
    exception: { staffId?: string; date: string; blocked?: boolean; startMin?: number; endMin?: number; reason?: string }
  ) {
    await businessService.getBranchById(branchId, userId, userRole);

    return prisma.availabilityException.create({
      data: {
        branchId,
        staffId: exception.staffId || null,
        date: new Date(exception.date),
        blocked: exception.blocked ?? true,
        startMin: exception.startMin,
        endMin: exception.endMin,
        reason: exception.reason,
      },
    });
  }

  async deleteAvailabilityException(exceptionId: string, userId: string, userRole: string) {
    const exc = await prisma.availabilityException.findUnique({
      where: { id: exceptionId },
      include: { branch: { include: { business: true } } },
    });
    if (!exc) {
      const error: any = new Error('Excepción no encontrada');
      error.statusCode = 404;
      throw error;
    }
    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && exc.branch.business.ownerId !== userId) {
      const error: any = new Error('No tienes permiso para eliminar esta excepción');
      error.statusCode = 403;
      throw error;
    }

    return prisma.availabilityException.delete({ where: { id: exceptionId } });
  }
}

export const catalogService = new CatalogService();

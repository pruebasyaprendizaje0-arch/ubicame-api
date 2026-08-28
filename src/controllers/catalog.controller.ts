import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { catalogService } from '../services/catalog.service';

const createServiceSchema = z.object({
  industry: z.string().optional(),
  name: z.string().min(1, 'El nombre del servicio es obligatorio'),
  description: z.string().optional(),
  durationMin: z.number().int().positive().optional().default(60),
  priceCents: z.number().int().nonnegative().optional().default(0),
  currency: z.string().optional().default('USD'),
  capacity: z.number().int().positive().optional().default(1),
  active: z.boolean().optional().default(true),
  metadata: z.any().optional(),
});

const updateServiceSchema = createServiceSchema.partial();

const createResourceSchema = z.object({
  type: z.string().optional().default('MESA'),
  name: z.string().min(1, 'El nombre del recurso es obligatorio'),
  capacity: z.number().int().positive().optional().default(1),
  active: z.boolean().optional().default(true),
  metadata: z.any().optional(),
});

const updateResourceSchema = createResourceSchema.partial();

const createStaffSchema = z.object({
  name: z.string().min(1, 'El nombre del personal es obligatorio'),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
  serviceIds: z.array(z.string()).optional(),
  metadata: z.any().optional(),
});

const updateStaffSchema = createStaffSchema.partial();

const availabilityRuleSchema = z.object({
  staffId: z.string().optional(),
  weekday: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0).max(1440),
  endMin: z.number().int().min(0).max(1440),
  active: z.boolean().optional().default(true),
});

const setAvailabilitySchema = z.object({
  rules: z.array(availabilityRuleSchema),
});

const availabilityExceptionSchema = z.object({
  staffId: z.string().optional(),
  date: z.string(),
  blocked: z.boolean().optional().default(true),
  startMin: z.number().int().optional(),
  endMin: z.number().int().optional(),
  reason: z.string().optional(),
});

export class CatalogController {
  // SERVICIOS
  createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.params.branchId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = createServiceSchema.parse(req.body);

      const service = await catalogService.createService(branchId, userId, userRole, input);
      res.status(201).json({ service });
    } catch (error) {
      next(error);
    }
  };

  getBranchServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.params.branchId as string;
      const services = await catalogService.getBranchServices(branchId);
      res.json({ services });
    } catch (error) {
      next(error);
    }
  };

  updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const serviceId = req.params.serviceId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = updateServiceSchema.parse(req.body);

      const service = await catalogService.updateService(serviceId, userId, userRole, input);
      res.json({ service });
    } catch (error) {
      next(error);
    }
  };

  deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const serviceId = req.params.serviceId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      await catalogService.deleteService(serviceId, userId, userRole);
      res.json({ message: 'Servicio eliminado' });
    } catch (error) {
      next(error);
    }
  };

  // RECURSOS
  createResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.params.branchId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = createResourceSchema.parse(req.body);

      const resource = await catalogService.createResource(branchId, userId, userRole, input);
      res.status(201).json({ resource });
    } catch (error) {
      next(error);
    }
  };

  getBranchResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.params.branchId as string;
      const resources = await catalogService.getBranchResources(branchId);
      res.json({ resources });
    } catch (error) {
      next(error);
    }
  };

  updateResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resourceId = req.params.resourceId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = updateResourceSchema.parse(req.body);

      const resource = await catalogService.updateResource(resourceId, userId, userRole, input);
      res.json({ resource });
    } catch (error) {
      next(error);
    }
  };

  deleteResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resourceId = req.params.resourceId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      await catalogService.deleteResource(resourceId, userId, userRole);
      res.json({ message: 'Recurso eliminado' });
    } catch (error) {
      next(error);
    }
  };

  // PERSONAL
  createStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.params.branchId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = createStaffSchema.parse(req.body);

      const staff = await catalogService.createStaff(branchId, userId, userRole, input);
      res.status(201).json({ staff });
    } catch (error) {
      next(error);
    }
  };

  getBranchStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.params.branchId as string;
      const staff = await catalogService.getBranchStaff(branchId);
      res.json({ staff });
    } catch (error) {
      next(error);
    }
  };

  updateStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const staffId = req.params.staffId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = updateStaffSchema.parse(req.body);

      const staff = await catalogService.updateStaff(staffId, userId, userRole, input);
      res.json({ staff });
    } catch (error) {
      next(error);
    }
  };

  deleteStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const staffId = req.params.staffId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      await catalogService.deleteStaff(staffId, userId, userRole);
      res.json({ message: 'Personal eliminado' });
    } catch (error) {
      next(error);
    }
  };

  // DISPONIBILIDAD
  getBranchAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.params.branchId as string;
      const availability = await catalogService.getBranchAvailability(branchId);
      res.json(availability);
    } catch (error) {
      next(error);
    }
  };

  setBranchAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.params.branchId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { rules } = setAvailabilitySchema.parse(req.body);

      const availability = await catalogService.setBranchAvailability(branchId, userId, userRole, rules);
      res.json(availability);
    } catch (error) {
      next(error);
    }
  };

  createAvailabilityException = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.params.branchId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = availabilityExceptionSchema.parse(req.body);

      const exception = await catalogService.createAvailabilityException(branchId, userId, userRole, input);
      res.status(201).json({ exception });
    } catch (error) {
      next(error);
    }
  };

  deleteAvailabilityException = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exceptionId = req.params.exceptionId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      await catalogService.deleteAvailabilityException(exceptionId, userId, userRole);
      res.json({ message: 'Excepción eliminada' });
    } catch (error) {
      next(error);
    }
  };
}

export const catalogController = new CatalogController();

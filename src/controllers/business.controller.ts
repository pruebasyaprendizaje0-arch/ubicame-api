import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { businessService } from '../services/business.service';

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

export class BusinessController {
  createBusiness = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.user!.id; // ownerId se toma AUTOMÁTICAMENTE del JWT
      const input = createBusinessSchema.parse(req.body);

      const business = await businessService.createBusiness(ownerId, input);
      res.status(201).json({ business });
    } catch (error) {
      next(error);
    }
  };

  getBusinesses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const businesses = await businessService.getBusinesses(userId, userRole);
      res.json({ businesses });
    } catch (error) {
      next(error);
    }
  };

  getBusinessById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessId = req.params.businessId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const business = await businessService.getBusinessByIdOrSlug(businessId, userId, userRole);
      res.json({ business });
    } catch (error) {
      next(error);
    }
  };

  updateBusiness = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessId = req.params.businessId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = updateBusinessSchema.parse(req.body);

      const business = await businessService.updateBusiness(businessId, userId, userRole, input);
      res.json({ business });
    } catch (error) {
      next(error);
    }
  };

  createBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessId = req.params.businessId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = createBranchSchema.parse(req.body);

      const branch = await businessService.createBranch(businessId, userId, userRole, input);
      res.status(201).json({ branch });
    } catch (error) {
      next(error);
    }
  };

  getBranches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessId = req.params.businessId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const branches = await businessService.getBranches(businessId, userId, userRole);
      res.json({ branches });
    } catch (error) {
      next(error);
    }
  };
}

export const businessController = new BusinessController();
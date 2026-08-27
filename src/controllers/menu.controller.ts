import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { menuService } from '../services/menu.service';

const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre de la categoría es requerido'),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const updateCategorySchema = createCategorySchema.partial();

const createProductSchema = z.object({
  categoryId: z.string().min(1, 'El categoryId es requerido'),
  name: z.string().min(1, 'El nombre del producto es requerido'),
  description: z.string().optional(),
  price: z.number().min(0, 'El precio debe ser mayor o igual a cero'),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().optional(),
  order: z.number().int().optional(),
});

const updateProductSchema = createProductSchema.partial();

const setAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export class MenuController {
  // --- CATEGORÍAS ---

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.params.branchId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = createCategorySchema.parse(req.body);

      const category = await menuService.createCategory(branchId, userId, userRole, input);
      res.status(201).json({ category });
    } catch (error) {
      next(error);
    }
  };

  getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.params.branchId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const categories = await menuService.getCategories(branchId, userId, userRole);
      res.json({ categories });
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryId = req.params.categoryId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = updateCategorySchema.parse(req.body);

      const category = await menuService.updateCategory(categoryId, userId, userRole, input);
      res.json({ category });
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryId = req.params.categoryId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const result = await menuService.deleteCategory(categoryId, userId, userRole);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // --- PRODUCTOS ---

  createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.params.branchId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = createProductSchema.parse(req.body);

      const product = await menuService.createProduct(branchId, userId, userRole, input);
      res.status(201).json({ product });
    } catch (error) {
      next(error);
    }
  };

  getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.params.branchId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const categoryId = req.query.categoryId as string | undefined;

      const products = await menuService.getProducts(branchId, userId, userRole, categoryId);
      res.json({ products });
    } catch (error) {
      next(error);
    }
  };

  getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productId = req.params.productId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const product = await menuService.getProductById(productId, userId, userRole);
      res.json({ product });
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productId = req.params.productId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const input = updateProductSchema.parse(req.body);

      const product = await menuService.updateProduct(productId, userId, userRole, input);
      res.json({ product });
    } catch (error) {
      next(error);
    }
  };

  setProductAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productId = req.params.productId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { isAvailable } = setAvailabilitySchema.parse(req.body);

      const product = await menuService.setProductAvailability(productId, userId, userRole, isAvailable);
      res.json({ product });
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productId = req.params.productId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const result = await menuService.deleteProduct(productId, userId, userRole);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const menuController = new MenuController();
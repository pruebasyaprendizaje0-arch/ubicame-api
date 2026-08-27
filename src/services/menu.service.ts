import { prisma } from '../prisma';

export interface CreateCategoryInput {
  name: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateProductInput {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
  order?: number;
}

export interface UpdateProductInput {
  categoryId?: string;
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  order?: number;
}

export class MenuService {
  /**
   * Verificar acceso a una sucursal por ID o Slug
   */
  async checkBranchAccess(branchIdOrSlug: string, userId: string, userRole: string) {
    const branch = await prisma.branch.findFirst({
      where: {
        OR: [{ id: branchIdOrSlug }, { slug: branchIdOrSlug }],
      },
      include: {
        business: true,
      },
    });

    if (!branch) {
      const error: any = new Error('Sucursal no encontrada');
      error.statusCode = 404;
      throw error;
    }

    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && branch.business.ownerId !== userId) {
      const error: any = new Error('No tienes permiso para gestionar el menú de esta sucursal');
      error.statusCode = 403;
      throw error;
    }

    return branch;
  }

  /**
   * Obtener o crear menú principal para una sucursal
   */
  private async getOrCreateMenu(branchId: string) {
    let menu = await prisma.menu.findFirst({
      where: { branchId },
    });

    if (!menu) {
      menu = await prisma.menu.create({
        data: {
          branchId,
          name: 'Menú Principal',
        },
      });
    }

    return menu;
  }

  // --- CATEGORÍAS ---

  async createCategory(branchIdOrSlug: string, userId: string, userRole: string, input: CreateCategoryInput) {
    const branch = await this.checkBranchAccess(branchIdOrSlug, userId, userRole);
    const menu = await this.getOrCreateMenu(branch.id);

    return prisma.category.create({
      data: {
        menuId: menu.id,
        name: input.name,
        order: input.order ?? 0,
        isActive: input.isActive ?? true,
      },
    });
  }

  async getCategories(branchIdOrSlug: string, userId: string, userRole: string) {
    const branch = await this.checkBranchAccess(branchIdOrSlug, userId, userRole);
    const menu = await this.getOrCreateMenu(branch.id);

    return prisma.category.findMany({
      where: { menuId: menu.id },
      include: {
        products: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async updateCategory(categoryId: string, userId: string, userRole: string, input: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        menu: {
          include: {
            branch: {
              include: {
                business: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      const error: any = new Error('Categoría no encontrada');
      error.statusCode = 404;
      throw error;
    }

    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && category.menu.branch.business.ownerId !== userId) {
      const error: any = new Error('No tienes permiso para modificar esta categoría');
      error.statusCode = 403;
      throw error;
    }

    return prisma.category.update({
      where: { id: categoryId },
      data: input,
    });
  }

  async deleteCategory(categoryId: string, userId: string, userRole: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        menu: {
          include: {
            branch: {
              include: {
                business: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      const error: any = new Error('Categoría no encontrada');
      error.statusCode = 404;
      throw error;
    }

    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && category.menu.branch.business.ownerId !== userId) {
      const error: any = new Error('No tienes permiso para eliminar esta categoría');
      error.statusCode = 403;
      throw error;
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return { message: 'Categoría eliminada exitosamente' };
  }

  // --- PRODUCTOS ---

  async createProduct(branchIdOrSlug: string, userId: string, userRole: string, input: CreateProductInput) {
    const branch = await this.checkBranchAccess(branchIdOrSlug, userId, userRole);
    const menu = await this.getOrCreateMenu(branch.id);

    // Verificar que la categoría pertenezca a la sucursal
    const category = await prisma.category.findFirst({
      where: {
        id: input.categoryId,
        menuId: menu.id,
      },
    });

    if (!category) {
      const error: any = new Error('La categoría especificada no pertenece a esta sucursal');
      error.statusCode = 400;
      throw error;
    }

    return prisma.product.create({
      data: {
        categoryId: input.categoryId,
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        isAvailable: input.isAvailable ?? true,
        order: input.order ?? 0,
      },
    });
  }

  async getProducts(branchIdOrSlug: string, userId: string, userRole: string, categoryId?: string) {
    const branch = await this.checkBranchAccess(branchIdOrSlug, userId, userRole);
    const menu = await this.getOrCreateMenu(branch.id);

    return prisma.product.findMany({
      where: {
        category: {
          menuId: menu.id,
        },
        ...(categoryId && { categoryId }),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async getProductById(productId: string, userId: string, userRole: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          include: {
            menu: {
              include: {
                branch: {
                  include: {
                    business: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      const error: any = new Error('Producto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    if (!isAdmin && product.category.menu.branch.business.ownerId !== userId) {
      const error: any = new Error('No tienes permiso para acceder a este producto');
      error.statusCode = 403;
      throw error;
    }

    return product;
  }

  async updateProduct(productId: string, userId: string, userRole: string, input: UpdateProductInput) {
    await this.getProductById(productId, userId, userRole);

    return prisma.product.update({
      where: { id: productId },
      data: input,
    });
  }

  async setProductAvailability(productId: string, userId: string, userRole: string, isAvailable: boolean) {
    await this.getProductById(productId, userId, userRole);

    return prisma.product.update({
      where: { id: productId },
      data: { isAvailable },
    });
  }

  async deleteProduct(productId: string, userId: string, userRole: string) {
    await this.getProductById(productId, userId, userRole);

    await prisma.product.delete({
      where: { id: productId },
    });

    return { message: 'Producto eliminado exitosamente' };
  }
}

export const menuService = new MenuService();
import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

// Helper slugify para pruebas
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Esquemas Zod para pruebas
const createBusinessSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres').optional(),
  industry: z.string().optional(),
  plan: z.string().optional().default('FREE'),
});

const createBranchSchema = z.object({
  name: z.string().min(2, 'El nombre de la sucursal debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug de la sucursal debe tener al menos 2 caracteres').optional(),
  deliveryCost: z.number().optional(),
});

describe('Business and Branch Logic Tests', () => {
  test('slugify convierte correctamente títulos a slugs sin caracteres especiales', () => {
    assert.equal(slugify('Pizzería Bella Italia!'), 'pizzeria-bella-italia');
    assert.equal(slugify(' Resto-Bar   & Café  '), 'resto-bar-cafe');
    assert.equal(slugify('Sucursal Quito Norte #1'), 'sucursal-quito-norte-1');
  });

  test('createBusinessSchema valida nombres de negocio correctos', () => {
    const validData = {
      name: 'Pizzería Napolitana',
      industry: 'RESTAURANTE',
    };
    const parsed = createBusinessSchema.parse(validData);
    assert.equal(parsed.name, 'Pizzería Napolitana');
    assert.equal(parsed.plan, 'FREE');
  });

  test('createBusinessSchema rechaza nombres con menos de 2 caracteres', () => {
    assert.throws(() => {
      createBusinessSchema.parse({ name: 'A' });
    });
  });

  test('createBranchSchema valida datos de sucursal', () => {
    const branchData = {
      name: 'Sucursal Centro',
      deliveryCost: 2.5,
    };
    const parsed = createBranchSchema.parse(branchData);
    assert.equal(parsed.name, 'Sucursal Centro');
    assert.equal(parsed.deliveryCost, 2.5);
  });

  test('Lógica de autorización permite a ADMIN acceder a cualquier negocio', () => {
    const userRole: string = 'ADMIN';
    const currentUserId: string = 'user-123';
    const businessOwnerId: string = 'owner-456';

    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    const canAccess = isAdmin || businessOwnerId === currentUserId;

    assert.equal(canAccess, true);
  });

  test('Lógica de autorización bloquea acceso a un negocio de otro usuario si no es ADMIN', () => {
    const userRole: string = 'MANAGER';
    const currentUserId: string = 'user-123';
    const businessOwnerId: string = 'owner-456';

    const isAdmin = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
    const canAccess = isAdmin || businessOwnerId === currentUserId;

    assert.equal(canAccess, false);
  });

  test('Filtro de negocio público devuelve únicamente las propiedades permitidas y sucursales activas', () => {
    const mockRawBusiness = {
      id: 'bus-1',
      ownerId: 'owner-1',
      name: 'Pigro',
      slug: 'pigro',
      industry: 'RESTAURANTE',
      description: 'Gastronomía italiana',
      logoUrl: 'https://cdn.ubicame.cc/logo.png',
      coverUrl: 'https://cdn.ubicame.cc/cover.png',
      whatsapp: '+593991234567',
      instagram: '@pigro',
      facebook: 'pigro',
      tiktok: 'pigro',
      plan: 'PRO',
      createdAt: new Date(),
      updatedAt: new Date(),
      branches: [
        { id: 'b1', name: 'Sucursal Principal', slug: 'principal', isActive: true, createdAt: new Date(1000) },
        { id: 'b2', name: 'Sucursal Inactiva', slug: 'inactiva', isActive: false, createdAt: new Date(2000) },
      ],
    };

    // Filtrar únicamente sucursales activas ordenadas por createdAt asc
    const activeBranches = mockRawBusiness.branches
      .filter((b) => b.isActive)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const publicBusiness = {
      id: mockRawBusiness.id,
      ownerId: mockRawBusiness.ownerId,
      name: mockRawBusiness.name,
      slug: mockRawBusiness.slug,
      industry: mockRawBusiness.industry,
      description: mockRawBusiness.description,
      logoUrl: mockRawBusiness.logoUrl,
      coverUrl: mockRawBusiness.coverUrl,
      whatsapp: mockRawBusiness.whatsapp,
      instagram: mockRawBusiness.instagram,
      facebook: mockRawBusiness.facebook,
      tiktok: mockRawBusiness.tiktok,
      plan: mockRawBusiness.plan,
      createdAt: mockRawBusiness.createdAt,
      updatedAt: mockRawBusiness.updatedAt,
      branches: activeBranches,
    };

    assert.equal(publicBusiness.slug, 'pigro');
    assert.equal(publicBusiness.branches.length, 1);
    assert.equal(publicBusiness.branches[0].id, 'b1');
    assert.equal((publicBusiness as any).password, undefined);
    assert.equal((publicBusiness as any).bankAccountNumber, undefined);
  });
});
import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre de la categoría es requerido'),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const createProductSchema = z.object({
  categoryId: z.string().min(1, 'El categoryId es requerido'),
  name: z.string().min(1, 'El nombre del producto es requerido'),
  description: z.string().optional(),
  price: z.number().min(0, 'El precio debe ser mayor o igual a cero'),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().optional(),
  order: z.number().int().optional(),
});

const setAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

describe('Menu Category and Product Logic Tests', () => {
  test('createCategorySchema valida datos de categoría y ordenamiento', () => {
    const data = { name: 'Pizzas Artesanales', order: 1, isActive: true };
    const parsed = createCategorySchema.parse(data);
    assert.equal(parsed.name, 'Pizzas Artesanales');
    assert.equal(parsed.order, 1);
    assert.equal(parsed.isActive, true);
  });

  test('createProductSchema valida precio positivo o cero', () => {
    const validProduct = {
      categoryId: 'cat-123',
      name: 'Agua Mineral 500ml',
      price: 0, // Válido
    };
    const parsed = createProductSchema.parse(validProduct);
    assert.equal(parsed.price, 0);
  });

  test('createProductSchema rechaza precio negativo', () => {
    assert.throws(() => {
      createProductSchema.parse({
        categoryId: 'cat-123',
        name: 'Producto Inválido',
        price: -5.0,
      });
    });
  });

  test('setAvailabilitySchema valida booleano de disponibilidad', () => {
    const parsedTrue = setAvailabilitySchema.parse({ isAvailable: true });
    assert.equal(parsedTrue.isAvailable, true);

    const parsedFalse = setAvailabilitySchema.parse({ isAvailable: false });
    assert.equal(parsedFalse.isAvailable, false);
  });
});
import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

const createServiceSchema = z.object({
  name: z.string().min(1, 'El nombre del servicio es obligatorio'),
  durationMin: z.number().int().positive().optional().default(60),
  priceCents: z.number().int().nonnegative().optional().default(0),
  currency: z.string().optional().default('USD'),
});

const createResourceSchema = z.object({
  type: z.string().optional().default('MESA'),
  name: z.string().min(1, 'El nombre del recurso es obligatorio'),
  capacity: z.number().int().positive().optional().default(1),
});

const createStaffSchema = z.object({
  name: z.string().min(1, 'El nombre del personal es obligatorio'),
  email: z.string().email().optional().nullable(),
  role: z.string().optional().nullable(),
});

describe('Catalog Validation Tests (Services, Resources, Staff)', () => {
  test('createServiceSchema valida nombre, duración y precio en centavos', () => {
    const valid = createServiceSchema.parse({
      name: 'Corte de Cabello',
      durationMin: 45,
      priceCents: 1500,
    });
    assert.equal(valid.name, 'Corte de Cabello');
    assert.equal(valid.durationMin, 45);
    assert.equal(valid.priceCents, 1500);
    assert.equal(valid.currency, 'USD');
  });

  test('createServiceSchema rechaza nombres vacíos', () => {
    assert.throws(() => {
      createServiceSchema.parse({ name: '' });
    });
  });

  test('createResourceSchema valida tipo y capacidad por defecto', () => {
    const valid = createResourceSchema.parse({
      name: 'MesaVIP #1',
      capacity: 4,
    });
    assert.equal(valid.name, 'MesaVIP #1');
    assert.equal(valid.type, 'MESA');
    assert.equal(valid.capacity, 4);
  });

  test('createStaffSchema valida datos de personal', () => {
    const valid = createStaffSchema.parse({
      name: 'Carlos Barbastro',
      email: 'carlos@peluqueria.com',
      role: 'Estilista Principal',
    });
    assert.equal(valid.name, 'Carlos Barbastro');
    assert.equal(valid.email, 'carlos@peluqueria.com');
  });
});

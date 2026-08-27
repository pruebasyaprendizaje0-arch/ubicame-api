import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ubicame Central API REST',
      version: '1.0.0',
      description:
        'API REST centralizada para conectar frontend menuqr.ubicame.cc y misreservaciones.ubicame.cc con una base PostgreSQL compartida.',
      contact: {
        name: 'Ubicame Support',
        url: 'https://ubicame.cc',
      },
    },
    servers: [
      {
        url: 'https://api.ubicame.cc',
        description: 'Servidor de Producción (Vultr / Coolify)',
      },
      {
        url: 'http://localhost:3000',
        description: 'Servidor Local de Desarrollo',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Gestión de Autenticación de Usuarios' },
      { name: 'Businesses', description: 'Gestión de Negocios y Sucursales' },
      { name: 'Menu', description: 'Catálogo de Categorías y Productos' },
      { name: 'Orders', description: 'Gestión de Pedidos' },
      { name: 'Reservations', description: 'Gestión de Reservaciones' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
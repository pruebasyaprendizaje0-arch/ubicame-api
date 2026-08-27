import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import businessRoutes from './routes/business.routes';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';
import reservationRoutes from './routes/reservation.routes';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './swagger';

const app: Express = express();

// Security middleware
app.use(helmet());

// Configuración de Orígenes CORS Permitidos
const defaultAllowedOrigins = [
  'https://api.ubicame.cc',
  'https://menuqr.ubicame.cc',
  'https://misreservaciones.ubicame.cc',
  'http://localhost:3000',
  'http://localhost:5173',
];

const envCorsString = process.env.CORS_ORIGINS || process.env.CORS_ALLOWED_ORIGINS;
const parsedEnvOrigins = envCorsString
  ? envCorsString.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = Array.from(
  new Set([...defaultAllowedOrigins, ...parsedEnvOrigins])
);

console.log('[CORS Config] Lista de orígenes permitidos:', allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir solicitudes sin header Origin (como curl, Postman o llamadas servidor a servidor)
      // y solicitudes cuyo origen coincida exactamente con la lista autorizada
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS Rechazado] Intentó conectarse desde origen no autorizado: ${origin}`);
        const corsError: any = new Error(`Origen ${origin} no permitido por política CORS`);
        corsError.statusCode = 403;
        corsError.name = 'CorsForbiddenError';
        callback(corsError);
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs-json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/', healthRoutes);
app.use('/v1/auth', authRoutes);
app.use('/v1/businesses', businessRoutes);
app.use('/v1/branches', menuRoutes);
app.use('/v1', orderRoutes);
app.use('/v1', reservationRoutes);

// Central error handler
app.use(errorHandler);

export default app;
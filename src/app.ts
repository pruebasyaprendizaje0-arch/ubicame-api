import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';
import reservationRoutes from './routes/reservation.routes';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './swagger';

const app: Express = express();

// Security and middleware
app.use(helmet());

const defaultAllowedOrigins = [
  'https://menuqr.ubicame.cc',
  'https://misreservaciones.ubicame.cc',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : defaultAllowedOrigins;

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origen ${origin} no permitido por política CORS`));
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
app.use('/v1/branches', menuRoutes);
app.use('/v1', orderRoutes);
app.use('/v1', reservationRoutes);

// Central error handler
app.use(errorHandler);

export default app;
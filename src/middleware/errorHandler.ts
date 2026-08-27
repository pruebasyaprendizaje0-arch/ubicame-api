import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Manejo de errores CORS -> HTTP 403 Forbidden
  if (
    err?.name === 'CorsForbiddenError' ||
    err?.statusCode === 403 ||
    (typeof err?.message === 'string' && err.message.includes('política CORS'))
  ) {
    res.status(403).json({
      error: 'Forbidden',
      message: err.message || 'Origen no permitido por política CORS',
    });
    return;
  }

  console.error('[Error Handler]', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Los datos proporcionados son inválidos',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
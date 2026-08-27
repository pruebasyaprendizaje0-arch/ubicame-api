import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRÍTICO: La variable de entorno JWT_SECRET es obligatoria en producción');
    }
    return 'dev-secret-key-change-in-production-12345';
  }
  return secret.trim();
};

/**
 * Middleware para exigir y verificar autenticación mediante JWT Bearer Token.
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[Auth Middleware Diagnostic]: Header Authorization ausente o no empieza con "Bearer "');
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token de autenticación no proporcionado',
    });
    return;
  }

  // Extraer token y limpiar comillas/espacios adicionales
  let token = authHeader.split(' ')[1];
  if (token) {
    token = token.trim().replace(/^["']|["']$/g, '');
  }

  if (!token) {
    console.warn('[Auth Middleware Diagnostic]: Token extraído está vacío');
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token de autenticación no proporcionado',
    });
    return;
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err: any) {
    const secret = getJwtSecret();

    // Log técnico seguro sin exponer secretos ni tokens completos
    console.error('[Auth Middleware JWT Verification Error]:', {
      algorithmUsed: 'HS256',
      isJwtSecretConfigured: !!process.env.JWT_SECRET,
      secretLength: secret.length,
      tokenLength: token.length,
      tokenPreview: `${token.substring(0, 10)}...${token.substring(token.length - 6)}`,
      serverCurrentTime: new Date().toISOString(),
      errorName: err?.name || 'Error',
      errorMessage: err?.message || String(err),
      ...(err?.expiredAt && { expiredAt: err.expiredAt }),
    });

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido o expirado',
    });
  }
};

// Alias para compatibilidad con código existente
export const authenticateJWT = requireAuth;
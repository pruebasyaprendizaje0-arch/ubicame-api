import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Ubicame Central API corriendo en http://${HOST}:${PORT}`);
  console.log(`📚 Documentación Swagger disponible en http://${HOST}:${PORT}/docs`);
});
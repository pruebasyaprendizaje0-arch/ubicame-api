# Ubicame Central REST API (`ubicame-api`)

API REST centralizada desarrollada en **Node.js**, **TypeScript**, **Express**, **Prisma ORM**, **Zod**, **Helmet**, **CORS** y **Swagger**.

Conecta los frontends:
- `menuqr.ubicame.cc` (Pedidos y Menú Digital QR)
- `misreservaciones.ubicame.cc` (Gestión de Reservaciones Multi-tenant)

*(Actualmente no incluye `ubicame.info`)*

---

## 🛠️ Tecnologías y Arquitectura

- **Runtime**: Node.js v20+
- **Lenguaje**: TypeScript
- **Framework Web**: Express.js
- **ORM**: Prisma Client v6
- **Base de Datos**: PostgreSQL (Compartida)
- **Validación de esquemas**: Zod
- **Seguridad**: Helmet, CORS restringido, JWT Auth
- **Documentación OpenAPI**: Swagger UI (`/docs`)
- **Contenedores**: Docker & Docker Compose

---

## 🚀 Inicio Rápido (Desarrollo Local)

### 1. Requisitos Previos
- Node.js >= 20.x
- Docker Desktop y Docker Compose (opcional para PostgreSQL local)

### 2. Instalación de Dependencias
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```

### 4. Iniciar Base de Datos Local (Docker)
```bash
docker-compose up -d postgres
```

### 5. Generar Cliente Prisma
```bash
npm run prisma:generate
```

### 6. Ejecutar en Modo Desarrollo
```bash
npm run dev
```

La API estará disponible en `http://localhost:3000`.
La documentación interactiva Swagger estará en `http://localhost:3000/docs`.

---

## 📑 Endpoints de la API

### Sistema & Salud
- `GET /health` - Chequeo de salud del servicio (status, uptime, timestamp).
- `GET /health/db` - Chequeo de conexión real a PostgreSQL mediante `DATABASE_URL` (retorna `{ "status": "ok", "database": "connected" }` o HTTP 503 sin exponer secretos).

### Autenticación
- `POST /v1/auth/login` - Iniciar sesión de usuario (devuelve JWT).
- `GET /v1/auth/me` - Perfil de usuario autenticado.

### Menú (MenuQR)
- `GET /v1/branches/:branchId/menu` - Obtener menú completo de una sucursal (categorías y productos).

### Pedidos (MenuQR)
- `POST /v1/branches/:branchId/orders` - Crear un nuevo pedido.
- `GET /v1/branches/:branchId/orders` - Listar pedidos de la sucursal.
- `PATCH /v1/orders/:orderId/status` - Actualizar estado del pedido (`PENDING`, `PREPARING`, `IN_TRANSIT`, `DELIVERED`, `COMPLETED`, `CANCELLED`).

### Reservaciones (MisReservaciones)
- `GET /v1/branches/:branchId/reservations` - Listar reservaciones de la sucursal.
- `POST /v1/branches/:branchId/reservations` - Crear una nueva reservación.
- `PATCH /v1/reservations/:reservationId/status` - Actualizar estado de reservación (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).

---

## 🐳 Guía Paso a Paso para Despliegue en Coolify (Vultr)

### 1. Crear la Base de Datos PostgreSQL en Coolify
1. En tu panel de Coolify, haz clic en **+ New Resource** -> **PostgreSQL**.
2. Asigna un nombre al recurso (e.g. `ubicame-postgres`).
3. Define el nombre de la base de datos como **`ubicame_core`**, el usuario (`ubicame_user`) y la contraseña.
4. Obtén la cadena de conexión interna que provee Coolify:
   `postgresql://ubicame_user:TU_CONTRASEÑA@postgres-internal-host:5432/ubicame_core?schema=public`

### 2. Crear la Aplicación `ubicame-api` en Coolify
1. En Coolify, haz clic en **+ New Resource** -> **Private / Public Repository**.
2. Conecta la URL de tu repositorio Git donde está alojado `ubicame-api`.
3. Coolify detectará automáticamente el archivo **`Dockerfile`**.
4. En la sección **Ports Exposed**, configura el puerto `3000`.
5. En la sección **Healthcheck Path**, ingresa `/health/db`.

### 3. Configurar Variables de Entorno en Coolify
Agrega las siguientes variables en la pestaña **Environment Variables** de la aplicación:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://ubicame_user:TU_CONTRASEÑA@postgres-internal-host:5432/ubicame_core?schema=public
JWT_SECRET=generar_clave_secreta_aleatoria_y_segura
JWT_EXPIRES_IN=7d
CORS_ALLOWED_ORIGINS=https://menuqr.ubicame.cc,https://misreservaciones.ubicame.cc
```

### 4. Desplegar y Ejecutar Migraciones Iniciales
1. Haz clic en **Deploy**.
2. Una vez desplegado, puedes abrir la terminal en Coolify para el contenedor de `ubicame-api` y ejecutar las migraciones iniciales de Prisma:
   ```bash
   npx prisma migrate deploy
   ```
3. Verifica el endpoint de salud e integración con PostgreSQL ingresando a `https://api.ubicame.cc/health/db`.
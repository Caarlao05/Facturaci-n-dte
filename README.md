# 🏢 Quantis Facturación DTE - SaaS Platform

Este proyecto es una plataforma **SaaS (Software as a Service) Multi-Tenant** diseñada para la emisión, recepción y gestión de **Documentos Tributarios Electrónicos (DTE)** según el estándar del Ministerio de Hacienda de El Salvador. 

El sistema permite administrar múltiples empresas (Tenants) desde un único panel maestro, aislando la información financiera y las credenciales de facturación de cada una de forma segura.

---

## 🚀 Características Principales

1. **Arquitectura Multi-Tenant:** Una base de datos centralizada (`MySQL`) con un identificador único por empresa (`tenantId`), permitiendo que miles de empresas facturen concurrentemente sin cruzar datos.
2. **Super Administrador:** Panel maestro para dar de alta clientes, asignar límites de facturas mensuales y recargar cuotas. Permite la **impersonación** (entrar como si fueras el cliente para dar soporte técnico).
3. **Firmador Local y Transmisión:** El sistema se encarga de firmar los JSON nativos (usando la llave privada y el certificado `.crt`/`.pem` de cada empresa) y enviarlos a las APIs de Hacienda.
4. **Catálogo de Clientes y Productos:** Cada empresa administra su propio inventario y base de clientes recurrentes.
5. **Generador PDF Profesional:** Diseños limpios y dinámicos creados con `PDFKit` a partir del JSON validado por Hacienda, incluyendo Código de Generación y Sello de Recepción.

---

## 🛠️ Stack Tecnológico

**Backend (API & Lógica de Negocio):**
- **Node.js + Express**: Servidor rápido y estructurado bajo los principios de Arquitectura Limpia (Clean Architecture) y Domain-Driven Design (DDD).
- **TypeScript**: Tipado estricto para evitar errores en producción y tener esquemas seguros.
- **Prisma ORM**: Modelado y migración de la base de datos relacional.
- **MySQL**: Base de datos principal.

**Frontend (Interfaz de Usuario "Nexxo"):**
- **React.js + Vite**: Construcción ultra rápida y reactiva.
- **TypeScript**: Interfaces seguras y compartidas con el backend.
- **Zustand / Context API**: Manejo de estado global ligero.
- **Axios**: Peticiones HTTP con interceptores automáticos para inyectar el `X-Tenant-Id` y el `Token JWT`.

---

## 📂 Arquitectura de Carpetas (Monorepo)

```text
quantis-dte/
├── backend/                  # Servidor API y Lógica Tributaria
│   ├── prisma/               # Esquema de base de datos relacional (schema.prisma)
│   ├── src/
│   │   ├── application/      # Casos de uso (Orquestadores de DTE, Auth, Tenants)
│   │   ├── domain/           # Modelos puros, Esquemas JSON estrictos de Hacienda
│   │   ├── infrastructure/   # Conectores externos (Hacienda API, Firmador, PDF)
│   │   └── presentation/     # Endpoints de Express (Controladores REST)
├── nexxo/                    # Aplicación Web Frontend
│   ├── src/
│   │   ├── components/       # Componentes visuales reutilizables (Botones, Tablas, Modales)
│   │   ├── pages/            # Vistas principales (Dashboard, Nueva Factura, Ajustes)
│   │   └── services/         # Adaptadores para conectar con el backend
├── Dockerfile                # Receta maestra para despliegues inquebrantables en la Nube
└── package.json              # Orquestador del Monorepo
```

---

## 🐳 Despliegue en Producción (Cloud)

El proyecto está diseñado para funcionar en un único contenedor **Docker** (unificando Backend y Frontend). En el paso final de construcción, Express empaqueta los archivos estáticos de Vite y los sirve como una sola aplicación, evitando problemas de CORS en producción.

**Plataformas compatibles:** `Render.com`, `Railway.app`, `Fly.io` o cualquier VPS con Docker.

1. **Variables de Entorno (Requeridas en Producción):**
   - `DATABASE_URL` (Ej: `mysql://usuario:password@host:3306/dte`)
   - `JWT_SECRET` (Una cadena aleatoria para cifrar tokens)
   - `NODE_ENV` (Configurado en `production`)

2. **Ejecución Local con Docker:**
   ```bash
   docker build -t quantis-dte .
   docker run -p 3000:3000 --env-file .env quantis-dte
   ```

---

## 🔑 Primeros Pasos (Arranque)

Cuando el servidor detecta que es su primer arranque y la base de datos está en blanco (vía `npx prisma db push`), automáticamente crea las credenciales del **Súper Administrador**.

Puedes iniciar sesión con:
- **Correo:** `admin@nexxo.com`
- **Contraseña:** `Admin2026!`

Desde ahí, dirígete al **Panel Master** para crear tu primera empresa (Tenant), cargar sus certificados de prueba de Hacienda y comenzar a facturar.

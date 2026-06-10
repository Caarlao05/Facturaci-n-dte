# 🏢 Facturación DTE - SaaS Architecture (DDD)

Este proyecto está estructurado utilizando los principios de **Arquitectura Limpia (Clean Architecture)** y **Diseño Orientado al Dominio (Domain-Driven Design - DDD)** para asegurar escalabilidad, mantenibilidad y robustez en la integración con el Ministerio de Hacienda.

## 📂 Estructura Global del Proyecto

```text
facturacion-dte/
├── backend/                # Entorno de Servicios API (Node.js + TS + Prisma)
├── nexxo/                  # Aplicación Cliente Frontend (React + Vite)
├── docker-compose.yml      # Orquestación de infraestructura local (DB)
├── ecosystem.config.js     # Configuración global de procesos en producción (PM2)
├── .gitignore              # Exclusiones globales de control de versiones
└── README.md               # Este archivo
```

---

## 🛠️ Backend: Arquitectura por Capas (DDD)

El backend (`backend/src/`) está dividido en capas con estrictas reglas de dependencia (de afuera hacia adentro).

```text
backend/src/
├── config/                 # Configuraciones globales del sistema
│   ├── database.ts         # Cliente e inicialización de Prisma ORM
│   └── env.ts              # Variables de entorno
├── domain/                 # Capa del Dominio (Reglas de negocio puras)
│   ├── dte/                # Entidades, tipos y esquemas JSON del estándar DTE
│   └── shared/             # Errores comunes y tipos compartidos
├── application/            # Capa de Aplicación (Casos de uso / Orquestadores)
│   ├── dte/                # Flujos de facturación (Emitir, Anular, PDF)
│   └── tenant/             # Gestión de multi-tenant y autenticación
├── infrastructure/         # Capa de Infraestructura (Adaptadores externos)
│   ├── hacienda/           # Cliente HTTP del Ministerio de Hacienda
│   ├── security/           # Firmador de documentos y criptografía
│   ├── pdf/                # Generación de representaciones gráficas
│   └── email/              # Servicios de mensajería (SMTP)
└── presentation/           # Capa de Presentación (Controladores de entrada)
    ├── api/                # Controladores REST y Servidor Express (server.ts)
    └── middlewares/        # Interceptores (Auth, Tenant, Validadores)
```

**Scripts Principales (Backend):**
- `npm run dev` : Inicia el servidor de desarrollo (`nodemon + ts-node`).
- `npm run build` : Transpila TypeScript a la carpeta `dist/`.
- `npm start` : Inicia el servidor en producción.

---

## 🎨 Frontend: Organización por Dominio (Nexxo)

El frontend (`nexxo/src/`) está estructurado para maximizar la reutilización de componentes y la claridad en la navegación.

```text
nexxo/src/
├── assets/                 # Recursos estáticos locales (Logos, imágenes)
├── components/             # Elementos UI
│   ├── common/             # Elementos transversales (Layout, modales, botones)
│   └── dte/                # Componentes específicos de facturación (Selectores, ítems)
├── context/                # Estados globales de React
│   ├── AuthContext.tsx     # Estado de autenticación
│   └── TenantContext.tsx   # Empresa activa en el SaaS
├── hooks/                  # Ganchos personalizados
│   ├── useDteCalculator.ts # Lógicas de subtotales, IVA y retenciones
│   └── useFetch.ts         # Abstracción de peticiones HTTP
├── pages/                  # Vistas de pantalla completa (Mapeadas a rutas)
│   ├── dashboard/          # Métricas y resúmenes
│   ├── billing/            # Emisión de DTEs y Carga Masiva
│   └── ...                 # Auth, Configuración, SuperAdmin, Reportes
├── services/               # Adaptadores HTTP (Clientes de API)
│   ├── api.ts              # Instancia de Axios/Fetch con interceptores
│   └── dteService.ts       # Peticiones específicas de DTE
└── utils/                  # Funciones utilitarias (Monedas, fechas, NIT/NRC)
```

**Scripts Principales (Nexxo):**
- `npm run dev` : Inicia el entorno de desarrollo Vite.
- `npm run build` : Construye el bundle para producción.

---

## 🚀 Despliegue a Producción

El archivo `ecosystem.config.js` está preparado para levantar tanto el frontend (servido estáticamente o vía web server) como el backend usando **PM2**.

1. Compila ambas aplicaciones (`npm run build` en backend y nexxo).
2. Configura tus variables de entorno (`.env`).
3. Ejecuta `pm2 start ecosystem.config.js`.

import express from 'express';
import cors from 'cors';
import { createInvoice } from './controllers/billing.controller';
import { loginController } from './controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { createInitialUser } from '../../application/tenant/auth.service';
import { getDteDashboard, invalidateInvoice, processBatchDte, processBatchSingle } from './controllers/dte.controller';
import { emitSaaSDte } from './controllers/b2b.controller';
import { getSettings, updateSettings, uploadLogo, uploadCertificate } from './controllers/settings.controller';
import { getSalesReport, getPurchasesReport } from './controllers/reports.controller';
import { getAllTenants, createTenant, getAllUsers, updateTenant, deleteTenant, rechargeQuota, impersonateTenant, getGlobalAnalytics } from './controllers/superadmin.controller';
import { getCustomers, createCustomer, getProducts, createProduct } from './controllers/catalog.controller';
import { getPurchases, importPurchase } from './controllers/purchases.controller';
import { requireApiKey } from '../middlewares/apiKey.middleware';
import multer from 'multer';

import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configuración de Multer para logos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/logos'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Servir archivos estáticos (PDFs locales generados)
// El __dirname es backend/src, entonces '../temp' es backend/temp
app.use('/temp', express.static(path.join(__dirname, '../temp')));

// Routes
app.post('/api/auth/login', loginController);
app.post('/api/invoices', requireAuth, createInvoice);
app.get('/api/invoices/:id/pdf', requireAuth, require('./controllers/dte.controller').downloadInvoicePdf);
app.get('/api/invoices/:id/json', requireAuth, require('./controllers/dte.controller').downloadInvoiceJson);
app.get('/api/settings', requireAuth, getSettings);
app.post('/api/settings', requireAuth, updateSettings);
app.post('/api/settings/logo', requireAuth, upload.single('logo'), uploadLogo);
app.post('/api/settings/cert', requireAuth, upload.single('certFile'), uploadCertificate);

app.get('/api/superadmin/tenants', requireAuth, getAllTenants);
app.post('/api/superadmin/tenants', requireAuth, createTenant);
app.put('/api/superadmin/tenants/:id', requireAuth, updateTenant);
app.delete('/api/superadmin/tenants/:id', requireAuth, deleteTenant);
app.post('/api/superadmin/tenants/:id/recharge', requireAuth, rechargeQuota);
app.post('/api/superadmin/tenants/:id/impersonate', requireAuth, impersonateTenant);
app.get('/api/superadmin/users', requireAuth, getAllUsers);
app.get('/api/superadmin/analytics', requireAuth, getGlobalAnalytics);

// Catálogos (Clientes y Productos)
import { validate } from '../middlewares/validate.middleware';
import { createCustomerSchema, createProductSchema } from '../../domain/dte/schemas/catalog.schema';

app.get('/api/customers', requireAuth, getCustomers);
app.post('/api/customers', requireAuth, validate(createCustomerSchema), createCustomer);
app.get('/api/products', requireAuth, getProducts);
app.post('/api/products', requireAuth, validate(createProductSchema), createProduct);

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Rutas ERP - Gestión DTE (Fase 6)
app.get('/api/dte', getDteDashboard);
app.post('/api/dte/:id/invalidate', requireAuth, invalidateInvoice);
app.post('/api/dte/batch', processBatchDte);
app.post('/api/dte/batch-single', requireAuth, require('./controllers/dte.controller').processBatchSingle);

// Dashboard
app.get('/api/dashboard', requireAuth, require('./controllers/dashboard.controller').getDashboardData);

// Rutas B2B SaaS Pública (Fase 8)
app.post('/api/v1/dte/emit', requireApiKey, emitSaaSDte);

// Compras DTE (Buzón Tributario)
app.get('/api/purchases', requireAuth, getPurchases);
app.post('/api/purchases/import', requireAuth, upload.single('json'), importPurchase);

// Reportes (Libros de IVA)
app.get('/api/reports/sales', requireAuth, getSalesReport);
app.get('/api/reports/purchases', requireAuth, getPurchasesReport);

// ==========================================
// UNIFICACIÓN: Servir Frontend (Nexxo)
// ==========================================
// Servimos la carpeta dist de Nexxo
app.use(express.static(path.join(__dirname, '../../nexxo/dist')));

// Ruta comodín (Catch-all) para que React Router maneje las URLs del navegador
app.use((req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, '../../nexxo/dist') });
});

app.listen(Number(port), '0.0.0.0', async () => {
  console.log(`🚀 Facturación DTE Backend corriendo en http://0.0.0.0:${port}`);
  try {
    await createInitialUser();
  } catch (error) {
    console.error("⚠️ Error conectando a la BD al iniciar el servidor:", error);
  }
});

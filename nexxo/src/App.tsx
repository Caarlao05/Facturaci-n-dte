import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import DashboardView from './features/dashboard/DashboardView';
import NewInvoiceView from './features/billing/NewInvoiceView';
import BulkUploadView from './features/billing/BulkUploadView';
import SettingsView from './features/settings/SettingsView';
import SuperAdminView from './features/superadmin/SuperAdminView';
import PurchasesView from './features/purchases/PurchasesView';
import CustomersView from './features/customers/CustomersView';
import ProductsView from './features/products/ProductsView';
import ReportsView from './features/reports/ReportsView';
import LoginView from './features/auth/LoginView';
import LogoutModal from './components/ui/LogoutModal';
import { GlobalHelpButton } from './components/ui/HelpCenterModal';
import { Bell, Zap, ZapOff } from 'lucide-react';
import './App.css';

const ProtectedLayout = () => {
  const [user, setUser] = useState<any>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(() => {
    return localStorage.getItem('perf-mode') === 'true';
  });

  useEffect(() => {
    if (performanceMode) {
      document.body.classList.add('perf-mode');
    } else {
      document.body.classList.remove('perf-mode');
    }
    localStorage.setItem('perf-mode', performanceMode.toString());
  }, [performanceMode]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser || typeof parsedUser !== 'object') {
          throw new Error('Invalid user data');
        }
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing stored user data, clearing storage...', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }

    // Interceptor para inyectar X-Tenant-Id basado en el usuario actual o subdominio
    const reqInterceptor = axios.interceptors.request.use((config) => {
      // Determinación de tenantId: LocalStorage (Fallback local) o por Subdominio en prod
      let tenantId = null;
      try {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        tenantId = localUser.tenantId;
      } catch (e) {}

      // Lógica de subdominio (Si estamos en tenant.nexxodte.com, extraemos "tenant")
      const host = window.location.hostname;
      const parts = host.split('.');
      if (parts.length >= 3 && parts[0] !== 'www') {
        // En producción real, resolveríamos el subdominio a un UUID
        // tenantId = resolverSubdominio(parts[0]) 
      }

      if (tenantId) {
        config.headers['X-Tenant-Id'] = tenantId;
      }
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  if (!user) {
    return null; // o un loader
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="app-container">
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>
      <Sidebar role={user?.role} onLogout={() => setIsLogoutModalOpen(true)} />
      <main className="main-content">
        <header className="top-header">
          <div className="header-title">
            <h1 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Quantis Billing</h1>
          </div>
          <div className="header-right">
            <button 
              onClick={() => setPerformanceMode(!performanceMode)} 
              className={`perf-toggle-btn ${performanceMode ? 'active' : ''}`}
              title={performanceMode ? "Desactivar Modo Rendimiento (Efectos Visuales)" : "Activar Modo Rendimiento (Optimizar Velocidad)"}
            >
              {performanceMode ? <Zap size={15} /> : <ZapOff size={15} />}
              <span>{performanceMode ? 'Rendimiento' : 'Efectos'}</span>
            </button>
            <Bell size={16} color="var(--text-secondary)" style={{marginRight: '8px', cursor: 'pointer'}} />
            <div className="user-profile" style={{cursor: 'pointer'}} onClick={() => setIsLogoutModalOpen(true)}>
              <div className="user-info" style={{textAlign: 'right'}}>
                <span className="user-name">{user?.name || 'Usuario'}</span>
              </div>
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=333&color=fff&size=28`} alt="Avatar" className="avatar" />
            </div>
          </div>
        </header>
        <div className="content-scroll">
          <Routes>
            <Route path="/" element={user?.role === 'SUPERADMIN' ? <Navigate to="/superadmin" replace /> : <DashboardView />} />
            <Route path="/superadmin" element={user?.role === 'SUPERADMIN' ? <SuperAdminView /> : <Navigate to="/" replace />} />
            <Route path="/nueva-factura" element={<NewInvoiceView />} />
            <Route path="/carga-masiva" element={<BulkUploadView />} />
            <Route path="/compras" element={<PurchasesView />} />
            <Route path="/clientes" element={<CustomersView />} />
            <Route path="/productos" element={<ProductsView />} />
            <Route path="/reportes" element={<ReportsView />} />
            <Route path="/configuracion" element={<SettingsView />} />
          </Routes>
        </div>
      </main>

      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={handleLogout} 
      />
      <GlobalHelpButton />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

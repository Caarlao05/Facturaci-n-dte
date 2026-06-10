import React from 'react';
import { Home, FileText, ShoppingCart, Users, Package, FileBarChart, Settings, LogOut, UploadCloud, Activity } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  role?: string;
  onLogout?: () => void;
}

const Sidebar = ({ role, onLogout }: SidebarProps) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/logo.png" alt="Quantis Logo" className="logo-img" />
          <span className="logo-text">QUANTIS</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {role === 'SUPERADMIN' ? (
          <ul className="nav-list">
            <li className="nav-section-title">Administración SaaS</li>
            <li className="nav-item">
              <NavLink to="/superadmin" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                <Activity size={18} />
                <span>Panel SaaS Global</span>
              </NavLink>
            </li>
          </ul>
        ) : (
          <>
            <div className="nav-section">
              <div className="nav-section-title">General</div>
              <ul className="nav-list">
                <li className="nav-item">
                  <NavLink to="/" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} end>
                    <Home size={18} />
                    <span>Dashboard</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/reportes" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                    <FileBarChart size={18} />
                    <span>Reportes DTE</span>
                  </NavLink>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <div className="nav-section-title">Operaciones</div>
              <ul className="nav-list">
                <li className="nav-item">
                  <NavLink to="/nueva-factura" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                    <FileText size={18} />
                    <span>Nueva Factura</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/carga-masiva" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                    <UploadCloud size={18} />
                    <span>Carga Masiva</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/compras" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                    <ShoppingCart size={18} />
                    <span>Compras (DTE)</span>
                  </NavLink>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <div className="nav-section-title">Catálogos</div>
              <ul className="nav-list">
                <li className="nav-item">
                  <NavLink to="/clientes" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                    <Users size={18} />
                    <span>Clientes</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/productos" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                    <Package size={18} />
                    <span>Productos</span>
                  </NavLink>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <div className="nav-section-title">Ajustes</div>
              <ul className="nav-list">
                <li className="nav-item">
                  <NavLink to="/configuracion" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                    <Settings size={18} />
                    <span>Configuración</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {onLogout && (
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

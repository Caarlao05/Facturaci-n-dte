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
        <div className="logo-container" style={{ width: '100%', justifyContent: 'center', padding: '10px 0' }}>
          <img src="/logo.png" alt="Nexxus Logo" style={{ height: '50px', maxWidth: '100%', objectFit: 'contain' }} />
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {role === 'SUPERADMIN' ? (
            <li className="nav-item">
              <NavLink to="/superadmin" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                <Activity size={20} />
                <span>Panel SaaS Global</span>
              </NavLink>
            </li>
          ) : (
            <>
              <li className="nav-item">
                <NavLink to="/" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} end>
                  <Home size={20} />
                  <span>Dashboard</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/nueva-factura" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                  <FileText size={20} />
                  <span>Nueva Factura</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/carga-masiva" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                  <UploadCloud size={20} />
                  <span>Carga Masiva</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/compras" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                  <ShoppingCart size={20} />
                  <span>Compras (DTE)</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/clientes" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                  <Users size={20} />
                  <span>Clientes</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/productos" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                  <Package size={20} />
                  <span>Productos</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/reportes" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                  <FileBarChart size={20} />
                  <span>Reportes DTE</span>
                </NavLink>
              </li>
            </>
          )}
          
          {role !== 'SUPERADMIN' && (
            <li className="nav-item" style={{ marginTop: '1rem' }}>
              <NavLink to="/configuracion" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                <Settings size={20} />
                <span>Configuración</span>
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {onLogout && (
          <button className="nav-link logout-btn" onClick={onLogout} style={{color: '#ef4444', fontWeight: 600}}>
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;


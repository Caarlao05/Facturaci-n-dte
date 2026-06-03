import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Server, FileText, CheckCircle, Loader2, Plus, X } from 'lucide-react';
import './SuperAdminView.css';

const SuperAdminView = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    nit: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:3000/api/superadmin/tenants', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setTenants(data.data);
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post('http://localhost:3000/api/superadmin/tenants', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setIsModalOpen(false);
        setFormData({ businessName: '', nit: '', adminName: '', adminEmail: '', adminPassword: '' });
        fetchTenants(); // Refrescar la lista
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear la empresa');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{display: 'flex', justifyContent: 'center', marginTop: '4rem'}}><Loader2 className="spinner" size={32} /></div>;
  }

  return (
    <div className="superadmin-view">
      <div className="view-header">
        <div>
          <h2>Panel Global SaaS (Super Admin)</h2>
          <p style={{color: '#64748b', marginTop: '0.25rem'}}>Gestiona todas las empresas conectadas a tu infraestructura de Facturación Electrónica.</p>
        </div>
        <button className="antigravity-button primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Registrar Nueva Empresa</span>
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card glass-panel">
          <div className="metric-icon" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6'}}>
            <Building size={24} />
          </div>
          <div>
            <p>Empresas Activas</p>
            <h3>{tenants.length}</h3>
          </div>
        </div>
        <div className="metric-card glass-panel">
          <div className="metric-icon" style={{background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E'}}>
            <FileText size={24} />
          </div>
          <div>
            <p>Facturas Globales</p>
            <h3>{tenants.reduce((acc, t) => acc + t.totalInvoices, 0)}</h3>
          </div>
        </div>
        <div className="metric-card glass-panel">
          <div className="metric-icon" style={{background: 'rgba(168, 85, 247, 0.1)', color: '#A855F7'}}>
            <Users size={24} />
          </div>
          <div>
            <p>Usuarios Creados</p>
            <h3>{tenants.reduce((acc, t) => acc + t.totalUsers, 0)}</h3>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{marginTop: '2rem'}}>
        <h3 style={{marginBottom: '1rem'}}>Directorio de Empresas (Tenants)</h3>
        <table className="antigravity-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Empresa (NIT)</th>
              <th>Ambiente</th>
              <th>Usuarios</th>
              <th>DTEs Emitidos</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id}>
                <td>
                  {t.logoUrl ? (
                    <img src={`http://localhost:3000${t.logoUrl}`} alt="Logo" style={{width: '32px', height: '32px', borderRadius: '4px', objectFit: 'contain'}} />
                  ) : (
                    <div style={{width: '32px', height: '32px', borderRadius: '4px', background: '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px'}}>N/A</div>
                  )}
                </td>
                <td>
                  <div style={{fontWeight: 500}}>{t.businessName}</div>
                  <div style={{fontSize: '0.8rem', color: '#64748b'}}>{t.nit}</div>
                </td>
                <td>
                  <span className={`status-badge ${t.environment === '00' ? 'warning' : 'success'}`}>
                    {t.environment === '00' ? 'Pruebas' : 'Producción'}
                  </span>
                </td>
                <td>{t.totalUsers}</td>
                <td>{t.totalInvoices}</td>
                <td><span className="status-badge success">Activo</span></td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={6} style={{textAlign: 'center', padding: '2rem'}}>No hay empresas registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Glassmorphism para Crear Empresa */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel bounce-in" style={{maxWidth: '500px'}}>
            <div className="modal-header">
              <h3 style={{color: 'var(--text-primary, #ffffff)'}}>Registrar Nueva Empresa Cliente</h3>
              <button className="close-button" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem'}}>
              
              <div className="form-group">
                <label>Nombre Comercial de la Empresa</label>
                <input required type="text" name="businessName" className="antigravity-input" placeholder="Ej. TechCorp S.A. de C.V." value={formData.businessName} onChange={handleInputChange} />
              </div>
              
              <div className="form-group">
                <label>NIT (Número de Identificación Tributaria)</label>
                <input required type="text" name="nit" className="antigravity-input" placeholder="Ej. 0614-010190-101-1" value={formData.nit} onChange={handleInputChange} />
              </div>

              <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '1rem 0'}} />
              <h4 style={{fontSize: '1rem', color: 'var(--text-primary, #ffffff)'}}>Datos del Administrador del Cliente</h4>

              <div className="form-group">
                <label>Nombre del Administrador</label>
                <input required type="text" name="adminName" className="antigravity-input" placeholder="Ej. Juan Pérez" value={formData.adminName} onChange={handleInputChange} />
              </div>
              
              <div className="form-group">
                <label>Correo Electrónico (Login)</label>
                <input required type="email" name="adminEmail" className="antigravity-input" placeholder="admin@techcorp.com" value={formData.adminEmail} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label>Contraseña Inicial</label>
                <input required type="password" name="adminPassword" className="antigravity-input" placeholder="••••••••" value={formData.adminPassword} onChange={handleInputChange} />
              </div>

              <div className="modal-actions" style={{marginTop: '1.5rem', justifyContent: 'flex-end', display: 'flex', gap: '1rem'}}>
                <button type="button" className="antigravity-button secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="antigravity-button primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={18} className="spinner" /> : 'Crear Cuenta y Entorno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Mock Building Icon
const Building = ({size}: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
);

export default SuperAdminView;

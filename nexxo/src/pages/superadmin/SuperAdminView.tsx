import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Server, FileText, CheckCircle, Loader2, Plus, X, Edit, Trash2, Shield, Zap, TrendingUp, Eye, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import './SuperAdminView.css';

const SuperAdminView = () => {
  const [activeTab, setActiveTab] = useState<'tenants'|'users'>('tenants');
  const [tenants, setTenants] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(100);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    nit: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  const [editData, setEditData] = useState({
    businessName: '',
    environment: '00'
  });

  useEffect(() => {
    fetchTenants();
    fetchUsers();
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:3000/api/superadmin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) setChartData(data.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:3000/api/superadmin/tenants', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) setTenants(data.data);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:3000/api/superadmin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) setUsersList(data.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
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
        fetchTenants();
        fetchUsers();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ocurrió un error al registrar el nuevo inquilino corporativo. Verifica los datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (t: any) => {
    setSelectedTenant(t);
    setEditData({ businessName: t.businessName, environment: t.environment });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (t: any) => {
    setSelectedTenant(t);
    setIsDeleteModalOpen(true);
  };

  const openRechargeModal = (t: any) => {
    setSelectedTenant(t);
    setRechargeAmount(100);
    setIsRechargeModalOpen(true);
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(`http://localhost:3000/api/superadmin/tenants/${selectedTenant.id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setIsEditModalOpen(false);
        fetchTenants();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'No fue posible guardar los cambios en el perfil de la empresa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTenant = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.delete(`http://localhost:3000/api/superadmin/tenants/${selectedTenant.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setIsDeleteModalOpen(false);
        fetchTenants();
        fetchUsers();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fallo al procesar la solicitud de eliminación o suspensión de cuenta.');
    } finally {
      setIsDeleteModalOpen(false);
      setIsSubmitting(false);
    }
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`http://localhost:3000/api/superadmin/tenants/${selectedTenant.id}/recharge`, { amount: Number(rechargeAmount) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setIsRechargeModalOpen(false);
        fetchTenants();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'La asignación de paquetes DTE no pudo completarse.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImpersonate = async (t: any) => {
    if (!window.confirm(`Estás a punto de acceder al entorno operativo de ${t.businessName} mediante suplantación de identidad (Impersonation) para brindar soporte. Todas las acciones quedarán registradas. ¿Deseas continuar?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`http://localhost:3000/api/superadmin/tenants/${t.id}/impersonate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        // Reemplazar la sesión actual
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Redirigir al dashboard
        window.location.href = '/';
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Acceso denegado. No fue posible iniciar la sesión de soporte remoto.');
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
          <p style={{color: '#64748b', marginTop: '0.25rem'}}>Gestiona todas las empresas y usuarios de tu infraestructura.</p>
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
            <p>Usuarios Registrados</p>
            <h3>{usersList.length}</h3>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{marginTop: '1.5rem', height: '300px'}}>
        <h3 style={{marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><TrendingUp size={18} color="#3b82f6"/> Emisión Global (Últimos 30 días)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
            <Line type="monotone" dataKey="Facturas" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
            <CartesianGrid stroke="#334155" strokeDasharray="5 5" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickMargin={10} minTickGap={20} />
            <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickMargin={10} allowDecimals={false} />
            <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff'}} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="superadmin-tabs">
        <button className={`tab-button ${activeTab === 'tenants' ? 'active' : ''}`} onClick={() => setActiveTab('tenants')}>
          <Building size={18} />
          Empresas (Tenants)
        </button>
        <button className={`tab-button ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={18} />
          Usuarios Globales
        </button>
      </div>

      {activeTab === 'tenants' && (
        <div className="glass-panel" style={{marginTop: '1.5rem'}}>
          <h3 style={{marginBottom: '1rem'}}>Directorio de Empresas</h3>
          <table className="antigravity-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Empresa (NIT)</th>
                <th>Ambiente</th>
                <th>Estado MH</th>
                <th>Saldo DTEs</th>
                <th>Emitidas</th>
                <th style={{textAlign: 'right'}}>Acciones</th>
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
                  <td>
                    {t.isMHReady ? (
                      <span className="status-badge success" style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
                        <CheckCircle size={14} /> Listo
                      </span>
                    ) : (
                      <span className="status-badge warning" style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
                        <AlertCircle size={14} /> Pendiente
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="status-badge" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
                      {t.balanceDtes} disp.
                    </span>
                  </td>
                  <td>{t.totalEmitted}</td>
                  <td style={{textAlign: 'right'}}>
                    <button className="action-btn" onClick={() => handleImpersonate(t)} title="Entrar como Cliente" style={{color: '#8b5cf6'}}>
                      <Eye size={16} />
                    </button>
                    <button className="action-btn" onClick={() => openRechargeModal(t)} title="Recargar DTEs" style={{color: '#eab308'}}>
                      <Zap size={16} />
                    </button>
                    <button className="action-btn edit" onClick={() => openEditModal(t)} title="Editar Empresa">
                      <Edit size={16} />
                    </button>
                    <button className="action-btn danger" onClick={() => openDeleteModal(t)} title="Eliminar Empresa">
                      <Trash2 size={16} />
                    </button>
                  </td>
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
      )}

      {activeTab === 'users' && (
        <div className="glass-panel" style={{marginTop: '1.5rem'}}>
          <h3 style={{marginBottom: '1rem'}}>Directorio Global de Usuarios</h3>
          <table className="antigravity-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo Electrónico</th>
                <th>Rol</th>
                <th>Empresa Asociada</th>
                <th>Fecha Registro</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(u => (
                <tr key={u.id}>
                  <td><div style={{fontWeight: 500}}>{u.name}</div></td>
                  <td><div style={{fontSize: '0.9rem', color: '#64748b'}}>{u.email}</div></td>
                  <td>
                    <span className={`status-badge ${u.role === 'SUPERADMIN' ? 'warning' : 'success'}`}>
                      {u.role === 'SUPERADMIN' ? <><Shield size={12} style={{marginRight: 4}}/> Super Admin</> : u.role}
                    </span>
                  </td>
                  <td>{u.tenantName}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {usersList.length === 0 && (
                <tr>
                  <td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>No hay usuarios registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel bounce-in" style={{maxWidth: '500px'}}>
            <div className="modal-header">
              <h3 style={{color: 'var(--text-primary, #ffffff)'}}>Registrar Nueva Empresa</h3>
              <button className="close-button" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem'}}>
              <div className="form-group">
                <label>Nombre Comercial</label>
                <input required type="text" name="businessName" className="antigravity-input" value={formData.businessName} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>NIT</label>
                <input required type="text" name="nit" className="antigravity-input" value={formData.nit} onChange={handleInputChange} />
              </div>
              <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '1rem 0'}} />
              <h4 style={{fontSize: '1rem', color: '#fff'}}>Administrador</h4>
              <div className="form-group">
                <label>Nombre</label>
                <input required type="text" name="adminName" className="antigravity-input" value={formData.adminName} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Correo</label>
                <input required type="email" name="adminEmail" className="antigravity-input" value={formData.adminEmail} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input required type="password" name="adminPassword" className="antigravity-input" value={formData.adminPassword} onChange={handleInputChange} />
              </div>
              <div className="modal-actions" style={{marginTop: '1.5rem', justifyContent: 'flex-end', display: 'flex', gap: '1rem'}}>
                <button type="button" className="antigravity-button secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="antigravity-button primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={18} className="spinner" /> : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel bounce-in" style={{maxWidth: '400px'}}>
            <div className="modal-header">
              <h3 style={{color: '#fff'}}>Editar Empresa</h3>
              <button className="close-button" onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateTenant} style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem'}}>
              <div className="form-group">
                <label>Nombre Comercial</label>
                <input required type="text" name="businessName" className="antigravity-input" value={editData.businessName} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Ambiente de Operación</label>
                <select name="environment" className="antigravity-input" value={editData.environment} onChange={handleEditChange}>
                  <option value="00">Pruebas (00)</option>
                  <option value="01">Producción (01)</option>
                </select>
              </div>
              <div className="modal-actions" style={{marginTop: '1.5rem', justifyContent: 'flex-end', display: 'flex', gap: '1rem'}}>
                <button type="button" className="antigravity-button secondary" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                <button type="submit" className="antigravity-button primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={18} className="spinner" /> : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel bounce-in" style={{maxWidth: '400px', textAlign: 'center'}}>
            <div style={{color: '#ef4444', marginBottom: '1rem'}}><Trash2 size={48} style={{margin: '0 auto'}}/></div>
            <h3 style={{color: '#fff', marginBottom: '1rem'}}>¿Eliminar Empresa?</h3>
            <p style={{color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem'}}>
              Estás a punto de eliminar <strong>{selectedTenant?.businessName}</strong>. Esta acción eliminará permanentemente todos sus usuarios y configuraciones.
              No se podrá eliminar si ya existen facturas o clientes asociados a esta empresa.
            </p>
            <div className="modal-actions" style={{justifyContent: 'center', display: 'flex', gap: '1rem'}}>
              <button type="button" className="antigravity-button secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
              <button type="button" className="antigravity-button" style={{background: '#ef4444', color: '#fff'}} disabled={isSubmitting} onClick={handleDeleteTenant}>
                {isSubmitting ? <Loader2 size={18} className="spinner" /> : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRechargeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel bounce-in" style={{maxWidth: '400px'}}>
            <div className="modal-header">
              <h3 style={{color: '#fff'}}><Zap size={18} style={{verticalAlign: 'text-bottom', marginRight: '6px', color: '#eab308'}} /> Recargar DTEs</h3>
              <button className="close-button" onClick={() => setIsRechargeModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleRecharge} style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem'}}>
              <p style={{color: '#94a3b8', fontSize: '0.9rem'}}>
                Añadir facturas al saldo disponible de <strong>{selectedTenant?.businessName}</strong>. 
                Actualmente tienen {selectedTenant?.balanceDtes} DTEs.
              </p>
              <div className="form-group">
                <label>Cantidad de DTEs a agregar</label>
                <input required type="number" min="1" step="1" className="antigravity-input" value={rechargeAmount} onChange={(e) => setRechargeAmount(Number(e.target.value))} />
              </div>
              <div className="modal-actions" style={{marginTop: '1.5rem', justifyContent: 'flex-end', display: 'flex', gap: '1rem'}}>
                <button type="button" className="antigravity-button secondary" onClick={() => setIsRechargeModalOpen(false)}>Cancelar</button>
                <button type="submit" className="antigravity-button primary" style={{background: '#eab308', color: '#000'}} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={18} className="spinner" /> : 'Confirmar Recarga'}
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

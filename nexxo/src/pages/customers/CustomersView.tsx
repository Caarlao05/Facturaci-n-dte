import React, { useState, useEffect } from 'react';
import { Search, Plus, UserPlus, Users, Loader2 } from 'lucide-react';
import axios from 'axios';
import { EmptyState } from '../../components/common/EmptyState';

const CustomersView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    commercialName: '',
    nit: '',
    nrc: '',
    dui: '',
    email: '',
    phone: '',
    address: '',
    economicActivityCode: ''
  });

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/customers', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setFormData({
        name: '', commercialName: '', nit: '', nrc: '', dui: '', email: '', phone: '', address: '', economicActivityCode: ''
      });
      fetchCustomers();
    } catch (error: any) {
      console.error('Error creating customer:', error);
      const details = error.response?.data?.details;
      if (details && Array.isArray(details)) {
        alert('Error de validación:\n' + details.map((d: any) => `- ${d.message}`).join('\n'));
      } else {
        alert(error.response?.data?.error || 'Error al crear el cliente');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = (Array.isArray(customers) ? customers : []).filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nit?.includes(searchTerm) ||
    c.nrc?.includes(searchTerm) ||
    c.dui?.includes(searchTerm)
  );

  return (
    <div className="view-container">
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Directorio de Clientes</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Gestiona los receptores de tus DTEs</p>
        </div>
        <button className="azure-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}} />
          Nuevo Cliente
        </button>
      </div>

      <div className="azure-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '8px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por Nombre, NIT, NRC o DUI..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="azure-input"
              style={{ paddingLeft: '32px' }}
            />
          </div>
          <button className="azure-btn-secondary">
            Filtrar
          </button>
        </div>
      </div>

      <div className="azure-panel">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="spinner" size={32} color="var(--accent-blue)" />
          </div>
        ) : filteredCustomers.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Cliente</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Documento (NIT/DUI)</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>NRC</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Actividad Económica</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                    {customer.name}
                    {customer.commercialName && <div style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{customer.commercialName}</div>}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{customer.nit || customer.dui || '-'}</td>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{customer.nrc || '-'}</td>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{customer.economicActivityCode || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState 
            icon={Users} 
            title="Aún no tienes clientes" 
            description="El Directorio te permite guardar los datos de facturación (Nombre, NIT, NRC, Correo) de tus compradores frecuentes para emitir facturas más rápido." 
            actionLabel="Registrar mi primer cliente"
            onAction={() => setIsModalOpen(true)}
          />
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="azure-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Nuevo Cliente</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Razón Social o Nombre *</label>
                  <input type="text" name="name" required className="azure-input" value={formData.name} onChange={handleInputChange} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nombre Comercial</label>
                  <input type="text" name="commercialName" className="azure-input" value={formData.commercialName} onChange={handleInputChange} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Actividad Económica</label>
                  <input type="text" name="economicActivityCode" className="azure-input" value={formData.economicActivityCode} onChange={handleInputChange} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>NIT</label>
                  <input type="text" name="nit" className="azure-input" value={formData.nit} onChange={handleInputChange} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>NRC</label>
                  <input type="text" name="nrc" className="azure-input" value={formData.nrc} onChange={handleInputChange} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>DUI</label>
                  <input type="text" name="dui" className="azure-input" value={formData.dui} onChange={handleInputChange} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Teléfono</label>
                  <input type="text" name="phone" className="azure-input" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Correo Electrónico</label>
                  <input type="email" name="email" className="azure-input" value={formData.email} onChange={handleInputChange} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Dirección Completa</label>
                  <input type="text" name="address" className="azure-input" value={formData.address} onChange={handleInputChange} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="azure-btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="azure-btn" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="spinner" size={16} /> : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersView;

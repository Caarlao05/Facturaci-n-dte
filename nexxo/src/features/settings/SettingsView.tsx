import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Shield, Mail, Building, Loader2, CheckCircle } from 'lucide-react';
import './SettingsView.css';

const SettingsView = () => {
  const [activeTab, setActiveTab] = useState('mh');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    commercialName: '',
    economicActivity: '',
    phone: '',
    address: '',
    establecimiento: 'M001',
    puntoVenta: 'P001',
    nrc: '',
    email: '',
    primaryColor: '#0F172A',
    secondaryColor: '#D4AF37',
    mhNit: '',
    mhApiPassword: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    logoUrl: ''
  });

  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:3000/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success && data.data) {
        setFormData({
          companyName: data.data.companyName || '',
          commercialName: data.data.commercialName || '',
          economicActivity: data.data.economicActivity || '',
          phone: data.data.phone || '',
          address: data.data.address || '',
          establecimiento: data.data.establecimiento || 'M001',
          puntoVenta: data.data.puntoVenta || 'P001',
          nrc: data.data.nrc || '',
          email: data.data.email || '',
          primaryColor: data.data.primaryColor || '#0F172A',
          secondaryColor: data.data.secondaryColor || '#D4AF37',
          mhNit: data.data.mhNit || '',
          mhApiPassword: data.data.mhApiPassword || '',
          smtpHost: data.data.smtpHost || '',
          smtpPort: data.data.smtpPort || '',
          smtpUser: data.data.smtpUser || '',
          smtpPass: data.data.smtpPass || '',
          logoUrl: data.data.logoUrl || ''
        });
        if (data.data.logoUrl) {
          setLogoPreview(`http://localhost:3000${data.data.logoUrl}`);
        }
      }
    } catch (error) {
      console.error("Error loading settings", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      
      // Save settings text data
      await axios.put('http://localhost:3000/api/settings', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Save logo if selected
      if (selectedLogo) {
        const formDataLogo = new FormData();
        formDataLogo.append('logo', selectedLogo);
        await axios.post('http://localhost:3000/api/settings/logo', formDataLogo, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setSuccessMsg('Configuración guardada exitosamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error saving settings", error);
      alert("Hubo un error al guardar la configuración.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{display: 'flex', justifyContent: 'center', marginTop: '4rem'}}><Loader2 className="spinner" size={32} /></div>;
  }

  return (
    <div className="settings-view">
      <div className="view-header">
        <div>
          <h2>Configuración del Sistema</h2>
          <p style={{color: '#64748b', marginTop: '0.25rem'}}>Gestiona las llaves de seguridad, correos automáticos e identidad de la marca.</p>
        </div>
        <button className="antigravity-button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {successMsg && (
        <div className="alert-box success" style={{marginBottom: '1.5rem'}}>
          <CheckCircle size={20} className="alert-icon" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="settings-layout">
        <div className="settings-sidebar glass-panel">
          <ul className="settings-nav">
            <li className={activeTab === 'mh' ? 'active' : ''} onClick={() => setActiveTab('mh')}>
              <Shield size={18} /> Ministerio de Hacienda
            </li>
            <li className={activeTab === 'smtp' ? 'active' : ''} onClick={() => setActiveTab('smtp')}>
              <Mail size={18} /> Envío de Correos (SMTP)
            </li>
            <li className={activeTab === 'company' ? 'active' : ''} onClick={() => setActiveTab('company')}>
              <Building size={18} /> Identidad Empresarial
            </li>
          </ul>
        </div>

        <div className="settings-content glass-panel panel-section">
          
          {activeTab === 'mh' && (
            <div className="tab-pane">
              <h3>Credenciales de Transmisión DTE</h3>
              <p className="tab-desc">Ingresa los datos de autenticación provistos por el Ministerio de Hacienda para firmar y timbrar electrónicamente. Estos datos se almacenan encriptados.</p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="antigravity-label">NIT del Emisor</label>
                  <input type="text" name="mhNit" className="antigravity-input" placeholder="Ej. 0614-100424-101-5" value={formData.mhNit} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Contraseña API / Certificado (Token)</label>
                  <input type="password" name="mhApiPassword" className="antigravity-input" placeholder="••••••••" value={formData.mhApiPassword} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'smtp' && (
            <div className="tab-pane">
              <h3>Servidor de Correos (SMTP)</h3>
              <p className="tab-desc">Configura tu correo institucional (Ej. Office 365, Google Workspace) para que los clientes reciban los DTEs en PDF apenas se autoricen en el MH.</p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="antigravity-label">Servidor SMTP (Host)</label>
                  <input type="text" name="smtpHost" className="antigravity-input" placeholder="Ej. smtp.office365.com" value={formData.smtpHost} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Puerto</label>
                  <input type="number" name="smtpPort" className="antigravity-input" placeholder="Ej. 587" value={formData.smtpPort} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Usuario / Correo Emisor</label>
                  <input type="text" name="smtpUser" className="antigravity-input" placeholder="Ej. facturacion@tuempresa.com" value={formData.smtpUser} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Contraseña de Aplicación</label>
                  <input type="password" name="smtpPass" className="antigravity-input" placeholder="••••••••" value={formData.smtpPass} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="tab-pane">
              <h3>Identidad Visual de Facturas</h3>
              <p className="tab-desc">Controla cómo se ven los PDFs generados "World-Class". El motor de plantillas usará este color como acento principal.</p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="antigravity-label">Razón Social</label>
                  <input type="text" name="companyName" className="antigravity-input" placeholder="G&G SOLUTIONS..." value={formData.companyName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Nombre Comercial</label>
                  <input type="text" name="commercialName" className="antigravity-input" placeholder="G&G solutions" value={formData.commercialName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Actividad Económica</label>
                  <input type="text" name="economicActivity" className="antigravity-input" placeholder="CONSULTORÍAS Y GESTIÓN..." value={formData.economicActivity} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">NRC Comercial</label>
                  <input type="text" name="nrc" className="antigravity-input" placeholder="342043-9" value={formData.nrc} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Correo Electrónico (Contacto)</label>
                  <input type="email" name="email" className="antigravity-input" placeholder="correo@empresa.com" value={formData.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Teléfono de Contacto</label>
                  <input type="text" name="phone" className="antigravity-input" placeholder="2222-0000" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                  <label className="antigravity-label">Dirección Completa</label>
                  <input type="text" name="address" className="antigravity-input" placeholder="Calle, Polígono, Colonia, Municipio..." value={formData.address} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Casa Matriz/Sucursal</label>
                  <input type="text" name="establecimiento" className="antigravity-input" placeholder="M001" value={formData.establecimiento} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Punto de Venta</label>
                  <input type="text" name="puntoVenta" className="antigravity-input" placeholder="P001" value={formData.puntoVenta} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Color Principal (Bordes)</label>
                  <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                    <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleChange} style={{height: '42px', width: '50px', padding: '2px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--border-color)'}} />
                    <input type="text" name="primaryColor" className="antigravity-input" placeholder="#0b1121" value={formData.primaryColor} onChange={handleChange} style={{flex: 1}} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Color Secundario (Fondos)</label>
                  <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                    <input type="color" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} style={{height: '42px', width: '50px', padding: '2px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--border-color)'}} />
                    <input type="text" name="secondaryColor" className="antigravity-input" placeholder="#808080" value={formData.secondaryColor} onChange={handleChange} style={{flex: 1}} />
                  </div>
                </div>
                <div className="form-group" style={{gridColumn: '1 / -1', marginTop: '1rem'}}>
                  <label className="antigravity-label">Logotipo de la Empresa (PNG / JPG)</label>
                  <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    {logoPreview ? (
                      <div style={{width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                        <img src={logoPreview} alt="Logo" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
                      </div>
                    ) : (
                      <div style={{width: '60px', height: '60px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748b', fontSize: '0.8rem'}}>
                        Logo
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="antigravity-input" style={{padding: '0.4rem', flex: 1}} />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsView;

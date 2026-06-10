import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Shield, Mail, Building, Loader2, CheckCircle } from 'lucide-react';
import { Tooltip } from '../../components/ui/Tooltip';
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
    primaryColor: '#0078D4',
    secondaryColor: '#D4AF37',
    mhNit: '',
    mhApiPassword: '',
    mhCertPassword: '',
    environment: '00',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: ''
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [hasCert, setHasCert] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success && data.data) {
        const s = data.data;
        setFormData({
          companyName: s.companyName || '',
          commercialName: s.commercialName || '',
          economicActivity: s.economicActivity || '',
          phone: s.phone || '',
          address: s.address || '',
          establecimiento: s.establecimiento || 'M001',
          puntoVenta: s.puntoVenta || 'P001',
          nrc: s.nrc || '',
          email: s.email || '',
          primaryColor: s.primaryColor || '#0078D4',
          secondaryColor: s.secondaryColor || '#D4AF37',
          mhNit: s.mhNit || '',
          mhApiPassword: s.mhApiPassword || '',
          mhCertPassword: s.mhCertPassword || '',
          environment: s.environment || '00',
          smtpHost: s.smtpHost || '',
          smtpPort: s.smtpPort || '',
          smtpUser: s.smtpUser || '',
          smtpPass: s.smtpPass || ''
        });
        if (s.logoUrl) {
          setLogoPreview(s.logoUrl);
        }
        if (s.hasCert) {
          setHasCert(true);
        }
      }
    } catch (error) {
      console.error("Error loading settings", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      
      await axios.post('/api/settings', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (logoFile) {
        const formDataLogo = new FormData();
        formDataLogo.append('logo', logoFile);
        await axios.post('/api/settings/logo', formDataLogo, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      if (certFile) {
        const formDataCert = new FormData();
        formDataCert.append('certFile', certFile);
        await axios.post('/api/settings/cert', formDataCert, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setHasCert(true);
      }

      setSuccessMsg('Configuración guardada exitosamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error saving settings", error);
      alert(error.response?.data?.error || 'No se pudo guardar la configuración. Revisa los campos e inténtalo de nuevo.');
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
        <button className="antigravity-button" onClick={() => handleSave()} disabled={isSaving}>
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
              <h3 style={{ marginTop: '0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>Integración Ministerio de Hacienda (DTE)</h3>
              <p className="tab-desc">Ingresa los datos de autenticación provistos por el Ministerio de Hacienda para firmar y timbrar electrónicamente. Estos datos se almacenan encriptados.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>NIT del Emisor</label>
                  <input type="text" name="mhNit" className="antigravity-input" placeholder="Ej. 0614-010190-101-1" value={formData.mhNit} onChange={handleChange} />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    Contraseña de API (MH)
                    <Tooltip content="Clave generada en el portal del MH, sección API." size={14} />
                  </label>
                  <input type="password" name="mhApiPassword" className="antigravity-input" placeholder="********" value={formData.mhApiPassword} onChange={handleChange} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Entorno (Pruebas / Producción)</label>
                  <select name="environment" className="antigravity-input" value={formData.environment} onChange={handleChange}>
                    <option value="00">Ambiente de Pruebas (00)</option>
                    <option value="01">Ambiente de Producción (01)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    Contraseña del Certificado (.p12)
                    <Tooltip content="Contraseña asignada al descargar el certificado de firma." size={14} />
                  </label>
                  <input type="password" name="mhCertPassword" className="antigravity-input" placeholder="********" value={formData.mhCertPassword} onChange={handleChange} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    Certificado de Firma Criptográfica (.p12)
                    <Tooltip content="Sube el archivo PKCS#12 proporcionado por el MH." size={14} />
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="file" accept=".p12" onChange={(e) => { if (e.target.files && e.target.files[0]) setCertFile(e.target.files[0]); }} style={{ padding: '8px', border: '1px dashed var(--border-color)', borderRadius: '6px', width: '100%' }} />
                    {hasCert && <span style={{ color: 'var(--success)', whiteSpace: 'nowrap', fontSize: '14px' }}>✓ Certificado Activo</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Sube el archivo PKCS#12 proporcionado por el Ministerio de Hacienda para firmar los DTEs.</p>
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
                  <label className="antigravity-label">Razón Social <span style={{color: 'var(--danger-color)'}}>*</span></label>
                  <input type="text" name="companyName" className="antigravity-input" placeholder="Ej. Empresa Emisora S.A. de C.V." value={formData.companyName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">NIT del Emisor <span style={{color: 'var(--danger-color)'}}>*</span></label>
                  <input type="text" name="mhNit" className="antigravity-input" placeholder="Ej. 0614-010190-101-1" value={formData.mhNit} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Nombre Comercial</label>
                  <input type="text" name="commercialName" className="antigravity-input" placeholder="Ej. Nombre Comercial" value={formData.commercialName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Actividad Económica</label>
                  <input type="text" name="economicActivity" className="antigravity-input" placeholder="Ej. Venta de Productos y Servicios" value={formData.economicActivity} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">NRC Comercial</label>
                  <input type="text" name="nrc" className="antigravity-input" placeholder="Ej. 00000-0" value={formData.nrc} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Correo Electrónico (Contacto)</label>
                  <input type="email" name="email" className="antigravity-input" placeholder="Ej. info@empresa.com" value={formData.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Teléfono de Contacto</label>
                  <input type="text" name="phone" className="antigravity-input" placeholder="Ej. 2222-2222" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                  <label className="antigravity-label">Dirección Completa</label>
                  <input type="text" name="address" className="antigravity-input" placeholder="Ej. San Salvador, El Salvador" value={formData.address} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Casa Matriz/Sucursal</label>
                  <input type="text" name="establecimiento" className="antigravity-input" placeholder="Ej. M001" value={formData.establecimiento} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="antigravity-label">Punto de Venta</label>
                  <input type="text" name="puntoVenta" className="antigravity-input" placeholder="Ej. P001" value={formData.puntoVenta} onChange={handleChange} />
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

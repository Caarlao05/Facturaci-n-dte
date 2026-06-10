import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Send, Save, CheckCircle, FileText, Code, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Tooltip } from '../../components/common/Tooltip';
import './NewInvoiceView.css';

const NewInvoiceView = () => {
  const [dteType, setDteType] = useState('01'); // Por defecto '01' (Factura)
  const [customer, setCustomer] = useState({ 
    nit: '', dui: '', razonSocial: '', nombreComercial: '', nrc: '', actividadEconomica: '', email: '', telefono: '', direccion: '',
    docRelacionado: '', motivoContin: '',
    paisDestino: '', incoterm: ''
  });
  const [items, setItems] = useState([{ id: 1, desc: '', qty: 1, price: 0 }]);
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' o 'json' para el visualizador

  const [customersList, setCustomersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const [custRes, prodRes] = await Promise.all([
          axios.get('http://localhost:3000/api/customers', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:3000/api/products', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setCustomersList(custRes.data);
        setProductsList(prodRes.data);
      } catch (error) {
        console.error('Error fetching catalogs:', error);
      }
    };
    fetchCatalogs();
  }, []);

  const handleCustomerChange = (field: string, value: string) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectSavedCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      // Clear or leave as is?
      return;
    }
    const c = customersList.find(c => c.id === selectedId);
    if (c) {
      setCustomer(prev => ({
        ...prev,
        nit: c.nit || '',
        dui: c.dui || '',
        razonSocial: c.name || '',
        nombreComercial: c.commercialName || '',
        nrc: c.nrc || '',
        actividadEconomica: c.economicActivityCode || '',
        email: c.email || '',
        telefono: c.phone || '',
        direccion: c.address || ''
      }));
    }
  };

  const handleSaveDraft = () => {
    // Lógica simulada de guardar borrador
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000); // Ocultar mensaje de guardado en 3s
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), desc: '', qty: 1, price: 0 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const calculateSubtotal = (qty: number, price: number) => {
    return (qty * price).toFixed(2);
  };

  const handlePriceChange = (id: number, value: string) => {
    const parsed = parseFloat(value);
    setItems(items.map(item => item.id === id ? { ...item, price: isNaN(parsed) ? 0 : parsed } : item));
  };

  const handleDescChange = (id: number, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, desc: value } : item));
  };

  const handleProductSelect = (id: number, productId: string) => {
    const p = productsList.find(prod => prod.id === productId);
    if (p) {
      setItems(items.map(item => item.id === id ? { ...item, desc: p.description, price: Number(p.unitPrice) } : item));
    }
  };

  const handleQtyChange = (id: number, value: string) => {
    const parsed = parseInt(value, 10);
    setItems(items.map(item => item.id === id ? { ...item, qty: isNaN(parsed) ? 1 : parsed } : item));
  };

  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.price), 0);
  // Lógica de cálculo según el tipo de DTE
  const iva = dteType === '14' ? 0 : subtotal * 0.13;
  const renta = dteType === '14' ? subtotal * 0.10 : 0;
  // Para FCF (01), los precios ingresados YA incluyen IVA teóricamente, o en el JSON no se separan de la misma forma para el cliente,
  // pero para no complicar el formulario base, mostraremos IVA sumado en 03 y 05, etc.
  const total = subtotal + iva - renta;

  const handleTransmit = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessData(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/api/invoices', {
        customer,
        items,
        dteType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessData({ ...response.data.invoice, jsonPayload: response.data.invoice.jsonPayload });
      setItems([{ id: Date.now(), desc: '', qty: 1, price: 0 }]);
      setCustomer({ nit: '', razonSocial: '', nombreComercial: '', nrc: '', actividadEconomica: '', email: '', telefono: '', direccion: '' });
      setDraftSaved(false);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.response?.data?.error || "Error de conexión con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="invoice-view">
      <div className="view-header">
        <h2>Crear Nuevo Cobro</h2>
        <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select 
              className="antigravity-input" 
              style={{ width: 'auto', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}
            value={dteType}
            onChange={(e) => setDteType(e.target.value)}
            disabled={isLoading}
          >
            <option value="01">Factura (01)</option>
            <option value="03">Comprobante de Crédito Fiscal (03)</option>
            <option value="04">Nota de Remisión (04)</option>
            <option value="05">Nota de Crédito (05)</option>
            <option value="06">Nota de Débito (06)</option>
            <option value="11">Factura de Exportación (11)</option>
            <option value="14">Factura de Sujeto Excluido (14)</option>
            <option value="15">Comprobante de Donación (15)</option>
          </select>
          <Tooltip content="Selecciona el tipo de documento. Ej: Factura (01) para consumidor final, CCF (03) para contribuyentes con NRC." />
          </div>
          <button className="antigravity-button secondary" onClick={handleSaveDraft} disabled={isLoading}>
            <Save size={18} />
            Guardar Borrador
          </button>
          <button 
            className="antigravity-button" 
            onClick={handleTransmit}
            disabled={isLoading || total <= 0}
          >
            {isLoading ? <Loader2 className="spinner" size={18} /> : <Send size={18} />}
            {isLoading ? "Transmitiendo al MH..." : "Transmitir al MH"}
          </button>
        </div>
      </div>

      {draftSaved && (
        <div className="alert-box success glass-panel" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <CheckCircle className="alert-icon" size={20} />
          <div className="alert-content">
            <p style={{ margin: 0 }}><strong>Borrador Guardado:</strong> La factura se ha guardado correctamente y puedes continuarla después.</p>
          </div>
        </div>
      )}

      {successData && (
        <div className="alert-box success glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircle className="alert-icon" size={24} />
              <div className="alert-content" style={{ flex: 1, marginLeft: '1rem' }}>
                <h4>¡Documento Transmitido con Éxito!</h4>
                <p><strong>Sello de Recepción (MH):</strong> {successData.receptionStamp}</p>
                <p><strong>Código de Generación:</strong> {successData.generationCode}</p>
              </div>
            </div>
            <button 
              onClick={() => setSuccessData(null)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ✕
            </button>
          </div>

          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button 
                className={`antigravity-button ${activeTab === 'pdf' ? '' : 'secondary'}`} 
                onClick={() => setActiveTab('pdf')}
                style={activeTab === 'pdf' ? { backgroundColor: 'var(--gold-primary)', color: 'var(--bg-primary)' } : {}}
              >
                <FileText size={18} /> Visualizador PDF
              </button>
              <button 
                className={`antigravity-button ${activeTab === 'json' ? '' : 'secondary'}`} 
                onClick={() => setActiveTab('json')}
                style={activeTab === 'json' ? { backgroundColor: 'var(--gold-primary)', color: 'var(--bg-primary)' } : {}}
              >
                <Code size={18} /> Estructura JSON
              </button>
            </div>

            {activeTab === 'pdf' && successData.pdfBlobUrl && (
              <div style={{ width: '100%', height: '600px', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                <iframe src={successData.pdfBlobUrl} width="100%" height="100%" style={{ border: 'none' }} title="Visor PDF" />
              </div>
            )}

            {activeTab === 'json' && successData.jsonPayload && (
              <div style={{ width: '100%', maxHeight: '600px', overflowY: 'auto', background: '#1e1e1e', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <pre style={{ margin: 0, color: '#d4af37', fontFamily: 'monospace', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(successData.jsonPayload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="alert-box error glass-panel">
          <AlertCircle className="alert-icon" size={24} />
          <div className="alert-content">
            <h4>Error de Transmisión</h4>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="invoice-grid">
        <div className="glass-panel panel-section">
          <h3>{dteType === '14' ? 'Datos del Sujeto Excluido' : 'Datos del Cliente'}</h3>
          
          {customersList.length > 0 && (
            <div className="form-group" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <label className="antigravity-label" style={{ color: 'var(--gold-primary)' }}>Cargar Cliente del Directorio</label>
              <select className="antigravity-input" onChange={handleSelectSavedCustomer} defaultValue="">
                <option value="" disabled>Seleccione un cliente guardado...</option>
                {customersList.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.nit ? `(NIT: ${c.nit})` : c.dui ? `(DUI: ${c.dui})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-grid">
            {dteType === '14' ? (
              <div className="form-group">
                <label className="antigravity-label">
                  DUI <span style={{color: 'var(--danger-color)'}}>*</span>
                  <Tooltip content="El DUI es obligatorio para Factura de Sujeto Excluido para aplicar la retención de Renta del 10%." size={14} />
                </label>
                <input type="text" className="antigravity-input" placeholder="00000000-0" disabled={isLoading} value={customer.dui} onChange={(e) => handleCustomerChange('dui', e.target.value)} />
              </div>
            ) : (
              <div className="form-group">
                <label className="antigravity-label">NIT / Documento</label>
                <input type="text" className="antigravity-input" placeholder="0000-000000-000-0" disabled={isLoading} value={customer.nit} onChange={(e) => handleCustomerChange('nit', e.target.value)} />
              </div>
            )}
            
            <div className="form-group">
              <label className="antigravity-label">
                {dteType === '14' ? 'Nombre del Sujeto' : 'Razón Social'} <span style={{color: 'var(--danger-color)'}}>*</span>
              </label>
              <input type="text" className="antigravity-input" placeholder={dteType === '14' ? "Nombre completo" : "Nombre de la empresa"} disabled={isLoading} value={customer.razonSocial} onChange={(e) => handleCustomerChange('razonSocial', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="antigravity-label">Nombre Comercial</label>
              <input type="text" className="antigravity-input" placeholder="Ej. Nombre Comercial del Cliente" disabled={isLoading} value={customer.nombreComercial || ''} onChange={(e) => handleCustomerChange('nombreComercial', e.target.value)} />
            </div>
            
            {['03', '05', '06'].includes(dteType) && (
              <div className="form-group">
                <label className="antigravity-label">
                  NRC <span style={{color: 'var(--danger-color)'}}>*</span>
                  <Tooltip content="Número de Registro de Contribuyente (ej: 123456-7). Es obligatorio para CCF." size={14} />
                </label>
                <input type="text" className="antigravity-input" placeholder="Número de Registro" disabled={isLoading} value={customer.nrc} onChange={(e) => handleCustomerChange('nrc', e.target.value)} />
              </div>
            )}
            
            <div className="form-group">
              <label className="antigravity-label">Actividad Económica</label>
              <input type="text" className="antigravity-input" placeholder="Código o Actividad" disabled={isLoading} value={customer.actividadEconomica} onChange={(e) => handleCustomerChange('actividadEconomica', e.target.value)} />
            </div>
            
            <div className="form-group">
              <label className="antigravity-label">Correo Electrónico</label>
              <input type="email" className="antigravity-input" placeholder="correo@cliente.com" disabled={isLoading} value={customer.email} onChange={(e) => handleCustomerChange('email', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="antigravity-label">Teléfono</label>
              <input type="text" className="antigravity-input" placeholder="2222-0000" disabled={isLoading} value={customer.telefono || ''} onChange={(e) => handleCustomerChange('telefono', e.target.value)} />
            </div>

            <div className="form-group" style={{gridColumn: '1 / -1'}}>
              <label className="antigravity-label">Dirección Completa</label>
              <input type="text" className="antigravity-input" placeholder="Calle, Polígono, Municipio, Departamento" disabled={isLoading} value={customer.direccion || ''} onChange={(e) => handleCustomerChange('direccion', e.target.value)} />
            </div>
          </div>
        </div>

        {dteType === '11' && (
          <div className="glass-panel panel-section" style={{ marginTop: '1rem' }}>
            <h3>Datos de Exportación</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="antigravity-label">País de Destino (Código ISO, Ej: USA) <span style={{color: 'var(--danger-color)'}}>*</span></label>
                <input type="text" className="antigravity-input" placeholder="Ej. HND, GTM, USA" disabled={isLoading} value={customer.paisDestino} onChange={(e) => handleCustomerChange('paisDestino', e.target.value.toUpperCase())} />
              </div>
              <div className="form-group">
                <label className="antigravity-label">Condiciones de Entrega (Incoterms) <span style={{color: 'var(--danger-color)'}}>*</span>
                  <Tooltip content="Términos de comercio internacional que definen responsabilidades. (Ej: FOB, CIF)" size={14} />
                </label>
                <select className="antigravity-input" disabled={isLoading} value={customer.incoterm} onChange={(e) => handleCustomerChange('incoterm', e.target.value)}>
                  <option value="">-- Seleccionar --</option>
                  <option value="EXW">EXW - En Fábrica</option>
                  <option value="FCA">FCA - Libre Transportista</option>
                  <option value="FOB">FOB - Libre a Bordo</option>
                  <option value="CIF">CIF - Costo, Seguro y Flete</option>
                  <option value="DAP">DAP - Entregado en el Lugar</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {['05', '06'].includes(dteType) && (
          <div className="glass-panel panel-section" style={{ marginTop: '1rem' }}>
            <h3>Documento Relacionado (Para Notas de Crédito/Débito)</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="antigravity-label">Código de Generación (UUID Original) <span style={{color: 'var(--danger-color)'}}>*</span>
                  <Tooltip content="El código de generación de la factura original que estás modificando o anulando." size={14} />
                </label>
                <input type="text" className="antigravity-input" placeholder="XXXX-XXXX-XXXX-XXXX" disabled={isLoading} value={customer.docRelacionado} onChange={(e) => handleCustomerChange('docRelacionado', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="antigravity-label">Motivo de la Contingencia <span style={{color: 'var(--danger-color)'}}>*</span></label>
                <input type="text" className="antigravity-input" placeholder="Ej. Devolución de mercadería" disabled={isLoading} value={customer.motivoContin} onChange={(e) => handleCustomerChange('motivoContin', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div className="glass-panel panel-section">
          <h3>Detalle de Facturación</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>Descripción / Código</th>
                <th width="100">Cant.</th>
                <th width="150">Precio Unit.</th>
                <th width="150">Subtotal</th>
                <th width="60"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {productsList.length > 0 && (
                      <select 
                        className="antigravity-input" 
                        style={{ marginBottom: '0.5rem', background: 'rgba(212, 175, 55, 0.05)', borderColor: 'var(--gold-primary)' }}
                        onChange={(e) => handleProductSelect(item.id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>Cargar de catálogo...</option>
                        {productsList.map(p => (
                          <option key={p.id} value={p.id}>{p.code} - {p.description}</option>
                        ))}
                      </select>
                    )}
                    <input type="text" className="antigravity-input" placeholder="Descripción del producto o servicio" disabled={isLoading} value={item.desc} onChange={(e) => handleDescChange(item.id, e.target.value)} />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="antigravity-input" 
                      value={item.qty}
                      onChange={(e) => handleQtyChange(item.id, e.target.value)} 
                      disabled={isLoading}
                    />
                  </td>
                  <td>
                    <div className="currency-input">
                      <span>$</span>
                      <input 
                        type="number" 
                        className="antigravity-input" 
                        value={item.price || ''}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        step="0.01" 
                        disabled={isLoading}
                      />
                    </div>
                  </td>
                  <td className="item-subtotal">${calculateSubtotal(item.qty, item.price)}</td>
                  <td>
                    <button className="icon-button danger" onClick={() => removeItem(item.id)} disabled={isLoading || items.length === 1}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-actions">
            <button className="antigravity-button secondary" onClick={addItem} disabled={isLoading}>
              <Plus size={16} /> Agregar Línea
            </button>
          </div>
        </div>

        <div className="totals-section glass-panel">
          <div className="totals-row">
            <span>Suma Total</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {dteType !== '14' && (
            <div className="totals-row">
              <span>IVA (13%)</span>
              <span>${iva.toFixed(2)}</span>
            </div>
          )}
          {dteType === '14' && (
            <div className="totals-row" style={{ color: 'var(--danger-color)' }}>
              <span>Retención Renta (10%)</span>
              <span>-${renta.toFixed(2)}</span>
            </div>
          )}
          <div className="totals-row grand-total">
            <span>Total a Cobrar</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInvoiceView;

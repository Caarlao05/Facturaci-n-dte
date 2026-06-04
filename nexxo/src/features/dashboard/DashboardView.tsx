import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DashboardView.css';
import { MoreHorizontal, Loader2, X, Download, Mail, Ban, FileJson, TrendingUp, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const DashboardView = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDte, setSelectedDte] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const downloadPdf = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Factura_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("Error al descargar PDF", err);
      alert("No se pudo descargar el PDF");
    }
  };

  const downloadJson = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/invoices/${id}/json`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DTE_${id}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("Error al descargar JSON", err);
      alert("No se pudo descargar el JSON");
    }
  };

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', marginTop: '4rem'}}><Loader2 className="spinner" size={32} /></div>;
  }

  const sparklineData = data?.sparklineData?.map((d: any, i: number) => ({
    name: `Día ${d.name}`,
    Ventas: d.value
  })) || [];
  
  const RECENT_DTES = data?.recentDtes || [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>Panel de Control</h2>
          <p>Resumen analítico y estado del servicio de facturación electrónica.</p>
        </div>
        <button className="azure-btn">
          Generar Reporte
        </button>
      </div>

      <div className="kpi-row">
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label" style={{ color: '#94a3b8' }}>Ventas del Día</span>
            <DollarSign size={20} color="#d4af37" />
          </div>
          <span className="kpi-value" style={{ color: 'white', marginTop: '10px' }}>${data?.ventasDelDia?.toFixed(2) || '0.00'}</span>
          <div style={{ marginTop: 'auto', fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={14} /> +12.5% vs ayer
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Facturas Emitidas</span>
            <FileText size={20} color="var(--accent-blue)" />
          </div>
          <span className="kpi-value">{data?.totalFacturas || 0}</span>
          <div style={{ marginTop: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
            En los últimos 30 días
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Tasa de Aprobación MH</span>
            <CheckCircle2 size={20} color="var(--success)" />
          </div>
          <span className="kpi-value">{data?.successRate || 0}%</span>
          <div style={{ marginTop: 'auto', width: '100%', background: '#e2e8f0', height: '4px', borderRadius: '2px' }}>
            <div style={{ width: `${data?.successRate || 0}%`, background: 'var(--success)', height: '100%', borderRadius: '2px' }}></div>
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Conexión MH</span>
            <div className={data?.mhConnected ? "pulse-dot" : "pulse-dot-error"} style={{ marginTop: '4px' }}></div>
          </div>
          <span className="kpi-value" style={{ fontSize: '1.2rem', color: data?.mhConnected ? 'var(--success)' : 'var(--danger-color)' }}>
            {data?.mhConnected ? 'En Línea' : 'Desconectado'}
          </span>
          <div style={{ marginTop: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
            {data?.mhConnected ? 'Firmador Activo y Autenticado' : 'Faltan credenciales API'}
          </div>
        </div>
      </div>

      <div className="main-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
        
        {/* CHART SECTION */}
        <div className="main-card">
          <div className="card-header">
            <h3>Tendencia de Ventas (Últimos 7 Días)</h3>
          </div>
          <div style={{ width: '100%', height: '300px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={data?.tenantColor || "#0078D4"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={data?.tenantColor || "#0078D4"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`$${value}`, 'Ventas']}
                />
                <Area type="monotone" dataKey="Ventas" stroke={data?.tenantColor || "#0078D4"} strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT DTES */}
        <div className="main-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3>Últimos DTEs Generados</h3>
            <MoreHorizontal size={16} color="var(--text-muted)" />
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', marginTop: '10px' }}>
            {RECENT_DTES.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {RECENT_DTES.map((dte: any, idx: number) => (
                  <div key={idx} className="recent-dte-item" onClick={() => setSelectedDte(dte)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', marginBottom: '4px' }}>{dte.client}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                        <span>{dte.id}</span> • <span>{dte.date}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>${dte.amount.toFixed(2)}</div>
                      <span className={`badge-pill ${dte.status.toLowerCase().replace(' ', '-')}`} style={{ marginTop: '4px', display: 'inline-block', fontSize: '10px', padding: '2px 6px' }}>
                        {dte.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center' }}>
                <FileText size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No hay documentos recientes</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* EPIC CENTER MODAL DE DETALLES DE DTE */}
      {selectedDte && (
        <div className="epic-modal-overlay" onClick={() => setSelectedDte(null)}>
          <div className="epic-modal" onClick={e => e.stopPropagation()}>
            <div className="epic-modal-header" style={{
              background: `linear-gradient(to right, ${data?.tenantColor}22, transparent)`,
              borderBottom: `2px solid ${data?.tenantColor || 'var(--accent-blue)'}`
            }}>
              <h3>Documento Tributario Electrónico</h3>
              <button className="icon-btn" onClick={() => setSelectedDte(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="epic-modal-toolbar">
              <button onClick={() => downloadPdf(selectedDte.uuid)}>
                <Download size={16} /> Descargar PDF
              </button>
              <button onClick={() => downloadJson(selectedDte.uuid)}>
                <FileJson size={16} /> JSON Hacienda
              </button>
              <button>
                <Mail size={16} /> Reenviar Email
              </button>
              <button className="danger" style={{marginLeft: 'auto'}}>
                <Ban size={16} /> Anular DTE
              </button>
            </div>

            <div className="epic-modal-body">
              <div className="blade-section">
                <h4>Resumen del Documento</h4>
                <div className="blade-kv-grid">
                  <div className="blade-kv">
                    <span className="blade-key">Código de Generación</span>
                    <span className="blade-value">{selectedDte.id}</span>
                  </div>
                  <div className="blade-kv">
                    <span className="blade-key">Estado de Transmisión</span>
                    <span className="blade-value">
                      <span className={`badge-pill ${selectedDte.status.toLowerCase().replace(' ', '-')}`}>{selectedDte.status}</span>
                    </span>
                  </div>
                  <div className="blade-kv">
                    <span className="blade-key">Fecha de Emisión</span>
                    <span className="blade-value">{selectedDte.date}</span>
                  </div>
                  <div className="blade-kv">
                    <span className="blade-key">Sello de Recepción (MH)</span>
                    <span className="blade-value" style={{fontFamily: 'monospace', fontSize: '11px', color: 'var(--success)'}}>
                      {selectedDte.status === 'Transmitido' ? `MH-${selectedDte.id.substring(0,8)}` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="blade-section">
                <h4>Datos del Receptor</h4>
                <div className="blade-kv-grid">
                  <div className="blade-kv">
                    <span className="blade-key">Nombre / Razón Social</span>
                    <span className="blade-value">{selectedDte.client}</span>
                  </div>
                  <div className="blade-kv">
                    <span className="blade-key">Documento de Identidad</span>
                    <span className="blade-value">{selectedDte.clientDoc || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="blade-section">
                <h4>Detalle de Operaciones</h4>
                <table className="blade-table">
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th>Cant.</th>
                      <th>Precio Unit.</th>
                      <th style={{textAlign: 'right'}}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDte.items && selectedDte.items.length > 0 ? (
                      selectedDte.items.map((it: any, i: number) => (
                        <tr key={i}>
                          <td>{it.desc}</td>
                          <td>{it.qty}</td>
                          <td>${it.price.toFixed(2)}</td>
                          <td style={{textAlign: 'right'}}>${it.subtotal.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{textAlign: 'center', color: 'var(--text-muted)'}}>No hay detalle de ítems disponible.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="blade-totals">
                  <div className="blade-total-row">
                    <span>Suma Ventas Gravadas</span>
                    <span>${selectedDte.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="blade-total-row">
                    <span>IVA (13%)</span>
                    <span>${selectedDte.taxes?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="blade-total-row grand-total">
                    <span>Total a Pagar</span>
                    <span style={{color: 'var(--success)'}}>${selectedDte.amount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;

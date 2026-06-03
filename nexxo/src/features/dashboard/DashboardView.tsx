import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DashboardView.css';
import { MoreHorizontal, Loader2, X, Download, Mail, Ban, FileJson } from 'lucide-react';

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
        responseType: 'blob' // Important
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

  const sparklineData = data?.sparklineData || [];
  const RECENT_DTES = data?.recentDtes || [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Dashboard - Facturación DTE</h2>
        <p>Resumen de transacciones y estado del servicio MH</p>
      </div>

      <div className="kpi-row">
        {/* KPI 1 */}
        <div className="kpi-card">
          <span className="kpi-label">Ventas del Día (USD)</span>
          <span className="kpi-value">${data?.ventasDelDia?.toFixed(2) || '0.00'}</span>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card">
          <span className="kpi-label">Facturas Emitidas</span>
          <span className="kpi-value">{data?.totalFacturas || 0}</span>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card">
          <span className="kpi-label">DTE Transmitidos MH</span>
          <span className="kpi-value">{data?.successRate || 0}%</span>
        </div>

        {/* KPI 4 */}
        <div className="kpi-card">
          <span className="kpi-label">Estado Conexión MH</span>
          <div className={data?.mhConnected ? "status-badge-active mt-auto" : "status-badge-error mt-auto"}>
            <div className={data?.mhConnected ? "pulse-dot" : "pulse-dot-error"}></div>
            <span>{data?.mhConnected ? 'Active' : 'Missing Configuration'}</span>
          </div>
        </div>
      </div>

      <div className="main-row">
        
        {/* RECENT DTES */}
        <div className="main-card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3>Últimos DTEs Generados</h3>
            <MoreHorizontal size={16} color="var(--text-muted)" />
          </div>

          <table className="recent-dtes-table">
            <thead>
              <tr>
                <th>DTE No.</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_DTES.map((dte: any, idx: number) => (
                <tr key={idx} onClick={() => setSelectedDte(dte)} style={{cursor: 'pointer'}}>
                  <td style={{color: 'var(--accent-blue)', fontWeight: 500}}>{dte.id}</td>
                  <td>{dte.client}</td>
                  <td style={{color: 'var(--text-muted)'}}>{dte.date}</td>
                  <td>${dte.amount.toFixed(2)}</td>
                  <td>
                    <span className={`badge-pill ${dte.status.toLowerCase().replace(' ', '-')}`}>
                      {dte.status}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => downloadPdf(dte.uuid)} className="azure-btn-secondary" style={{padding: '2px 8px', fontSize: '11px', borderRadius: '2px'}}>
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

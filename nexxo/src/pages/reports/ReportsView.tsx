import React, { useState } from 'react';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';

const ReportsView = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const downloadReport = async (type: 'sales' | 'purchases') => {
    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reports/${type}?${queryParams.toString()}`;
      
      const userStr = localStorage.getItem('user');
      let tenantId = '';
      if (userStr) {
        try {
          tenantId = JSON.parse(userStr).tenantId || '';
        } catch(e){}
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Id': tenantId
        }
      });
      
      if (!response.ok) throw new Error('Error al descargar el reporte');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `reporte_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Hubo un error al generar el reporte.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Reportes Contables (Libros IVA)</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Exporta la información de ventas y compras en formato CSV compatible con Excel.</p>
      </div>

      <div className="azure-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <Calendar size={18} color="var(--accent-blue)" /> Rango de Fechas (Opcional)
        </h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginTop: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Fecha Inicio</label>
            <input 
              type="date" 
              className="azure-input" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Fecha Fin</label>
            <input 
              type="date" 
              className="azure-input" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
            />
          </div>
          <button 
            className="azure-btn-secondary" 
            onClick={() => { setStartDate(''); setEndDate(''); }}
          >
            Limpiar Fechas
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Tarjeta Libro de Ventas */}
        <div className="azure-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
              <FileSpreadsheet size={24} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Libro de Ventas</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Detalle de todas las facturas emitidas y validadas por el MH.
              </p>
            </div>
          </div>
          <button 
            className="azure-btn" 
            style={{ width: '100%', marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            onClick={() => downloadReport('sales')}
            disabled={isExporting}
          >
            <Download size={18} />
            Descargar CSV
          </button>
        </div>

        {/* Tarjeta Libro de Compras */}
        <div className="azure-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
              <FileSpreadsheet size={24} color="#10b981" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Libro de Compras</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Detalle de todos los DTEs importados en el buzón tributario.
              </p>
            </div>
          </div>
          <button 
            className="azure-btn" 
            style={{ width: '100%', marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#10b981' }}
            onClick={() => downloadReport('purchases')}
            disabled={isExporting}
          >
            <Download size={18} />
            Descargar CSV
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReportsView;

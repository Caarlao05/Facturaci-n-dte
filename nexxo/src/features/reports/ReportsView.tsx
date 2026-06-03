import React, { useState } from 'react';
import { Download, Calendar, Filter, FileBarChart } from 'lucide-react';

const ReportsView = () => {
  const [reportType, setReportType] = useState('ventas');
  
  // Array vacío de reporte
  const reportData: any[] = [];

  return (
    <div className="view-container">
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Reportes y Libros de IVA</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Generación automática de anexos tributarios</p>
        </div>
        <button className="azure-btn" disabled>
          <Download size={16} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}} />
          Exportar Excel
        </button>
      </div>

      <div className="azure-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Tipo de Reporte:</span>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              className="azure-input"
              style={{ width: '200px' }}
            >
              <option value="ventas">Libro de Ventas (Contribuyentes)</option>
              <option value="consumidor">Libro de Ventas (Consumidor Final)</option>
              <option value="compras">Libro de Compras</option>
              <option value="anexo">Anexo DTE Ministerio de Hacienda</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <select className="azure-input" style={{ width: '150px' }}>
              <option>Este Mes</option>
              <option>Mes Anterior</option>
              <option>Este Año</option>
              <option>Personalizado...</option>
            </select>
            <button className="azure-btn-secondary">
              <Filter size={16} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}} />
              Generar
            </button>
          </div>
        </div>
      </div>

      <div className="azure-panel">
        {reportData.length > 0 ? (
          <div>
            {/* Tabla de reporte simulada si hubiera datos */}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(0, 120, 212, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <FileBarChart size={32} color="var(--accent-blue)" />
            </div>
            <h3 style={{ fontSize: '18px', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Aún no hay datos para reportar</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              Una vez que comiences a emitir y recibir DTEs, este módulo generará automáticamente tus Libros de Ventas, Libros de Compras y anexos tributarios listos para presentar al Ministerio de Hacienda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsView;

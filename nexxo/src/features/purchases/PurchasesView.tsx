import React, { useState } from 'react';
import { Search, UploadCloud, FileText, DownloadCloud } from 'lucide-react';

const PurchasesView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Array vacío para simulacion de empty state
  const purchases: any[] = [];

  return (
    <div className="view-container">
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Gestión de Compras (DTEs Recibidos)</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Buzón tributario de documentos recibidos</p>
        </div>
        <button className="azure-btn">
          <UploadCloud size={16} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}} />
          Importar JSON de MH
        </button>
      </div>

      <div className="azure-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '8px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por Código de Generación o Proveedor..." 
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
        {purchases.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Fecha</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Código Generación</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Proveedor</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total ($)</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Estado IVA</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {/* Filas aquí */}
            </tbody>
          </table>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(0, 120, 212, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <DownloadCloud size={32} color="var(--accent-blue)" />
            </div>
            <h3 style={{ fontSize: '18px', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Sin DTEs recibidos</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              En esta sección podrás visualizar y procesar automáticamente los Documentos Tributarios Electrónicos que tus proveedores te emitan. Ideal para cruzar tu crédito fiscal IVA de forma automática.
            </p>
            <button className="azure-btn-secondary" disabled>
              <FileText size={16} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}} />
              Esperando recepción de facturas...
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesView;

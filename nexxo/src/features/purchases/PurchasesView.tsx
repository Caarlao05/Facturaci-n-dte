import React, { useState, useEffect, useRef } from 'react';
import { Search, UploadCloud, FileText, DownloadCloud } from 'lucide-react';

const PurchasesView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/purchases', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPurchases(data);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('json', file);

    try {
      const res = await fetch('/api/purchases/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al importar');
      }

      alert('DTE importado con éxito');
      fetchPurchases(); // Recargar la tabla
    } catch (error: any) {
      console.error('Error importing:', error);
      alert(error.message);
    } finally {
      setUploading(false);
      // Resetear el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredPurchases = (Array.isArray(purchases) ? purchases : []).filter(p => 
    p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.generationCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Gestión de Compras (DTEs Recibidos)</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Buzón tributario de documentos recibidos</p>
        </div>
        <div>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
          <button className="azure-btn" onClick={handleImportClick} disabled={uploading}>
            <UploadCloud size={16} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}} />
            {uploading ? 'Importando...' : 'Importar JSON de MH'}
          </button>
        </div>
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
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando compras...</div>
        ) : filteredPurchases.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Fecha Recepción</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Código Generación</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Proveedor</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total ($)</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '12px' }}>{new Date(purchase.receptionDate).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.9em' }}>{purchase.generationCode}</td>
                  <td style={{ padding: '12px' }}>{purchase.supplierName}</td>
                  <td style={{ padding: '12px', fontWeight: 500 }}>${purchase.totalAmount.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      backgroundColor: purchase.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                      color: purchase.status === 'APPROVED' ? 'var(--success)' : 'var(--warning)',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      {purchase.status === 'APPROVED' ? 'APROBADO' : 'PENDIENTE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(0, 120, 212, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <DownloadCloud size={32} color="var(--accent-blue)" />
            </div>
            <h3 style={{ fontSize: '18px', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Sin DTEs recibidos</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              En esta sección podrás visualizar y procesar automáticamente los Documentos Tributarios Electrónicos que tus proveedores te emitan. Sube tu primer archivo JSON para cruzar el crédito fiscal IVA.
            </p>
            <button className="azure-btn-secondary" onClick={handleImportClick}>
              <FileText size={16} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}} />
              Subir tu primera factura
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesView;

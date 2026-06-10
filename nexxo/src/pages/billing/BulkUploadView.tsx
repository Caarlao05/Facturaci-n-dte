import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import './BulkUploadView.css';

interface InvoiceRow {
  TipoDTE: string;
  DocumentoReceptor: string;
  NombreCliente: string;
  Descripcion: string;
  Cantidad: number;
  PrecioUnitario: number;
  DocRelacionado?: string;
  PaisDestino?: string;
  Incoterm?: string;
  _error?: string;
}

const BulkUploadView = () => {
  const [data, setData] = useState<InvoiceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const templateData = [
      { TipoDTE: '01', DocumentoReceptor: '06140101901112', NombreCliente: 'Empresa Demo SA de CV', Descripcion: 'Servicio Contable', Cantidad: 1, PrecioUnitario: 150.00, DocRelacionado: '', PaisDestino: '', Incoterm: '' },
      { TipoDTE: '14', DocumentoReceptor: '012345678', NombreCliente: 'Juan Perez', Descripcion: 'Mantenimiento PC', Cantidad: 2, PrecioUnitario: 50.00, DocRelacionado: '', PaisDestino: '', Incoterm: '' },
      { TipoDTE: '11', DocumentoReceptor: 'EX0001', NombreCliente: 'Global Import', Descripcion: 'Licencia Software', Cantidad: 1, PrecioUnitario: 1000.00, DocRelacionado: '', PaisDestino: 'USA', Incoterm: 'FOB' },
      { TipoDTE: '03', DocumentoReceptor: '06142509152125', NombreCliente: 'Grupo Agrisal', Descripcion: 'Migración Nube', Cantidad: 1, PrecioUnitario: 2000.00, DocRelacionado: '', PaisDestino: '', Incoterm: '' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Configurar anchos de columna para la hoja de datos
    ws['!cols'] = [
      { wch: 10 }, { wch: 20 }, { wch: 30 }, { wch: 35 }, { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 12 }
    ];

    const instructionsData = [
      { Campo: 'TipoDTE', Obligatorio: 'Sí', Descripcion: '01 = Factura, 03 = Crédito Fiscal, 11 = Exportación, 14 = Sujeto Excluido' },
      { Campo: 'DocumentoReceptor', Obligatorio: 'Sí', Descripcion: 'NIT, NRC o DUI del cliente (preferiblemente sin guiones)' },
      { Campo: 'NombreCliente', Obligatorio: 'Sí', Descripcion: 'Razón Social o Nombre Completo del receptor' },
      { Campo: 'Descripcion', Obligatorio: 'Sí', Descripcion: 'Detalle del producto o servicio vendido' },
      { Campo: 'Cantidad', Obligatorio: 'Sí', Descripcion: 'Debe ser mayor a 0' },
      { Campo: 'PrecioUnitario', Obligatorio: 'Sí', Descripcion: 'En Factura(01) incluye IVA. En CCF(03) es SIN IVA.' },
      { Campo: 'PaisDestino', Obligatorio: 'Solo DTE 11', Descripcion: 'País destino de la exportación (Ej. USA, MEX)' },
      { Campo: 'Incoterm', Obligatorio: 'Solo DTE 11', Descripcion: 'Término de comercio internacional (Ej. FOB, CIF)' }
    ];
    const wsInstruct = XLSX.utils.json_to_sheet(instructionsData);
    wsInstruct['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 80 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsInstruct, "Instrucciones (LEER)");
    XLSX.utils.book_append_sheet(wb, ws, "Datos_DTE");
    XLSX.writeFile(wb, "Plantilla_Carga_Masiva_DTE.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json<any>(ws);

      const validatedData = jsonData.map(row => {
        let error = '';
        if (!row.TipoDTE) error += 'TipoDTE faltante. ';
        if (!row.DocumentoReceptor) error += 'DocumentoReceptor faltante. ';
        if (!row.NombreCliente) error += 'Nombre faltante. ';
        if (!row.Cantidad || row.Cantidad <= 0) error += 'Cant. inválida. ';
        if (!row.PrecioUnitario || row.PrecioUnitario < 0) error += 'Precio inválido. ';
        if (row.TipoDTE === '11' && (!row.PaisDestino || !row.Incoterm)) error += 'DTE 11 requiere PaisDestino e Incoterm. ';
        
        return { ...row, _error: error || undefined };
      });

      setData(validatedData);
      setIsSuccess(false);
    };
    reader.readAsBinaryString(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTransmit = async () => {
    const validRows = data.filter(r => !r._error);
    if (validRows.length === 0) return;

    setIsLoading(true);
    setProgress({ current: 0, total: validRows.length });

    try {
      const token = localStorage.getItem('token');
      // Simulated batched process
      for (let i = 0; i < validRows.length; i++) {
        await axios.post('http://localhost:3000/api/dte/batch-single', {
          row: validRows[i]
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProgress({ current: i + 1, total: validRows.length });
      }
      
      setIsSuccess(true);
      setData([]); 
    } catch (error) {
      console.error(error);
      alert("Error al procesar el lote.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasErrors = data.some(r => r._error);
  const validCount = data.filter(r => !r._error).length;

  return (
    <div className="bulk-upload-view">
      <div className="view-header">
        <div>
          <h2>Carga Masiva Inteligente</h2>
          <p style={{color: '#64748b', marginTop: '0.25rem'}}>Genera cientos de DTEs de distintos tipos desde una sola Plantilla Universal Excel</p>
        </div>
        <button className="antigravity-button secondary" onClick={downloadTemplate}>
          <Download size={18} />
          Descargar Plantilla Universal
        </button>
      </div>

      {!isSuccess && data.length === 0 && (
        <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
          <div className="icon" style={{color: 'var(--brand-accent)'}}><FileSpreadsheet size={48} /></div>
          <h3 style={{marginTop: '1rem'}}>Arrastra tu plantilla Excel aquí</h3>
          <p>Soporta mezclado de FCF, CCF, NC, Sujetos Excluidos y Exportaciones (.xlsx)</p>
          <div style={{ marginTop: '1rem', display: 'inline-block', backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
            💡 Tip: Revisa la hoja de Instrucciones en la plantilla
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden-input" />
        </div>
      )}

      {isSuccess && (
        <div className="alert-box success">
          <CheckCircle className="alert-icon" size={24} />
          <div className="alert-content">
            <h4>¡Lote DTE Procesado Exitosamente!</h4>
            <p>Se firmaron y timbraron <strong>{progress.total} facturas</strong> en el Ministerio de Hacienda. Se generaron las representaciones gráficas Premium en formato PDF.</p>
            <button className="antigravity-button secondary" style={{marginTop: '1rem'}} onClick={() => setIsSuccess(false)}>Subir otro archivo</button>
          </div>
        </div>
      )}

      {data.length > 0 && !isSuccess && (
        <div className="preview-panel">
          <h3>
            Vista Previa de Validaciones
            <button 
              className="antigravity-button" 
              disabled={validCount === 0 || isLoading}
              onClick={handleTransmit}
            >
              {isLoading ? <Loader2 className="spinner" size={18} /> : <Send size={18} />}
              {isLoading ? 'Transmitiendo a MH...' : `Transmitir ${validCount} DTEs válidos`}
            </button>
          </h3>

          {isLoading && (
            <div style={{ marginTop: '1rem', background: '#F1F5F9', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
                <span>Procesando facturas en lote...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(progress.current / progress.total) * 100}%`, height: '100%', background: 'var(--brand-accent)', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}
          
          {hasErrors && !isLoading && (
            <div className="alert-box error" style={{marginTop: '1rem', borderLeft: '4px solid #ef4444'}}>
              <AlertCircle className="alert-icon" size={20} />
              <div className="alert-content">
                <p>Se detectaron filas con errores (marcadas en rojo). Estas no serán enviadas a Hacienda.</p>
              </div>
            </div>
          )}

          <div style={{overflowX: 'auto', marginTop: '1rem'}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo DTE</th>
                  <th>ID Receptor</th>
                  <th>Razón Social</th>
                  <th>Descripción</th>
                  <th>Subtotal</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className={row._error ? 'row-error' : ''}>
                    <td><strong>{row.TipoDTE}</strong></td>
                    <td>{row.DocumentoReceptor}</td>
                    <td>{row.NombreCliente}</td>
                    <td>{row.Descripcion}</td>
                    <td>${(row.Cantidad * row.PrecioUnitario).toFixed(2)}</td>
                    <td>
                      {row._error ? (
                        <span className="error-badge">{row._error}</span>
                      ) : (
                        <span className="status-badge success">Válido</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUploadView;

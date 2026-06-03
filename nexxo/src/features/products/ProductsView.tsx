import React, { useState, useEffect } from 'react';
import { Search, Plus, Package, PackagePlus, Loader2 } from 'lucide-react';
import axios from 'axios';

const ProductsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    unitPrice: '',
    taxType: 'IVA',
    isActive: true
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'unitPrice') {
      finalValue = parseFloat(value) || '';
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/products', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setFormData({
        code: '', description: '', unitPrice: '', taxType: 'IVA', isActive: true
      });
      fetchProducts();
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert(error.response?.data?.error || 'Error al crear el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Catálogo de Productos y Servicios</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Gestiona tu inventario para facturación rápida</p>
        </div>
        <button className="azure-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}} />
          Nuevo Ítem
        </button>
      </div>

      <div className="azure-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '8px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por Código o Nombre..." 
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
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="spinner" size={32} color="var(--accent-blue)" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Código</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Nombre / Descripción</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tributo</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Precio Base</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{product.code}</td>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{product.description}</td>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{product.taxType}</td>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>${Number(product.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(0, 120, 212, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Package size={32} color="var(--accent-blue)" />
            </div>
            <h3 style={{ fontSize: '18px', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Catálogo de Productos vacío</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              Aquí puedes registrar los bienes o servicios que comercializas, incluyendo códigos SKU, categorías e impuestos aplicables.
            </p>
            <button className="azure-btn" onClick={() => setIsModalOpen(true)}>
              <PackagePlus size={16} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}} />
              Agregar mi primer producto
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="azure-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Nuevo Ítem del Catálogo</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Código Interno *</label>
                  <input type="text" name="code" required className="azure-input" value={formData.code} onChange={handleInputChange} placeholder="Ej. SKU-001" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Descripción del Producto o Servicio *</label>
                  <input type="text" name="description" required className="azure-input" value={formData.description} onChange={handleInputChange} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Precio Unitario Base ($) *</label>
                  <input type="number" step="0.01" name="unitPrice" required className="azure-input" value={formData.unitPrice} onChange={handleInputChange} placeholder="0.00" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Tipo de Tributo Afecto *</label>
                  <select name="taxType" required className="azure-input" value={formData.taxType} onChange={handleInputChange}>
                    <option value="IVA">IVA (13%)</option>
                    <option value="EXENTO">Exento</option>
                    <option value="NO_SUJETO">No Sujeto</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="azure-btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="azure-btn" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="spinner" size={16} /> : 'Guardar Ítem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsView;

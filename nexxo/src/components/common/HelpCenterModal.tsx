import React, { useState } from 'react';
import { HelpCircle, X, ChevronDown, ChevronRight, FileText, Settings, ShieldCheck, Mail } from 'lucide-react';
import './HelpCenterModal.css';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQ_ITEMS = [
  {
    category: 'Primeros Pasos',
    icon: <Settings size={20} />,
    questions: [
      {
        q: '¿Qué necesito para emitir mi primera factura?',
        a: 'Para empezar, debes dirigirte a "Configuración" y asegurarte de tener configurado tu NIT, NRC, Razón Social, la Contraseña API (generada en el Ministerio de Hacienda) y haber subido tu certificado P12.'
      },
      {
        q: '¿Cómo cargo mis clientes y productos rápidamente?',
        a: 'Ve a la sección "Clientes" o "Productos" en el menú lateral. Puedes agregarlos uno por uno, o usar la opción "Carga Masiva" usando nuestra plantilla de Excel.'
      }
    ]
  },
  {
    category: 'Facturación y DTEs',
    icon: <FileText size={20} />,
    questions: [
      {
        q: '¿Qué significa "Sello de Recepción"?',
        a: 'Es el código oficial que retorna el Ministerio de Hacienda para confirmar que tu factura fue recibida, validada y es legalmente válida.'
      },
      {
        q: '¿Qué hago si me equivoco en una factura (DTE)?',
        a: 'Si la factura ya fue enviada (tiene Sello), debes ir al "Historial", seleccionar la factura y usar la opción "Invalidar". Debes justificar el motivo de la invalidación.'
      },
      {
        q: '¿Cómo envío la factura al cliente?',
        a: 'Al generar la factura, si ingresas el correo del cliente, el sistema le enviará automáticamente el PDF y el JSON original. También puedes descargar el PDF desde el Historial y enviarlo manualmente.'
      }
    ]
  },
  {
    category: 'Seguridad y Credenciales',
    icon: <ShieldCheck size={20} />,
    questions: [
      {
        q: '¿Dónde obtengo mi Contraseña API y Certificado?',
        a: 'Debes ingresar al portal de Facturación Electrónica del Ministerio de Hacienda con tu NIT y contraseña. Ahí encontrarás la sección "API" para generar la contraseña, y "Certificados" para descargar tu archivo .p12.'
      }
    ]
  }
];

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleExpand = (index: string) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="help-modal-overlay">
      <div className="help-modal-content glass-panel">
        <div className="help-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="help-icon-wrapper">
              <HelpCircle size={24} color="var(--gold-primary)" />
            </div>
            <h2>Centro de Ayuda Rápida</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>
        
        <div className="help-modal-body">
          <p className="help-intro">
            Aquí encontrarás respuestas a las dudas más comunes sobre el uso de nuestra plataforma de Facturación Electrónica (DTE).
          </p>

          <div className="faq-container">
            {FAQ_ITEMS.map((section, sIdx) => (
              <div key={sIdx} className="faq-section">
                <h3 className="faq-category">
                  {section.icon} {section.category}
                </h3>
                
                {section.questions.map((item, qIdx) => {
                  const key = `${sIdx}-${qIdx}`;
                  const isExpanded = expandedIndex === key;
                  return (
                    <div key={key} className={`faq-item ${isExpanded ? 'expanded' : ''}`}>
                      <button 
                        className="faq-question" 
                        onClick={() => toggleExpand(key)}
                        aria-expanded={isExpanded}
                      >
                        <span style={{ fontWeight: 500 }}>{item.q}</span>
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      
                      <div className="faq-answer-wrapper" style={{ height: isExpanded ? 'auto' : 0, overflow: 'hidden' }}>
                        <div className="faq-answer">
                          {item.a}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="support-contact">
            <Mail size={18} />
            <span>¿Aún tienes dudas? Contáctanos a <strong>soporte@nexxus.sv</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GlobalHelpButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="global-help-btn" 
        onClick={() => setIsOpen(true)}
        aria-label="Abrir centro de ayuda"
      >
        <HelpCircle size={28} />
      </button>
      <HelpCenterModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

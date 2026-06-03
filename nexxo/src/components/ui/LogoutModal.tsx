import React from 'react';
import { LogOut, X } from 'lucide-react';
import './LogoutModal.css';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel bounce-in">
        <div className="modal-header">
          <div className="modal-icon-container">
            <LogOut size={28} className="modal-icon" />
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <h3>¿Cerrar Sesión?</h3>
          <p>Estás a punto de salir del sistema de Facturación Electrónica. ¿Deseas continuar?</p>
        </div>
        
        <div className="modal-actions">
          <button className="antigravity-button secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="antigravity-button danger" onClick={onConfirm}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;

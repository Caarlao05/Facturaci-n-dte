import React from 'react';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  actionRoute,
  onAction 
}) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionRoute) {
      navigate(actionRoute);
    }
  };

  return (
    <div className="glass-panel" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      margin: '2rem 0',
      minHeight: '300px'
    }}>
      <div style={{
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
        border: '1px solid var(--border-color)',
        borderRadius: '50%',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={48} color="var(--gold-primary)" opacity={0.8} />
      </div>
      
      <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
        {title}
      </h3>
      
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '2rem', lineHeight: '1.6' }}>
        {description}
      </p>
      
      {(actionLabel && (actionRoute || onAction)) && (
        <button 
          className="antigravity-button" 
          onClick={handleAction}
          style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

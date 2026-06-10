import React from 'react';
import { HelpCircle, Info } from 'lucide-react';
import './Tooltip.css';

interface TooltipProps {
  content: React.ReactNode;
  icon?: 'help' | 'info';
  size?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, icon = 'help', size = 16 }) => {
  return (
    <div className="tooltip-container" aria-label="Información adicional">
      {icon === 'help' ? (
        <HelpCircle size={size} className="tooltip-icon" />
      ) : (
        <Info size={size} className="tooltip-icon" />
      )}
      <div className="tooltip-content" role="tooltip">
        {content}
      </div>
    </div>
  );
};

import React from 'react';
import './LoadingSkeleton.css';

interface LoadingSkeletonProps {
  type: 'card' | 'table' | 'chart' | 'generic';
  rows?: number;
  height?: string;
}

const LoadingSkeleton = ({ type, rows = 5, height }: LoadingSkeletonProps) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="skeleton-card glass-panel">
            <div className="skeleton-line skeleton-header" />
            <div className="skeleton-line skeleton-value" />
            <div className="skeleton-line skeleton-footer" />
          </div>
        );
      case 'chart':
        return (
          <div className="skeleton-chart glass-panel" style={{ height: height || '350px' }}>
            <div className="skeleton-line skeleton-header" style={{ width: '40%' }} />
            <div className="skeleton-chart-bars">
              <div className="skeleton-bar" style={{ height: '60%' }} />
              <div className="skeleton-bar" style={{ height: '80%' }} />
              <div className="skeleton-bar" style={{ height: '40%' }} />
              <div className="skeleton-bar" style={{ height: '90%' }} />
              <div className="skeleton-bar" style={{ height: '50%' }} />
              <div className="skeleton-bar" style={{ height: '75%' }} />
              <div className="skeleton-bar" style={{ height: '65%' }} />
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="skeleton-table glass-panel">
            <div className="skeleton-table-header">
              <div className="skeleton-line" style={{ width: '15%' }} />
              <div className="skeleton-line" style={{ width: '25%' }} />
              <div className="skeleton-line" style={{ width: '20%' }} />
              <div className="skeleton-line" style={{ width: '20%' }} />
              <div className="skeleton-line" style={{ width: '10%' }} />
            </div>
            <div className="skeleton-table-body">
              {Array.from({ length: rows }).map((_, idx) => (
                <div className="skeleton-table-row" key={idx}>
                  <div className="skeleton-line" style={{ width: '12%' }} />
                  <div className="skeleton-line" style={{ width: '30%' }} />
                  <div className="skeleton-line" style={{ width: '18%' }} />
                  <div className="skeleton-line" style={{ width: '22%' }} />
                  <div className="skeleton-line" style={{ width: '8%' }} />
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="skeleton-generic glass-panel" style={{ height: height || '100px' }}>
            <div className="skeleton-line" style={{ width: '80%' }} />
            <div className="skeleton-line" style={{ width: '60%' }} />
            <div className="skeleton-line" style={{ width: '40%' }} />
          </div>
        );
    }
  };

  return renderSkeleton();
};

export default LoadingSkeleton;

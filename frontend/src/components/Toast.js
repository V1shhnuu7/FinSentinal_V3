import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const colors = {
    success: {
      bg: 'rgba(93, 228, 199, 0.15)',
      border: 'rgba(93, 228, 199, 0.4)',
      text: '#5de4c7',
      icon: '✓'
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.4)',
      text: '#ef4444',
      icon: '✕'
    },
    info: {
      bg: 'rgba(122, 168, 255, 0.15)',
      border: 'rgba(122, 168, 255, 0.4)',
      text: '#7aa8ff',
      icon: 'ℹ'
    }
  };

  const style = colors[type] || colors.success;

  return (
    <div
      style={{
        position: 'fixed',
        top: '100px',
        right: '24px',
        zIndex: 10000,
        padding: '14px 20px',
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '12px',
        color: style.text,
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        animation: 'slideInRight 0.3s ease',
        maxWidth: '400px'
      }}
    >
      <span style={{ fontSize: '18px' }}>{style.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: style.text,
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0 4px',
            opacity: 0.7
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

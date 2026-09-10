import toast from 'react-hot-toast';
import React from 'react';

export const confirmDialog = (message, confirmText = 'Да', cancelText = 'Отмена') => {
  return new Promise((resolve) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(true);
            }}
            style={{
              padding: '0.3rem 0.8rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            {confirmText}
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(false);
            }}
            style={{
              padding: '0.3rem 0.8rem',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
    });
  });
};

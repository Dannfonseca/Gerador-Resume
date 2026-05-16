import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  confirmText, 
  cancelText, 
  onConfirm, 
  onCancel,
  variant = 'danger'
}) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="modal-standard"
        style={{ width: '100%', maxWidth: '420px', overflow: 'hidden' }}
      >
        <div className="modal-standard-header">
          <h3 className="modal-title" style={{ fontSize: 'var(--font-h3)' }}>{title}</h3>
          <button className="icon-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-standard-body">
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ 
              background: isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(26, 28, 30, 0.05)', 
              padding: '12px', 
              display: 'flex' 
            }}>
              <AlertTriangle size={24} color={isDanger ? 'var(--error)' : 'var(--primary)'} />
            </div>
            <p style={{ 
              margin: 0, 
              color: 'var(--secondary)', 
              fontSize: 'var(--font-body)', 
              lineHeight: 1.5 
            }}>
              {message}
            </p>
          </div>
        </div>

        <div className="modal-standard-footer">
          <button className="btn-secondary" onClick={onCancel} style={{ padding: '10px 20px' }}>
            {cancelText || 'Cancelar'}
          </button>
          <button 
            className={isDanger ? 'btn-danger' : 'btn-primary'} 
            onClick={onConfirm}
            style={{ padding: '10px 20px' }}
          >
            {confirmText || 'Confirmar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

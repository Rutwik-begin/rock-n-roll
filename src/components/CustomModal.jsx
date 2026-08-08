import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, PlusCircle } from 'lucide-react';

export default function CustomModal({ isOpen, onClose, onConfirm, modalConfig }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const {
    type = 'confirm', // 'confirm' | 'input'
    title = 'Confirm Action',
    message = '',
    placeholder = 'Enter value...',
    initialValue = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false,
  } = modalConfig || {};

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
      if (type === 'input') {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, initialValue, type]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'input') {
      if (!inputValue.trim()) return;
      onConfirm(inputValue.trim());
    } else {
      onConfirm(true);
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div
        className="modal-content glass-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            {isDanger ? (
              <AlertTriangle className="modal-icon text-red" size={22} />
            ) : (
              <PlusCircle className="modal-icon text-accent" size={22} />
            )}
            <h3>{title}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {message && <p className="modal-message">{message}</p>}

            {type === 'input' && (
              <input
                ref={inputRef}
                type="text"
                className="modal-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                maxLength={50}
                required
              />
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className={`btn-primary ${isDanger ? 'btn-danger' : ''}`}
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

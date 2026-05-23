"use client";

import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle, X } from "lucide-react";

interface CustomDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: "info" | "warning" | "danger" | "confirm";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CustomDialog({
  isOpen,
  title,
  message,
  type,
  confirmText = "OK",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: CustomDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertTriangle size={36} style={{ color: "var(--danger-color)" }} />;
      case "warning":
        return <AlertCircle size={36} style={{ color: "var(--warning-color)" }} />;
      case "confirm":
        return <HelpCircle size={36} style={{ color: "var(--accent-color)" }} />;
      default:
        return <AlertCircle size={36} style={{ color: "var(--accent-color)" }} />;
    }
  };

  const getConfirmButtonClass = () => {
    if (type === "danger") return "btn btn-primary btn-danger";
    return "btn btn-primary";
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={onCancel}>
      <div 
        className="modal-content custom-dialog-card"
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: "400px", 
          padding: "1.75rem",
          border: type === "danger" 
            ? "1px solid var(--danger-color)" 
            : type === "warning" 
            ? "1px solid var(--warning-color)" 
            : "1px solid var(--border-color)"
        }}
      >
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div className="dialog-icon-wrapper" style={{ flexShrink: 0 }}>
            {getIcon()}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              {title}
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
          {type === "confirm" && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
              {cancelText}
            </button>
          )}
          <button 
            type="button" 
            className={getConfirmButtonClass()} 
            onClick={onConfirm} 
            style={{ flex: 1 }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";

interface PhotoUploadProps {
  value?: string | null;
  onChange: (base64: string | null) => void;
  label?: string;
  circular?: boolean;
}

export default function PhotoUpload({ value, onChange, label = "Tirar Foto / Anexar", circular = false }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressAndConvert = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to compress
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress as JPEG at 0.7 quality
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setPreview(compressedBase64);
          onChange(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressAndConvert(file);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="form-group" style={{ display: "flex", flexDirection: "column", alignItems: circular ? "center" : "flex-start" }}>
      {label && <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>{label}</span>}
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: circular ? "120px" : "100%",
          height: circular ? "120px" : "150px",
          borderRadius: circular ? "50%" : "8px",
          border: "2px dashed var(--border-color)",
          backgroundColor: "var(--bg-tertiary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          overflow: "hidden",
          position: "relative",
          transition: "border-color 0.2s ease",
          gap: "0.5rem"
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-color)"}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
      >
        {preview ? (
          <>
            <img 
              src={preview} 
              alt="Preview" 
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "cover" 
              }} 
            />
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                backgroundColor: "rgba(239, 68, 68, 0.9)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
              }}
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <Camera size={24} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "0 10px" }}>
              Clique para usar Câmera ou Arquivo
            </span>
          </>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment" // Forces back-facing camera on mobile devices
        style={{ display: "none" }}
      />
    </div>
  );
}

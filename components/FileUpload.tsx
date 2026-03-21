"use client";

import { useCallback, useState } from "react";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  loading?: boolean;
  disabled?: boolean;
  accept: string;
  label: string;
  hint: string;
  loadingText?: string;
  id: string;
  validate?: (file: File) => boolean;
}

export function FileUpload({
  onFileUpload,
  loading,
  disabled,
  accept,
  label,
  hint,
  loadingText = "Analyzing file...",
  id,
  validate,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        if (validate && !validate(files[0])) return;
        onFileUpload(files[0]);
      }
    },
    [onFileUpload, disabled, validate]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (disabled) return;
      const files = e.target.files;
      if (files && files[0]) {
        onFileUpload(files[0]);
      }
    },
    [onFileUpload, disabled]
  );

  return (
    <form
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <label
        htmlFor={id}
        className={`
          relative flex flex-col items-center justify-center
          w-full h-72 border-2 border-dashed rounded-lg
          cursor-pointer transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        style={{
          borderColor: dragActive ? "oklch(50% 0.08 260)" : "oklch(80% 0.005 80)",
          backgroundColor: dragActive ? "oklch(96% 0.01 260)" : "oklch(100% 0 0)",
        }}
      >
        <div className="flex flex-col items-center py-8 px-6">
          {loading ? (
            <>
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: "oklch(90% 0.005 80)" }} />
                <div
                  className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "oklch(50% 0.08 260)" }}
                />
              </div>
              <p className="text-base font-semibold mb-2" style={{ color: "oklch(20% 0.01 80)" }}>
                {loadingText}
              </p>
            </>
          ) : (
            <>
              <svg
                className="w-16 h-16 mb-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "oklch(60% 0.05 260)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg font-semibold mb-2" style={{ color: "oklch(20% 0.01 80)" }}>
                {dragActive ? "Drop file here" : label}
              </p>
              <p className="text-sm mb-4" style={{ color: "oklch(50% 0.01 80)" }}>
                Drag and drop or click to browse
              </p>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium"
                style={{ backgroundColor: "oklch(95% 0.005 80)", color: "oklch(40% 0.01 80)" }}
              >
                <span>{hint}</span>
              </div>
            </>
          )}
        </div>
        <input
          id={id}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
        />
      </label>
    </form>
  );
}

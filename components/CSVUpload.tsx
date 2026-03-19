"use client";

import { useCallback, useState } from "react";

interface CSVUploadProps {
  onFileUpload: (file: File) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function CSVUpload({ onFileUpload, loading, disabled }: CSVUploadProps) {
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
        const file = files[0];
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          onFileUpload(file);
        } else {
          alert("Please upload a CSV file");
        }
      }
    },
    [onFileUpload, disabled]
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
    <div className="w-full">
      <form
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="relative"
      >
        <label
          htmlFor="csv-upload"
          className={`
            relative flex flex-col items-center justify-center
            w-full h-80 border-2 border-dashed rounded-2xl
            cursor-pointer transition-all duration-200
            bg-white shadow-lg hover:shadow-xl
            ${
              dragActive
                ? "border-indigo-500 bg-indigo-50 scale-[1.02]"
                : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="flex flex-col items-center justify-center py-8 px-6">
            {loading ? (
              <>
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="mb-2 text-base font-semibold text-slate-700">
                  Analyzing your file...
                </p>
                <p className="text-sm text-slate-500">
                  This usually takes a few seconds
                </p>
              </>
            ) : (
              <>
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  {dragActive && (
                    <div className="absolute -inset-4 bg-indigo-400/20 rounded-3xl animate-pulse"></div>
                  )}
                </div>
                <p className="mb-2 text-base font-semibold text-slate-700">
                  {dragActive ? "Drop your file here" : "Drag and drop your CSV file"}
                </p>
                <p className="mb-4 text-sm text-slate-500">
                  or click to browse
                </p>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                  <svg
                    className="w-4 h-4 text-slate-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs font-medium text-slate-600">
                    CSV files only • Max 10MB
                  </span>
                </div>
              </>
            )}
          </div>
          <input
            id="csv-upload"
            type="file"
            className="hidden"
            accept=".csv,text/csv"
            onChange={handleChange}
            disabled={disabled}
          />
        </label>
      </form>
    </div>
  );
}

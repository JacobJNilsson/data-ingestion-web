"use client";

import { useCallback } from "react";
import { FileUpload } from "@/components/FileUpload";

interface CSVUploadProps {
  onFileUpload: (file: File) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function CSVUpload({ onFileUpload, loading, disabled }: CSVUploadProps) {
  const validate = useCallback((file: File) => {
    if (file.type === "text/csv" || file.name.endsWith(".csv")) return true;
    alert("Please upload a CSV file");
    return false;
  }, []);

  return (
    <FileUpload
      onFileUpload={onFileUpload}
      loading={loading}
      disabled={disabled}
      accept=".csv,text/csv"
      label="Upload CSV"
      hint=".csv files"
      id="csv-upload"
      validate={validate}
    />
  );
}

// Source contract types (CSV analysis)

export interface TopValue {
  value: string;
  count: number;
}

export interface FieldProfile {
  total_count: number;
  null_count: number;
  null_percentage: number;
  min_value: string;
  max_value: string;
  top_values: TopValue[];
}

export interface Field {
  name: string;
  data_type: string;
  profile: FieldProfile;
}

export interface SourceContract {
  source_format: string;
  source_path: string;
  encoding: string;
  delimiter: string;
  has_header: boolean;
  total_rows: number;
  fields: Field[];
  sample_data: string[][];
  issues: string[] | null;
}

// Destination contract types (PostgreSQL database analysis)

export interface FieldConstraint {
  type: "not_null" | "unique" | "primary_key" | "foreign_key" | "check";
  value?: unknown;
  referred_table?: string;
  referred_column?: string;
}

export interface DestinationField {
  name: string;
  data_type: string;
  nullable: boolean;
  description?: string;
  constraints?: FieldConstraint[];
}

export interface ValidationRules {
  required_fields?: string[];
  unique_constraints?: string[];
}

export interface SchemaContract {
  name: string;
  description?: string;
  namespace?: string;
  row_count?: number;
  fields: DestinationField[];
  sample_data?: string[][];
  validation_rules: ValidationRules;
  issues?: string[];
  metadata?: Record<string, unknown>;
}

export interface DataContract {
  contract_type: string;
  id: string;
  schemas: SchemaContract[];
  metadata?: Record<string, unknown>;
}

// Transformation contract types

export interface FieldTransformation {
  type: "rename" | "cast" | "format" | "default";
  parameters?: Record<string, unknown>;
}

export type SourceType = "field" | "null" | "constant" | "unmapped" | "transform";

export interface FieldMapping {
  destination_field: string;
  source_type: SourceType;
  source_ref?: string;
  source_field?: string;
  source_constant?: string;
  source_fields?: { ref: string; field: string }[];
  transform_description?: string;
  transformation?: FieldTransformation;
  confidence: number;
  user_edited?: boolean;
}

export interface ExecutionPlan {
  batch_size: number;
  error_threshold: number;
  validation_enabled: boolean;
}

export interface MappingGroup {
  destination_ref: string;
  field_mappings: FieldMapping[];
}

export interface TransformContract {
  contract_type: "transformation";
  transformation_id: string;
  source_refs: string[];
  destination_refs: string[];
  mapping_groups: MappingGroup[];
  execution_plan: ExecutionPlan;
  metadata?: Record<string, unknown>;
}

// Pipeline contracts

export type PipelineStepType =
  | "source"
  | "mapping"
  | "api_call"
  | "manual_label"
  | "llm_classify"
  | "lookup"
  | "destination";

export interface PipelineStep {
  id: string;
  type: PipelineStepType;
  label: string;
  depends_on: string[];
  inputs_from?: Record<string, string[]>;
  config: Record<string, unknown>;
  position?: { x: number; y: number };
}

export interface PipelineContract {
  contract_type: "pipeline";
  pipeline_id: string;
  steps: PipelineStep[];
  metadata?: Record<string, unknown>;
}

// Verification result

export interface VerifyResult {
  valid: boolean;
  contract_type?: string;
  issues?: string[];
}

// Common type for any analyzed contract (source or destination)
export type AnalyzedContract = SourceContract | DataContract;

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

// Pipeline contract types
//
// A pipeline describes how data flows from sources to destinations
// through a series of steps. Steps form a DAG: each step declares its
// inputs (source refs or previous step outputs) and produces a named
// output. "send" steps write data to a destination.

// --- Connection: a data source or destination ---

export type ConnectionRole = "source" | "destination" | "both";

export interface ConnectionEntry {
  id: string;
  label: string;
  role: ConnectionRole;
  contract: SourceContract | DataContract | null;
  selectedSchemaIndices: number[];
}

// --- Step types ---

export type PipelineStepType =
  | "map"       // Transform fields from input schema to output schema
  | "send"      // Write data to a destination (API call, DB insert)
  | "label"     // Pause for human labeling of a field
  | "classify"  // LLM-powered field classification
  | "lookup"    // Enrich from a reference source
  | "filter"    // Remove rows based on a condition
  | "merge";    // Combine multiple inputs into one dataset

// --- Step configs ---

export interface MapConfig {
  field_mappings: FieldMapping[];
}

export interface SendConfig {
  destination_ref: string;
  method?: string;
  capture_response?: string[];
}

export interface LabelConfig {
  field: string;
  options: string[];
  instructions: string;
  allow_custom: boolean;
}

export interface ClassifyConfig {
  field: string;
  output_field: string;
  categories: string[];
  prompt: string;
  model: string;
}

export interface LookupConfig {
  lookup_source: string;
  key_field: string;
  value_field: string;
  output_field: string;
}

export interface FilterConfig {
  condition: string;
}

export interface MergeConfig {
  strategy: "union" | "join";
  join_key?: string;
}

// --- Pipeline step (discriminated union) ---

export interface FieldDef {
  name: string;
  data_type: string;
}

interface StepBase {
  id: string;
  label: string;
  inputs: string[];
  output: string;
  output_schema?: FieldDef[];
  notes?: string;
  user_created?: boolean;
}

export type PipelineStep =
  | (StepBase & { type: "map"; config: MapConfig })
  | (StepBase & { type: "send"; config: SendConfig })
  | (StepBase & { type: "label"; config: LabelConfig })
  | (StepBase & { type: "classify"; config: ClassifyConfig })
  | (StepBase & { type: "lookup"; config: LookupConfig })
  | (StepBase & { type: "filter"; config: FilterConfig })
  | (StepBase & { type: "merge"; config: MergeConfig });

// --- Pipeline contract ---

export interface PipelineContract {
  contract_type: "pipeline";
  pipeline_id: string;
  sources: Record<string, { contract_ref: string; description?: string }>;
  destinations: Record<string, { contract_ref: string; description?: string }>;
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

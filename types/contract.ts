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

export interface TableContract {
  table_name: string;
  schema: string;
  fields: DestinationField[];
  validation_rules: ValidationRules;
}

export interface DatabaseContract {
  contract_type: string;
  database_id: string;
  tables: TableContract[];
  metadata?: Record<string, unknown>;
}

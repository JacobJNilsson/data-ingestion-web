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

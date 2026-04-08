export type PatientStatus = 'active' | 'inactive' | 'critical';

export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  phone: string;
  address: string;
  blood_type: string;
  status: PatientStatus;
  allergies: string;
  conditions: string;
  last_visit: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientListResponse {
  items: Patient[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface Note {
  id: number;
  patient_id: number;
  content: string;
  created_at: string;
}

export interface PatientSummary {
  patient_id: number;
  summary: string;
}

export interface PatientFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  phone: string;
  address: string;
  blood_type: string;
  status: PatientStatus;
  allergies: string;
  conditions: string;
}

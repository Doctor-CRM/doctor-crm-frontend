import type { UserRole } from "./auth";

export interface SummaryMetrics {
  total_users: number;
  total_doctors: number;
  total_patients: number;
  total_admins: number;
  total_recipients?: number;
}

export interface AdminUser {
  id: number | string;
  name: string;
  username: string;
  email: string;
  role: UserRole | string;
  status: string;
  join_date?: string;
  joinedDate?: string;
  action?: string;
}

export interface GetUserDataResponse {
  status: string;
  message: string;
  data: {
    summary: SummaryMetrics;
    users: AdminUser[];
  };
}

export interface UpdateUserPayload {
  username: string;
  name: string;
  email: string;
  role: string;
  status: string;
  action: string;
}

export interface UpdateUserResponse {
  status: string;
  message: string;
}

export interface DoctorProfile {
  id: number | string;
  user_id: number | string;
  doctor_name: string;
  gender?: string;
  contact_number?: string;
  experience_years: number;
  doctor_type: string;
  consultation_fee: number;
  doctor_abilities: string;
  availability_status: string;
}

export interface SaveDoctorProfilePayload {
  user_id?: number | string;
  doctor_name: string;
  gender?: string;
  contact_number?: string;
  experience_years: number;
  doctor_type: string;
  consultation_fee: number;
  doctor_abilities: string;
  availability_status: string;
}

export interface GetDoctorDataResponse {
  status: string;
  message: string;
  data: DoctorProfile[] | DoctorProfile;
}

export interface PatientProfile {
  id: number | string;
  user_id: number | string;
  patient_name: string;
  age: number;
  gender: string;
  blood_group: string;
  contact_number: string;
  address: string;
}

export interface SavePatientProfilePayload {
  user_id?: number | string;
  patient_name: string;
  age: number;
  gender: string;
  blood_group: string;
  contact_number: string;
  address: string;
}

export interface GetPatientDataResponse {
  status: string;
  message: string;
  data: PatientProfile[] | PatientProfile;
}

export interface HealthCheckResponse {
  status: string;
  message: string;
  db_status?: string;
  db_message?: string;
}

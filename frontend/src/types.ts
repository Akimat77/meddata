// frontend/src/types.ts

// --- Типы для Справочников ---
export interface Allergy {
  id: number;
  name: string;
}

export interface ChronicDisease {
  id: number;
  name: string;
  icd10_code?: string;
}

// --- Типы для Пользователя ---
export interface User {
  id: number;
  is_active: boolean;
  email: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string; // Даты приходят как строки
  allergies: Allergy[];
  chronic_diseases: ChronicDisease[];
}

// --- Типы для Профиля (Паспорта Здоровья) ---
export interface Profile {
    id: number;
    user_id: number;
    address?: string;
    attached_clinic?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    height?: number;
    weight?: number;
    optimal_weight?: number;
    body_mass_index?: number;
    basal_metabolism?: number;
    skeletal_muscle_mass?: number;
    fat_mass_kg?: number;
    fat_mass_percent?: number;
    waist_hip_ratio?: number;
    waist_circumference?: number;
    fat_correction?: number;
    muscle_correction?: number;
    visceral_fat?: number;
    subcutaneous_fat?: number;
    total_bio_age?: number;
    physical_age?: number;
    vascular_age?: number;
    cardio_age?: number;
    immune_age?: number;
    metabolic_age?: number;
    joint_age?: number;
    kidney_age?: number;
}

// --- Типы для Ленты Здоровья ---
export interface Record {
  id: number;
  date: string;
  resource_type: string;
  course_id?: number;
  doctor_name?: string;
  clinic_name?: string;
  patient_complaints?: string;
  conclusion_text?: string;
  diagnosis_code?: string;
  medication_name?: string;
  attachment_url?: string;
  lab_name?: string;
  test_name?: string;
  result?: string;
  reference_range?: string;
}

export type RecordCreate = Omit<Record, 'id'>;


// --- Типы для Замеров (Мониторинг) ---
export interface VitalsRecord {
  id: number;
  owner_id: number;
  timestamp: string;
  type: string;
  value: number;
  unit: string;
}

export interface Reminder {
  id: number;
  owner_id: number;
  title: string;
  time: string; // Время приходит как строка, например "09:00:00"
  days_of_week: number[];
  is_active: boolean;
}

export interface Complaint {
  id: number;
  complaint_text: string;
  start_date?: string;
  status: string;
  created_at: string;
}

export interface TreatmentCourse {
  id: number;
  owner_id: number;
  name: string;
  start_date?: string;
  status: string;
  records: Record[];
  complaints: Complaint[];
}
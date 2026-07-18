export type FamilyRole = 'parent' | 'caregiver' | 'doctor';

export interface ChildProfile {
  id: string;
  family_id: string;
  full_name: string;
  date_of_birth: string;
  gender: string | null;
  blood_group: string | null;
  birth_weight_kg: number | null;
  birth_length_cm: number | null;
  gestational_age_weeks: number | null;
  premature: boolean;
  allergies: string[];
  medical_conditions: string[];
  pediatrician_name: string | null;
  pediatrician_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  father_height_cm: number | null;
  mother_height_cm: number | null;
  photo_path: string | null;
}

export interface HealthRow {
  id: string;
  child_id: string;
  created_at?: string;
  [key: string]: unknown;
}

export const trackerTypes = [
  ['feeding', 'Feeding'], ['sleep', 'Sleep'], ['diaper', 'Diaper'], ['stool', 'Stool colour'],
  ['medication', 'Medication'], ['temperature', 'Temperature'], ['illness', 'Illness'],
  ['allergy', 'Allergy'], ['dental', 'Dental'], ['screen_time', 'Screen time'], ['mood', 'Mood'],
] as const;

export const documentTypes = [
  'Prescription', 'Laboratory report', 'Imaging', 'Discharge summary', 'Vaccination card',
  'Growth chart', 'Referral', 'Insurance', 'Other',
];

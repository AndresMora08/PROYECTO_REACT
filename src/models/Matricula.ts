import { Student } from "./Estudiante";
import { Carrera } from "./Carrera";

export enum AcademicStatus {
  ACTIVE     = "ACTIVE",
  SUSPENDED  = "SUSPENDED",
  WITHDRAWN  = "WITHDRAWN",
  AT_RISK    = "AT_RISK",
}

export interface Registration {
  id: number;
  student_id: number;
  career_id: number;
  admission_period: string;   // ej: "2026-1"
  academic_status: AcademicStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  student?: Student;
  career?: Carrera;
}
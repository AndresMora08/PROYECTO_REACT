/* ========================================================================================= */
/* Modelo de Plan de Estudio                                                                 */
/* ========================================================================================= */
import { Subject } from "./Asignatura";
import { Carrera } from "./Carrera";

export enum EstadoPlan {
  VIGENTE = "vigente",
  HISTORICO = "historico",
  ARCHIVADO = "archivado",
  BORRADOR = "borrador"
}

export interface AsignaturaPlan {
  id: string;
  subject_id: string;
  suggested_semester: number;
  credits: number;
  is_required: boolean;
  created_at: string;
  subject?: Subject;
  // Auxiliar de UI para validación E1
  has_active_enrollments?: boolean;
}

export interface VersionPlanEstudio {
  id: string;
  study_plan_id: string;
  version_number: number;
  state: EstadoPlan;
  published_at: string;
  subjects: AsignaturaPlan[];
  created_at: string;
  updated_at: string;
}

export interface PlanEstudio {
  id: string;
  career_id: string;
  year: number;
  state: EstadoPlan;
  created_at: string;
  updated_at: string;
  career?: Carrera;
  history?: VersionPlanEstudio[];
  subjects?: AsignaturaPlan[];
}

export interface DetallesPlan {
    career: string;
    year: number;
    is_active: boolean;
    total_subjects: number;
    total_credits: number;
    last_update: string;
    updated_by: string;
}
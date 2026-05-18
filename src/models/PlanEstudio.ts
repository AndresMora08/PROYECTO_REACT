import { Subject } from "./Asignatura";
import { Carrera } from "./Carrera";

export type EstadoPlan = "vigente" | "borrador";

export interface AsignaturaPlan extends Subject {
  subject?: Subject;
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
  name: string;
  year: number;
  suggested_semester: number;
  is_published: boolean;
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

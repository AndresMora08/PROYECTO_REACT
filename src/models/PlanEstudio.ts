import { Asignatura } from "./Asignatura";
import { Carrera } from "./Carrera";

export enum EstadoPlan {
  VIGENTE = "vigente",
  HISTORICO = "historico",
  ARCHIVADO = "archivado"
}

export interface AsignaturaPlan {
  id: string;
  asignaturaId: string;
  semestreSugerido: number;
  creditos: number;
  esRequerida: boolean;
  createdAt: string;
  asignatura?: Asignatura;
}

export interface VersionPlanEstudio {
  id: string;
  planEstudioId: string;
  numeroVersion: number;
  estado: EstadoPlan;
  fechaVigencia: string;
  asignaturas: AsignaturaPlan[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanEstudio {
  id: string;
  carreraId: string;
  numeroVersionActual: number;
  estado: EstadoPlan;
  createdAt: string;
  updatedAt: string;
  carrera?: Carrera;
  versionesHistorico?: VersionPlanEstudio[];
  asignaturasVigentes?: AsignaturaPlan[];
}

export interface CrearPlanEstudioInput {
  carreraId: string;
  asignaturas: {
    asignaturaId: string;
    semestreSugerido: number;
    creditos: number;
    esRequerida: boolean;
  }[];
}

export interface ActualizarAsignaturaPlanInput {
  semestreSugerido?: number;
  creditos?: number;
  esRequerida?: boolean;
}
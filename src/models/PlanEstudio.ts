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
  asignaturaId: string;
  semestreSugerido: number;
  creditos: number;
  esRequerida: boolean;
  createdAt: string;
  asignatura?: Subject;
  // Auxiliar de UI para validación E1
  tieneInscripcionesActivas?: boolean;
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

export interface DetallesPlan {
    carrera: string;
    añoVersion: number;
    estado: Boolean;
    totalAsignaturas:number;
    totalCreditos:number;
    ultimaActualizacion:string;
    actualizadoPor:string;
}
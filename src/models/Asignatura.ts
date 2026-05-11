import { Grupo } from "./Grupo";
import { PlanEstudio } from "./PlanEstudio";

export interface Asignatura {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  creditosBase: number;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
  grupos?: Grupo[];
  planEstudio?:PlanEstudio;
}
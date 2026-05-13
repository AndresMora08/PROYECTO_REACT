import { Grupo } from "./Grupo";
import { PlanEstudio } from "./PlanEstudio";

export interface Subject {
      id: string;
    name: string;
    code: string;
    description?: string;
    credits: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  grupos?: Grupo[];
  planEstudio?:PlanEstudio;
}
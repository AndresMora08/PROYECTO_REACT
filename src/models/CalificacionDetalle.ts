import { Escala } from "./Escala";
export interface CalificacionDetalle {
    id?: string;
    scale_id: string;
    student_id: string;
    score: number;      // Escala.value × peso_criterio / 100
    comment?: string;
 
    // Relación que puede venir poblada
    escala?: Escala;
 
    created_at?: string;
    updated_at?: string;
}
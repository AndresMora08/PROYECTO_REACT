import { Subject } from "./Asignatura";
import { Rubrica } from "./Rubrica";

export interface Evaluacion {
    id?: string;             // ID único de la evaluación generado por el backend
    subject_id: string;      // ID de la asignatura (UUID/String)
    group_id: string;        // ID del grupo (UUID/String)
    rubrica_id?: string | null; // ID de la rúbrica asociada (según CU-10 puede actualizarse)
    name: string;            // Nombre de la evaluación (ej: "Exam 1")
    description?: string;    // Descripción opcional (ej: "Partial exam")
    weight: number;          // Peso o porcentaje de la evaluación (ej: 40)
    
    // Relaciones pobladas opcionales (por si el backend te devuelve el objeto completo)
    Asignatura?: Subject;     
    rubrica?: Rubrica | null;
    
    // Auditoría (mencionado en las postcondiciones de la imagen: 'Evaluacion.updated_at')
    created_at?: string;
    updated_at?: string;
}
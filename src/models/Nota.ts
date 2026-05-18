
import { Inscripcion } from "./Inscripcion";
import { Rubrica } from "./Rubrica";

export interface Nota {
    id?: string;
    enrollment_id: string;   // inscripcion_id (FK)
    rubric_id: string;
    status: "BORRADOR" | "ENVIADA"; // BORRADOR = borrador, ENVIADA = enviada al estudiante
    observations?: string;
    final_score?: number;     // calculado por el backend (suma ponderada)
 
    // Relaciones que el backend puede poblar
    rubrica?: Rubrica;
    
 
    created_at?: string;
    updated_at?: string;
}
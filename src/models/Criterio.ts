import { Escala } from "./Escala";

export interface Criterio {
    id?: string;
    rubric_id: string;       // Relación con la rúbrica
    name: string;            // Ej: "Funcionalidad", "Conocimiento"
    description?: string;    // Descripción del criterio
    weight: number;          // Peso porcentual (ej: 30)
    
    // Campo opcional para manejar las escalas desde el frontend
    escalas?: Escala[]; 

    created_at?: string;
    updated_at?: string;
}
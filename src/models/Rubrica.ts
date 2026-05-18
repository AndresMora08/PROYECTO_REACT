import { Evaluacion } from "./Evaluacion";
import { Nota } from "./Nota";
import { Criterio } from "./Criterio";

export interface Rubrica {
    id?: string;             // Generado por la base de datos (UUID)
    title: string;           // Ej: "Rubric 1"
    description?: string;    // Ej: "Main rubric"
    is_public: boolean;      // Fundamental para tu caso de uso (es_publica)
    is_archived: boolean;    // Estado de archivo

    // Opcionalmente, datos de auditoría que suele devolver Flask
    created_at?: string;
    updated_at?: string;
    evaluacion?: Evaluacion;
    notas?: Nota[];
    criterios?: Criterio[];
}
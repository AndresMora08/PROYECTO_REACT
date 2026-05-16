// src/models/Estudiante.ts



import { Matricula } from "./Matricula";

import { Inscripcion } from "./Inscripcion";

import { CalificacionDetalle } from "./CalificacionDetalle";

export interface Student {

    id: string;             // ID único de la tabla estudiantes
    user_id: string;        // Enlace al ID de la cuenta del usuario
    first_name: string;
    last_name: string;
    identification: string;
    created_at: string;
    updated_at: string;




    matriculas: Matricula[];

    inscripciones: Inscripcion[];

    calificaciones: CalificacionDetalle[];



}
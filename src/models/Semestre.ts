

export enum EstadoSemestre {
	ACTIVO = "activo",
	CERRADO = "cerrado"
}

// src/models/Semestre.ts

export interface Semester {
    id: string;
    name: string;
    code: string;
    career_id?: string;
    start_date?: string;
    end_date?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CrearSemestreInput {
	carreraId: string;
	name: string;
	fechaInicio: string;
	fechaFin: string;
	estado?: EstadoSemestre;
}

export interface EditarSemestreInput {
	name?: string;
	fechaInicio?: string;
	fechaFin?: string;
	estado?: EstadoSemestre;
}

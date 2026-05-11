import { Grupo } from "./Grupo";

export enum EstadoSemestre {
	ACTIVO = "activo",
	CERRADO = "cerrado"
}

export interface Semestre {
	id: string;
	carreraId: string;
	nombre: string;
	fechaInicio: string;
	fechaFin: string;
	estado: EstadoSemestre;
	createdAt: string;
	updatedAt: string;
	grupos:Grupo[];
}

export interface CrearSemestreInput {
	carreraId: string;
	nombre: string;
	fechaInicio: string;
	fechaFin: string;
	estado?: EstadoSemestre;
}

export interface EditarSemestreInput {
	nombre?: string;
	fechaInicio?: string;
	fechaFin?: string;
	estado?: EstadoSemestre;
}

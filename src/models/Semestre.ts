import { Group } from "./Grupo";

export enum EstadoSemestre {
	ACTIVO = "activo",
	CERRADO = "cerrado"
}

export interface Semestre {
	id: string;
	carreraId: string;
	name: string;
	fechaInicio: string;
	fechaFin: string;
	estado: EstadoSemestre;
	createdAt: string;
	updatedAt: string;
	grupos:Group[];
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

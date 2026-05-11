import { Matricula } from "./Matricula";
import { PlanEstudio } from "./PlanEstudio";

export interface Carrera {
	id: string;
	nombre: string;
	codigo: string;
	descripcion?: string;
	archivada: boolean;
	createdAt: string;
	updatedAt: string;
	matriculas: Matricula[];
	planEstudios: PlanEstudio[];
}

export interface CrearCarreraInput {
	nombre: string;
	codigo: string;
	descripcion?: string;
}

export interface EditarCarreraInput {
	nombre?: string;
	codigo?: string;
	descripcion?: string;
}

import { Matricula } from "./Matricula";
import { PlanEstudio } from "./PlanEstudio";

export interface Carrera {
	id: string;
	name: string;
	codigo: string;
	descripcion?: string;
	archivada: boolean;
	createdAt: string;
	updatedAt: string;
	matriculas: Matricula[];
	planEstudios: PlanEstudio[];
}

export interface CrearCarreraInput {
	name: string;
	codigo: string;
	descripcion?: string;
}

export interface EditarCarreraInput {
	name?: string;
	codigo?: string;
	descripcion?: string;
}

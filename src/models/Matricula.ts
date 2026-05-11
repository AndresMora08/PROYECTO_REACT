import { Student } from "./Estudiante";
import { Carrera } from "./Carrera";
export enum EstadoMatricula {
	ACTIVA = "activa",
	INACTIVA = "inactiva",
	RETIRADA = "retirada"
}

export interface Matricula {
	id: string;
	estudianteId: string;
	carreraId: string;
	periodoIngreso: string;
	estado: EstadoMatricula;
	createdAt: string;
	updatedAt: string;
	estudiante: Student;
	carrera: Carrera;
}

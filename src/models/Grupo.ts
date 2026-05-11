import { Asignatura } from "./Asignatura";
import { Teacher} from "./Docente";
import { Inscripcion } from "./Inscripcion";
import { Semestre } from "./Semestre";
export interface Grupo {

    inscripciones: Inscripcion[];
    semestre: Semestre;
    Docente: Teacher;
    Asignatura: Asignatura;
    
}
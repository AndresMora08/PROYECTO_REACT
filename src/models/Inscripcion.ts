
import { Student} from "./Estudiante";
import { Grupo } from "./Grupo";
import { Nota } from "./Nota";

export interface Inscripcion {

    Estudiante: Student;
    Grupo: Grupo;
    notas:Nota[];
}
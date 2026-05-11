import { Asignatura } from "./Asignatura";
import { Rubrica } from "./Rubrica";

export interface Evaluacion {

    Asignatura: Asignatura;
    rubrica:Rubrica;
}
import { Evaluacion } from "./Evaluacion";
import { Nota } from "./Nota";
import { Criterio } from "./Criterio";

export interface Rubrica {

    evaluacion:Evaluacion;
    notas:Nota[];
    criterios:Criterio[];
}

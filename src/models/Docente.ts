// src/models/Docente.ts

import { User } from "./User";

import { Group } from "./Grupo";

export interface Teacher extends User {

    grupos: Group[];


    phone: string;

    

    speciality: string;

}
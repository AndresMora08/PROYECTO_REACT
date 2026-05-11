// src/models/Docente.ts

import { User } from "./User";

import { Grupo } from "./Grupo";

export interface Teacher extends User {

    grupos: Grupo[];

    firstName: string;

    lastName: string;

    phone: string;

    identification: number;

    speciality: string;

}
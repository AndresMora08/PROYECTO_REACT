// src/models/Estudiante.ts

import { User } from "./User";

import { Matricula } from "./Matricula";

import { Inscripcion } from "./Inscripcion";

import { CalificacionDetalle } from "./CalificacionDetalle";

export interface Student extends User {

    matriculas: Matricula[];

    inscripciones: Inscripcion[];

    calificaciones: CalificacionDetalle[];



}
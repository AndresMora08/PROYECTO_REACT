import { Subject } from "./Asignatura";
import { Teacher } from "./Docente";
import { Inscripcion } from "./Inscripcion";
import { Semestre } from "./Semestre";

export interface Group {
    // 🔹 Campos de Identificación y Estado (Generados por Backend)
    id: string;
    is_active: boolean;
    created_at?: string; // O Date, según prefieras
    updated_at?: string;

    // 🔹 Campos provenientes del JSON / Postman (Payload)
    subject_id: string;
    semester_id: string;
    teacher_id: string;
    name: string;
    group_code: string;
    capacity: number;

    // 🔹 Campos de Relaciones (Se mantienen igual en español/original)
    // Nota: Estos suelen venir en el GET cuando haces un "join" o "populate"
    inscripciones: Inscripcion[];
    semestre: Semestre;
    Docente: Teacher;
    Asignatura: Subject;
}
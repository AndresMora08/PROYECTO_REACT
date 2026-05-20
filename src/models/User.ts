// src/models/User.ts

export interface User {
    id: string;
    password: string;
    email: string;
    role: string;
    is_active: boolean; 
    code: string;
    first_name?: string;
    last_name?: string;
    identification?: string;
    phone?: string | null;
    specialty?: string | null;
    user_id?: string;
    student_id?: string;
    matriculas?: unknown[];
    inscripciones?: unknown[];
    calificaciones?: unknown[];

    created_at?: string;
}

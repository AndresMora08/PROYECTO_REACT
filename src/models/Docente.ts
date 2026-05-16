import { Group } from "./Grupo";

// src/models/Docente.ts
export interface Teacher {
    id: string;             // '5152271f-8282-4cd8-ace1-b1689a8f99fb' (ID del Profesor)
    user_id: string;        // 'eba7624b-f76b-458d-8b4b-9c1bc40e24c1' (Enlace al Usuario)
    first_name: string;     // 'Teach3'
    last_name: string;      // 'Doc'
    identification: string; // 'TCH103'
    phone: string | null;
    specialty: string | null;
    created_at: string;
    updated_at: string;
    grupos?:Group
}
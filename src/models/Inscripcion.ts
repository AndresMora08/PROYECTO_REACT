// GET /api/academic/enrollments
// POST { student_id, group_id, status }
 
export interface Inscripcion {
    id?: string;
    student_id: string;
    group_id: string;
    status: "ACTIVE" | "CANCELLED" | string;
 
    // Relaciones que el backend puede poblar
    Estudiante?: {
        id: string;
        first_name: string;
        last_name: string;
        email?: string;
        document_number?: string;
        program?: string;
        semester?: string;
    };
    Grupo?: {
        id: string;
        name: string;
        group_code?: string;
    };
 
    created_at?: string;
    updated_at?: string;
}
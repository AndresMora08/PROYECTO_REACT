export interface Escala {
    id?: string;
    criterion_id: string;    // Relación con el criterio
    name: string;            // Etiqueta (Ej: "Excelente", "Bueno")
    description?: string;    // Ej: "Cumple todos los requisitos de forma completa..."
    value: number;        
    
    created_at?: string;
    updated_at?: string;
}
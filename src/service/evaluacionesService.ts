import axios from "axios";
import { Group } from "../models/Grupo";
import { Inscripcion } from "../models/Inscripcion";

const API_URL = "http://127.0.0.1:5000/api/academic";

/**
 * Interfaz para los detalles de evaluación de un estudiante
 */
export interface EvaluacionEstudiante {
    inscripcion_id: string;
    estudiante_id: string;
    estudiante_nombre: string;
    evaluaciones: {
        id: string;
        nombre: string;
        nota: number;
        peso: number; // Ponderación en %
    }[];
    nota_ponderada: number; // Suma de (nota * peso/100)
    notas_incompletas: boolean; // Si falta calificar alguna evaluación
}

export interface RegistroNotaFinal {
    inscripcion_id: string;
    nota_final: number;
    observaciones?: string;
    completada: boolean; // Si todas las evaluaciones están calificadas
}

class EvaluacionesService {
    /**
     * Obtener todas las evaluaciones de un grupo específico
     */
    async getEvaluacionesPorGrupo(groupId: string): Promise<any> {
        try {
            const response = await axios.get(
                `${API_URL}/groups/${groupId}/evaluaciones`
            );
            return response.data.data ?? response.data;
        } catch (error) {
            console.error("Error al obtener evaluaciones del grupo:", error);
            throw error;
        }
    }

    /**
     * Obtener detalles de calificaciones de todos los estudiantes en un grupo
     * Calcula automáticamente la nota ponderada
     */
    async getCalificacionesEstudiantes(
        groupId: string
    ): Promise<EvaluacionEstudiante[]> {
        try {
            const response = await axios.get(
                `${API_URL}/groups/${groupId}/calificaciones`
            );
            
            // Si viene del backend, usamos directo
            if (response.data.data) {
                return response.data.data;
            }
            
            return response.data;
        } catch (error) {
            console.error("Error al obtener calificaciones:", error);
            throw error;
        }
    }

    /**
     * Calcular nota final ponderada localmente
     * (en caso que el backend no lo haga)
     */
    calcularNotaPonderada(evaluaciones: any[]): number {
        if (!evaluaciones || evaluaciones.length === 0) return 0;

        let sumaPonderada = 0;
        let sumaPesos = 0;

        evaluaciones.forEach((ev) => {
            if (ev.nota !== null && ev.nota !== undefined && ev.peso) {
                sumaPonderada += ev.nota * (ev.peso / 100);
                sumaPesos += ev.peso;
            }
        });

        // Normalizar en caso que los pesos no sumen 100
        return sumaPesos > 0 ? (sumaPonderada / (sumaPesos / 100)) : 0;
    }

    /**
     * Verificar si hay evaluaciones incompletas en el grupo
     */
    async verificarEvaluacionesIncompletas(
        groupId: string
    ): Promise<{ incompletas: boolean; detalles: string[] }> {
        try {
            const response = await axios.get(
                `${API_URL}/groups/${groupId}/evaluaciones/estado`
            );
            
            return response.data.data ?? {
                incompletas: false,
                detalles: []
            };
        } catch (error) {
            console.error("Error al verificar evaluaciones:", error);
            return { incompletas: false, detalles: [] };
        }
    }

    /**
     * Obtener información del semestre (verificar si está activo)
     */
    async verificarSemestreActivo(groupId: string): Promise<boolean> {
        try {
            const response = await axios.get(
                `${API_URL}/groups/${groupId}`
            );
            
            const group = response.data.data ?? response.data;
            return group.semestre?.estado === true || group.semestre?.is_active === true;
        } catch (error) {
            console.error("Error al verificar semestre:", error);
            return false;
        }
    }
}

export const evaluacionesService = new EvaluacionesService();

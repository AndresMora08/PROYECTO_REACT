import axios from "axios";
import { Evaluacion } from "../models/Evaluacion";

// 💡 URL base apuntando exactamente al endpoint de evaluaciones que marca tu Postman
const API_URL = "http://127.0.0.1:5000/api/evaluation/evaluations";

class EvaluationService {

    // =====================================================
    // 🔹 OBTENER TODAS LAS EVALUACIONES
    // =====================================================
    async getEvaluations(): Promise<Evaluacion[]> {
        const response = await axios.get<any>(API_URL);
        // Retornamos response.data.data si tu backend envuelve la respuesta, sino response.data
        return response.data.data ?? response.data;
    }

    // =====================================================
    // 🔹 OBTENER EVALUACIÓN POR ID
    // =====================================================
    async getEvaluationById(id: string): Promise<Evaluacion | null> {
        try {
            const response = await axios.get<any>(`${API_URL}/${id}`);
            return response.data.data ?? response.data;
        } catch (error) {
            console.error("Evaluación no encontrada:", error);
            return null;
        }
    }

    // =====================================================
    // 🔹 BUSCAR EVALUACIONES (Filtro por nombre)
    // =====================================================
    async searchEvaluations(name: string): Promise<Evaluacion[]> {
        const response = await axios.get<any>(`${API_URL}/search`, {
            params: { name }
        });
        return response.data.data ?? response.data;
    }

    // =====================================================
    // 🔹 CREAR EVALUACIÓN
    // =====================================================
    async createEvaluation(data: {
        subject_id: string;
        group_id: string;
        name: string;
        description?: string;
        weight: number;
        rubrica_id?: string | null;
    }): Promise<Evaluacion> {
        // Axios post enviará el Body exactamente igual a como lo pide Postman
        const response = await axios.post<Evaluacion>(API_URL, data);
        return response.data;
    }

    // =====================================================
    // 🔹 ACTUALIZAR EVALUACIÓN (Incluye asociar rúbrica CU-10)
    // =====================================================
    async updateEvaluation(id: string, data: Partial<Evaluacion>): Promise<Evaluacion> {
        // Este método será fundamental para el CU-10, donde le mandarás el { rubrica_id: "..." }
        const response = await axios.put<Evaluacion>(`${API_URL}/${id}`, data);
        return response.data;
    }

    // =====================================================
    // 🔹 ELIMINAR EVALUACIÓN
    // =====================================================
    async deleteEvaluation(id: string): Promise<boolean> {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return true;
        } catch (error) {
            console.error("Error al eliminar la evaluación:", error);
            return false;
        }
    }

    // =====================================================
    // 🔹 ASOCIAR RÚBRICA Y ASIGNATURA A EVALUACIÓN (CU-10)
    // =====================================================
    async associateRubric(evaluationId: string, rubricId: string, subjectId: string): Promise<Evaluacion> {
        // Usa la URL que indicaste y envía el subject_id en el cuerpo
        const response = await axios.patch<Evaluacion>(
            `${API_URL}/${evaluationId}/associate-rubric/${rubricId}`,
            { subject_id: subjectId },
            { headers: { "Content-Type": "application/json" } }
        );
        return response.data;
    }
}

export const evaluationService = new EvaluationService();
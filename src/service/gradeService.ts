import axios from "axios";
import { Nota } from "../models/Nota";

const API_URL = "http://127.0.0.1:5000/api/evaluation/grades";

const unwrap = (response: any): any =>
    response.data?.data ?? response.data;

export interface CreateGradePayload {
    enrollment_id: string;
    rubric_id: string;
    status: "DRAFT" | "SENT";
    observations?: string;
   
}

class GradeService {

    /** Obtener todas las notas */
    async getGrades(): Promise<Nota[]> {
        const response = await axios.get<any>(API_URL);
        return unwrap(response);
    }

    /** Obtener nota por ID */
    async getGradeById(id: string): Promise<Nota> {
        const response = await axios.get<any>(`${API_URL}/${id}`);
        return unwrap(response);
    }

    /**
     * Buscar notas por status (DRAFT | SENT)
     * GET /api/evaluation/grades/search?status=DRAFT
     */
    async searchGrades(status: "DRAFT" | "SENT"): Promise<Nota[]> {
        const response = await axios.get<any>(`${API_URL}/search`, {
            params: { status },
        });
        return unwrap(response);
    }

    /**
     * Crear nota con sus detalles por criterio
     * POST /api/evaluation/grades
     * Body: { enrollment_id, rubric_id, status, observations, details:[{scale_id, comment}] }
     */
    async createGrade(payload: CreateGradePayload): Promise<Nota> {
        const response = await axios.post<any>(API_URL, payload);
        return unwrap(response);
    }

    /**
     * Actualizar nota (cambiar status a SENT o editar observaciones)
     * PUT /api/evaluation/grades/:id
     * Body: { status, observations }
     */
    async updateGrade(
        id: string,
        data: { status?: "DRAFT" | "SENT"; observations?: string }
    ): Promise<Nota> {
        const response = await axios.put<any>(`${API_URL}/${id}`, data);
        return unwrap(response);
    }

    /** Eliminar nota */
    async deleteGrade(id: string): Promise<boolean> {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return true;
        } catch (error) {
            console.error("Error al eliminar nota:", error);
            return false;
        }
    }
}

export const gradeService = new GradeService();
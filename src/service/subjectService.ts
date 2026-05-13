import axios from "axios";
import { Subject } from "../models/Asignatura";

const API_URL = "http://127.0.0.1:5000/api/academic/subjects";

class SubjectService {

    // =====================================================
    // 🔹 OBTENER TODAS
    // =====================================================
    async getSubjects(): Promise<Subject[]> {
        const response = await axios.get<any>(API_URL);
        return response.data.data ?? response.data;
    }

    // =====================================================
    // 🔹 OBTENER POR ID
    // =====================================================
    async getSubjectById(id: string): Promise<Subject | null> {
        try {
            const response = await axios.get<any>(`${API_URL}/${id}`);
            return response.data.data ?? response.data;
        } catch (error) {
            console.error("Asignatura no encontrada:", error);
            return null;
        }
    }

    // =====================================================
    // 🔹 CREAR
    // =====================================================
    async createSubject(data: {
        name: string;
        code: string;
        description?: string;
        credits: number;
    }): Promise<Subject> {
        const response = await axios.post<Subject>(API_URL, {
            ...data,
            is_active: true,
        });
        return response.data;
    }

    // =====================================================
    // 🔹 ACTUALIZAR
    // =====================================================
    async updateSubject(
        id: string,
        data: Partial<{
            name: string;
            code: string;
            description: string;
            credits: number;
            is_active: boolean;
        }>
    ): Promise<Subject> {
        const response = await axios.put<Subject>(`${API_URL}/${id}`, data);
        return response.data;
    }

    // =====================================================
    // 🔹 ARCHIVAR (desactivar)
    // =====================================================
    async archiveSubject(id: string): Promise<Subject> {
        const response = await axios.put<Subject>(`${API_URL}/${id}`, {
            is_active: false,
        });
        return response.data;
    }

    // =====================================================
    // 🔹 ELIMINAR
    // =====================================================
    async deleteSubject(id: string): Promise<boolean> {
        await axios.delete(`${API_URL}/${id}`);
        return true;
    }
}

export const subjectService = new SubjectService();
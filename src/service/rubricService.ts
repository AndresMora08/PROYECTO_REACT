import axios from "axios";
import { Rubrica } from "../models/Rubrica"; // Ajusta la ruta a donde guardaste la interfaz

const API_URL = "http://127.0.0.1:5000/api/evaluation/rubrics";

class RubricService {

    // =====================================================
    // 🔹 OBTENER TODAS LAS RÚBRICAS
    // =====================================================
    async getRubrics(): Promise<Rubrica[]> {
        const response = await axios.get<any>(API_URL);
        return response.data.data ?? response.data;
    }

    // =====================================================
    // 🔹 OBTENER RÚBRICA POR ID
    // =====================================================
    async getRubricById(id: string): Promise<Rubrica | null> {
        try {
            const response = await axios.get<any>(`${API_URL}/${id}`);
            return response.data.data ?? response.data;
        } catch (error) {
            console.error("Rúbrica no encontrada:", error);
            return null;
        }
    }

    // =====================================================
    // 🔹 BUSCAR RÚBRICAS (Filtro por título)
    // =====================================================
    async searchRubrics(title: string): Promise<Rubrica[]> {
        const response = await axios.get<any>(`${API_URL}/search`, {
            params: { title }
        });
        return response.data.data ?? response.data;
    }

    // =====================================================
    // 🔹 CREAR RÚBRICA
    // =====================================================
    async createRubric(data: Rubrica): Promise<Rubrica> {
        const response = await axios.post<Rubrica>(API_URL, data);
        return response.data;
    }

    // =====================================================
    // 🔹 ACTUALIZAR RÚBRICA (PUT)
    // =====================================================
    async updateRubric(id: string, data: Partial<Rubrica>): Promise<Rubrica> {
        const response = await axios.put<Rubrica>(`${API_URL}/${id}`, data);
        return response.data;
    }

    // =====================================================
    // 🔹 PUBLICAR RÚBRICA (PATCH)
    // =====================================================
    async publishRubric(id: string): Promise<Rubrica> {
        // En tu Postman, esto es un PATCH a /:rubric_id/publish
        const response = await axios.patch<Rubrica>(`${API_URL}/${id}/publish`);
        return response.data;
    }

    // =====================================================
    // 🔹 ELIMINAR RÚBRICA
    // =====================================================
    async deleteRubric(id: string): Promise<boolean> {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return true;
        } catch (error) {
            console.error("Error al eliminar la rúbrica:", error);
            return false;
        }
    }
}

export const rubricService = new RubricService();
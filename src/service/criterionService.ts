import axios from "axios";
import { Criterio } from "../models/Criterio";

const API_URL = "http://127.0.0.1:5000/api/evaluation/criteria";

// Helper: el backend puede devolver { data: [...] } o directamente [...]
const unwrap = (response: any): any =>
    response.data?.data ?? response.data;

class CriterionService {

    async getCriteria(): Promise<Criterio[]> {
        const response = await axios.get<any>(API_URL);
        return unwrap(response);
    }

    /** Filtra en cliente por rubric_id */
    async getCriteriaByRubric(rubricId: string): Promise<Criterio[]> {
        const all = await this.getCriteria();
        return all.filter((c: Criterio) => c.rubric_id === rubricId);
    }

    async getCriterionById(id: string): Promise<Criterio> {
        const response = await axios.get<any>(`${API_URL}/${id}`);
        return unwrap(response);
    }

    async createCriterion(
        data: Omit<Criterio, "id" | "created_at" | "updated_at" | "scales">
    ): Promise<Criterio> {
        const response = await axios.post<any>(API_URL, data);
        return unwrap(response);
    }

    async updateCriterion(
        id: string,
        data: Omit<Criterio, "id" | "created_at" | "updated_at" | "scales">
    ): Promise<Criterio> {
        const response = await axios.put<any>(`${API_URL}/${id}`, data);
        return unwrap(response);
    }

    async deleteCriterion(id: string): Promise<boolean> {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return true;
        } catch (error) {
            console.error("Error al eliminar criterio:", error);
            return false;
        }
    }

    async searchCriteria(name: string): Promise<Criterio[]> {
        const response = await axios.get<any>(`${API_URL}/search`, {
            params: { name },
        });
        return unwrap(response);
    }
}

export const criterionService = new CriterionService();
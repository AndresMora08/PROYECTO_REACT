import axios from "axios";
import { Escala } from "../models/Escala";

const API_URL = "http://127.0.0.1:5000/api/evaluation/scales";

const unwrap = (response: any): any =>
    response.data?.data ?? response.data;

class ScaleService {

    async getScales(): Promise<Escala[]> {
        const response = await axios.get<any>(API_URL);
        return unwrap(response);
    }

    async getScalesByCriterion(criterionId: string): Promise<Escala[]> {
        const all = await this.getScales();
        return all.filter((s: Escala) => s.criterion_id === criterionId);
    }

    async getScaleById(id: string): Promise<Escala> {
        const response = await axios.get<any>(`${API_URL}/${id}`);
        return unwrap(response);
    }

    async createScale(
        data: Omit<Escala, "id" | "created_at" | "updated_at">
    ): Promise<Escala> {
        const response = await axios.post<any>(API_URL, data);
        return unwrap(response);
    }

    async updateScale(
        id: string,
        data: Omit<Escala, "id" | "created_at" | "updated_at">
    ): Promise<Escala> {
        const response = await axios.put<any>(`${API_URL}/${id}`, data);
        return unwrap(response);
    }

    async deleteScale(id: string): Promise<boolean> {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return true;
        } catch (error) {
            console.error("Error al eliminar escala:", error);
            return false;
        }
    }

    async searchScales(name: string): Promise<Escala[]> {
        const response = await axios.get<any>(`${API_URL}/search`, {
            params: { name },
        });
        return unwrap(response);
    }
}

export const scaleService = new ScaleService();
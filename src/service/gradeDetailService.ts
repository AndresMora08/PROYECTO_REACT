import axios from "axios";
import{CalificacionDetalle} from "../models/CalificacionDetalle";

const API_URL = "http://127.0.0.1:5000/api/evaluation/grade-details";

const unwrap = (response: any): any =>
    response.data?.data ?? response.data;

class GradeDetailService {

    async getDetails(): Promise<CalificacionDetalle[]> {
        const response = await axios.get<any>(API_URL);
        return unwrap(response);
    }

    async getDetailById(id: string): Promise<CalificacionDetalle> {
        const response = await axios.get<any>(`${API_URL}/${id}`);
        return unwrap(response);
    }

    /**
     * POST /api/evaluation/grade-details
     * Body: { scale_id, student_id, score, comment }
     */
    async createDetail(data: Omit<CalificacionDetalle, "id" | "created_at" | "updated_at" | "escala">): Promise<CalificacionDetalle> {
        const response = await axios.post<any>(API_URL, data);
        return unwrap(response);
    }

    /**
     * PUT /api/evaluation/grade-details/:id
     * Body: { comment, score, scale_id, student_id }
     */
    async updateDetail(
        id: string,
        data: Omit<CalificacionDetalle, "id" | "created_at" | "updated_at" | "escala">
    ): Promise<CalificacionDetalle> {
        const response = await axios.put<any>(`${API_URL}/${id}`, data);
        return unwrap(response);
    }

    async deleteDetail(id: string): Promise<boolean> {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * GET /api/evaluation/grade-details/search?comment=...
     */
    async searchDetails(comment: string): Promise<CalificacionDetalle[]> {
        const response = await axios.get<any>(`${API_URL}/search`, {
            params: { comment },
        });
        return unwrap(response);
    }
}

export const gradeDetailService = new GradeDetailService();
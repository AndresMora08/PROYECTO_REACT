import axios from "axios";
import { Inscripcion } from "../models/Inscripcion";

const API_URL = "http://127.0.0.1:5000/api/academic/enrollments";

const unwrap = (response: any): any =>
    response.data?.data ?? response.data;

class EnrollmentService {

    async getEnrollments(): Promise<Inscripcion[]> {
        const response = await axios.get<any>(API_URL);
        return unwrap(response);
    }

    /** Filtra en cliente por group_id */
    async getEnrollmentsByGroup(groupId: string): Promise<Inscripcion[]> {
        const all = await this.getEnrollments();
        return all.filter((e: Inscripcion) => e.group_id === groupId);
    }

    async getEnrollmentById(id: string): Promise<Inscripcion> {
        const response = await axios.get<any>(`${API_URL}/${id}`);
        return unwrap(response);
    }

    /** GET /api/academic/enrollments/search?status=ACTIVE */
    async searchEnrollments(status: string): Promise<Inscripcion[]> {
        const response = await axios.get<any>(`${API_URL}/search`, {
            params: { status },
        });
        return unwrap(response);
    }

    async createEnrollment(data: {
        student_id: string;
        group_id: string;
        status: string;
    }): Promise<Inscripcion> {
        const response = await axios.post<any>(API_URL, data);
        return unwrap(response);
    }

    async updateEnrollment(
        id: string,
        data: { student_id: string; group_id: string; status: string }
    ): Promise<Inscripcion> {
        const response = await axios.put<any>(`${API_URL}/${id}`, data);
        return unwrap(response);
    }

    async deleteEnrollment(id: string): Promise<boolean> {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return true;
        } catch {
            return false;
        }
    }
}

export const enrollmentService = new EnrollmentService();
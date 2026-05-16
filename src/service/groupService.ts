import axios from "axios";
import { Group } from "../models/Grupo";

const API_URL = "http://127.0.0.1:5000/api/academic/groups";

class GroupService {

    // =====================================================
    // 🔹 OBTENER TODOS LOS GRUPOS
    // =====================================================
    async getGroups(): Promise<Group[]> {
        const response = await axios.get<any>(API_URL);
        // Según tu API, los datos suelen venir en response.data.data
        return response.data.data ?? response.data;
    }

    // =====================================================
    // 🔹 OBTENER GRUPO POR ID
    // =====================================================
    async getGroupById(id: string): Promise<Group | null> {
        try {
            const response = await axios.get<any>(`${API_URL}/${id}`);
            return response.data.data ?? response.data;
        } catch (error) {
            console.error("Grupo no encontrado:", error);
            return null;
        }
    }

    // =====================================================
    // 🔹 BUSCAR GRUPOS (Filtro por nombre)
    // =====================================================
    async searchGroups(name: string): Promise<Group[]> {
        const response = await axios.get<any>(`${API_URL}/search`, {
            params: { name }
        });
        return response.data.data ?? response.data;
    }

    // =====================================================
    // 🔹 CREAR GRUPO
    // =====================================================
    async createGroup(data: {
        subject_id: string;
        semester_id: string;
        teacher_id: string;
        name: string;
        group_code: string;
        capacity: number;
    }): Promise<Group> {
        const response = await axios.post<Group>(API_URL, data);
        return response.data;
    }

    // =====================================================
    // 🔹 ACTUALIZAR GRUPO
    // =====================================================
    async updateGroup(
        id: string,
        data: Partial<{
            subject_id: string;
            semester_id: string;
            teacher_id: string;
            name: string;
            group_code: string;
            capacity: number;
        }>
    ): Promise<Group> {
        const response = await axios.put<Group>(`${API_URL}/${id}`, data);
        return response.data;
    }

    // =====================================================
    // 🔹 ASIGNAR DOCENTE A GRUPO (Patch específico del Postman)
    // =====================================================
    async assignTeacher(groupId: string, teacherId: string): Promise<Group> {
        const response = await axios.patch<Group>(
            `${API_URL}/${groupId}/assign-teacher/${teacherId}`
        );
        return response.data;
    }

    // =====================================================
    // 🔹 ELIMINAR GRUPO
    // =====================================================
    async deleteGroup(id: string): Promise<boolean> {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return true;
        } catch (error) {
            console.error("Error al eliminar el grupo:", error);
            return false;
        }
    }
}

export const groupService = new GroupService();
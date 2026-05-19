// src/service/semesterService.ts
import axios from "axios";
import { Semester } from "../models/Semestre";

const BASE = "http://127.0.0.1:5000/api/academic/semesters";

export const semesterService = {

    // GET /api/academic/semesters
    getSemesters: async (): Promise<Semester[]> => {
        try {
            const response = await axios.get(BASE);
            // 🔹 Acceso seguro: desempaqueta si viene envuelto en .data.data
            return response.data.data ?? response.data ?? [];
        } catch (error) {
            console.error("Error al obtener semestres:", error);
            return [];
        }
    },

    // GET /api/academic/semesters/:id
    getSemesterById: async (id: string): Promise<Semester | null> => {
        try {
            const response = await axios.get(`${BASE}/${id}`);
            return response.data.data ?? response.data ?? null;
        } catch (error) {
            console.error(`Error al obtener el semestre con ID ${id}:`, error);
            return null;
        }
    },

    // GET /api/academic/semesters/search?name=...&is_active=...
    searchSemesters: async (params: Record<string, string | boolean>): Promise<Semester[]> => {
        try {
            const response = await axios.get(`${BASE}/search`, { params });
            return response.data.data ?? response.data ?? [];
        } catch (error) {
            console.error("Error al buscar semestres:", error);
            return [];
        }
    },

    // Retorna el primer semestre activo (is_active === true)
    getActiveSemester: async (): Promise<Semester | null> => {
        try {
            const response = await axios.get(BASE);
            const data = response.data.data ?? response.data;
            const all: Semester[] = Array.isArray(data) ? data : [];
            return all.find((s) => s.is_active) ?? null;
        } catch (error) {
            console.error("Error al obtener el semestre activo:", error);
            return null;
        }
    },

    // POST /api/academic/semesters
    createSemester: async (data: Partial<Semester>): Promise<any> => {
        try {
            const response = await axios.post(BASE, data);
            return response.data.data ?? response.data;
        } catch (error) {
            console.error("Error al crear semestre:", error);
            throw error; // Se relanza para que el formulario o componente maneje la alerta visual
        }
    },

    // PUT /api/academic/semesters/:id
    updateSemester: async (id: string, data: Partial<Semester>): Promise<Semester | null> => {
        try {
            const response = await axios.put(`${BASE}/${id}`, data);
            return response.data.data ?? response.data ?? null;
        } catch (error) {
            console.error(`Error al actualizar el semestre con ID ${id}:`, error);
            return null;
        }
    },

    // DELETE /api/academic/semesters/:id
    deleteSemester: async (id: string): Promise<boolean> => {
        try {
            await axios.delete(`${BASE}/${id}`);
            return true;
        } catch (error) {
            console.error(`Error al eliminar el semestre con ID ${id}:`, error);
            return false;
        }
    },
};
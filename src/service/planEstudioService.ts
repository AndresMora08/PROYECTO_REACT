import axios from "axios";
import { PlanEstudio, VersionPlanEstudio } from "../models/PlanEstudio";
import { Subject } from "../models/Asignatura";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";
const API_URL = `${API_BASE_URL}/api/academic/study-plans`;
const CARRERAS_URL = `${API_BASE_URL}/api/academic/careers`;
const SUBJECTS_URL = `${API_BASE_URL}/api/academic/subjects`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

const extractApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError(error)) {
    const apiMessage =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.response?.data?.details;

    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage;
    }

    if (error.code === "ERR_NETWORK") {
      return "No se pudo conectar con el backend. Verifique que la API este activa y que permita peticiones desde el frontend.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};

const mapPlan = (raw: any): PlanEstudio => ({
  id: raw.id,
  career_id: raw.career_id,
  name: raw.name,
  year: raw.year,
  suggested_semester: raw.suggested_semester,
  is_published: Boolean(raw.is_published),
  created_at: raw.created_at,
  updated_at: raw.updated_at,
  subjects: raw.subjects ?? []
});

class PlanEstudioService {
  async getCarreras(): Promise<any[]> {
    try {
      const response = await axios.get<any>(CARRERAS_URL, getAuthHeaders());
      const data = response.data.data ?? response.data;
      return Array.isArray(data) ? data.filter(Boolean) : [];
    } catch (error) {
      console.error("Error al obtener carreras:", error);
      return [];
    }
  }

  async getSubjects(): Promise<Subject[]> {
    try {
      const response = await axios.get<any>(SUBJECTS_URL, getAuthHeaders());
      const data = response.data.data ?? response.data;
      return Array.isArray(data) ? data.filter(Boolean) : [];
    } catch (error) {
      console.error("Error al obtener catalogo de materias:", error);
      return [];
    }
  }

  async crearPlan(carreraId: string, careerName: string, anio: number): Promise<PlanEstudio | null> {
    const payload = {
      career_id: carreraId,
      name: `Plan de estudios ${careerName} ${anio}`,
      year: anio,
      suggested_semester: 1,
      is_published: false
    };

    try {
      const response = await axios.post(`${API_URL}`, payload, getAuthHeaders());
      const data = response.data.data ?? response.data;
      return data ? mapPlan(data) : null;
    } catch (error) {
      console.error("Error al crear plan:", error);
      throw new Error(
        extractApiErrorMessage(error, "No se pudo crear el plan de estudios.")
      );
    }
  }

  async getPlanesPorCarrera(carreraId: string): Promise<PlanEstudio[]> {
    try {
      const response = await axios.get(API_URL, getAuthHeaders());
      const data = response.data.data ?? response.data;
      return Array.isArray(data)
        ? data.filter((item: any) => item && item.career_id === carreraId).map(mapPlan)
        : [];
    } catch (error) {
      console.error("Error al obtener planes por carrera:", error);
      return [];
    }
  }

  async getSubjectsByPlan(planId: string): Promise<Subject[]> {
    try {
      const response = await axios.get(`${API_URL}/${planId}/subjects`, getAuthHeaders());
      const data = response.data.data ?? response.data;
      return Array.isArray(data) ? data.filter(Boolean) : [];
    } catch (error) {
      console.error("Error al obtener asignaturas del plan:", error);
      return [];
    }
  }

  async getHistorialVersiones(carreraId: string): Promise<VersionPlanEstudio[]> {
    const planes = await this.getPlanesPorCarrera(carreraId);
    return planes.map((plan) => ({
      id: plan.id,
      study_plan_id: plan.id,
      version_number: plan.year,
      state: plan.is_published ? "vigente" : "borrador",
      published_at: plan.updated_at,
      subjects: plan.subjects ?? [],
      created_at: plan.created_at,
      updated_at: plan.updated_at
    }));
  }

  async actualizarPlan(
    planId: string,
    data: Partial<Pick<PlanEstudio, "name" | "year" | "suggested_semester" | "is_published">>
  ): Promise<PlanEstudio | null> {
    try {
      const response = await axios.put(`${API_URL}/${planId}`, data, getAuthHeaders());
      const rawPlan = response.data.data ?? response.data;
      return rawPlan ? mapPlan(rawPlan) : null;
    } catch (error) {
      console.error("Error al actualizar plan:", error);
      throw new Error(
        extractApiErrorMessage(error, "No se pudo actualizar el plan de estudios.")
      );
    }
  }

  async publicarPlan(planId: string): Promise<PlanEstudio | null> {
    return this.actualizarPlan(planId, { is_published: true });
  }

  async vincularAsignatura(planId: string, subjectId: string): Promise<PlanEstudio | null> {
    try {
      const response = await axios.post(`${API_URL}/${planId}/subjects/${subjectId}`, undefined, getAuthHeaders());
      const data = response.data.data ?? response.data;
      return data ? mapPlan(data) : null;
    } catch (error) {
      console.error("Error al vincular asignatura:", error);
      throw new Error(
        extractApiErrorMessage(error, "No se pudo vincular la asignatura al plan.")
      );
    }
  }

  async desvincularAsignatura(planId: string, subjectId: string): Promise<boolean> {
    try {
      await axios.delete(`${API_URL}/${planId}/subjects/${subjectId}`, getAuthHeaders());
      return true;
    } catch (error) {
      console.error("Error al desvincular asignatura:", error);
      return false;
    }
  }
}

export const planEstudioService = new PlanEstudioService();

import axios from "axios";
import { PlanEstudio, AsignaturaPlan, VersionPlanEstudio } from "../models/PlanEstudio";
const API_URL = "http://127.0.0.1:5000/api/academic/study-plans";
/* CORREGIDO: Se eliminó la barra final para coincidir con la ruta que funcionó en Postman */
const CARRERAS_URL = "http://127.0.0.1:5000/api/academic/careers";
/* NUEVO: Endpoint para el catálogo de materias */
const SUBJECTS_URL = "http://127.0.0.1:5000/api/academic/subjects";

/* Helper para obtener headers con token de seguridad */
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

class PlanEstudioService {
  /**
   * Obtiene todas las carreras para el listado inicial.
   */
  async getCarreras(): Promise<any[]> {
    try {
      const response = await axios.get<any>(CARRERAS_URL, getAuthHeaders());
      /* Retornamos los datos tal cual vienen (usando name, code, updated_at) */
      return response.data.data ?? response.data ?? [];
    } catch (error) {
      console.error("Error al obtener carreras:", error);
      return [];
    }
  }

  /**
   * Obtiene el catálogo global de materias.
   */
  async getSubjects(): Promise<any[]> {
    try {
      const response = await axios.get<any>(SUBJECTS_URL, getAuthHeaders());
      /* Retornamos los datos tal cual vienen (usando name, code, credits) */
      return response.data.data ?? response.data ?? [];
    } catch (error) {
      console.error("Error al obtener catálogo de materias:", error);
      return [];
    }
  }

  /**
   * Crea una nueva carrera. 
   */
  async createCarrera(data: { name: string; code: string; description?: string }): Promise<any> {
    try {
      const response = await axios.post<any>(CARRERAS_URL, data, getAuthHeaders());
      // El backend suele responder con el objeto creado en .data o .data.data
      return response.data.data ?? response.data;
    } catch (error) {
      console.error("Error al crear carrera:", error);
      throw error;
    }
  }

  /**
   * Obtiene el plan de estudios vigente para una carrera específica.
   * Mapea la respuesta del backend al modelo PlanEstudio de la App.
   */
  async getPlanVigente(carreraId: string): Promise<PlanEstudio | null> {
    try {
      const response = await axios.get(`${API_URL}/career/${carreraId}/vigente`, getAuthHeaders());
      /* Retornamos el objeto raw del backend */
      return response.data.data ?? response.data ?? null;
    } catch (error) {
      console.error("Error al obtener el plan vigente:", error);
      return null;
    }
  }

  /**
   * Obtiene todas las versiones pasadas (historial) de un plan.
   */
  async getHistorialVersiones(planId: string): Promise<VersionPlanEstudio[]> {
    try {
      const response = await axios.get(`${API_URL}/${planId}/historial`, getAuthHeaders());
      return response.data.data ?? [];
    } catch (error) {
      console.error("Error al obtener historial de versiones:", error);
      return [];
    }
  }

  /**
   * Vincula una asignatura del catálogo al plan de estudios actual. 
   */
  async vincularAsignatura(planId: string, data: Partial<AsignaturaPlan>): Promise<AsignaturaPlan | null> {
    try {
      /* Enviamos los datos directamente asumiendo que el componente ya usa las llaves del backend */
      const response = await axios.post(`${API_URL}/${planId}/asignaturas`, data, getAuthHeaders());
      return response.data.data ?? response.data;
    } catch (error) {
      console.error("Error al vincular asignatura:", error);
      throw error; // Permitimos que el componente maneje el error (ej: con SweetAlert)
    }
  }

  /**
   * Actualiza los detalles de una asignatura ya vinculada (edición).
   */
  async actualizarAsignaturaVinculada(idVinculacion: string, data: Partial<AsignaturaPlan>): Promise<boolean> {
    try {
      /*Mapeo manual de campos editables */
      await axios.put(`${API_URL}/asignaturas-vinculadas/${idVinculacion}`, data, getAuthHeaders());
      return true;
    } catch (error) {
      console.error("Error al actualizar vinculación:", error);
      return false;
    }
  }

  /**
   * Elimina la vinculación de una asignatura
   */
  async desvincularAsignatura(idVinculacion: string): Promise<boolean> {
    try {
      await axios.delete(`${API_URL}/asignaturas-vinculadas/${idVinculacion}`, getAuthHeaders());
      return true;
    } catch (error) {
      console.error("Error al desvincular asignatura:", error);
      return false;
    }
  }

  /**
   * Publica una nueva versión del plan de estudios
   */
  async publicarNuevaVersion(planId: string, año: number): Promise<PlanEstudio | null> {
    try {
      /*Envío del año de la versión como parámetro del body */
      const response = await axios.post(`${API_URL}/${planId}/publicar`, {
        version_number: año
      }, getAuthHeaders());
      return response.data.data ?? response.data;
    } catch (error) {
      console.error("Error al publicar nueva versión:", error);
      return null;
    }
  }
}

export const planEstudioService = new PlanEstudioService();
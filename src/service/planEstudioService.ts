import axios from "axios";
import { PlanEstudio, AsignaturaPlan, VersionPlanEstudio } from "../models/PlanEstudio";

const API_URL = "http://127.0.0.1:5000/api/planes-estudio";
/* MODIFICADO: Agregada URL para carreras ya que es necesaria para el listado inicial */
const CARRERAS_URL = "http://127.0.0.1:5000/api/carreras";

class PlanEstudioService {
  /**
   * MODIFICADO: Obtiene todas las carreras para el listado inicial.
   */
  async getCarreras(): Promise<any[]> {
    try {
      const response = await axios.get(CARRERAS_URL);
      return response.data.data ?? response.data;
    } catch (error) {
      console.error("Error al obtener carreras:", error);
      return [];
    }
  }

  /**
   * Obtiene el plan de estudios vigente para una carrera específica.
   * Mapea la respuesta del backend al modelo PlanEstudio de la App.
   */
  async getPlanVigente(carreraId: string): Promise<PlanEstudio | null> {
    try {
      /* MODIFICADO: Endpoint corregido para seguir estructura REST */
      const response = await axios.get(`${API_URL}/carrera/${carreraId}/vigente`);
      // MODIFICADO: Manejo de envoltura de datos .data.data
      return response.data.data ?? response.data;
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
      const response = await axios.get(`${API_URL}/${planId}/historial`);
      return response.data.data ?? [];
    } catch (error) {
      console.error("Error al obtener historial de versiones:", error);
      return [];
    }
  }

  /**
   * Vincula una asignatura del catálogo al plan de estudios actual.
   * Aquí es donde mapeamos de camelCase a lo que espere el backend (ej: snake_case)
   */
  async vincularAsignatura(planId: string, data: Partial<AsignaturaPlan>): Promise<AsignaturaPlan | null> {
    try {
      /* MODIFICADO: Mapeo manual a snake_case para compatibilidad con el Backend */
      const response = await axios.post(`${API_URL}/${planId}/asignaturas`, {
        asignatura_id: data.asignaturaId,
        semestre_sugerido: data.semestreSugerido,
        creditos: data.creditos,
        es_requerida: data.esRequerida
      });
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
      /* MODIFICADO: Mapeo manual de campos editables */
      await axios.put(`${API_URL}/asignaturas-vinculadas/${idVinculacion}`, {
        semestre_sugerido: data.semestreSugerido,
        creditos: data.creditos
      });
      return true;
    } catch (error) {
      console.error("Error al actualizar vinculación:", error);
      return false;
    }
  }

  /**
   * Elimina la vinculación de una asignatura (Regla E1: El backend validará si hay inscritos).
   */
  async desvincularAsignatura(idVinculacion: string): Promise<boolean> {
    try {
      await axios.delete(`${API_URL}/asignaturas-vinculadas/${idVinculacion}`);
      return true;
    } catch (error) {
      console.error("Error al desvincular asignatura:", error);
      return false;
    }
  }

  /**
   * Publica una nueva versión del plan de estudios (Regla E2).
   */
  async publicarNuevaVersion(planId: string, año: number): Promise<PlanEstudio | null> {
    try {
      /* MODIFICADO: Envío del año de la versión como parámetro del body */
      const response = await axios.post(`${API_URL}/${planId}/publicar`, {
        numero_version: año
      });
      return response.data.data ?? response.data;
    } catch (error) {
      console.error("Error al publicar nueva versión:", error);
      return null;
    }
  }
}

export const planEstudioService = new PlanEstudioService();
import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api/academic";

class EnrollmentService {
  /**
   * Obtener inscripciones de un grupo (Utilizado en CU-11/12)
   */
  async getEnrollmentsByGroup(groupId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/groups/${groupId}/enrollments`);
      return response.data.data ?? response.data ?? [];
    } catch (error) {
      console.error("Error al obtener inscripciones del grupo:", error);
      return [];
    }
  }

  /**
   * Crear matrícula de carrera (HU-06)
   */
  async createEnrollment(data: { student_id: string; career_id: string; period: string; estado_academico: string }) {
    try {
      const response = await axios.post(`${API_URL}/enrollments`, data);
      return response.data.data ?? response.data;
    } catch (error) {
      console.error("Error al crear matrícula:", error);
      throw error;
    }
  }

  /**
   * Actualizar estado académico de una matrícula (HU-06)
   */
  async updateEnrollmentStatus(studentId: string, careerId: string, status: string) {
    const response = await axios.patch(`${API_URL}/enrollments/status`, {
      student_id: studentId,
      career_id: careerId,
      estado_academico: status
    });
    return response.data.data ?? response.data;
  }
}

export const enrollmentService = new EnrollmentService();
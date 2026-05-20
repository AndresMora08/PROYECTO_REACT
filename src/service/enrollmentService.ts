import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api/academic";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

class EnrollmentService {
  /**
   * Obtener inscripciones de un grupo (Utilizado en CU-11/12)
   */
  async getEnrollmentsByGroup(groupId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/groups/${groupId}/enrollments`, getAuthHeaders());
      return response.data.data ?? response.data ?? [];
    } catch (error) {
      console.error("Error al obtener inscripciones del grupo:", error);
      return [];
    }
  }

  /**
   * Crear matrícula de carrera (HU-06)
   */
  async createEnrollment(data: { 
    student_id: string; 
    career_id: string; 
    period: string; 
    estado_academico: string;
    group_id?: string; // 👈 Lo hacemos opcional aquí por si acaso
  }) {
    try {
      const payload = {
        student_id: parseInt(data.student_id, 10),
        career_id: parseInt(data.career_id, 10),
        period: data.period,
        estado_academico: data.estado_academico,
        // 🌟 SI TU BACKEND PIDE UN ID DE GRUPO OBLIGATORIO:
        // Aquí mandamos el group_id. Si no viene en los datos, ponemos "1" temporalmente para probar.
        group_id: data.group_id ? parseInt(data.group_id, 10) : 1 
      };

      console.log("Enviando payload corregido al backend:", payload);

      const response = await axios.post(`${API_URL}/enrollments`, payload, getAuthHeaders());
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
    const payload = {
      student_id: parseInt(studentId, 10),
      career_id: parseInt(careerId, 10),
      estado_academico: status
    };

    const response = await axios.patch(`${API_URL}/enrollments/status`, payload, getAuthHeaders());
    return response.data.data ?? response.data;
  }
}

export const enrollmentService = new EnrollmentService();
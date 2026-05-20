import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api/academic";

class EnrollmentService {
  private async postEnrollment(payload: Record<string, unknown>) {
    const response = await axios.post(`${API_URL}/enrollments`, payload);
    return response.data.data ?? response.data;
  }

  private async patchEnrollmentStatus(payload: Record<string, unknown>) {
    const response = await axios.patch(`${API_URL}/enrollments/status`, payload);
    return response.data.data ?? response.data;
  }

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
      const payload = {
        student_id: data.student_id,
        career_id: data.career_id,
        period: data.period,
        estado_academico: data.estado_academico,
      };

      return await this.postEnrollment(payload);
    } catch (error) {
      console.error("Error al crear matrícula:", error);
      throw error;
    }
  }

  /**
   * Actualizar estado académico de una matrícula (HU-06)
   */
  async updateEnrollmentStatus(studentId: string, careerId: string, status: string) {
    return await this.patchEnrollmentStatus({
      student_id: studentId,
      career_id: careerId,
      estado_academico: status,
    });
  }

  /**
   * Inscribir estudiante en grupo (HU-07)
   */
  async enrollStudentInGroup(studentId: string, groupId: string): Promise<any> {
    try {
      const payload = {
        student_id: studentId,
        group_id: groupId,
        status: "ACTIVE",
      };
      return await this.postEnrollment(payload);
    } catch (error) {
      console.error("Error al inscribir estudiante en grupo:", error);
      throw error;
    }
  }

  /**
   * Inscribir estudiante en múltiples grupos (HU-07)
   */
  async enrollStudentInMultipleGroups(studentId: string, groupIds: string[]): Promise<any> {
    const successful: string[] = [];
    const failed: { groupId: string; error: string }[] = [];

    for (const groupId of groupIds) {
      try {
        await this.enrollStudentInGroup(studentId, groupId);
        successful.push(groupId);
      } catch (error) {
        failed.push({
          groupId,
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Obtener inscripciones del estudiante (HU-07)
   */
  async getStudentInscriptions(studentId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/enrollments/student/${studentId}`);
      return response.data.data ?? response.data ?? [];
    } catch (error) {
      console.error("Error al obtener inscripciones:", error);
      return [];
    }
  }
}

export const enrollmentService = new EnrollmentService();
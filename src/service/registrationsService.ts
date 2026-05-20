import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api/academic";

export interface CreateRegistrationData {
  student_id: string | number;
  career_id: string | number;
  admission_period: string;
  academic_status: string;   // "ACTIVE" | "SUSPENDED" | "WITHDRAWN" | "AT_RISK"
  is_active: boolean;
}

export interface UpdateRegistrationData {
  student_id: string | number;
  career_id: string | number;
  admission_period: string;
  academic_status: string;
  is_active: boolean;
}

class RegistrationService {
  async createRegistration(data: CreateRegistrationData) {
    try {
      // 🚨 ELIMINAMOS EL parseInt PORQUE EL BACKEND USA UUIDs O STRINGS COMO LLAVES PRIMARIAS
      const payload = {
        student_id:        String(data.student_id).trim(),
        career_id:         String(data.career_id).trim(),
        admission_period:  data.admission_period.trim(),
        academic_status:   data.academic_status,
        is_active:         Boolean(data.is_active),
      };

      const response = await axios.post(`${API_URL}/registrations`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      return response.data.data ?? response.data;
    } catch (error: any) {
      console.error("Error al crear matrícula:", error);
      console.error("Response data del Backend:", error?.response?.data);
      console.error("Payload enviado:", data);
      throw error;
    }
  }

  async updateRegistration(registrationId: string | number, data: UpdateRegistrationData) {
    try {
      // 🚨 REPETIMOS: Quitamos parseInt para que no rompa los IDs alfanuméricos
      const payload = {
        student_id:        String(data.student_id).trim(),
        career_id:         String(data.career_id).trim(),
        admission_period:  data.admission_period.trim(),
        academic_status:   data.academic_status,
        is_active:         Boolean(data.is_active),
      };

      const response = await axios.put(
        `${API_URL}/registrations/${registrationId}`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      return response.data.data ?? response.data;
    } catch (error) {
      console.error("Error al actualizar matrícula:", error);
      throw error;
    }
  }

  async getAllRegistrations(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/registrations`, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data.data ?? response.data ?? [];
    } catch (error) {
      console.error("Error al obtener matrículas:", error);
      return [];
    }
  }
}

export const registrationService = new RegistrationService();
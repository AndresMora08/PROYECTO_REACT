import axios from "axios";

export type CareerRecord = {
  id: string;
  name: string;
  code: string;
  description: string;
  archived: boolean;
  hasEnrolledStudents: boolean;
  createdAt: string;
  updatedAt: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";
const CAREERS_URL = `${API_BASE_URL}/api/academic/careers`;

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
      return "No se pudo conectar con el backend. Verifique que la API este activa.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};

const normalizeCareer = (raw: any): CareerRecord | null => {
  if (!raw) return null;

  const id = String(raw.id ?? raw._id ?? "").trim();
  const name = String(raw.name ?? raw.nombre ?? "").trim();

  if (!id || !name) return null;

  const code = String(raw.code ?? raw.codigo ?? "").trim();
  const description = String(raw.description ?? raw.descripcion ?? "").trim();

  const archivedFromState =
    typeof raw.is_active === "boolean" ? !raw.is_active : undefined;

  const archived =
    Boolean(raw.archived) ||
    Boolean(raw.archivada) ||
    Boolean(raw.is_archived) ||
    Boolean(archivedFromState);

  const enrolledCount = Number(raw.enrolled_students_count ?? raw.enrolledCount ?? 0);
  const hasEnrolledStudents =
    Boolean(raw.has_enrolled_students) ||
    Boolean(raw.hasEnrolledStudents) ||
    (!Number.isNaN(enrolledCount) && enrolledCount > 0);

  const createdAt = String(raw.created_at ?? raw.createdAt ?? new Date().toISOString());
  const updatedAt = String(raw.updated_at ?? raw.updatedAt ?? createdAt);

  return {
    id,
    name,
    code,
    description,
    archived,
    hasEnrolledStudents,
    createdAt,
    updatedAt,
  };
};

class CareerService {
  async getCareers(): Promise<CareerRecord[]> {
    try {
      const response = await axios.get<any>(CAREERS_URL, getAuthHeaders());
      const data = response.data?.data ?? response.data;
      if (!Array.isArray(data)) return [];

      return data
        .map(normalizeCareer)
        .filter((career): career is CareerRecord => Boolean(career));
    } catch (error) {
      console.error("Error al obtener carreras:", error);
      return [];
    }
  }

  async createCareer(payload: { name: string; code: string; description?: string }) {
    try {
      const response = await axios.post(
        CAREERS_URL,
        {
          name: payload.name,
          code: payload.code,
          description: payload.description ?? "",
        },
        getAuthHeaders()
      );

      const data = response.data?.data ?? response.data;
      const created = normalizeCareer(data);
      if (!created) {
        throw new Error("La respuesta del backend no incluye una carrera valida.");
      }
      return created;
    } catch (error) {
      throw new Error(extractApiErrorMessage(error, "No se pudo crear la carrera."));
    }
  }

  async updateCareer(
    id: string,
    payload: Partial<{ name: string; code: string; description: string; archived: boolean }>
  ) {
    try {
      const response = await axios.put(
        `${CAREERS_URL}/${id}`,
        {
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.code !== undefined ? { code: payload.code } : {}),
          ...(payload.description !== undefined ? { description: payload.description } : {}),
          ...(payload.archived !== undefined
            ? { archived: payload.archived, is_active: !payload.archived }
            : {}),
        },
        getAuthHeaders()
      );

      const data = response.data?.data ?? response.data;
      const updated = normalizeCareer(data);
      if (!updated) {
        throw new Error("La respuesta del backend no incluye una carrera valida.");
      }
      return updated;
    } catch (error) {
      throw new Error(extractApiErrorMessage(error, "No se pudo actualizar la carrera."));
    }
  }

  async archiveCareer(id: string) {
    try {
      const response = await axios.put(
        `${CAREERS_URL}/${id}`,
        {
          archived: true,
          archivada: true,
          is_active: false,
        },
        getAuthHeaders()
      );

      const data = response.data?.data ?? response.data;
      const updated = normalizeCareer(data);
      if (!updated) {
        throw new Error("La respuesta del backend no incluye una carrera valida.");
      }
      return updated;
    } catch (error) {
      throw new Error(extractApiErrorMessage(error, "No se pudo archivar la carrera."));
    }
  }
}

export const careerService = new CareerService();

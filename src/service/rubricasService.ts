import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api/academic";

export interface EscalaDto {
    id?: string;
    nombre?: string;
    descripcion?: string;
    valor?: number;
}

export interface CriterioDto {
    id?: string;
    nombre?: string;
    descripcion?: string;
    peso?: number;
    escalas?: EscalaDto[];
}

export interface RubricaDto {
    id?: string;
    titulo?: string;
    descripcion?: string;
    criterios?: CriterioDto[];
    publicado_en?: string;
}

class RubricasService {
    async getRubricaByEvaluation(evaluationId: string): Promise<RubricaDto | null> {
        try {
            // Intentar endpoint por evaluación
            const resp = await axios.get(`${API_URL}/evaluations/${evaluationId}/rubrica`);
            return resp.data.data ?? resp.data ?? null;
        } catch (err) {
            // Si falla, intentar endpoint por id de rúbrica
            try {
                const resp2 = await axios.get(`${API_URL}/rubricas/${evaluationId}`);
                return resp2.data.data ?? resp2.data ?? null;
            } catch (err2) {
                console.error("Error al obtener rúbrica:", err2);
                return null;
            }
        }
    }

    async getRubricaById(rubricaId: string): Promise<RubricaDto | null> {
        try {
            const resp = await axios.get(`${API_URL}/rubricas/${rubricaId}`);
            return resp.data.data ?? resp.data ?? null;
        } catch (err) {
            console.error("Error al obtener rúbrica por id:", err);
            return null;
        }
    }
}

export const rubricasService = new RubricasService();

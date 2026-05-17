import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api/academic";

export interface NotaFinal {
    id?: string;
    inscripcion_id: string;
    nota_final: number;
    observaciones?: string;
    registrado_oficialmente?: boolean;
    locked?: boolean;
    updated_at?: string;
}

export interface RespuestaRegistroNota {
    success: boolean;
    message: string;
    data?: NotaFinal;
}

class NotasService {
    /**
     * Registrar o actualizar la nota final de un estudiante
     */
    async registrarNotaFinal(
        groupId: string,
        inscripcionId: string,
        notaFinal: number,
        observaciones?: string
    ): Promise<RespuestaRegistroNota> {
        try {
            const payload = {
                nota_final: notaFinal,
                observaciones: observaciones || "",
                registrado_oficialmente: true
            };

            const response = await axios.post(
                `${API_URL}/groups/${groupId}/inscripciones/${inscripcionId}/registrar-nota-final`,
                payload
            );

            return {
                success: true,
                message: "Nota final registrada correctamente",
                data: response.data.data ?? response.data
            };
        } catch (error: any) {
            console.error("Error al registrar nota final:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Error al registrar la nota"
            };
        }
    }

    /**
     * Registrar notas finales de múltiples estudiantes en lote
     */
    async registrarNotasFinalesPorLote(
        groupId: string,
        notas: NotaFinal[]
    ): Promise<RespuestaRegistroNota> {
        try {
            const response = await axios.post(
                `${API_URL}/groups/${groupId}/registrar-notas-finales-lote`,
                { notas }
            );

            return {
                success: true,
                message: "Notas finales registradas correctamente",
                data: response.data
            };
        } catch (error: any) {
            console.error("Error al registrar notas en lote:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Error al registrar las notas"
            };
        }
    }

    /**
     * Obtener las notas finales registradas de un grupo
     */
    async obtenerNotasFinalesPorGrupo(groupId: string): Promise<NotaFinal[]> {
        try {
            const response = await axios.get(
                `${API_URL}/groups/${groupId}/notas-finales`
            );
            
            return response.data.data ?? response.data ?? [];
        } catch (error) {
            console.error("Error al obtener notas finales:", error);
            return [];
        }
    }

    /**
     * Bloquear edición de notas (tras confirmar registra oficial)
     */
    async bloquearNotasFinal(groupId: string): Promise<RespuestaRegistroNota> {
        try {
            const response = await axios.patch(
                `${API_URL}/groups/${groupId}/bloquear-notas-finales`
            );

            return {
                success: true,
                message: "Notas bloqueadas correctamente",
                data: response.data
            };
        } catch (error: any) {
            console.error("Error al bloquear notas:", error);
            return {
                success: false,
                message: "Error al bloquear las notas"
            };
        }
    }

    /**
     * Generar reporte de notas en formato JSON
     * (luego se puede convertir a PDF en el frontend)
     */
    async generarReporteNotas(groupId: string): Promise<any> {
        try {
            const response = await axios.get(
                `${API_URL}/groups/${groupId}/reporte-notas`,
                {
                    // Permite respuestas en diferentes formatos
                    params: { formato: 'json' }
                }
            );

            return response.data.data ?? response.data;
        } catch (error) {
            console.error("Error al generar reporte:", error);
            throw error;
        }
    }

    /**
     * Descargar reporte en PDF directamente desde el backend
     */
    async descargarReportePDF(groupId: string): Promise<Blob> {
        try {
            const response = await axios.get(
                `${API_URL}/groups/${groupId}/reporte-notas/pdf`,
                {
                    responseType: 'blob'
                }
            );

            return response.data;
        } catch (error) {
            console.error("Error al descargar PDF:", error);
            throw error;
        }
    }
}

export const notasService = new NotasService();

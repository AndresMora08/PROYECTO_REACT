import React, { useEffect, useState } from "react";
import { evaluacionesService, EvaluacionEstudiante } from "../../service/evaluacionesService";
import { notasService, NotaFinal } from "../../service/notasService";

interface Props {
    groupId: string;
}

const FinalizarNotas: React.FC = () => {
    const [groupId, setGroupId] = useState<string>(
        // intentar leer groupId desde la URL (React Router proporciona params en la app principal)
        window.location.pathname.split("/").includes("groups")
            ? window.location.pathname.split("/").pop() || ""
            : ""
    );

    const [data, setData] = useState<EvaluacionEstudiante[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [observaciones, setObservaciones] = useState<Record<string, string>>({});
    const [semestreActivo, setSemestreActivo] = useState<boolean>(true);
    const [incompletasWarning, setIncompletasWarning] = useState<string[]>([]);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                if (!groupId) throw new Error("No se encontró groupId en la URL");

                const activo = await evaluacionesService.verificarSemestreActivo(groupId);
                setSemestreActivo(activo);

                const detalles = await evaluacionesService.verificarEvaluacionesIncompletas(groupId);
                if (detalles && detalles.incompletas) setIncompletasWarning(detalles.detalles || []);

                const califs = await evaluacionesService.getCalificacionesEstudiantes(groupId);
                setData(califs || []);
                const initialSelected: Record<string, boolean> = {};
                const initialObs: Record<string, string> = {};
                (califs || []).forEach((c: any) => {
                    initialSelected[c.inscripcion_id] = true;
                    initialObs[c.inscripcion_id] = c.observaciones || "";
                });
                setSelected(initialSelected);
                setObservaciones(initialObs);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Error al cargar datos");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [groupId]);

    const toggleSelect = (inscripcionId: string) => {
        setSelected((s) => ({ ...s, [inscripcionId]: !s[inscripcionId] }));
    };

    const onObservacionChange = (inscripcionId: string, value: string) => {
        setObservaciones((o) => ({ ...o, [inscripcionId]: value }));
    };

    const confirmarRegistro = async () => {
        if (!groupId) return setError("groupId faltante");
        setLoading(true);
        try {
            // Preparar notas a enviar
            const notas: NotaFinal[] = data
                .filter((d) => selected[d.inscripcion_id])
                .map((d) => ({
                    inscripcion_id: d.inscripcion_id,
                    nota_final: Math.round((d.nota_ponderada + Number.EPSILON) * 100) / 100,
                    observaciones: observaciones[d.inscripcion_id] || "",
                }));

            if (notas.length === 0) {
                setError("No hay estudiantes seleccionados para registrar");
                setLoading(false);
                return;
            }

            const resp = await notasService.registrarNotasFinalesPorLote(groupId, notas);
            if (!resp.success) throw new Error(resp.message || "Error al registrar notas");

            // Bloquear notas
            const bloqueo = await notasService.bloquearNotasFinal(groupId);
            if (!bloqueo.success) console.warn("No se pudo bloquear notas: ", bloqueo.message);

            // Descargar PDF automáticamente si el backend lo soporta
            try {
                const blob = await notasService.descargarReportePDF(groupId);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `reporte_notas_grupo_${groupId}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } catch (pdfErr) {
                console.warn("No se descargó el PDF automáticamente:", pdfErr);
            }

            alert("Registro oficial completado");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al confirmar registro");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

    return (
        <div style={{ padding: 16 }}>
            <h2>Registrar Nota Final - Grupo {groupId}</h2>

            {!semestreActivo && (
                <div style={{ color: "red", marginBottom: 12 }}>
                    El semestre asociado no está activo. Contacte al administrador.
                </div>
            )}

            {incompletasWarning.length > 0 && (
                <div style={{ color: "orange", marginBottom: 12 }}>
                    <strong>Advertencia:</strong> Existen calificaciones incompletas:
                    <ul>
                        {incompletasWarning.map((d, i) => (
                            <li key={i}>{d}</li>
                        ))}
                    </ul>
                </div>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>Sel</th>
                        <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>Estudiante</th>
                        <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>Nota ponderada</th>
                        <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>Observaciones</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.inscripcion_id}>
                            <td style={{ padding: 8, textAlign: "center" }}>
                                <input
                                    type="checkbox"
                                    checked={!!selected[row.inscripcion_id]}
                                    onChange={() => toggleSelect(row.inscripcion_id)}
                                />
                            </td>
                            <td style={{ padding: 8 }}>{row.estudiante_nombre}</td>
                            <td style={{ padding: 8 }}>{row.nota_ponderada.toFixed(2)}</td>
                            <td style={{ padding: 8 }}>
                                <input
                                    type="text"
                                    value={observaciones[row.inscripcion_id] || ""}
                                    onChange={(e) => onObservacionChange(row.inscripcion_id, e.target.value)}
                                    style={{ width: "100%" }}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: 16 }}>
                <button
                    onClick={confirmarRegistro}
                    disabled={!semestreActivo || loading}
                    style={{ padding: "8px 16px", marginRight: 8 }}
                >
                    Confirmar y registrar oficialmente
                </button>
                <button
                    onClick={async () => {
                        try {
                            const reporte = await notasService.generarReporteNotas(groupId);
                            const text = JSON.stringify(reporte, null, 2);
                            const blob = new Blob([text], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `reporte_notas_grupo_${groupId}.json`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                        } catch (err) {
                            console.error(err);
                            alert("Error al generar reporte JSON");
                        }
                    }}
                >
                    Descargar reporte (JSON)
                </button>
            </div>
        </div>
    );
};

export default FinalizarNotas;

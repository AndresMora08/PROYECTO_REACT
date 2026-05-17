import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { evaluacionesService, EvaluacionEstudiante } from "../../service/evaluacionesService";
import { notasService, NotaFinal } from "../../service/notasService";
import { groupService } from "../../service/groupService";
import { Group } from "../../models/Grupo";

const RegistrarNotasFinal: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();

    // Estados
    const [grupo, setGrupo] = useState<Group | null>(null);
    const [calificacionesEstudiantes, setCalificacionesEstudiantes] = useState<EvaluacionEstudiante[]>([]);
    const [notasEditable, setNotasEditable] = useState<Map<string, number>>(new Map());
    const [observacionesEditable, setObservacionesEditable] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState<boolean>(true);
    const [enviando, setEnviando] = useState<boolean>(false);
    const [semestreActivo, setSemestreActivo] = useState<boolean>(true);
    const [evaluacionesIncompletas, setEvaluacionesIncompletas] = useState<boolean>(false);

    // Cargar datos iniciales
    useEffect(() => {
        if (!groupId) {
            Swal.fire("Error", "No se especificó el grupo", "error");
            navigate("/groups/list");
            return;
        }
        loadDatos();
    }, [groupId]);

    const loadDatos = async () => {
        try {
            setLoading(true);

            // Verificar que el semestre esté activo
            const semestreOk = await evaluacionesService.verificarSemestreActivo(groupId!);
            setSemestreActivo(semestreOk);

            if (!semestreOk) {
                Swal.fire(
                    "Semestre Inactivo",
                    "El semestre de este grupo no está activo. Contacta al administrador.",
                    "warning"
                );
                return;
            }

            // Obtener información del grupo
            const grupoData = await groupService.getGroupById(groupId!);
            setGrupo(grupoData);

            // Obtener calificaciones de estudiantes
            const calificaciones = await evaluacionesService.getCalificacionesEstudiantes(groupId!);
            setCalificacionesEstudiantes(calificaciones);

            // Inicializar mapas con notas actuales
            const mapNotas = new Map<string, number>();
            const mapObservaciones = new Map<string, string>();

            calificaciones.forEach((cal) => {
                mapNotas.set(cal.inscripcion_id, cal.nota_ponderada);
            });

            setNotasEditable(mapNotas);
            setObservacionesEditable(mapObservaciones);

            // Verificar si hay evaluaciones incompletas
            const estadoEval = await evaluacionesService.verificarEvaluacionesIncompletas(groupId!);
            setEvaluacionesIncompletas(estadoEval.incompletas);

            if (estadoEval.incompletas) {
                Swal.fire(
                    "Advertencia",
                    `Hay evaluaciones incompletas para algunos estudiantes:\n${estadoEval.detalles.join("\n")}`,
                    "warning"
                );
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
            Swal.fire("Error", "No se pudieron cargar los datos del grupo", "error");
            navigate("/groups/list");
        } finally {
            setLoading(false);
        }
    };

    // Actualizar nota de un estudiante
    const actualizarNota = (inscripcionId: string, valor: number) => {
        const mapa = new Map(notasEditable);
        if (valor >= 0 && valor <= 5) {
            mapa.set(inscripcionId, valor);
            setNotasEditable(mapa);
        } else {
            Swal.fire("Error", "La nota debe estar entre 0 y 5", "error");
        }
    };

    // Actualizar observación de un estudiante
    const actualizarObservacion = (inscripcionId: string, valor: string) => {
        const mapa = new Map(observacionesEditable);
        mapa.set(inscripcionId, valor);
        setObservacionesEditable(mapa);
    };

    // Guardar cambios (validación previa)
    const handleConfirmarRegistro = async () => {
        if (!groupId) return;

        // Validar que todas las notas están llenas
        const notasValidas = calificacionesEstudiantes.every((cal) =>
            notasEditable.has(cal.inscripcion_id) &&
            notasEditable.get(cal.inscripcion_id)! >= 0 &&
            notasEditable.get(cal.inscripcion_id)! <= 5
        );

        if (!notasValidas) {
            Swal.fire("Error", "Por favor completa todas las notas (0-5)", "error");
            return;
        }

        // Confirmar antes de registrar
        const result = await Swal.fire({
            title: "¿Registrar notas finales?",
            text: `Se registrarán ${calificacionesEstudiantes.length} notas finales como registro oficial. Esta acción puede ser bloqueada posteriormente por el administrador.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, registrar",
            cancelButtonText: "Cancelar"
        });

        if (result.isConfirmed) {
            await registrarNotasFinales();
        }
    };

    // Registrar notas en lote
    const registrarNotasFinales = async () => {
        if (!groupId) return;

        try {
            setEnviando(true);

            const notasARegistrar: NotaFinal[] = calificacionesEstudiantes.map((cal) => ({
                inscripcion_id: cal.inscripcion_id,
                nota_final: notasEditable.get(cal.inscripcion_id) || 0,
                observaciones: observacionesEditable.get(cal.inscripcion_id) || "",
                registrado_oficialmente: true,
                locked: false
            }));

            // Registrar notas
            const respuesta = await notasService.registrarNotasFinalesPorLote(groupId, notasARegistrar);

            if (respuesta.success) {
                Swal.fire("Éxito", "Notas finales registradas correctamente", "success");
                
                // Preguntar si descargar reporte
                const resultReporte = await Swal.fire({
                    title: "¿Descargar reporte?",
                    text: "¿Deseas descargar el reporte de notas en PDF?",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonText: "Descargar",
                    cancelButtonText: "No, gracias"
                });

                if (resultReporte.isConfirmed) {
                    await descargarReporte();
                }

                // Regresar a la lista de grupos
                setTimeout(() => navigate("/groups/list"), 1500);
            } else {
                Swal.fire("Error", respuesta.message, "error");
            }
        } catch (error) {
            console.error("Error registrando notas:", error);
            Swal.fire("Error", "Ocurrió un error al registrar las notas", "error");
        } finally {
            setEnviando(false);
        }
    };

    // Descargar reporte en PDF
    const descargarReporte = async () => {
        if (!groupId) return;

        try {
            const blob = await notasService.descargarReportePDF(groupId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Reporte_Notas_${grupo?.group_code || "grupo"}_${new Date().toISOString().split("T")[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error descargando PDF:", error);
            Swal.fire("Error", "No se pudo descargar el reporte", "error");
        }
    };

    // Acciones para volver a revisar evaluaciones
    const irARevisarEvaluaciones = () => {
        navigate(`/evaluaciones/grupo/${groupId}`);
    };

    if (loading) {
        return <div className="flex items-center justify-center p-8"><p>Cargando datos...</p></div>;
    }

    if (!semestreActivo) {
        return (
            <div className="p-6 rounded-lg bg-red-50 border border-red-200">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Semestre Inactivo</h3>
                <p className="text-red-700 mb-4">
                    El semestre de este grupo no está activo. No es posible registrar notas finales en este momento.
                </p>
                <button
                    onClick={() => navigate("/groups/list")}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Volver a Grupos
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ENCABEZADO */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-black dark:text-white">
                        Registrar Notas Finales
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Grupo: <strong>{grupo?.name}</strong> ({grupo?.group_code})
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Asignatura: {grupo?.Asignatura?.name} | Docente: {grupo?.Docente?.first_name} {grupo?.Docente?.last_name}
                    </p>
                </div>
                <button
                    onClick={() => navigate("/groups/list")}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                    ← Volver
                </button>
            </div>

            {/* ADVERTENCIA SI HAY EVALUACIONES INCOMPLETAS */}
            {evaluacionesIncompletas && (
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <p className="text-yellow-800 font-semibold">
                        ⚠️ Hay evaluaciones incompletas para algunos estudiantes
                    </p>
                    <p className="text-yellow-700 text-sm mt-2">
                        Puedes continuar registrando notas finales, pero se agregará una observación en los registros.
                    </p>
                </div>
            )}

            {/* TABLA DE CALIFICACIONES */}
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                                Estudiante
                            </th>
                            <th className="px-6 py-3 text-center font-semibold text-gray-900 dark:text-white">
                                Evaluaciones
                            </th>
                            <th className="px-6 py-3 text-center font-semibold text-gray-900 dark:text-white">
                                Nota Ponderada
                            </th>
                            <th className="px-6 py-3 text-center font-semibold text-gray-900 dark:text-white">
                                Nota Final
                            </th>
                            <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                                Observaciones
                            </th>
                            <th className="px-6 py-3 text-center font-semibold text-gray-900 dark:text-white">
                                Estado
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {calificacionesEstudiantes.map((cal) => (
                            <tr
                                key={cal.inscripcion_id}
                                className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                                    {cal.estudiante_nombre}
                                </td>
                                <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                    <details className="cursor-pointer inline">
                                        <summary className="underline hover:text-blue-600">
                                            {cal.evaluaciones.length} evaluaciones
                                        </summary>
                                        <div className="mt-2 text-left text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                            {cal.evaluaciones.map((ev) => (
                                                <div key={ev.id} className="py-1">
                                                    <p className="font-semibold">{ev.nombre} ({ev.peso}%)</p>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        Nota: {ev.nota ?? "Sin calificar"}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                </td>
                                <td className="px-6 py-4 text-center font-semibold text-blue-600 dark:text-blue-400">
                                    {cal.nota_ponderada.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <input
                                        type="number"
                                        min="0"
                                        max="5"
                                        step="0.01"
                                        value={notasEditable.get(cal.inscripcion_id) ?? ""}
                                        onChange={(e) =>
                                            actualizarNota(cal.inscripcion_id, parseFloat(e.target.value) || 0)
                                        }
                                        placeholder="0.00"
                                        className="w-20 px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-center"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        value={observacionesEditable.get(cal.inscripcion_id) ?? ""}
                                        onChange={(e) =>
                                            actualizarObservacion(cal.inscripcion_id, e.target.value)
                                        }
                                        placeholder="Observación..."
                                        className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-xs"
                                    />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {cal.notas_incompletas ? (
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-xs font-semibold">
                                            ⚠️ Incompleta
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs font-semibold">
                                            ✓ Completa
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {calificacionesEstudiantes.length === 0 && (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                        No hay estudiantes inscritos en este grupo aún.
                    </p>
                </div>
            )}

            {/* ACCIONES */}
            <div className="flex gap-4 justify-end">
                <button
                    onClick={irARevisarEvaluaciones}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition"
                >
                    ← Revisar Evaluaciones
                </button>
                <button
                    onClick={descargarReporte}
                    disabled={enviando}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                    📄 Descargar Reporte
                </button>
                <button
                    onClick={handleConfirmarRegistro}
                    disabled={enviando || calificacionesEstudiantes.length === 0}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                    {enviando ? "Registrando..." : "✓ Registrar Notas Finales"}
                </button>
            </div>

            {/* RESUMEN */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-blue-800 dark:text-blue-300 font-semibold">
                    📊 Resumen: {calificacionesEstudiantes.length} estudiantes | 
                    {calificacionesEstudiantes.filter(c => c.notas_incompletas).length > 0 && 
                        ` ${calificacionesEstudiantes.filter(c => c.notas_incompletas).length} con evaluaciones incompletas`
                    }
                </p>
            </div>
        </div>
    );
};

export default RegistrarNotasFinal;

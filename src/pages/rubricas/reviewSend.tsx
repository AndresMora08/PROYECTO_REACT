import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { gradeService } from "../../service/gradeService";
import { evaluationService } from "../../service/evaluationService";
import { enrollmentService } from "../../service/enrollmentService";
import { Nota } from "../../models/Nota";
import { Evaluacion } from "../../models/Evaluacion";
import { Inscripcion } from "../../models/Inscripcion";

/**
 * CU-11 — Paso 3: Revisar la calificación guardada y confirmar envío.
 * Si llega en DRAFT permite editar observaciones y enviar.
 * Si ya está SENT muestra el estado final.
 * Ruta: /evaluations/:evaluationId/calificar/:enrollmentId/revisar/:gradeId
 */
const CU11_Step3_ReviewSend: React.FC = () => {
    const { evaluationId, enrollmentId, gradeId } = useParams<{
        evaluationId: string;
        enrollmentId: string;
        gradeId: string;
    }>();
    const navigate = useNavigate();

    const [nota, setNota] = useState<Nota | null>(null);
    const [evaluation, setEvaluation] = useState<Evaluacion | null>(null);
    const [enrollment, setEnrollment] = useState<Inscripcion | null>(null);
    const [observations, setObservations] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (gradeId && evaluationId && enrollmentId) loadData();
    }, [gradeId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [gradeData, evalData, enrollData] = await Promise.all([
                gradeService.getGradeById(gradeId!),
                evaluationService.getEvaluationById(evaluationId!),
                enrollmentService.getEnrollmentById(enrollmentId!),
            ]);
            setNota(gradeData);
            setEvaluation(evalData);
            setEnrollment(enrollData);
            setObservations(gradeData.observations ?? "");
        } catch {
            Swal.fire("Error", "No se pudo cargar la calificación.", "error").then(() =>
                navigate(-1)
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        const confirm = await Swal.fire({
            title: "¿Enviar calificación?",
            text: "Se calculará la nota final y se notificará al estudiante. Esta acción puede ser bloqueada posteriormente.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, enviar",
            cancelButtonText: "Cancelar",
        });
        if (!confirm.isConfirmed) return;

        setIsSending(true);
        try {
            await gradeService.updateGrade(gradeId!, {
                status: "SENT",
                observations,
            });
            Swal.fire({
                icon: "success",
                title: "¡Calificación enviada!",
                text: "La nota final fue calculada y notificada al estudiante.",
                timer: 2200,
                showConfirmButton: false,
            }).then(() => navigate(`/evaluations/${evaluationId}/calificar`));
        } catch {
            Swal.fire("Error", "No se pudo enviar la calificación.", "error");
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-gray-400 text-center">Cargando revisión...</div>;
    }
    if (!nota) return null;

    const isSent = nota.status === "ENVIADA";
    const nombreEstudiante = `${enrollment?.Estudiante?.first_name ?? ""} ${enrollment?.Estudiante?.last_name ?? ""}`.trim();

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Indicador de pasos */}
            <div className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold text-xs">1</span>
                <span className="text-gray-400">Seleccionar estudiante</span>
                <span className="flex-1 h-px bg-indigo-200 mx-2" />
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold text-xs">2</span>
                <span className="text-gray-400">Evaluar criterios</span>
                <span className="flex-1 h-px bg-indigo-200 mx-2" />
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">3</span>
                <span className="font-medium text-indigo-700">Revisar y enviar</span>
            </div>

            <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                    Revisar y enviar calificación
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Verifica los datos antes de enviar la nota al estudiante.
                </p>
            </div>

            {/* Estado */}
            <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border ${
                isSent
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
            }`}>
                {isSent ? "✅ Enviada y notificada al estudiante" : "📝 Borrador — pendiente de envío"}
            </div>

            {/* Resumen */}
            <div className="bg-white border rounded-lg shadow-sm p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-400">Evaluación</p>
                        <p className="font-semibold">{evaluation?.name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Ponderación</p>
                        <p className="font-semibold">{evaluation?.weight}%</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Estudiante</p>
                        <p className="font-semibold">{nombreEstudiante || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Inscripción</p>
                        <p className="font-semibold text-xs">{enrollmentId?.slice(0, 12)}...</p>
                    </div>
                </div>

                <hr />

                {/* Nota final */}
                <div className="text-center py-2">
                    <p className="text-xs text-gray-400 mb-1">Nota final calculada</p>
                    <p className="text-4xl font-bold text-indigo-600">
                        {nota.final_score !== undefined
                            ? nota.final_score.toFixed(2)
                            : "Calculando..."}
                        <span className="text-lg font-normal text-gray-400"> / 100</span>
                    </p>
                </div>

                <hr />

                {/* Observaciones */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observaciones generales
                    </label>
                    <textarea
                        rows={3}
                        disabled={isSent}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none disabled:bg-gray-50 disabled:text-gray-400"
                        placeholder="Observaciones opcionales..."
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                    />
                </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-between items-center pb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="px-5 py-2.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 font-medium text-sm"
                >
                    ← Volver a criterios
                </button>

                {!isSent ? (
                    <div className="flex gap-3">
                        {/* CU-13: editar/eliminar */}
                        <button
                            onClick={() =>
                                navigate(
                                    `/evaluations/${evaluationId}/grades/${gradeId}/edit`
                                )
                            }
                            className="px-4 py-2.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 font-medium text-sm"
                        >
                            ✏️ Editar / eliminar
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isSending}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-sm shadow-md disabled:opacity-50 transition-colors"
                        >
                            ✈️ {isSending ? "Enviando..." : "Enviar calificación"}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => navigate(`/evaluations/${evaluationId}/calificar`)}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded font-semibold text-sm"
                    >
                        Calificar otro estudiante →
                    </button>
                )}
            </div>
        </div>
    );
};

export default CU11_Step3_ReviewSend;
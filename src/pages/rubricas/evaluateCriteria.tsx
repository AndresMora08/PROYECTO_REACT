import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { evaluationService } from "../../service/evaluationService";
import { criterionService } from "../../service/criterionService";
import { scaleService } from "../../service/scaleService";
import { enrollmentService } from "../../service/enrollmentService";
import { gradeService } from "../../service/gradeService";
import { Evaluacion } from "../../models/Evaluacion";
import { Criterio } from "../../models/Criterio";
import { Escala } from "../../models/Escala";
import { Inscripcion } from "../../models/Inscripcion";

/**
 * Estado de selección por criterio:
 * criterionId → { scale_id, value, comment }
 */
interface SeleccionCriterio {
    scale_id: string;
    value: number;      // Escala.value (para calcular puntaje)
    comment: string;
}

/**
 * CU-11 — Paso 2: Evaluar criterios de la rúbrica.
 * El docente selecciona el nivel (Escala) para cada Criterio.
 * Puntaje = Escala.value × peso_criterio / 100
 * Ruta: /evaluations/:evaluationId/calificar/:enrollmentId/criterios
 */
const CU11_Step2_EvaluateCriteria: React.FC = () => {
    const { evaluationId, enrollmentId } = useParams<{
        evaluationId: string;
        enrollmentId: string;
    }>();
    const navigate = useNavigate();

    const [evaluation, setEvaluation] = useState<Evaluacion | null>(null);
    const [enrollment, setEnrollment] = useState<Inscripcion | null>(null);
    const [criteria, setCriteria] = useState<Criterio[]>([]);
    const [scalesMap, setScalesMap] = useState<Record<string, Escala[]>>({});  // criterionId → escalas

    // Selecciones del docente: criterionId → SeleccionCriterio
    const [selecciones, setSelecciones] = useState<Record<string, SeleccionCriterio>>({});

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (evaluationId && enrollmentId) loadData();
    }, [evaluationId, enrollmentId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [evalData, enrollData] = await Promise.all([
                evaluationService.getEvaluationById(evaluationId!),
                enrollmentService.getEnrollmentById(enrollmentId!),
            ]);
            setEvaluation(evalData);
            setEnrollment(enrollData);

            if (!evalData?.rubrica_id) {
                Swal.fire("Error", "Esta evaluación no tiene rúbrica asociada.", "error").then(() =>
                    navigate(-1)
                );
                return;
            }

            // Cargar criterios de la rúbrica
            const criteriaData = await criterionService.getCriteriaByRubric(evalData.rubrica_id);
            setCriteria(criteriaData);

            // Cargar escalas agrupadas por criterio
            const allScales = await scaleService.getScales();
            const grouped: Record<string, Escala[]> = {};
            criteriaData.forEach((c) => {
                grouped[c.id!] = allScales.filter((s) => s.criterion_id === c.id);
            });
            setScalesMap(grouped);
        } catch {
            Swal.fire("Error", "No se pudieron cargar los datos.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Cálculo de puntaje y nota ─────────────────────────────
    const calcPuntaje = (criterio: Criterio, scaleValue: number) =>
        (scaleValue * criterio.weight) / 100;

    const notaTotal = useMemo(() => {
        return criteria.reduce((acc, c) => {
            const sel = selecciones[c.id!];
            if (!sel) return acc;
            return acc + calcPuntaje(c, sel.value);
        }, 0);
    }, [selecciones, criteria]);

    const criteriosPendientes = criteria.filter((c) => !selecciones[c.id!]);
    const todosCompletos = criteriosPendientes.length === 0;

    // ── Seleccionar escala para un criterio ───────────────────
    const handleSelectScale = (criterio: Criterio, escala: Escala) => {
        setSelecciones((prev) => ({
            ...prev,
            [criterio.id!]: {
                scale_id: escala.id!,
                value: escala.value,
                comment: prev[criterio.id!]?.comment ?? "",
            },
        }));
    };

    const handleComment = (criterionId: string, text: string) => {
        setSelecciones((prev) => ({
            ...prev,
            [criterionId]: {
                ...prev[criterionId],
                comment: text,
            },
        }));
    };

    // ── Guardar borrador ──────────────────────────────────────
    const handleGuardarBorrador = async () => {
        await submitGrade("DRAFT");
    };

    // ── Enviar calificación (E1 validado antes) ───────────────
    const handleEnviar = async () => {
        // E1: algún criterio sin escala seleccionada
        if (!todosCompletos) {
            Swal.fire(
                "No se puede enviar la calificación",
                `Debes seleccionar un nivel de desempeño para todos los criterios. Pendientes: ${criteriosPendientes.map((c) => c.name).join(", ")}`,
                "warning"
            );
            return;
        }
        await submitGrade("SENT");
    };

    const submitGrade = async (status: "DRAFT" | "SENT") => {
        if (!evaluation?.rubrica_id || !enrollmentId) return;
        setIsSaving(true);
        try {


            const nota = await gradeService.createGrade({
                enrollment_id: enrollmentId,
                rubric_id: evaluation.rubrica_id,
                status,
                observations: "",
                
            });

            if (status === "DRAFT") {
                Swal.fire({
                    icon: "success",
                    title: "Borrador guardado",
                    text: "La calificación quedó guardada sin notificar al estudiante.",
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                // Ir a paso 3: revisar y enviar
                navigate(
                    `/evaluations/${evaluationId}/calificar/${enrollmentId}/revisar/${nota.id}`
                );
            }
        } catch {
            Swal.fire("Error", "No se pudo guardar la calificación.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-gray-400 text-center">Cargando criterios...</div>;
    }

    const nombreEstudiante = `${enrollment?.Estudiante?.first_name ?? ""} ${enrollment?.Estudiante?.last_name ?? ""}`.trim();

    return (
        <div className="flex gap-6">
            {/* ── Panel principal ─────────────────────────────────── */}
            <div className="flex-1 space-y-6 min-w-0">
                {/* Indicador de pasos */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold text-xs">1</span>
                    <span className="text-gray-400">Seleccionar estudiante</span>
                    <span className="flex-1 h-px bg-indigo-200 mx-2" />
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">2</span>
                    <span className="font-medium text-indigo-700">Evaluar criterios</span>
                    <span className="flex-1 h-px bg-gray-200 mx-2" />
                    <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold text-xs">3</span>
                    <span className="text-gray-400">Revisar y enviar</span>
                </div>

                {/* Info evaluación */}
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-xs text-gray-400">Evaluación</p>
                            <p className="font-bold text-gray-800">{evaluation?.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Ponderación</p>
                            <p className="font-semibold">{evaluation?.weight}%</p>
                        </div>
                    </div>

                    {/* Rúbrica asociada */}
                    {evaluation?.rubrica_id && (
                        <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
                            <span className="text-green-600 text-xs">✅ Rúbrica asociada: Publicada</span>
                            <button
                                onClick={() => navigate(`/rubrics/${evaluation.rubrica_id}/view`)}
                                className="text-xs text-indigo-600 hover:underline border border-indigo-200 rounded px-2 py-0.5"
                            >
                                Ver rúbrica ↗
                            </button>
                        </div>
                    )}
                </div>

                {/* Info estudiante */}
                <div className="bg-white border rounded-lg p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg">
                            👤
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">{nombreEstudiante || "—"}</p>
                            <p className="text-xs text-gray-500">
                                Cédula: {enrollment?.Estudiante?.document_number ?? "—"} · Inscripción: {enrollmentId?.slice(0, 8)}...
                            </p>
                            <p className="text-xs text-gray-500">
                                {enrollment?.Estudiante?.program ?? ""} · {enrollment?.Estudiante?.semester ?? ""}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-xs border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50 text-gray-600"
                        >
                            ← Anterior
                        </button>
                        <button
                            onClick={handleEnviar}
                            disabled={isSaving}
                            className="text-xs border border-indigo-200 rounded px-3 py-1.5 hover:bg-indigo-50 text-indigo-600"
                        >
                            Siguiente →
                        </button>
                    </div>
                </div>

                {/* ── Tabla de criterios ───────────────────────────── */}
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-800">Criterios de la rúbrica</h3>
                            <p className="text-xs text-gray-500">Selecciona el nivel de desempeño (escala) para cada criterio.</p>
                        </div>
                        <div className="text-xs text-gray-500 flex gap-3">
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                                Completo
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                                Pendiente: {criteriosPendientes.length} de {criteria.length}
                            </span>
                        </div>
                    </div>

                    <div className="divide-y">
                        {criteria.map((criterio, idx) => {
                            const escalas = scalesMap[criterio.id!] ?? [];
                            const sel = selecciones[criterio.id!];
                            const puntaje = sel ? calcPuntaje(criterio, sel.value) : null;

                            return (
                                <div key={criterio.id} className="p-5">
                                    <div className="flex items-start gap-4">
                                        {/* Nº + estado */}
                                        <div className="flex flex-col items-center gap-1 min-w-[28px]">
                                            <span className="text-xs text-gray-400 font-medium">{idx + 1}</span>
                                            {sel ? (
                                                <span className="text-green-500 text-base">✅</span>
                                            ) : (
                                                <span className="text-red-400 text-base">⬤</span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Nombre y peso del criterio */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-800">
                                                    {criterio.name}
                                                    <span className="text-indigo-600 ml-1 font-normal text-sm">
                                                        ({criterio.weight}%)
                                                    </span>
                                                </span>
                                            </div>
                                            {criterio.description && (
                                                <p className="text-xs text-gray-500 mb-3">{criterio.description}</p>
                                            )}

                                            {/* Selector de escala como dropdown */}
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {escalas.map((escala) => {
                                                    const isSelected = sel?.scale_id === escala.id;
                                                    return (
                                                        <button
                                                            key={escala.id}
                                                            onClick={() => handleSelectScale(criterio, escala)}
                                                            className={`text-left border rounded-lg px-3 py-2 text-sm transition-all ${
                                                                isSelected
                                                                    ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                                                    : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {isSelected && (
                                                                    <span className="text-indigo-600 font-bold">▶</span>
                                                                )}
                                                                <div>
                                                                    <span className={`font-semibold text-xs ${isSelected ? "text-indigo-700" : "text-gray-700"}`}>
                                                                        {escala.name} ({escala.value})
                                                                    </span>
                                                                    {escala.description && (
                                                                        <p className="text-xs text-gray-500 max-w-[220px] leading-snug mt-0.5">
                                                                            {escala.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Comentario + puntaje */}
                                            {sel && (
                                                <div className="flex gap-3 items-start">
                                                    <textarea
                                                        rows={2}
                                                        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                                        placeholder="Comentario (opcional)..."
                                                        value={sel.comment}
                                                        onChange={(e) => handleComment(criterio.id!, e.target.value)}
                                                    />
                                                    <div className="text-right whitespace-nowrap">
                                                        <p className="text-xs text-gray-400">Puntaje</p>
                                                        <p className="font-bold text-gray-800 text-sm">
                                                            {puntaje?.toFixed(2)}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {criterio.weight}% × {sel.value}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Total */}
                    <div className="px-5 py-4 bg-gray-50 border-t flex items-center justify-between">
                        <div className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded px-3 py-2">
                            ℹ️ El puntaje de cada criterio se calcula como: <strong>valor de escala × peso del criterio</strong>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Total (suma ponderada)</p>
                            <p className="text-2xl font-bold text-green-600">
                                {notaTotal.toFixed(2)} <span className="text-base font-normal text-gray-400">/ 100</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* E1: advertencia visible si intenta enviar incompleto */}
                {!todosCompletos && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                        <span>🚫</span>
                        <span>
                            No se puede enviar la calificación. Debes seleccionar un nivel de desempeño (escala) para <strong>todos los criterios</strong>.
                        </span>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center pb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-5 py-2.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleGuardarBorrador}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
                        >
                            💾 Guardar borrador
                            <span className="text-xs text-gray-400 hidden sm:inline">Se guarda sin notificar al estudiante.</span>
                        </button>
                        <button
                            onClick={handleEnviar}
                            disabled={isSaving || !todosCompletos}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded font-semibold text-sm text-white transition-colors ${
                                todosCompletos
                                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-md"
                                    : "bg-gray-300 cursor-not-allowed"
                            }`}
                        >
                            ✈️ Enviar calificación
                            <span className="text-xs hidden sm:inline opacity-80">Calcula la nota final y notifica al estudiante.</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Panel derecho: resumen ─────────────────────────── */}
            <aside className="w-64 min-w-[220px] hidden lg:block">
                <div className="sticky top-4 space-y-4">
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                        <h4 className="font-bold text-gray-800 mb-3 text-sm">Resumen de la calificación</h4>
                        <div className="space-y-2 text-xs text-gray-600">
                            <div className="flex justify-between">
                                <span>Evaluación:</span>
                                <span className="font-medium text-right max-w-[110px]">{evaluation?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Estudiante:</span>
                                <span className="font-medium text-right max-w-[110px]">{nombreEstudiante || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Inscripción:</span>
                                <span className="font-medium">{enrollmentId?.slice(0, 8)}...</span>
                            </div>
                        </div>

                        <hr className="my-3" />

                        <div>
                            <p className="text-xs text-gray-400 mb-1">Nota final calculada</p>
                            <p className="text-2xl font-bold text-indigo-600">
                                {notaTotal.toFixed(2)}
                                <span className="text-sm font-normal text-gray-400"> / 100</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Ponderación de la evaluación: {evaluation?.weight}%
                            </p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded mt-2 inline-block ${
                                todosCompletos
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}>
                                {todosCompletos ? "Completo" : "Borrador"}
                            </span>
                        </div>

                        <hr className="my-3" />

                        <div>
                            <p className="text-xs font-semibold text-gray-600 mb-2">Detalle del cálculo</p>
                            <div className="space-y-1">
                                {criteria.map((c) => {
                                    const sel = selecciones[c.id!];
                                    const pts = sel ? calcPuntaje(c, sel.value) : null;
                                    return (
                                        <div key={c.id} className="flex justify-between text-xs">
                                            <span className="text-gray-500 truncate max-w-[130px]">
                                                {c.name} ({c.weight}%)
                                            </span>
                                            <span className={pts !== null ? "font-semibold" : "text-gray-300"}>
                                                {pts !== null ? pts.toFixed(2) : "—"}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div className="flex justify-between text-xs font-bold border-t pt-1 mt-1">
                                    <span>Total</span>
                                    <span>{notaTotal.toFixed(2)} / 100</span>
                                </div>
                            </div>
                        </div>

                        <hr className="my-3" />

                        {/* CU-12 y CU-13 */}
                        <div className="space-y-3">
                            <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-gray-700">
                                <p className="font-semibold text-amber-700 mb-1">💡 Incluye CU-12</p>
                                <p>Puedes revisar y gestionar las notas de esta evaluación en el módulo de calificaciones.</p>
                                <button
                                    onClick={() => navigate(`/evaluations/${evaluationId}/grades`)}
                                    className="text-indigo-600 hover:underline mt-1 block"
                                >
                                    Ir a calificaciones →
                                </button>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-gray-700">
                                <p className="font-semibold text-blue-700 mb-1">💡 Extiende CU-13</p>
                                <p>Puedes editar o eliminar una calificación registrada, según las reglas del sistema.</p>
                                <button
                                    onClick={() => navigate(`/evaluations/${evaluationId}/grades`)}
                                    className="text-indigo-600 hover:underline mt-1 block"
                                >
                                    Editar / eliminar calificación →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default CU11_Step2_EvaluateCriteria;
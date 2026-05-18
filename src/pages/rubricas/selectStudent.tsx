import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import SearchInput from "../../components/GenericSearch";
import GenericCard from "../../components/GenericCard";
import { evaluationService } from "../../service/evaluationService";
import { enrollmentService } from "../../service/enrollmentService";
import { Evaluacion } from "../../models/Evaluacion";
import { Inscripcion } from "../../models/Inscripcion";

/**
 * CU-11 — Paso 1: Seleccionar Evaluación con rúbrica asociada y luego
 * seleccionar el estudiante inscrito en ese grupo.
 * Ruta: /evaluations/:evaluationId/calificar  (o /evaluations/calificar para elegir eval primero)
 */
const CU11_Step1_SelectStudent: React.FC = () => {
    const { evaluationId } = useParams<{ evaluationId?: string }>();
    const navigate = useNavigate();

    // ── Si ya hay evaluationId en URL, ir directo a selección de estudiante ──
    const [evaluations, setEvaluations] = useState<Evaluacion[]>([]);
    const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluacion | null>(null);
    const [enrollments, setEnrollments] = useState<Inscripcion[]>([]);
    const [searchEval, setSearchEval] = useState("");
    const [searchStudent, setSearchStudent] = useState("");
    const [isLoadingEval, setIsLoadingEval] = useState(true);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    // Cargar evaluaciones con rúbrica asociada
    useEffect(() => {
        fetchEvaluations();
    }, []);

    // Si viene evaluationId en la URL, auto-seleccionar
    useEffect(() => {
        if (evaluationId && evaluations.length > 0) {
            const ev = evaluations.find((e) => e.id === evaluationId);
            if (ev) handleSelectEvaluation(ev.id!);
        }
    }, [evaluationId, evaluations]);

    const fetchEvaluations = async () => {
        setIsLoadingEval(true);
        try {
            const data = await evaluationService.getEvaluations();
            // Solo evaluaciones con rúbrica asignada (precondición CU-11)
            const withRubric = data.filter((e) => !!e.rubrica_id);
            setEvaluations(withRubric);
        } catch {
            Swal.fire("Error", "No se pudieron cargar las evaluaciones.", "error");
        } finally {
            setIsLoadingEval(false);
        }
    };

    const handleSelectEvaluation = async (evalId: string) => {
        const ev = evaluations.find((e) => e.id === evalId);
        if (!ev) return;
        setSelectedEvaluation(ev);
        setIsLoadingStudents(true);
        try {
            // Inscritos activos en el grupo de la evaluación
            const all = await enrollmentService.getEnrollmentsByGroup(ev.group_id);
            const activos = all.filter((e) => e.status === "ACTIVE");
            setEnrollments(activos);
            if (activos.length === 0) {
                Swal.fire("Sin estudiantes", "No hay estudiantes inscritos activos en este grupo.", "warning");
            }
        } catch {
            Swal.fire("Error", "No se pudieron cargar los estudiantes.", "error");
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const handleSelectStudent = (enrollmentId: string) => {
        // Ir al paso 2: evaluar criterios para ese estudiante
        navigate(
            `/evaluations/${selectedEvaluation?.id}/calificar/${enrollmentId}/criterios`
        );
    };

    // ── Filtros ───────────────────────────────────────────────
    const filteredEvaluations = useMemo(() => {
        if (!searchEval.trim()) return evaluations;
        const t = searchEval.toLowerCase();
        return evaluations.filter(
            (e) =>
                e.name.toLowerCase().includes(t) ||
                (e.description && e.description.toLowerCase().includes(t))
        );
    }, [searchEval, evaluations]);

    const filteredEnrollments = useMemo(() => {
        if (!searchStudent.trim()) return enrollments;
        const t = searchStudent.toLowerCase();
        return enrollments.filter((e) => {
            const nombre = `${e.Estudiante?.first_name ?? ""} ${e.Estudiante?.last_name ?? ""}`.toLowerCase();
            return nombre.includes(t) || (e.Estudiante?.document_number ?? "").includes(t);
        });
    }, [searchStudent, enrollments]);

    return (
        <div className="space-y-8">
            {/* Indicador de pasos */}
            <div className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">1</span>
                <span className="font-medium text-indigo-700">Seleccionar estudiante</span>
                <span className="flex-1 h-px bg-gray-200 mx-2" />
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold text-xs">2</span>
                <span className="text-gray-400">Evaluar criterios</span>
                <span className="flex-1 h-px bg-gray-200 mx-2" />
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold text-xs">3</span>
                <span className="text-gray-400">Revisar y enviar</span>
            </div>

            {/* ── Sección 1: Evaluación ─────────────────────────────── */}
            {!selectedEvaluation ? (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                            Calificar estudiante con rúbrica
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Selecciona la evaluación con rúbrica asociada que deseas calificar.
                        </p>
                    </div>

                    <div className="max-w-md">
                        <SearchInput
                            label="Buscar evaluación"
                            placeholder="Ej: Proyecto de Programación..."
                            value={searchEval}
                            onChange={setSearchEval}
                        />
                    </div>

                    {isLoadingEval ? (
                        <div className="text-gray-400 p-6">Cargando evaluaciones...</div>
                    ) : filteredEvaluations.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredEvaluations.map((ev) => (
                                <GenericCard
                                    key={ev.id}
                                    id={ev.id!}
                                    title={ev.name}
                                    subtitle={`Peso: ${ev.weight}%`}
                                    description={ev.description}
                                    actionLabel="Calificar estudiantes"
                                    onAction={handleSelectEvaluation}
                                    customStatus={
                                        <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded font-medium">
                                            ✅ Rúbrica asociada
                                        </span>
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-gray-50 border border-dashed rounded-lg text-gray-400 text-sm">
                            No hay evaluaciones con rúbrica asociada.
                        </div>
                    )}
                </div>
            ) : (
                /* ── Sección 2: Estudiante ───────────────────────────── */
                <div className="space-y-4">
                    {/* Info de la evaluación seleccionada */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-lg">
                                    📋
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Evaluación</p>
                                    <p className="font-bold text-gray-800">{selectedEvaluation.name}</p>
                                    <p className="text-xs text-gray-500">
                                        Ponderación: {selectedEvaluation.weight}%
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedEvaluation(null)}
                                className="text-xs text-indigo-600 hover:underline"
                            >
                                ← Cambiar evaluación
                            </button>
                        </div>

                        {/* Ver rúbrica (CU-12) */}
                        {selectedEvaluation.rubrica_id && (
                            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
                                <span className="text-green-600">✅ Rúbrica asociada</span>
                                <button
                                    onClick={() =>
                                        navigate(
                                            `/rubrics/${selectedEvaluation.rubrica_id}/view`
                                        )
                                    }
                                    className="text-indigo-600 hover:underline text-xs border border-indigo-200 rounded px-2 py-1"
                                >
                                    Ver rúbrica ↗
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Buscador de estudiantes */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                            Seleccionar estudiante
                        </h3>
                        <div className="max-w-md">
                            <SearchInput
                                label="Buscar estudiante"
                                placeholder="Nombre o cédula..."
                                value={searchStudent}
                                onChange={setSearchStudent}
                            />
                        </div>
                    </div>

                    {isLoadingStudents ? (
                        <div className="text-gray-400 p-6">Cargando estudiantes...</div>
                    ) : filteredEnrollments.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredEnrollments.map((enroll) => {
                                const nombre = `${enroll.Estudiante?.first_name ?? ""} ${enroll.Estudiante?.last_name ?? ""}`.trim();
                                return (
                                    <GenericCard
                                        key={enroll.id}
                                        id={enroll.id!}
                                        title={nombre || "Estudiante"}
                                        subtitle={enroll.Estudiante?.semester ?? ""}
                                        description={`Cédula: ${enroll.Estudiante?.document_number ?? "—"}\nPrograma: ${enroll.Estudiante?.program ?? "—"}`}
                                        actionLabel="Calificar"
                                        onAction={handleSelectStudent}
                                        customStatus={
                                            <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded">
                                                ✅ Inscripción activa
                                            </span>
                                        }
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-gray-50 border border-dashed rounded-lg text-gray-400 text-sm">
                            No se encontraron estudiantes activos.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CU11_Step1_SelectStudent;
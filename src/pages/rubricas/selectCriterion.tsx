import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericCard from "../../components/GenericCard";
import { Rubrica } from "../../models/Rubrica";
import { Criterio } from "../../models/Criterio";
import { rubricService } from "../../service/rubricService";
import { criterionService } from "../../service/criterionService";
import { scaleService } from "../../service/scaleService";
import { Escala } from "../../models/Escala";

/**
 * CU-09 — Paso 2: Seleccionar el Criterio a trabajar dentro de la Rúbrica.
 * Muestra todos los criterios de la rúbrica y cuántos niveles (escalas)
 * tiene cada uno ya definidos.
 * Desde aquí también se puede publicar la rúbrica si todos los criterios
 * tienen ≥ 2 escalas (postcondición CU-09).
 */
const Step2_SelectCriterion: React.FC = () => {
    const { rubricId } = useParams<{ rubricId: string }>();
    const navigate = useNavigate();

    const [rubric, setRubric] = useState<Rubrica | null>(null);
    const [criteria, setCriteria] = useState<Criterio[]>([]);
    // Mapa criterionId → lista de escalas ya guardadas
    const [scalesMap, setScalesMap] = useState<Record<string, Escala[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        if (rubricId) loadData();
    }, [rubricId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Rúbrica
            const rubricData = await rubricService.getRubricById(rubricId!);
            setRubric(rubricData);

            // 2. Criterios de la rúbrica
            const criteriaData = await criterionService.getCriteriaByRubric(rubricId!);
            setCriteria(criteriaData);

            // 3. Escalas agrupadas por criterio
            const allScales = await scaleService.getScales();
            const grouped: Record<string, Escala[]> = {};
            criteriaData.forEach((c) => {
                grouped[c.id!] = allScales.filter((s) => s.criterion_id === c.id);
            });
            setScalesMap(grouped);
        } catch (error) {
            console.error("Error cargando criterios:", error);
            Swal.fire("Error", "No se pudo cargar la rúbrica.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Ir a definir escalas del criterio seleccionado ──────────────
    const handleSelectCriterion = (criterionId: string) => {
        navigate(`/rubrics/${rubricId}/define-scales/criteria/${criterionId}/scales`);
    };

    // ── Validar y publicar rúbrica ──────────────────────────────────
    const canPublish =
        criteria.length > 0 &&
        criteria.every((c) => (scalesMap[c.id!] ?? []).length >= 2);

    const handlePublish = async () => {
        if (!canPublish) {
            Swal.fire(
                "Rúbrica incompleta",
                "Todos los criterios deben tener al menos 2 niveles de escala definidos antes de publicar.",
                "warning"
            );
            return;
        }

        const confirm = await Swal.fire({
            title: "¿Publicar rúbrica?",
            text: "Una vez publicada será visible para asociarla a evaluaciones.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, publicar",
            cancelButtonText: "Cancelar",
        });
        if (!confirm.isConfirmed) return;

        setIsPublishing(true);
        try {
            await rubricService.publishRubric(rubricId!);
            Swal.fire("¡Publicada!", "La rúbrica está disponible.", "success").then(() =>
                navigate("/rubrics/define-scales")
            );
        } catch {
            Swal.fire("Error", "No se pudo publicar la rúbrica.", "error");
        } finally {
            setIsPublishing(false);
        }
    };

    // ── Progreso ────────────────────────────────────────────────────
    const done = criteria.filter((c) => (scalesMap[c.id!] ?? []).length >= 2).length;
    const progress = criteria.length > 0 ? Math.round((done / criteria.length) * 100) : 0;
    const totalWeight = criteria.reduce((acc, c) => acc + (c.weight ?? 0), 0);

    return (
        <div className="space-y-6">
            {/* Encabezado con botón Volver */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <button
                        onClick={() => navigate("/rubrics/define-scales")}
                        className="text-xs text-indigo-600 hover:underline mb-1 flex items-center gap-1"
                    >
                        ← Volver a selección de rúbrica
                    </button>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                        {isLoading ? "Cargando..." : rubric?.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Selecciona un criterio para definir sus niveles de desempeño (escalas).
                    </p>
                </div>

                {/* Barra de progreso + boton publicar */}
                <div className="flex flex-col items-end gap-2 min-w-[220px]">
                    <div className="w-full">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progreso</span>
                            <span className="font-semibold text-gray-700">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {done} de {criteria.length} criterios completos
                        </p>
                    </div>

                    <button
                        onClick={handlePublish}
                        disabled={!canPublish || isPublishing}
                        className={`px-4 py-2 rounded font-semibold text-sm text-white transition-colors ${
                            canPublish
                                ? "bg-green-600 hover:bg-green-700 shadow"
                                : "bg-gray-300 cursor-not-allowed"
                        }`}
                    >
                        {isPublishing ? "Publicando..." : "Publicar rúbrica →"}
                    </button>
                </div>
            </div>

            {/* Métricas rápidas */}
            {!isLoading && (
                <div className="flex flex-wrap gap-4">
                    <div className="bg-white border rounded-lg px-5 py-3 text-center min-w-[110px]">
                        <p className="text-xs text-gray-400">Criterios</p>
                        <p className="text-xl font-bold text-gray-800">{criteria.length}</p>
                    </div>
                    <div className={`border rounded-lg px-5 py-3 text-center min-w-[110px] ${totalWeight === 100 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                        <p className="text-xs text-gray-400">Suma de pesos</p>
                        <p className={`text-xl font-bold ${totalWeight === 100 ? "text-green-600" : "text-red-500"}`}>
                            {totalWeight}%
                        </p>
                    </div>
                    <div className="bg-white border rounded-lg px-5 py-3 text-center min-w-[110px]">
                        <p className="text-xs text-gray-400">Completos</p>
                        <p className="text-xl font-bold text-indigo-600">{done}/{criteria.length}</p>
                    </div>
                </div>
            )}

            {/* Advertencia E2 */}
            {!canPublish && !isLoading && criteria.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span>
                    <span>
                        Para publicar la rúbrica, <strong>todos los criterios</strong> deben tener al menos 2 niveles de escala definidos.
                        Los criterios incompletos aparecen marcados con ⚠️.
                    </span>
                </div>
            )}

            {/* Grid de criterios */}
            {isLoading ? (
                <div className="p-6 text-gray-400">Cargando criterios...</div>
            ) : criteria.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {criteria.map((criterion) => {
                        const scaleCount = (scalesMap[criterion.id!] ?? []).length;
                        const isComplete = scaleCount >= 2;

                        return (
                            <GenericCard
                                key={criterion.id}
                                id={criterion.id!}
                                title={criterion.name}
                                subtitle={`Peso: ${criterion.weight}%`}
                                description={criterion.description}
                                actionLabel="Definir escalas"
                                onAction={handleSelectCriterion}
                                customStatus={
                                    isComplete ? (
                                        <span className="text-xs text-green-700 font-medium bg-green-50 border border-green-200 px-2 py-1 rounded">
                                            ✅ {scaleCount} nivel{scaleCount !== 1 ? "es" : ""} definidos
                                        </span>
                                    ) : (
                                        <span className="text-xs text-orange-700 font-medium bg-orange-50 border border-orange-200 px-2 py-1 rounded">
                                            ⚠️ {scaleCount === 0 ? "Sin escalas" : `${scaleCount} nivel — falta ${2 - scaleCount} más`}
                                        </span>
                                    )
                                }
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="text-center p-12 bg-gray-50 border border-dashed rounded-lg">
                    <p className="text-gray-400 text-sm">
                        Esta rúbrica no tiene criterios. Agrégalos antes de continuar.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Step2_SelectCriterion;
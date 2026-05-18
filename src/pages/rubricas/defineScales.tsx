import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericTable from "../../components/GenericTable";
import { Criterio } from "../../models/Criterio";
import { Escala } from "../../models/Escala";
import { criterionService } from "../../service/criterionService";
import { scaleService } from "../../service/scaleService";

// ─────────────────────────────────────────────────────────────
// Tipos internos
// ─────────────────────────────────────────────────────────────

interface EscalaLocal extends Escala {
    _localId: string;
    _isNew: boolean;
    _isDirty: boolean;
}

const genLocalId = () => `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const toLocal = (s: Escala): EscalaLocal => ({
    ...s,
    _localId: s.id ?? genLocalId(),
    _isNew: false,
    _isDirty: false,
});

const emptyLocal = (criterionId: string): EscalaLocal => ({
    _localId: genLocalId(),
    _isNew: true,
    _isDirty: true,
    criterion_id: criterionId,
    name: "",
    description: "",
    value: 0,
});

// ─────────────────────────────────────────────────────────────
// Subcomponente: formulario inline para agregar / editar escala
// ─────────────────────────────────────────────────────────────

interface ScaleFormProps {
    criterionId: string;
    existingValues: number[]; // para validar unicidad (E1)
    editingScale?: EscalaLocal | null;
    onSave: (data: { name: string; description: string; value: number }) => void;
    onCancel: () => void;
}

const ScaleForm: React.FC<ScaleFormProps> = ({
    criterionId,
    existingValues,
    editingScale,
    onSave,
    onCancel,
}) => {
    const [name, setName] = useState(editingScale?.name ?? "");
    const [description, setDescription] = useState(editingScale?.description ?? "");
    const [value, setValue] = useState<string>(
        editingScale ? String(editingScale.value) : ""
    );
    const [error, setError] = useState<string>("");

    const isEditing = !!editingScale && !editingScale._isNew;

    const handleSubmit = () => {
        setError("");
        if (!name.trim()) { setError("El nombre es obligatorio."); return; }
        const num = parseFloat(value);
        if (isNaN(num)) { setError("El valor debe ser un número."); return; }

        // E1: valor duplicado dentro del mismo criterio
        const otherValues = isEditing
            ? existingValues.filter((v) => v !== editingScale!.value)
            : existingValues;
        if (otherValues.includes(num)) {
            setError(`El valor ${num} ya existe en este criterio. Debe ser único.`);
            return;
        }

        onSave({ name: name.trim(), description: description.trim(), value: num });
    };

    return (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4 space-y-3">
            <h4 className="text-sm font-semibold text-indigo-800">
                {isEditing ? "✏️ Editar nivel" : "➕ Nuevo nivel de escala"}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Nombre */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nombre (etiqueta) *
                    </label>
                    <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Ej: Excelente"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {/* Descripción */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Descripción
                    </label>
                    <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Ej: Cumple todos los requisitos..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {/* Valor numérico */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Valor (único por criterio) *
                    </label>
                    <input
                        type="number"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Ej: 100"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1">
                    ⚠️ {error}
                </p>
            )}

            <div className="flex gap-2 pt-1">
                <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors"
                >
                    {isEditing ? "Actualizar" : "Agregar nivel"}
                </button>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Página principal: Step3_DefineScales
// ─────────────────────────────────────────────────────────────

const Step3_DefineScales: React.FC = () => {
    const { rubricId, criterionId } = useParams<{
        rubricId: string;
        criterionId: string;
    }>();
    const navigate = useNavigate();

    const [criterion, setCriterion] = useState<Criterio | null>(null);
    const [scales, setScales] = useState<EscalaLocal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Formulario de creación/edición
    const [showForm, setShowForm] = useState(false);
    const [editingScale, setEditingScale] = useState<EscalaLocal | null>(null);

    // ── Carga inicial ──────────────────────────────────────────
    const loadData = useCallback(async () => {
        if (!criterionId) return;
        setIsLoading(true);
        try {
            const [criterionData, allScales] = await Promise.all([
                criterionService.getCriterionById(criterionId),
                scaleService.getScalesByCriterion(criterionId),
            ]);
            setCriterion(criterionData);
            setScales(allScales.map(toLocal));
        } catch (error) {
            console.error("Error cargando escalas:", error);
            Swal.fire("Error", "No se pudieron cargar los datos.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [criterionId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ── Valores actuales (para validar unicidad) ───────────────
    const currentValues = scales.map((s) => s.value);

    // ── Agregar nivel desde formulario ─────────────────────────
    const handleFormSave = async (data: {
        name: string;
        description: string;
        value: number;
    }) => {
        if (!criterionId) return;
        setIsSaving(true);
        try {
            if (editingScale && !editingScale._isNew && editingScale.id) {
                // Actualizar existente en backend
                const updated = await scaleService.updateScale(editingScale.id, {
                    criterion_id: criterionId,
                    ...data,
                });
                setScales((prev) =>
                    prev.map((s) =>
                        s._localId === editingScale._localId ? toLocal(updated) : s
                    )
                );
                Swal.fire({ icon: "success", title: "Nivel actualizado", timer: 1500, showConfirmButton: false });
            } else {
                // Crear nuevo en backend
                const created = await scaleService.createScale({
                    criterion_id: criterionId,
                    ...data,
                });
                setScales((prev) => [...prev, toLocal(created)]);
                Swal.fire({ icon: "success", title: "Nivel agregado", timer: 1500, showConfirmButton: false });
            }
            setShowForm(false);
            setEditingScale(null);
        } catch {
            Swal.fire("Error", "No se pudo guardar el nivel.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // ── Flujo alternativo 2a: Reutilizar escala de otro criterio ─
    const handleReuseScale = async () => {
        if (!criterionId) return;

        // Obtener TODAS las escalas del backend y filtrar las de OTROS criterios
        let allScales: Escala[] = [];
        try {
            allScales = await scaleService.getScales();
        } catch {
            Swal.fire("Error", "No se pudieron cargar las escalas existentes.", "error");
            return;
        }

        const others = allScales.filter((s) => s.criterion_id !== criterionId);
        if (others.length === 0) {
            Swal.fire("Sin escalas", "No hay escalas en otros criterios para reutilizar.", "info");
            return;
        }

        // Agrupar por criterion_id para mostrar en el select
        const grouped = others.reduce<Record<string, Escala[]>>((acc, s) => {
            if (!acc[s.criterion_id]) acc[s.criterion_id] = [];
            acc[s.criterion_id].push(s);
            return acc;
        }, {});

        const optionsHtml = Object.entries(grouped)
            .map(
                ([cid, ss]) =>
                    `<option value="${cid}">${cid.slice(0, 8)}... (${ss.length} niveles)</option>`
            )
            .join("");

        const { value: sourceCriterionId } = await Swal.fire({
            title: "Reutilizar escala existente",
            html: `
                <p class="text-sm text-gray-600 mb-3">
                    Los niveles del criterio seleccionado serán clonados con el ID de este criterio.
                </p>
                <label class="block text-sm font-medium text-left mb-1">Criterio de origen:</label>
                <select id="src-select" class="swal2-input w-full">
                    ${optionsHtml}
                </select>
            `,
            showCancelButton: true,
            confirmButtonText: "Clonar niveles",
            cancelButtonText: "Cancelar",
            preConfirm: () =>
                (document.getElementById("src-select") as HTMLSelectElement)?.value,
        });

        if (!sourceCriterionId) return;

        const sourceScales = grouped[sourceCriterionId] ?? [];
        setIsSaving(true);
        try {
            const cloned: EscalaLocal[] = [];
            for (const s of sourceScales) {
                // Validar unicidad antes de crear (E1)
                const alreadyUsed = [
                    ...currentValues,
                    ...cloned.map((c) => c.value),
                ].includes(s.value);
                if (alreadyUsed) continue; // Saltar valores duplicados

                const created = await scaleService.createScale({
                    criterion_id: criterionId!,
                    name: s.name,
                    description: s.description,
                    value: s.value,
                });
                cloned.push(toLocal(created));
            }

            if (cloned.length === 0) {
                Swal.fire(
                    "Sin cambios",
                    "Todos los valores del criterio origen ya existen en este criterio.",
                    "warning"
                );
            } else {
                setScales((prev) => [...prev, ...cloned]);
                Swal.fire({
                    icon: "success",
                    title: `${cloned.length} nivel(es) clonados`,
                    timer: 1800,
                    showConfirmButton: false,
                });
            }
        } catch {
            Swal.fire("Error", "No se pudieron clonar los niveles.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // ── Eliminar escala ────────────────────────────────────────
    const handleDelete = async (scale: EscalaLocal) => {
        const confirm = await Swal.fire({
            title: "¿Eliminar nivel?",
            text: `"${scale.name}" será eliminado permanentemente.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Eliminar",
            cancelButtonText: "Cancelar",
        });
        if (!confirm.isConfirmed) return;

        if (!scale._isNew && scale.id) {
            try {
                await scaleService.deleteScale(scale.id);
            } catch {
                Swal.fire("Error", "No se pudo eliminar el nivel.", "error");
                return;
            }
        }
        setScales((prev) => prev.filter((s) => s._localId !== scale._localId));
    };

    // ── Adaptación para GenericTable ───────────────────────────
    const columns = ["Nombre", "Descripción", "Valor"];

    const tableData = scales.map((s) => ({
        ...s,
        "Nombre": s.name || "—",
        "Descripción": s.description || "—",
        "Valor": s.value,
    }));

    const tableActions = [
        { name: "edit", label: "Editar" },
        { name: "delete", label: "Eliminar" },
    ];

    const handleTableAction = (actionName: string, item: Record<string, any>) => {
        const scale = scales.find((s) => s._localId === item._localId);
        if (!scale) return;

        if (actionName === "edit") {
            setEditingScale(scale);
            setShowForm(true);
        } else if (actionName === "delete") {
            handleDelete(scale);
        }
    };

    // ── Validación mínima ──────────────────────────────────────
    const hasMin2 = scales.length >= 2;
    const hasMax5 = scales.length < 5;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">

            {/* Encabezado */}
            <div>
                <button
                    onClick={() => navigate(`/rubrics/${rubricId}/define-scales/criteria`)}
                    className="text-xs text-indigo-600 hover:underline mb-1 flex items-center gap-1"
                >
                    ← Volver a criterios
                </button>

                {isLoading ? (
                    <p className="text-gray-400">Cargando criterio...</p>
                ) : (
                    <>
                        <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                                    {criterion?.name}
                                </h2>
                                {criterion?.description && (
                                    <p className="text-sm text-gray-500 mt-0.5">{criterion.description}</p>
                                )}
                            </div>
                            <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-3 py-1">
                                Peso: {criterion?.weight}%
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Define entre 2 y 5 niveles de desempeño. Cada valor debe ser único dentro de este criterio.
                        </p>
                    </>
                )}
            </div>

            {/* Estado de validación */}
            {!isLoading && (
                <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border ${
                    hasMin2
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-orange-50 border-orange-200 text-orange-700"
                }`}>
                    {hasMin2 ? "✅" : "⚠️"}
                    <span>
                        {scales.length} nivel(es) definidos — {hasMin2 ? "criterio completo" : `faltan ${2 - scales.length} para el mínimo requerido`}
                        {scales.length >= 5 && " · Máximo de 5 niveles alcanzado"}
                    </span>
                </div>
            )}

            {/* Acciones principales */}
            <div className="flex flex-wrap gap-3">
                <button
                    disabled={!hasMax5 || isSaving}
                    onClick={() => {
                        setEditingScale(null);
                        setShowForm(true);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm text-white transition-colors ${
                        hasMax5
                            ? "bg-indigo-600 hover:bg-indigo-700"
                            : "bg-gray-300 cursor-not-allowed"
                    }`}
                >
                    + Agregar nivel
                </button>

                <button
                    onClick={handleReuseScale}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 border border-indigo-300 text-indigo-600 rounded font-semibold text-sm hover:bg-indigo-50 transition-colors"
                >
                    ⇄ Reutilizar escala existente
                </button>
            </div>

            {/* Formulario inline (agregar / editar) */}
            {showForm && (
                <ScaleForm
                    criterionId={criterionId!}
                    existingValues={currentValues}
                    editingScale={editingScale}
                    onSave={handleFormSave}
                    onCancel={() => { setShowForm(false); setEditingScale(null); }}
                />
            )}

            {/* Tabla de escalas */}
            {isLoading ? (
                <div className="text-gray-400 py-6 text-center">Cargando niveles...</div>
            ) : scales.length > 0 ? (
                <>
                    <GenericTable
                        columns={columns}
                        data={tableData}
                        actions={tableActions}
                        onAction={handleTableAction}
                    />

                    {/* Aviso de valor único */}
                    <div className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded px-3 py-2">
                        ℹ️ El valor de cada nivel debe ser único dentro del mismo criterio (E1).
                        Los valores duplicados son rechazados automáticamente.
                    </div>
                </>
            ) : (
                <div className="text-center p-10 bg-gray-50 border border-dashed rounded-lg">
                    <p className="text-gray-400 text-sm">
                        Aún no hay niveles. Haz clic en <strong>Agregar nivel</strong> para comenzar.
                    </p>
                </div>
            )}

            {/* Footer de navegación */}
            <div className="flex justify-between items-center pt-4 border-t">
                <button
                    onClick={() => navigate(`/rubrics/${rubricId}/define-scales/criteria`)}
                    className="px-5 py-2.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors font-medium text-sm"
                >
                    ← Volver a criterios
                </button>
                <button
                    onClick={() => navigate(`/rubrics/${rubricId}/define-scales/criteria`)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-sm transition-colors"
                >
                    Guardar y continuar →
                </button>
            </div>
        </div>
    );
};

export default Step3_DefineScales;
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { Subject } from "../../models/Asignatura";
import { Rubrica } from "../../models/Rubrica";
import { Criterio } from "../../models/Criterio";
import { subjectService } from "../../service/subjectService";
import { rubricService } from "../../service/rubricService";
import { criterionService } from "../../service/criterionService";

type SubjectOption = {
  id: string;
  nombre: string;
  codigo: string;
};

type CriterionForm = {
  id: string;
  nombre: string;
  descripcion: string;
  peso: string;
};

type RubricRecord = {
  id: string;
  titulo: string;
  descripcion: string;
  asignaturaId: string;
  asignaturaNombre: string;
  estado: "borrador" | "publicada" | "archivada";
  criterios: {
    id?: string;
    nombre: string;
    descripcion: string;
    peso: number;
  }[];
  createdAt: string;
  updatedAt: string;
};

const createEmptyCriterion = (): CriterionForm => ({
  id: crypto.randomUUID(),
  nombre: "",
  descripcion: "",
  peso: "",
});

const RubricasManagementBackend: React.FC = () => {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingRubrics, setIsLoadingRubrics] = useState(true);
  const [asignaturaId, setAsignaturaId] = useState("");
  const [criterios, setCriterios] = useState<CriterionForm[]>([createEmptyCriterion()]);
  const [rubricas, setRubricas] = useState<RubricRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingSubjects(true);
      setIsLoadingRubrics(true);

      try {
        const [subjectsResponse, rubricsResponse] = await Promise.all([
          subjectService.getSubjects(),
          rubricService.getRubrics(),
        ]);

        const mappedSubjects = (Array.isArray(subjectsResponse) ? subjectsResponse : []).map((subject: Subject | any) => ({
          id: String(subject.id),
          nombre: subject.name ?? subject.nombre ?? "Sin nombre",
          codigo: subject.code ?? subject.codigo ?? "SIN-CODIGO",
        }));

        setSubjects(mappedSubjects);
        setAsignaturaId((current) => current || mappedSubjects[0]?.id || "");

        const subjectMap = new Map(mappedSubjects.map((subject) => [subject.id, subject]));
        const rubrics = Array.isArray(rubricsResponse) ? rubricsResponse : [];

        const normalized = await Promise.all(
          rubrics.map(async (rubric: Rubrica & Record<string, any>) => {
            const rubricId = String(rubric.id ?? "");
            const criteria = await criterionService.getCriteriaByRubric(rubricId);
            const subjectId = String(
              rubric.subject_id ?? rubric.subjectId ?? rubric.asignatura_id ?? rubric.asignaturaId ?? ""
            );

            const subjectInfo = subjectId ? subjectMap.get(subjectId) : null;
            const subjectLabel = subjectInfo
              ? `${subjectInfo.codigo} - ${subjectInfo.nombre}`
              : rubric.evaluacion?.Asignatura
                ? `${rubric.evaluacion.Asignatura.code ?? "SIN-CODIGO"} - ${rubric.evaluacion.Asignatura.name ?? "Sin nombre"}`
                : "Sin asignatura";

            return {
              id: rubricId,
              titulo: rubric.title ?? rubric.titulo ?? "Sin título",
              descripcion: rubric.description ?? rubric.descripcion ?? "",
              asignaturaId: subjectId,
              asignaturaNombre: subjectLabel,
              estado: rubric.is_archived
                ? "archivada"
                : rubric.is_public
                  ? "publicada"
                  : "borrador",
              criterios: (criteria || []).map((criterion: Criterio) => ({
                id: criterion.id,
                nombre: criterion.name,
                descripcion: criterion.description ?? "",
                peso: Number(criterion.weight ?? 0),
              })),
              createdAt: rubric.created_at ?? new Date().toISOString(),
              updatedAt: rubric.updated_at ?? new Date().toISOString(),
            } as RubricRecord;
          })
        );

        setRubricas(normalized);
      } catch (error) {
        console.error("Error cargando rúbricas o asignaturas:", error);
        Swal.fire({
          icon: "error",
          title: "No se pudieron cargar las rúbricas",
          text: "Verifica que el backend esté activo y que existan asignaturas creadas.",
        });
      } finally {
        setIsLoadingSubjects(false);
        setIsLoadingRubrics(false);
      }
    };

    loadInitialData();
  }, []);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === asignaturaId),
    [asignaturaId, subjects]
  );

  const totalWeight = useMemo(() => {
    return criterios.reduce((sum, criterio) => {
      const value = Number(criterio.peso);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [criterios]);

  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setAsignaturaId(subjects[0]?.id ?? "");
    setCriterios([createEmptyCriterion()]);
    setEditingId(null);
  };

  const addCriterion = () => {
    setCriterios((current) => [...current, createEmptyCriterion()]);
  };

  const updateCriterion = (
    criterionId: string,
    field: keyof Omit<CriterionForm, "id">,
    value: string
  ) => {
    setCriterios((current) =>
      current.map((criterion) =>
        criterion.id === criterionId ? { ...criterion, [field]: value } : criterion
      )
    );
  };

  const removeCriterion = (criterionId: string) => {
    setCriterios((current) => current.filter((criterion) => criterion.id !== criterionId));
  };

  const validateRubric = (strictWeightSum: boolean) => {
    if (!titulo.trim() || !descripcion.trim() || !asignaturaId) {
      Swal.fire({
        icon: "warning",
        title: "Campos obligatorios",
        text: "Debes completar el título, la descripción y la asignatura.",
      });
      return false;
    }

    if (criterios.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Sin criterios",
        text: "La rúbrica debe tener al menos un criterio para poder publicarse.",
      });
      return false;
    }

    const validCriteria = criterios.filter(
      (criterion) =>
        criterion.nombre.trim() &&
        criterion.descripcion.trim() &&
        criterion.peso !== "" &&
        !Number.isNaN(Number(criterion.peso))
    );

    if (validCriteria.length !== criterios.length) {
      Swal.fire({
        icon: "warning",
        title: "Criterios incompletos",
        text: "Cada criterio debe tener nombre, descripción y peso.",
      });
      return false;
    }

    const uniqueCriterionNames = new Set(
      criterios.map((criterion) => criterion.nombre.trim().toLowerCase())
    );

    if (uniqueCriterionNames.size !== criterios.length) {
      Swal.fire({
        icon: "warning",
        title: "Nombres duplicados",
        text: "No repitas el nombre de un criterio dentro de la misma rúbrica.",
      });
      return false;
    }

    const sum = totalWeight;
    if (strictWeightSum && sum !== 100) {
      const diferencia = 100 - sum;
      const texto = diferencia > 0
        ? `Faltan ${diferencia.toFixed(2)}% para completar 100%.`
        : `Exceden en ${Math.abs(diferencia).toFixed(2)}% sobre 100%.`;

      Swal.fire({
        icon: "error",
        title: "Suma de pesos inválida",
        text: `La suma actual es ${sum}%. ${texto} No se puede publicar hasta que sea exactamente 100%.`,
      });
      return false;
    }

    return true;
  };

  const syncCriteria = async (rubricId: string) => {
    const existing = await criterionService.getCriteriaByRubric(rubricId);
    for (const criterion of existing) {
      if (criterion.id) {
        await criterionService.deleteCriterion(criterion.id);
      }
    }

    const createdCriteria = [] as Criterio[];
    for (const criterion of criterios) {
      const created = await criterionService.createCriterion({
        rubric_id: rubricId,
        name: criterion.nombre.trim(),
        description: criterion.descripcion.trim(),
        weight: Number(criterion.peso),
      });
      createdCriteria.push(created);
    }

    return createdCriteria;
  };

  const saveRubric = async (estado: RubricRecord["estado"]) => {
    const strict = estado === "publicada";
    if (!validateRubric(strict)) return;

    const subject = selectedSubject;
    if (!subject) {
      Swal.fire({
        icon: "warning",
        title: "Sin asignatura",
        text: "Debes seleccionar una asignatura antes de guardar la rúbrica.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const basePayload = {
        title: titulo.trim(),
        description: descripcion.trim(),
        is_public: false,
      } as any;

      let rubricId = editingId;

      if (editingId) {
        await rubricService.updateRubric(editingId, basePayload);
        // If asignatura changed, try to update it separately
        if (asignaturaId) {
          try {
            await rubricService.updateRubric(editingId, { subject_id: asignaturaId } as any);
          } catch (e) {
            console.warn("No se pudo asociar asignatura al editar rúbrica:", e);
          }
        }
        await syncCriteria(editingId);
      } else {
        const created = await rubricService.createRubric(basePayload);
        rubricId = String(created?.id ?? created?._id ?? "");
        if (!rubricId) {
          throw new Error("La rúbrica fue creada pero no devolvió un ID válido.");
        }
        // Try to associate subject in a separate call to avoid POST failure
        if (asignaturaId) {
          try {
            await rubricService.updateRubric(rubricId, { subject_id: asignaturaId } as any);
          } catch (e) {
            console.warn("No se pudo asociar asignatura tras crear rúbrica:", e);
          }
        }
        await syncCriteria(rubricId);
      }

      if (estado === "publicada") {
        await rubricService.publishRubric(rubricId!);
      }

      Swal.fire({
        icon: "success",
        title: estado === "publicada" ? "Rúbrica publicada" : "Borrador guardado",
        text:
          estado === "publicada"
            ? "La rúbrica quedó lista para usarse en evaluaciones."
            : "La rúbrica se guardó como borrador para seguir editándola.",
      });

      await loadRubricsAgain();
      resetForm();
    } catch (error) {
      console.error("Error guardando la rúbrica:", error);
      const resp = (error as any)?.response?.data;
      const serverMsg = resp?.message ?? resp ?? String(error);
      let detail = typeof serverMsg === "object" ? JSON.stringify(serverMsg, null, 2) : String(serverMsg);
      // Limitar tamaño del detalle para no romper el modal
      if (detail.length > 2000) detail = detail.slice(0, 2000) + "...";

      Swal.fire({
        icon: "error",
        title: "No se pudo guardar la rúbrica",
        html: `<div>Revisa la conexión con el backend.</div><pre style="text-align:left;white-space:pre-wrap;margin-top:8px">${detail}</pre>`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadRubricsAgain = async () => {
    const rubricsResponse = await rubricService.getRubrics();
    const rubrics = Array.isArray(rubricsResponse) ? rubricsResponse : [];
    const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]));

    const normalized = await Promise.all(
      rubrics.map(async (rubric: Rubrica & Record<string, any>) => {
        const rubricId = String(rubric.id ?? "");
        const criteria = await criterionService.getCriteriaByRubric(rubricId);
        const subjectId = String(
          rubric.subject_id ?? rubric.subjectId ?? rubric.asignatura_id ?? rubric.asignaturaId ?? ""
        );

        const subjectInfo = subjectId ? subjectMap.get(subjectId) : null;
        const subjectLabel = subjectInfo
          ? `${subjectInfo.codigo} - ${subjectInfo.nombre}`
          : rubric.evaluacion?.Asignatura
            ? `${rubric.evaluacion.Asignatura.code ?? "SIN-CODIGO"} - ${rubric.evaluacion.Asignatura.name ?? "Sin nombre"}`
            : "Sin asignatura";

        return {
          id: rubricId,
          titulo: rubric.title ?? rubric.titulo ?? "Sin título",
          descripcion: rubric.description ?? rubric.descripcion ?? "",
          asignaturaId: subjectId,
          asignaturaNombre: subjectLabel,
          estado: rubric.is_archived
            ? "archivada"
            : rubric.is_public
              ? "publicada"
              : "borrador",
          criterios: (criteria || []).map((criterion: Criterio) => ({
            id: criterion.id,
            nombre: criterion.name,
            descripcion: criterion.description ?? "",
            peso: Number(criterion.weight ?? 0),
          })),
          createdAt: rubric.created_at ?? new Date().toISOString(),
          updatedAt: rubric.updated_at ?? new Date().toISOString(),
        } as RubricRecord;
      })
    );

    setRubricas(normalized);
  };

  const editRubric = async (rubricId: string) => {
    const rubric = rubricas.find((item) => item.id === rubricId);
    if (!rubric || rubric.estado === "archivada") return;

    setTitulo(rubric.titulo);
    setDescripcion(rubric.descripcion);
    setAsignaturaId(rubric.asignaturaId || subjects[0]?.id || "");
    setCriterios(
      rubric.criterios.length > 0
        ? rubric.criterios.map((criterion) => ({
            id: criterion.id ?? crypto.randomUUID(),
            nombre: criterion.nombre,
            descripcion: criterion.descripcion,
            peso: String(criterion.peso),
          }))
        : [createEmptyCriterion()]
    );
    setEditingId(rubric.id);
  };

  const archiveRubric = async (rubricId: string) => {
    const confirm = await Swal.fire({
      title: "¿Archivar rúbrica?",
      text: "La rúbrica quedará oculta para seguir editándola, pero no se eliminará.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, archivar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await rubricService.updateRubric(rubricId, { is_archived: true, is_public: true } as any);
      await loadRubricsAgain();
      Swal.fire("Archivada", "La rúbrica fue archivada correctamente.", "success");
    } catch (error) {
      console.error("Error archivando la rúbrica:", error);
      Swal.fire("Error", "No se pudo archivar la rúbrica.", "error");
    }
  };

  const deleteDraft = async (rubricId: string) => {
    const rubric = rubricas.find((item) => item.id === rubricId);
    if (!rubric || rubric.estado !== "borrador") return;

    const confirm = await Swal.fire({
      title: "¿Eliminar borrador?",
      text: "Esta acción eliminará la rúbrica y sus criterios asociados.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      const criteria = await criterionService.getCriteriaByRubric(rubricId);
      for (const criterion of criteria) {
        if (criterion.id) {
          await criterionService.deleteCriterion(criterion.id);
        }
      }

      await rubricService.deleteRubric(rubricId);
      await loadRubricsAgain();
      Swal.fire("Eliminada", "El borrador fue eliminado.", "success");
    } catch (error) {
      console.error("Error eliminando el borrador:", error);
      Swal.fire("Error", "No se pudo eliminar la rúbrica.", "error");
    }
  };

  useEffect(() => {
    if (subjects.length > 0 && !asignaturaId) {
      setAsignaturaId(subjects[0].id);
    }
  }, [asignaturaId, subjects]);

  useEffect(() => {
    if (!isLoadingRubrics && rubricas.length === 0) {
      return;
    }
  }, [isLoadingRubrics, rubricas.length]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">HU-08</p>
        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Crear rúbrica de evaluación
        </h1>
        <p className="text-sm text-gray-500">
          Define criterios con peso porcentual. Puedes guardar borrador y solo publicar cuando la suma sea exactamente 100%.
        </p>
      </div>

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Título
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
              placeholder="Rúbrica de proyecto final"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Asignatura
            </label>
            <select
              value={asignaturaId}
              onChange={(e) => setAsignaturaId(e.target.value)}
              disabled={isLoadingSubjects || subjects.length === 0}
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
            >
              <option value="">-- Selecciona una asignatura --</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.codigo} - {subject.nombre}
                </option>
              ))}
            </select>
            {!isLoadingSubjects && subjects.length === 0 && (
              <p className="mt-1 text-xs text-red-500">
                No hay asignaturas disponibles para asociar.
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
              placeholder="Describe el instrumento y su propósito"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-gray-2 px-4 py-3 dark:bg-meta-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-200">
              Peso total: <span className={`font-semibold ${
                totalWeight === 100
                  ? "text-green-600 dark:text-green-400"
                  : totalWeight === 0
                    ? "text-gray-600 dark:text-gray-400"
                    : "text-red-600 dark:text-red-400"
              }`}>{totalWeight}%</span>
            </p>
            {totalWeight !== 0 && totalWeight !== 100 && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {totalWeight < 100
                  ? `Faltan ${(100 - totalWeight).toFixed(2)}%`
                  : `Exceden ${(totalWeight - 100).toFixed(2)}%`}
              </p>
            )}
            {totalWeight === 100 && (
              <p className="text-xs text-green-600 dark:text-green-400">
                ✓ Listo para publicar
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={addCriterion}
            className="rounded-md border border-stroke px-4 py-2 text-sm font-medium dark:border-strokedark"
          >
            + Agregar criterio
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {criterios.map((criterion, index) => (
            <div
              key={criterion.id}
              className="rounded-xl border border-stroke p-4 dark:border-strokedark"
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  Criterio {index + 1}
                </h2>
                {criterios.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCriterion(criterion.id)}
                    className="rounded-md border border-stroke px-3 py-1 text-xs font-medium text-red-500 dark:border-strokedark"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Nombre
                  </label>
                  <input
                    value={criterion.nombre}
                    onChange={(e) => updateCriterion(criterion.id, "nombre", e.target.value)}
                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
                    placeholder="Responsabilidad"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Peso %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={criterion.peso}
                    onChange={(e) => updateCriterion(criterion.id, "peso", e.target.value)}
                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
                    placeholder="25"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Descripción
                  </label>
                  <input
                    value={criterion.descripcion}
                    onChange={(e) => updateCriterion(criterion.id, "descripcion", e.target.value)}
                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
                    placeholder="Describe cómo se evaluará"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => saveRubric("borrador")}
            disabled={isSaving}
            className="rounded-md border border-stroke px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-strokedark dark:hover:bg-meta-4"
          >
            💾 Guardar como borrador
          </button>
          <button
            type="button"
            onClick={() => saveRubric("publicada")}
            disabled={isLoadingSubjects || subjects.length === 0 || totalWeight !== 100 || criterios.length === 0 || isSaving}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
              !isLoadingSubjects && subjects.length > 0 && totalWeight === 100 && criterios.length > 0
                ? "bg-primary hover:bg-opacity-90"
                : "cursor-not-allowed bg-gray-400 dark:bg-gray-600"
            }`}
            title={
              isLoadingSubjects || subjects.length === 0
                ? "Cargando asignaturas o no hay materias disponibles"
                : criterios.length === 0
                  ? "Agrega al menos un criterio"
                  : totalWeight !== 100
                    ? `La suma debe ser 100% (actual: ${totalWeight}%)`
                    : "Publicar rúbrica"
            }
          >
            🚀 Publicar rúbrica
            {totalWeight !== 100 && criterios.length > 0 && (
              <span className="ml-1 text-xs">({totalWeight}%)</span>
            )}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-stroke px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4"
            >
              ✕ Cancelar edición
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Rúbricas creadas
        </h2>

        {isLoadingRubrics ? (
          <div className="mt-4 p-6 text-gray-400">Cargando rúbricas...</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full table-auto text-left">
              <thead>
                <tr className="bg-gray-2 dark:bg-meta-4">
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Asignatura</th>
                  <th className="px-4 py-3">Criterios</th>
                  <th className="px-4 py-3">Peso total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rubricas.length > 0 ? rubricas.map((rubrica) => {
                  const total = rubrica.criterios.reduce((sum, criterio) => sum + criterio.peso, 0);
                  const isPublished = rubrica.estado === "publicada";
                  const isArchived = rubrica.estado === "archivada";
                  return (
                    <tr key={rubrica.id} className="border-b border-stroke dark:border-strokedark">
                      <td className="px-4 py-3 text-black dark:text-white">{rubrica.titulo}</td>
                      <td className="px-4 py-3">{rubrica.asignaturaNombre}</td>
                      <td className="px-4 py-3">{rubrica.criterios.length}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${
                          total === 100
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          {total}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          isPublished
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
                            : isArchived
                              ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100"
                        }`}>
                          {isPublished ? "Publicada" : isArchived ? "Archivada" : "Borrador"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {(rubrica.estado === "borrador" || rubrica.estado === "publicada") && (
                            <button
                              type="button"
                              onClick={() => editRubric(rubrica.id)}
                              className="rounded-md border border-stroke px-3 py-1 text-xs font-medium hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4"
                            >
                              Editar
                            </button>
                          )}
                          {rubrica.estado === "borrador" && (
                            <button
                              type="button"
                              onClick={() => deleteDraft(rubrica.id)}
                              className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900"
                            >
                              Eliminar
                            </button>
                          )}
                          {rubrica.estado !== "archivada" && (
                            <button
                              type="button"
                              onClick={() => archiveRubric(rubrica.id)}
                              className="rounded-md border border-stroke px-3 py-1 text-xs font-medium hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4"
                            >
                              Archivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No hay rúbricas creadas todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default RubricasManagementBackend;

import React, { useMemo, useState } from "react";

import Swal from "sweetalert2";

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
    nombre: string;
    descripcion: string;
    peso: number;
  }[];
  createdAt: string;
  updatedAt: string;
};

const subjectCatalog: SubjectOption[] = [
  { id: "asig-1", nombre: "Programación I", codigo: "PRO-101" },
  { id: "asig-2", nombre: "Matemática I", codigo: "MAT-101" },
  { id: "asig-3", nombre: "Bases de Datos", codigo: "BD-201" },
  { id: "asig-4", nombre: "Redes", codigo: "RED-201" },
];

const initialCriteria: CriterionForm[] = [
  {
    id: crypto.randomUUID(),
    nombre: "",
    descripcion: "",
    peso: "",
  },
];

const RubricasManagement: React.FC = () => {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [asignaturaId, setAsignaturaId] = useState(subjectCatalog[0].id);
  const [criterios, setCriterios] = useState<CriterionForm[]>(initialCriteria);
  const [rubricas, setRubricas] = useState<RubricRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectedSubject = useMemo(
    () => subjectCatalog.find((subject) => subject.id === asignaturaId),
    [asignaturaId]
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
    setAsignaturaId(subjectCatalog[0].id);
    setCriterios([
      {
        id: crypto.randomUUID(),
        nombre: "",
        descripcion: "",
        peso: "",
      },
    ]);
    setEditingId(null);
  };

  const addCriterion = () => {
    setCriterios((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        nombre: "",
        descripcion: "",
        peso: "",
      },
    ]);
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

    if (criterios.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin criterios",
        text: "La rúbrica debe tener al menos un criterio.",
      });
      return false;
    }

    const sum = totalWeight;
    if (strictWeightSum && sum !== 100) {
      Swal.fire({
        icon: "error",
        title: "Suma inválida",
        text: `La suma de pesos debe ser exactamente 100%. Actualmente es ${sum}%.`,
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

    return true;
  };

  const saveRubric = (estado: RubricRecord["estado"]) => {
    const strict = estado === "publicada";
    if (!validateRubric(strict)) return;

    const subject = selectedSubject;
    if (!subject) return;

    const payload: RubricRecord = {
      id: editingId ?? crypto.randomUUID(),
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      asignaturaId,
      asignaturaNombre: `${subject.codigo} - ${subject.nombre}`,
      estado,
      criterios: criterios.map((criterion) => ({
        nombre: criterion.nombre.trim(),
        descripcion: criterion.descripcion.trim(),
        peso: Number(criterion.peso),
      })),
      createdAt: editingId
        ? rubricas.find((item) => item.id === editingId)?.createdAt ?? new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRubricas((current) => {
      if (editingId) {
        return current.map((rubrica) =>
          rubrica.id === editingId ? payload : rubrica
        );
      }
      return [payload, ...current];
    });

    Swal.fire({
      icon: "success",
      title: estado === "publicada" ? "Rúbrica publicada" : "Borrador guardado",
      text:
        estado === "publicada"
          ? "La rúbrica quedó lista para usarse en evaluaciones."
          : "La rúbrica se guardó como borrador para seguir editándola.",
    });

    resetForm();
  };

  const editRubric = (rubricId: string) => {
    const rubric = rubricas.find((item) => item.id === rubricId);
    if (!rubric || rubric.estado === "archivada") return;

    setTitulo(rubric.titulo);
    setDescripcion(rubric.descripcion);
    setAsignaturaId(rubric.asignaturaId);
    setCriterios(
      rubric.criterios.map((criterion) => ({
        id: crypto.randomUUID(),
        nombre: criterion.nombre,
        descripcion: criterion.descripcion,
        peso: String(criterion.peso),
      }))
    );
    setEditingId(rubric.id);
  };

  const archiveRubric = (rubricId: string) => {
    setRubricas((current) =>
      current.map((rubric) =>
        rubric.id === rubricId ? { ...rubric, estado: "archivada", updatedAt: new Date().toISOString() } : rubric
      )
    );
  };

  const deleteDraft = (rubricId: string) => {
    setRubricas((current) => current.filter((rubric) => rubric.id !== rubricId));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">HU-08</p>
        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Crear rúbrica de evaluación
        </h1>
        <p className="text-sm text-gray-500">
          Define criterios con peso porcentual. Puedes guardar borrador y solo
          publicar cuando la suma sea exactamente 100%.
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
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedrokedark dark:bg-form-input dark:text-white"
            >
              {subjectCatalog.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.codigo} - {subject.nombre}
                </option>
              ))}
            </select>
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
          <p className="text-sm text-gray-600 dark:text-gray-200">
            Peso total: <span className="font-semibold">{totalWeight}%</span>
          </p>
          <button
            type="button"
            onClick={addCriterion}
            className="rounded-md border border-stroke px-4 py-2 text-sm font-medium dark:border-strokedark"
          >
            Agregar criterio
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
            className="rounded-md border border-stroke px-4 py-2 text-sm font-medium dark:border-strokedark"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={() => saveRubric("publicada")}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Publicar rúbrica
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-stroke px-4 py-2 text-sm font-medium dark:border-strokedark"
            >
              Cancelar edición
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Rúbricas creadas
        </h2>
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
              {rubricas.map((rubrica) => {
                const total = rubrica.criterios.reduce((sum, criterio) => sum + criterio.peso, 0);
                return (
                  <tr key={rubrica.id} className="border-b border-stroke dark:border-strokedark">
                    <td className="px-4 py-3 text-black dark:text-white">{rubrica.titulo}</td>
                    <td className="px-4 py-3">{rubrica.asignaturaNombre}</td>
                    <td className="px-4 py-3">{rubrica.criterios.length}</td>
                    <td className="px-4 py-3">{total}%</td>
                    <td className="px-4 py-3">{rubrica.estado}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {(rubrica.estado === "borrador" || rubrica.estado === "publicada") && (
                          <button
                            type="button"
                            onClick={() => editRubric(rubrica.id)}
                            className="rounded-md border border-stroke px-3 py-1 text-xs font-medium dark:border-strokedark"
                          >
                            Editar
                          </button>
                        )}
                        {rubrica.estado === "borrador" && (
                          <button
                            type="button"
                            onClick={() => deleteDraft(rubrica.id)}
                            className="rounded-md border border-stroke px-3 py-1 text-xs font-medium text-red-500 dark:border-strokedark"
                          >
                            Eliminar borrador
                          </button>
                        )}
                        {rubrica.estado !== "archivada" && (
                          <button
                            type="button"
                            onClick={() => archiveRubric(rubrica.id)}
                            className="rounded-md border border-stroke px-3 py-1 text-xs font-medium dark:border-strokedark"
                          >
                            Archivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default RubricasManagement;
import React, { useMemo, useState } from "react";

import Swal from "sweetalert2";

type Subject = {
  code: string;
  name: string;
  semesterSuggested: number;
  credits: number;
};

type PlanVersion = {
  id: number;
  careerName: string;
  year: number;
  status: "borrador" | "publicado";
  subjects: Subject[];
};

const careers = [
  "Ingeniería de Sistemas",
  "Contabilidad",
  "Administración",
];

const catalog = [
  { code: "MAT-101", name: "Matemática I", semesterSuggested: 1, credits: 4 },
  { code: "PRO-101", name: "Programación I", semesterSuggested: 1, credits: 5 },
  { code: "BD-201", name: "Bases de Datos", semesterSuggested: 3, credits: 4 },
  { code: "RED-201", name: "Redes", semesterSuggested: 4, credits: 3 },
];

const StudyPlanManagement: React.FC = () => {
  const [careerName, setCareerName] = useState(careers[0]);
  const [year, setYear] = useState(2026);
  const [search, setSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState(catalog[0].code);
  const [currentSubjects, setCurrentSubjects] = useState<Subject[]>([
    catalog[0],
  ]);
  const [history, setHistory] = useState<PlanVersion[]>([
    {
      id: 1,
      careerName: careers[0],
      year: 2025,
      status: "publicado",
      subjects: [catalog[0], catalog[1]],
    },
  ]);

  const filteredCatalog = useMemo(() => {
    const text = search.toLowerCase();
    return catalog.filter((subject) => {
      if (!text) return true;
      return (
        subject.code.toLowerCase().includes(text) ||
        subject.name.toLowerCase().includes(text)
      );
    });
  }, [search]);

  const addSubject = () => {
    const subject = catalog.find((item) => item.code === selectedCode);
    if (!subject) return;

    if (currentSubjects.some((item) => item.code === subject.code)) {
      Swal.fire({
        icon: "warning",
        title: "Asignatura repetida",
        text: "Esa asignatura ya está en el plan.",
      });
      return;
    }

    setCurrentSubjects((current) => [...current, subject]);
  };

  const removeSubject = (code: string) => {
    setCurrentSubjects((current) => current.filter((item) => item.code !== code));
  };

  const saveDraft = () => {
    setHistory((current) => [
      ...current,
      {
        id: Date.now(),
        careerName,
        year,
        status: "borrador",
        subjects: currentSubjects,
      },
    ]);

    Swal.fire({
      icon: "success",
      title: "Borrador guardado",
      text: "El plan queda como una nueva versión sin publicar.",
    });
  };

  const publishPlan = () => {
    if (currentSubjects.length === 0) {
      Swal.fire({
        icon: "error",
        title: "No se puede publicar",
        text: "El plan debe tener al menos una asignatura.",
      });
      return;
    }

    setHistory((current) => [
      ...current,
      {
        id: Date.now(),
        careerName,
        year,
        status: "publicado",
        subjects: currentSubjects,
      },
    ]);

    Swal.fire({
      icon: "success",
      title: "Plan publicado",
      text: "Los cambios aplican como una nueva versión para nuevas cohortes.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">HU-03</p>
        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Plan de estudios
        </h1>
        <p className="text-sm text-gray-500">
          Agrega o remueve asignaturas, guarda versiones y publica sólo cuando
          el plan esté completo.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Configurar versión
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Carrera
              </label>
              <select
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
                value={careerName}
                onChange={(e) => setCareerName(e.target.value)}
              >
                {careers.map((career) => (
                  <option key={career} value={career}>
                    {career}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Año de versión
              </label>
              <input
                type="number"
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Buscar asignatura
              </label>
              <input
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
                placeholder="Código o nombre"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Agregar
              </label>
              <select
                className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
              >
                {filteredCatalog.map((subject) => (
                  <option key={subject.code} value={subject.code}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addSubject}
                className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
              >
                Añadir asignatura
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full table-auto text-left">
              <thead>
                <tr className="bg-gray-2 dark:bg-meta-4">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Asignatura</th>
                  <th className="px-4 py-3">Semestre sugerido</th>
                  <th className="px-4 py-3">Créditos</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {currentSubjects.map((subject) => (
                  <tr key={subject.code} className="border-b border-stroke dark:border-strokedark">
                    <td className="px-4 py-3">{subject.code}</td>
                    <td className="px-4 py-3 text-black dark:text-white">{subject.name}</td>
                    <td className="px-4 py-3">{subject.semesterSuggested}</td>
                    <td className="px-4 py-3">{subject.credits}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeSubject(subject.code)}
                        className="rounded-md border border-stroke px-3 py-1 text-sm"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={saveDraft}
              className="rounded-md border border-stroke px-4 py-2 text-sm font-medium"
            >
              Guardar borrador
            </button>
            <button
              type="button"
              onClick={publishPlan}
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white"
            >
              Publicar versión
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Histórico de versiones
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Aquí queda el registro por año y estado para que nuevas cohortes
            usen la versión publicada correcta.
          </p>

          <div className="mt-4 space-y-3">
            {history.map((version) => (
              <div
                key={version.id}
                className="rounded-xl border border-stroke p-4 dark:border-strokedark"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-black dark:text-white">
                      {version.careerName} - {version.year}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {version.subjects.length} asignaturas
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-2 px-3 py-1 text-xs uppercase tracking-wide dark:bg-meta-4">
                    {version.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudyPlanManagement;
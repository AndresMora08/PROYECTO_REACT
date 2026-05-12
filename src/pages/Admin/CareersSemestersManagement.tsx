import React, { useMemo, useState } from "react";

import Swal from "sweetalert2";

type Career = {
  id: number;
  name: string;
  code: string;
  description: string;
  archived: boolean;
  hasEnrolledStudents: boolean;
};

type Semester = {
  id: number;
  careerId: number;
  name: string;
  startDate: string;
  endDate: string;
  status: "activo" | "cerrado";
};

const initialCareers: Career[] = [
  {
    id: 1,
    name: "Ingeniería de Sistemas",
    code: "IS-001",
    description: "Carrera base del catálogo académico.",
    archived: false,
    hasEnrolledStudents: false,
  },
];

const initialSemesters: Semester[] = [
  {
    id: 1,
    careerId: 1,
    name: "2026-1",
    startDate: "2026-01-15",
    endDate: "2026-06-20",
    status: "activo",
  },
];

const CareersSemestersManagement: React.FC = () => {
  const [careers, setCareers] = useState<Career[]>(initialCareers);
  const [semesters, setSemesters] = useState<Semester[]>(initialSemesters);
  const [careerForm, setCareerForm] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [semesterForm, setSemesterForm] = useState({
    careerId: 1,
    name: "",
    startDate: "",
    endDate: "",
    status: "activo" as "activo" | "cerrado",
  });

  const activeSemestersByCareer = useMemo(() => {
    return semesters.reduce<Record<number, number>>((acc, semester) => {
      if (semester.status === "activo") {
        acc[semester.careerId] = (acc[semester.careerId] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [semesters]);

  const addCareer = () => {
    const trimmedName = careerForm.name.trim();
    const trimmedCode = careerForm.code.trim();

    if (!trimmedName || !trimmedCode) {
      Swal.fire({
        icon: "warning",
        title: "Campos obligatorios",
        text: "Nombre y código son obligatorios.",
      });
      return;
    }

    if (careers.some((career) => career.code === trimmedCode)) {
      Swal.fire({
        icon: "error",
        title: "Código duplicado",
        text: "No se puede crear otra carrera con el mismo código.",
      });
      return;
    }

    setCareers((current) => [
      ...current,
      {
        id: Date.now(),
        name: trimmedName,
        code: trimmedCode,
        description: careerForm.description.trim(),
        archived: false,
        hasEnrolledStudents: false,
      },
    ]);

    setCareerForm({ name: "", code: "", description: "" });
  };

  const archiveCareer = (careerId: number) => {
    const career = careers.find((item) => item.id === careerId);
    if (!career) return;

    if (career.hasEnrolledStudents) {
      Swal.fire({
        icon: "error",
        title: "No se puede eliminar",
        text: "La carrera tiene estudiantes matriculados.",
      });
      return;
    }

    if (activeSemestersByCareer[careerId]) {
      Swal.fire({
        icon: "error",
        title: "Semestre activo",
        text: "No puedes archivar mientras exista un semestre activo.",
      });
      return;
    }

    setCareers((current) =>
      current.map((item) =>
        item.id === careerId ? { ...item, archived: true } : item
      )
    );
  };

  const addSemester = () => {
    const start = new Date(semesterForm.startDate);
    const end = new Date(semesterForm.endDate);

    if (!semesterForm.name.trim() || !semesterForm.startDate || !semesterForm.endDate) {
      Swal.fire({
        icon: "warning",
        title: "Campos obligatorios",
        text: "Debes completar nombre, fecha de inicio y fecha de fin.",
      });
      return;
    }

    if (start >= end) {
      Swal.fire({
        icon: "error",
        title: "Fechas inválidas",
        text: "La fecha de inicio debe ser menor que la fecha de fin.",
      });
      return;
    }

    if (semesterForm.status === "activo" && activeSemestersByCareer[semesterForm.careerId]) {
      Swal.fire({
        icon: "error",
        title: "Solo un semestre activo",
        text: "Esa carrera ya tiene un semestre activo.",
      });
      return;
    }

    setSemesters((current) => [
      ...current,
      {
        id: Date.now(),
        careerId: semesterForm.careerId,
        name: semesterForm.name.trim(),
        startDate: semesterForm.startDate,
        endDate: semesterForm.endDate,
        status: semesterForm.status,
      },
    ]);

    setSemesterForm({
      careerId: semesterForm.careerId,
      name: "",
      startDate: "",
      endDate: "",
      status: "activo",
    });
  };

  const toggleSemesterStatus = (semesterId: number) => {
    setSemesters((current) =>
      current.map((semester) => {
        if (semester.id !== semesterId) return semester;

        const nextStatus = semester.status === "activo" ? "cerrado" : "activo";
        if (nextStatus === "activo" && activeSemestersByCareer[semester.careerId]) {
          Swal.fire({
            icon: "error",
            title: "Regla violada",
            text: "Solo puede haber un semestre activo por carrera.",
          });
          return semester;
        }

        return { ...semester, status: nextStatus };
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">HU-02</p>
        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Carreras y semestres
        </h1>
        <p className="text-sm text-gray-500">
          Crea carreras, archívalas y controla el estado de los semestres con
          validaciones visibles en la interfaz.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Crear carrera
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              className="rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
              placeholder="Nombre"
              value={careerForm.name}
              onChange={(e) => setCareerForm((current) => ({ ...current, name: e.target.value }))}
            />
            <input
              className="rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
              placeholder="Código único"
              value={careerForm.code}
              onChange={(e) => setCareerForm((current) => ({ ...current, code: e.target.value }))}
            />
            <textarea
              className="md:col-span-2 rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
              placeholder="Descripción"
              rows={3}
              value={careerForm.description}
              onChange={(e) => setCareerForm((current) => ({ ...current, description: e.target.value }))}
            />
          </div>
          <button
            type="button"
            onClick={addCareer}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Guardar carrera
          </button>
        </section>

        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Crear semestre
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <select
              className="rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
              value={semesterForm.careerId}
              onChange={(e) =>
                setSemesterForm((current) => ({ ...current, careerId: Number(e.target.value) }))
              }
            >
              {careers.map((career) => (
                <option key={career.id} value={career.id}>
                  {career.name}
                </option>
              ))}
            </select>
            <input
              className="rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
              placeholder="Nombre del semestre"
              value={semesterForm.name}
              onChange={(e) => setSemesterForm((current) => ({ ...current, name: e.target.value }))}
            />
            <input
              type="date"
              className="rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
              value={semesterForm.startDate}
              onChange={(e) => setSemesterForm((current) => ({ ...current, startDate: e.target.value }))}
            />
            <input
              type="date"
              className="rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
              value={semesterForm.endDate}
              onChange={(e) => setSemesterForm((current) => ({ ...current, endDate: e.target.value }))}
            />
            <select
              className="md:col-span-2 rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
              value={semesterForm.status}
              onChange={(e) =>
                setSemesterForm((current) => ({
                  ...current,
                  status: e.target.value as "activo" | "cerrado",
                }))
              }
            >
              <option value="activo">Activo</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
          <button
            type="button"
            onClick={addSemester}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Guardar semestre
          </button>
        </section>
      </div>

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Carreras registradas
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="bg-gray-2 dark:bg-meta-4">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {careers.map((career) => (
                <tr key={career.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-3 text-black dark:text-white">{career.name}</td>
                  <td className="px-4 py-3">{career.code}</td>
                  <td className="px-4 py-3">{career.archived ? "Archivada" : "Activa"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => archiveCareer(career.id)}
                      className="rounded-md border border-stroke px-3 py-1 text-sm"
                    >
                      Archivar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Semestres registrados
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="bg-gray-2 dark:bg-meta-4">
                <th className="px-4 py-3">Carrera</th>
                <th className="px-4 py-3">Semestre</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Fin</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {semesters.map((semester) => {
                const career = careers.find((item) => item.id === semester.careerId);
                return (
                  <tr key={semester.id} className="border-b border-stroke dark:border-strokedark">
                    <td className="px-4 py-3">{career?.name ?? semester.careerId}</td>
                    <td className="px-4 py-3 text-black dark:text-white">{semester.name}</td>
                    <td className="px-4 py-3">{semester.startDate}</td>
                    <td className="px-4 py-3">{semester.endDate}</td>
                    <td className="px-4 py-3">{semester.status}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSemesterStatus(semester.id)}
                        className="rounded-md border border-stroke px-3 py-1 text-sm"
                      >
                        Cambiar estado
                      </button>
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

export default CareersSemestersManagement;
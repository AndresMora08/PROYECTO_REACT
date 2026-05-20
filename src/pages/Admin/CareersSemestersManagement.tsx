import React, { useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";
import { careerService } from "../../service/careerService";

type Career = {
  id: string;
  name: string;
  code: string;
  description: string;
  archived: boolean;
  hasEnrolledStudents: boolean;
  createdAt: string;
  updatedAt: string;
};

type Semester = {
  id: string;
  careerId: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: "activo" | "cerrado";
  createdAt: string;
  updatedAt: string;
};

const nowIso = () => new Date().toISOString();

const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}`;
};

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const initialSemesters: Semester[] = [];

const CareersSemestersManagement: React.FC = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>(initialSemesters);
  const [isLoadingCareers, setIsLoadingCareers] = useState(true);
  const [editingCareerId, setEditingCareerId] = useState<string | null>(null);
  const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
  const [careerForm, setCareerForm] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [semesterForm, setSemesterForm] = useState({
    careerId: "",
    name: "",
    code: "",
    startDate: "",
    endDate: "",
    status: "activo" as "activo" | "cerrado",
  });

  const availableCareers = useMemo(
    () => careers.filter((career) => !career.archived),
    [careers]
  );

  const loadCareers = async () => {
    setIsLoadingCareers(true);
    const data = await careerService.getCareers();
    setCareers(data);
    setIsLoadingCareers(false);
  };

  useEffect(() => {
    loadCareers();
  }, []);

  useEffect(() => {
    if (!availableCareers.length) return;

    const hasCurrentCareer = availableCareers.some(
      (career) => career.id === semesterForm.careerId
    );

    if (!hasCurrentCareer) {
      setSemesterForm((current) => ({
        ...current,
        careerId: availableCareers[0].id,
      }));
    }
  }, [availableCareers, semesterForm.careerId]);

  const activeSemestersByCareer = useMemo(() => {
    return semesters.reduce<Record<string, number>>((acc, semester) => {
      if (semester.status === "activo") {
        acc[semester.careerId] = (acc[semester.careerId] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [semesters]);

  const validateCareerForm = (careerIdToIgnore?: string) => {
    const trimmedName = careerForm.name.trim();
    const trimmedCode = careerForm.code.trim();

    if (!trimmedName || !trimmedCode) {
      Swal.fire({
        icon: "warning",
        title: "Campos obligatorios",
        text: "Nombre y código son obligatorios.",
      });
      return null;
    }

    const duplicate = careers.some(
      (career) =>
        career.code.toLowerCase() === trimmedCode.toLowerCase() &&
        career.id !== careerIdToIgnore
    );

    if (duplicate) {
      Swal.fire({
        icon: "error",
        title: "Código duplicado",
        text: "No se puede crear ni editar una carrera con el mismo código.",
      });
      return null;
    }

    return {
      name: trimmedName,
      code: trimmedCode,
      description: careerForm.description.trim(),
    };
  };

  const resetCareerForm = () => {
    setCareerForm({ name: "", code: "", description: "" });
    setEditingCareerId(null);
  };

  const addCareer = async () => {
    const payload = validateCareerForm();
    if (!payload) return;

    try {
      await careerService.createCareer(payload);
      await loadCareers();
      resetCareerForm();

      Swal.fire({
        icon: "success",
        title: "Carrera creada",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error al crear",
        text: error?.message || "No se pudo crear la carrera.",
      });
    }
  };

  const startEditCareer = (career: Career) => {
    if (career.archived) {
      Swal.fire({
        icon: "info",
        title: "Carrera archivada",
        text: "No puedes editar una carrera archivada.",
      });
      return;
    }

    setEditingCareerId(career.id);
    setCareerForm({
      name: career.name,
      code: career.code,
      description: career.description,
    });
  };

  const saveCareerEdition = async () => {
    if (!editingCareerId) return;
    const payload = validateCareerForm(editingCareerId);
    if (!payload) return;

    try {
      await careerService.updateCareer(editingCareerId, payload);
      await loadCareers();
      resetCareerForm();

      Swal.fire({
        icon: "success",
        title: "Carrera actualizada",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error al actualizar",
        text: error?.message || "No se pudo actualizar la carrera.",
      });
    }
  };

  const archiveCareer = async (careerId: string) => {
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

    const result = await Swal.fire({
      icon: "question",
      title: "Archivar carrera",
      text: `La carrera ${career.name} dejará de estar disponible para nuevos semestres.`,
      showCancelButton: true,
      confirmButtonText: "Sí, archivar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await careerService.archiveCareer(careerId);
      await loadCareers();

      if (editingCareerId === careerId) {
        resetCareerForm();
      }

      Swal.fire({
        icon: "success",
        title: "Carrera archivada",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error al archivar",
        text: error?.message || "No se pudo archivar la carrera.",
      });
    }
  };

  const validateSemesterForm = () => {
    const start = new Date(semesterForm.startDate);
    const end = new Date(semesterForm.endDate);

    if (
      !semesterForm.careerId ||
      !semesterForm.name.trim() ||
      !semesterForm.code.trim() ||
      !semesterForm.startDate ||
      !semesterForm.endDate
    ) {
      Swal.fire({
        icon: "warning",
        title: "Campos obligatorios",
        text: "Debes completar carrera, nombre, código y fechas.",
      });
      return null;
    }

    if (start >= end) {
      Swal.fire({
        icon: "error",
        title: "Fechas inválidas",
        text: "La fecha de inicio debe ser menor que la fecha de fin.",
      });
      return null;
    }

    const career = careers.find((item) => item.id === semesterForm.careerId);
    if (!career || career.archived) {
      Swal.fire({
        icon: "error",
        title: "Carrera no disponible",
        text: "Selecciona una carrera activa para el semestre.",
      });
      return null;
    }

    return {
      careerId: semesterForm.careerId,
      name: semesterForm.name.trim(),
      code: semesterForm.code.trim(),
      startDate: semesterForm.startDate,
      endDate: semesterForm.endDate,
      status: semesterForm.status,
    };
  };

  const resetSemesterForm = () => {
    setSemesterForm((current) => ({
      careerId: availableCareers[0]?.id ?? current.careerId,
      name: "",
      code: "",
      startDate: "",
      endDate: "",
      status: "activo",
    }));
    setEditingSemesterId(null);
  };

  const closeOtherActiveSemesters = (
    currentSemesters: Semester[],
    careerId: string,
    semesterIdToKeep: string
  ) => {
    const timestamp = nowIso();
    return currentSemesters.map((semester) => {
      if (
        semester.careerId === careerId &&
        semester.id !== semesterIdToKeep &&
        semester.status === "activo"
      ) {
        return { ...semester, status: "cerrado" as const, updatedAt: timestamp };
      }
      return semester;
    });
  };

  const addSemester = () => {
    const payload = validateSemesterForm();
    if (!payload) return;

    const timestamp = nowIso();
    const newSemester: Semester = {
      id: generateId(),
      careerId: payload.careerId,
      name: payload.name,
      code: payload.code,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: payload.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setSemesters((current) => {
      const next = [...current, newSemester];
      if (newSemester.status === "activo") {
        return closeOtherActiveSemesters(next, newSemester.careerId, newSemester.id);
      }
      return next;
    });

    resetSemesterForm();

    Swal.fire({
      icon: "success",
      title: "Semestre creado",
      timer: 1300,
      showConfirmButton: false,
    });
  };

  const startEditSemester = (semester: Semester) => {
    setEditingSemesterId(semester.id);
    setSemesterForm({
      careerId: semester.careerId,
      name: semester.name,
      code: semester.code,
      startDate: semester.startDate,
      endDate: semester.endDate,
      status: semester.status,
    });
  };

  const saveSemesterEdition = () => {
    if (!editingSemesterId) return;

    const payload = validateSemesterForm();
    if (!payload) return;

    const timestamp = nowIso();

    setSemesters((current) =>
      current.map((semester) =>
        semester.id === editingSemesterId
          ? {
              ...semester,
              careerId: payload.careerId,
              name: payload.name,
              code: payload.code,
              startDate: payload.startDate,
              endDate: payload.endDate,
              status: payload.status,
              updatedAt: timestamp,
            }
          : semester
      )
    );

    if (payload.status === "activo") {
      setSemesters((current) =>
        closeOtherActiveSemesters(current, payload.careerId, editingSemesterId)
      );
    }

    resetSemesterForm();

    Swal.fire({
      icon: "success",
      title: "Semestre actualizado",
      timer: 1300,
      showConfirmButton: false,
    });
  };

  const setSemesterStatus = (semesterId: string, nextStatus: "activo" | "cerrado") => {
    const timestamp = nowIso();

    setSemesters((current) => {
      const target = current.find((semester) => semester.id === semesterId);
      if (!target) return current;

      const updated = current.map((semester) =>
        semester.id === semesterId
          ? { ...semester, status: nextStatus, updatedAt: timestamp }
          : semester
      );

      if (nextStatus === "activo") {
        return closeOtherActiveSemesters(updated, target.careerId, semesterId);
      }

      return updated;
    });

    Swal.fire({
      icon: "success",
      title: nextStatus === "activo" ? "Semestre activado" : "Semestre cerrado",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">HU-02</p>
        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Carreras y semestres
        </h1>
        <p className="text-sm text-gray-500">
          Crea, edita y archiva carreras. Gestiona semestres con validaciones
          de código único, fechas válidas y un único semestre activo por carrera.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            {editingCareerId ? "Editar carrera" : "Crear carrera"}
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
            onClick={editingCareerId ? saveCareerEdition : addCareer}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {editingCareerId ? "Guardar cambios" : "Crear carrera"}
          </button>
          {editingCareerId && (
            <>
              <button
                type="button"
                onClick={resetCareerForm}
                className="ml-2 mt-4 rounded-md border border-stroke px-4 py-2 text-sm font-medium"
              >
                Cancelar edición
              </button>
              <button
                type="button"
                onClick={resetCareerForm}
                className="ml-2 mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
              >
                Nueva carrera
              </button>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            {editingSemesterId ? "Editar semestre" : "Crear semestre"}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <select
              className="rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
              value={semesterForm.careerId}
              disabled={!availableCareers.length}
              onChange={(e) =>
                setSemesterForm((current) => ({ ...current, careerId: e.target.value }))
              }
            >
              {availableCareers.map((career) => (
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
              className="rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
              placeholder="Código del semestre"
              value={semesterForm.code}
              onChange={(e) => setSemesterForm((current) => ({ ...current, code: e.target.value }))}
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
            onClick={editingSemesterId ? saveSemesterEdition : addSemester}
            disabled={!availableCareers.length}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {editingSemesterId ? "Guardar cambios" : "Crear semestre"}
          </button>
          {editingSemesterId && (
            <>
              <button
                type="button"
                onClick={resetSemesterForm}
                className="ml-2 mt-4 rounded-md border border-stroke px-4 py-2 text-sm font-medium"
              >
                Cancelar edición
              </button>
              <button
                type="button"
                onClick={resetSemesterForm}
                className="ml-2 mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
              >
                Nuevo semestre
              </button>
            </>
          )}
          {!availableCareers.length && (
            <p className="mt-4 text-sm text-red-500">
              No hay carreras activas disponibles para crear semestres.
            </p>
          )}
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
                <th className="px-4 py-3">Matriculados</th>
                <th className="px-4 py-3">Actualizado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {careers.map((career) => (
                <tr key={career.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-3 text-black dark:text-white">{career.name}</td>
                  <td className="px-4 py-3">{career.code}</td>
                  <td className="px-4 py-3">{career.archived ? "Archivada" : "Activa"}</td>
                  <td className="px-4 py-3">{career.hasEnrolledStudents ? "Sí" : "No"}</td>
                  <td className="px-4 py-3">{formatDateTime(career.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => startEditCareer(career)}
                      disabled={career.archived}
                      className="mr-2 rounded-md border border-stroke px-3 py-1 text-sm disabled:opacity-40"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => archiveCareer(career.id)}
                      disabled={career.archived}
                      className="rounded-md border border-stroke px-3 py-1 text-sm disabled:opacity-40"
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
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Fin</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Actualizado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {semesters.map((semester) => {
                const career = careers.find((item) => item.id === semester.careerId);
                return (
                  <tr key={semester.id} className="border-b border-stroke dark:border-strokedark">
                    <td className="px-4 py-3">{career?.name ?? semester.careerId}</td>
                    <td className="px-4 py-3 text-black dark:text-white">{semester.name}</td>
                    <td className="px-4 py-3">{semester.code}</td>
                    <td className="px-4 py-3">{semester.startDate}</td>
                    <td className="px-4 py-3">{semester.endDate}</td>
                    <td className="px-4 py-3">{semester.status}</td>
                    <td className="px-4 py-3">{formatDateTime(semester.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => startEditSemester(semester)}
                        className="mr-2 rounded-md border border-stroke px-3 py-1 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSemesterStatus(
                            semester.id,
                            semester.status === "activo" ? "cerrado" : "activo"
                          )
                        }
                        className="rounded-md border border-stroke px-3 py-1 text-sm"
                      >
                        {semester.status === "activo" ? "Cerrar" : "Activar"}
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
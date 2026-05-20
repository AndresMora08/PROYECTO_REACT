import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import GenericSearch from "../../components/GenericSearch";

import { Group } from "../../models/Grupo";
import { Semester } from "../../models/Semestre";
import { Matricula } from "../../models/Matricula";
import { PlanEstudio } from "../../models/PlanEstudio";

import { userService } from "../../service/userService";
import { groupService } from "../../service/groupService";
import { semesterService } from "../../service/semesterService";
import { planEstudioService } from "../../service/planEstudioService";
import { enrollmentService } from "../../service/enrollmentService";

type AdminUser = Record<string, any>;

interface GroupWithDetails extends Group {
  asignaturaNombre?: string;
  docenteNombre?: string;
}

const InscripcionesGruposManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [planesByCarrera, setPlanesByCarrera] = useState<Record<string, PlanEstudio>>({});
  const [loading, setLoading] = useState(true);

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  const MAX_CREDITS_PER_SEMESTER = 18;

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        const [
          usersResponse,
          groupsResponse,
          semestersResponse,
        ] = await Promise.all([
          userService.getUsers(),
          groupService.getGroups(),
          semesterService.getSemesters(),
        ]);

        setUsers(Array.isArray(usersResponse) ? usersResponse : []);
        setGroups(Array.isArray(groupsResponse) ? groupsResponse : []);
        setSemesters(Array.isArray(semestersResponse) ? semestersResponse : []);

        const carreras = await planEstudioService.getCarreras();
        const planeMap: Record<string, PlanEstudio> = {};

        for (const carrera of carreras) {
          const planes = await planEstudioService.getPlanesPorCarrera(carrera.id);
          if (planes.length > 0) {
            planeMap[carrera.id] = planes[0];
          }
        }

        setPlanesByCarrera(planeMap);
      } catch (error) {
        console.error("Error cargando datos:", error);
        Swal.fire({
          icon: "error",
          title: "Error de conexión",
          text: "No se pudieron cargar los datos académicos",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const students = useMemo(() => {
    return users.filter(
      (user) => String(user.role ?? "").toUpperCase() === "STUDENT"
    );
  }, [users]);

  const filteredStudents = useMemo(() => {
    const text = studentSearch.toLowerCase();
    return students.filter((student) => {
      if (!text) return true;
      const name =
        `${student.first_name ?? ""} ${student.last_name ?? ""}`.toLowerCase();
      const email = String(student.email ?? "").toLowerCase();
      const identification = String(student.identification ?? "").toLowerCase();
      return name.includes(text) || email.includes(text) || identification.includes(text);
    });
  }, [studentSearch, students]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [selectedStudentId, students]
  );

  const activeSemester = useMemo(
    () => semesters.find((s) => s.is_active) ?? null,
    [semesters]
  );

  const activeMatricula = useMemo(() => {
    if (!selectedStudent?.matriculas) return null;
    return (
      selectedStudent.matriculas.find(
        (m: Matricula) => m.estado === "activa" || m.estado === "ACTIVA"
      ) ?? null
    );
  }, [selectedStudent]);

  const hasActiveMatricula = !!activeMatricula;

  const studentCarreraId = useMemo(
    () => activeMatricula?.carreraId ?? null,
    [activeMatricula]
  );

  const studentPlan = useMemo(
    () => (studentCarreraId ? planesByCarrera[studentCarreraId] : null),
    [studentCarreraId, planesByCarrera]
  );

  const allowedSubjectIds = useMemo(
    () => studentPlan?.subjects?.map((s: any) => s.id ?? s.subject?.id) ?? [],
    [studentPlan]
  );

  const availableGroups = useMemo(() => {
    if (!activeSemester) return [];
    return groups.filter(
      (g) =>
        g.semester_id === activeSemester.id &&
        (allowedSubjectIds.includes(g.subject_id) || allowedSubjectIds.length === 0)
    );
  }, [groups, activeSemester, allowedSubjectIds]);

  const studentEnrolledGroupIds = useMemo(() => {
    if (!selectedStudent?.inscripciones) return [];
    return (selectedStudent.inscripciones || [])
      .filter((e: any) => e.status === "ACTIVE")
      .map((e: any) => e.group_id);
  }, [selectedStudent]);

  const validSelectedGroups = useMemo(
    () =>
      selectedGroupIds
        .map((id) => availableGroups.find((g) => g.id === id))
        .filter((g) => !!g) as GroupWithDetails[],
    [selectedGroupIds, availableGroups]
  );

  const totalSelectedCredits = useMemo(() => {
    return validSelectedGroups.reduce((sum, group) => {
      const subject = groups.find((g) => g.id === group.id)?.Asignatura;
      return sum + (subject?.credits ?? 0);
    }, 0);
  }, [validSelectedGroups, groups]);

  const validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!selectedStudent) {
      errors.push("Selecciona un estudiante");
    } else if (!selectedStudent.is_active) {
      errors.push("El estudiante no está activo");
    }

    if (!hasActiveMatricula) {
      errors.push("El estudiante no tiene una matrícula activa");
    }

    if (selectedGroupIds.length === 0) {
      errors.push("Selecciona al menos un grupo");
    }

    if (totalSelectedCredits > MAX_CREDITS_PER_SEMESTER) {
      errors.push(
        `Los créditos seleccionados (${totalSelectedCredits}) exceden el límite (${MAX_CREDITS_PER_SEMESTER})`
      );
    }

    const asignaturasNoEnPlan = validSelectedGroups.filter((group) => {
      const subjectInPlan = allowedSubjectIds.includes(group.subject_id);
      return !subjectInPlan;
    });

    if (asignaturasNoEnPlan.length > 0) {
      warnings.push(
        `${asignaturasNoEnPlan.length} asignatura(s) NO está(n) en el plan de estudios`
      );
    }

    const duplicates = selectedGroupIds.filter((id) =>
      studentEnrolledGroupIds.includes(id)
    );

    if (duplicates.length > 0) {
      errors.push(`El estudiante ya está inscrito en ${duplicates.length} grupo(s)`);
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }, [
    selectedStudent,
    hasActiveMatricula,
    selectedGroupIds,
    totalSelectedCredits,
    validSelectedGroups,
    allowedSubjectIds,
    studentEnrolledGroupIds,
  ]);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSelectedGroupIds([]);
  };

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId]
    );
  };

  const handleCreateInscriptions = async () => {
    if (validation.warnings.length > 0) {
      const confirmResult = await Swal.fire({
        icon: "warning",
        title: "Advertencias",
        html: `<div class="text-left">${validation.warnings
          .map((w) => `<p>⚠️ ${w}</p>`)
          .join("")}</div>`,
        showCancelButton: true,
        confirmButtonText: "Continuar",
        cancelButtonText: "Cancelar",
      });

      if (!confirmResult.isConfirmed) return;
    }

    if (!validation.isValid) {
      Swal.fire({
        icon: "error",
        title: "Validación fallida",
        html: `<div class="text-left">${validation.errors
          .map((e) => `<p>❌ ${e}</p>`)
          .join("")}</div>`,
      });
      return;
    }

    try {
      setConfirming(true);

      const result = await enrollmentService.enrollStudentInMultipleGroups(
        selectedStudentId!,
        selectedGroupIds
      );

      if (result.successful.length > 0) {
        Swal.fire({
          icon: "success",
          title: "Inscripciones creadas",
          text: `${result.successful.length} grupo(s) inscrito(s) correctamente`,
        });

        setSelectedStudentId(null);
        setSelectedGroupIds([]);
      }

      if (result.failed.length > 0) {
        Swal.fire({
          icon: "warning",
          title: "Inscripciones parciales",
          html: `<div class="text-left">
            Exitosas: ${result.successful.length}<br/>
            Fallidas: ${result.failed.length}
          </div>`,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Cargando datos académicos...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">
          HU-07
        </p>
        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Inscribir estudiante en grupo
        </h1>
        <p className="text-sm text-gray-500">
          Selecciona un estudiante con matrícula activa y los grupos para inscribirlo.
        </p>
      </div>

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Paso 1: Buscar estudiante
        </h2>

        <div className="mt-4">
          <GenericSearch
            label="Filtro rápido"
            placeholder="Nombre, cédula o email"
            value={studentSearch}
            onChange={setStudentSearch}
          />
        </div>

        <div className="mt-4 max-h-96 overflow-y-auto rounded-xl border border-stroke dark:border-strokedark">
          <table className="w-full table-auto text-left text-sm">
            <thead className="sticky top-0">
              <tr className="bg-gray-2 dark:bg-meta-4">
                <th className="px-4 py-3">Seleccionar</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4"
                >
                  <td className="px-4 py-3">
                    <input
                      type="radio"
                      name="student"
                      checked={selectedStudentId === student.id}
                      onChange={() => handleSelectStudent(student.id)}
                    />
                  </td>
                  <td className="px-4 py-3 text-black dark:text-white">
                    {`${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() ||
                      "Sin nombre"}
                  </td>
                  <td className="px-4 py-3">{student.email ?? "-"}</td>
                  <td className="px-4 py-3">
                    {student.is_active ? "✓ Activo" : "✗ Inactivo"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedStudent && (
        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Paso 2: Información del estudiante
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-2 p-4 dark:bg-meta-4">
              <p className="text-xs uppercase text-gray-500">Nombre</p>
              <p className="mt-1 font-semibold text-black dark:text-white">
                {`${selectedStudent.first_name ?? ""} ${selectedStudent.last_name ?? ""}`.trim()}
              </p>
            </div>

            <div className="rounded-lg bg-gray-2 p-4 dark:bg-meta-4">
              <p className="text-xs uppercase text-gray-500">Cédula</p>
              <p className="mt-1 font-semibold text-black dark:text-white">
                {selectedStudent.identification ?? "-"}
              </p>
            </div>

            <div className="rounded-lg bg-gray-2 p-4 dark:bg-meta-4">
              <p className="text-xs uppercase text-gray-500">Email</p>
              <p className="mt-1 font-semibold text-black dark:text-white">
                {selectedStudent.email ?? "-"}
              </p>
            </div>

            <div className="rounded-lg bg-gray-2 p-4 dark:bg-meta-4">
              <p className="text-xs uppercase text-gray-500">Estado matrícula</p>
              <p className={`mt-1 font-semibold ${
                hasActiveMatricula ? "text-green-600" : "text-red-600"
              }`}>
                {hasActiveMatricula ? "✓ Activa" : "✗ Sin matrícula activa"}
              </p>
            </div>

            {activeMatricula && (
              <>
                <div className="rounded-lg bg-gray-2 p-4 dark:bg-meta-4">
                  <p className="text-xs uppercase text-gray-500">Carrera</p>
                  <p className="mt-1 font-semibold text-black dark:text-white">
                    {activeMatricula.carrera?.name ?? "-"}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-2 p-4 dark:bg-meta-4">
                  <p className="text-xs uppercase text-gray-500">Estado académico</p>
                  <p className="mt-1 font-semibold text-black dark:text-white">
                    {activeMatricula.estado ?? "-"}
                  </p>
                </div>
              </>
            )}
          </div>

          {!hasActiveMatricula && (
            <div className="mt-4 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
              ⚠️ El estudiante no puede ser inscrito sin una matrícula activa.
            </div>
          )}
        </section>
      )}

      {selectedStudent && hasActiveMatricula && (
        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Paso 3: Seleccionar grupos
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Semestre activo: {activeSemester?.name ?? "No hay semestre activo"}
          </p>

          {availableGroups.length === 0 ? (
            <div className="mt-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
              No hay grupos disponibles.
            </div>
          ) : (
            <>
              <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
                {availableGroups.map((group) => {
                  const isAlreadyEnrolled = studentEnrolledGroupIds.includes(group.id);
                  const isSelected = selectedGroupIds.includes(group.id);
                  const subject = groups.find((g) => g.id === group.id)?.Asignatura;
                  const credits = subject?.credits ?? 0;
                  const isNotInPlan = !allowedSubjectIds.includes(group.subject_id);

                  return (
                    <div
                      key={group.id}
                      className={`flex items-start rounded-lg border p-4 transition ${
                        isAlreadyEnrolled
                          ? "border-gray-300 bg-gray-100 opacity-50 dark:border-gray-600 dark:bg-gray-800"
                          : isSelected
                          ? "border-primary bg-blue-50 dark:border-primary dark:bg-blue-900"
                          : "border-stroke dark:border-strokedark"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isAlreadyEnrolled}
                        checked={isSelected}
                        onChange={() => !isAlreadyEnrolled && handleToggleGroup(group.id)}
                        className="mt-1"
                      />

                      <div className="ml-4 flex-1">
                        <p className="font-semibold text-black dark:text-white">
                          {group.name} ({group.group_code})
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Asignatura: {subject?.name ?? "-"} ({credits} créditos)
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Docente: {group.Docente?.first_name ?? "-"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {isAlreadyEnrolled && (
                            <span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-700 dark:bg-orange-900 dark:text-orange-200">
                              Ya inscrito
                            </span>
                          )}
                          {isNotInPlan && (
                            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                              ⚠️ No en plan
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedGroupIds.length > 0 && (
                <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-200">
                    Grupos: {validSelectedGroups.length} | Créditos: {totalSelectedCredits} / {MAX_CREDITS_PER_SEMESTER}
                  </p>
                  {totalSelectedCredits > MAX_CREDITS_PER_SEMESTER && (
                    <p className="mt-1 text-sm font-semibold text-red-600">
                      ❌ Excede el límite
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {selectedStudent && hasActiveMatricula && (
        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Paso 4: Confirmar
          </h2>

          {validation.errors.length > 0 && (
            <div className="mt-4 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900">
              {validation.errors.map((error, idx) => (
                <p key={idx} className="text-sm text-red-700 dark:text-red-200">
                  ❌ {error}
                </p>
              ))}
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="mt-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900">
              {validation.warnings.map((warning, idx) => (
                <p key={idx} className="text-sm text-yellow-700 dark:text-yellow-200">
                  ⚠️ {warning}
                </p>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleCreateInscriptions}
              disabled={!validation.isValid || confirming || selectedGroupIds.length === 0}
              className="flex-1 rounded-lg bg-primary px-6 py-3 text-center font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirming ? "Inscribiendo..." : "Crear inscripciones"}
            </button>

            <button
              onClick={() => {
                setSelectedStudentId(null);
                setSelectedGroupIds([]);
                setStudentSearch("");
              }}
              className="rounded-lg border border-stroke px-6 py-3 font-semibold text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
            >
              Cancelar
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default InscripcionesGruposManagement;

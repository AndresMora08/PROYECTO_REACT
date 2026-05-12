import React, { useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";

import GenericSearch from "../../components/GenericSearch";
import { userService } from "../../service/userService";

type AdminUser = Record<string, any>;

type GroupRecord = {
  id: string;
  code: string;
  subjectCode: string;
  subjectName: string;
  careerId: string;
  careerName: string;
  semester: string;
  semesterState: "activo" | "cerrado";
  teacher: string;
  capacity: number;
  enrolled: number;
};

type EnrollmentRecord = {
  id: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  groupId: string;
  groupCode: string;
  subjectName: string;
  careerName: string;
  semester: string;
  status: "activa" | "cancelada";
  createdAt: string;
};

const planByCareer: Record<string, string[]> = {
  "Ingeniería de Sistemas": ["MAT-101", "PRO-101", "BD-201", "RED-201"],
  Contabilidad: ["MAT-101", "CON-101", "LEG-101"],
  Administración: ["ADM-101", "ADM-102", "MAT-101"],
};

const groupsCatalog: GroupRecord[] = [
  {
    id: "g-1",
    code: "SIS-1A",
    subjectCode: "PRO-101",
    subjectName: "Programación I",
    careerId: "Ingeniería de Sistemas",
    careerName: "Ingeniería de Sistemas",
    semester: "2026-1",
    semesterState: "activo",
    teacher: "Dra. Alvarez",
    capacity: 30,
    enrolled: 22,
  },
  {
    id: "g-2",
    code: "SIS-1B",
    subjectCode: "MAT-101",
    subjectName: "Matemática I",
    careerId: "Ingeniería de Sistemas",
    careerName: "Ingeniería de Sistemas",
    semester: "2026-1",
    semesterState: "activo",
    teacher: "Ing. Torres",
    capacity: 25,
    enrolled: 25,
  },
  {
    id: "g-3",
    code: "CON-1A",
    subjectCode: "CON-101",
    subjectName: "Contabilidad Básica",
    careerId: "Contabilidad",
    careerName: "Contabilidad",
    semester: "2026-1",
    semesterState: "activo",
    teacher: "Lic. Pérez",
    capacity: 28,
    enrolled: 12,
  },
  {
    id: "g-4",
    code: "ADM-1A",
    subjectCode: "ADM-101",
    subjectName: "Administración General",
    careerId: "Administración",
    careerName: "Administración",
    semester: "2026-1",
    semesterState: "cerrado",
    teacher: "Lic. Gómez",
    capacity: 30,
    enrolled: 18,
  },
];

const InscripcionesManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [records, setRecords] = useState<EnrollmentRecord[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(Array.isArray(response) ? response : []);
      setLoading(false);
    };

    loadUsers();
  }, []);

  const students = useMemo(() => {
    return users.filter((user) => String(user.role ?? "").toUpperCase() === "STUDENT");
  }, [users]);

  const filteredStudents = useMemo(() => {
    const text = studentSearch.toLowerCase();
    return students.filter((student) => {
      if (!text) return true;
      const name = `${student.first_name ?? ""} ${student.last_name ?? ""}`.toLowerCase();
      const email = String(student.email ?? "").toLowerCase();
      const code = String(student.code ?? "").toLowerCase();
      const identification = String(student.identification ?? "").toLowerCase();
      return name.includes(text) || email.includes(text) || code.includes(text) || identification.includes(text);
    });
  }, [studentSearch, students]);

  const selectedStudent = useMemo(() => {
    return students.find((student) => student.id === selectedStudentId) ?? null;
  }, [selectedStudentId, students]);

  const activeEnrollment = useMemo(() => {
    if (!selectedStudent) return null;

    const matricula = selectedStudent.matriculas?.find((item: any) => {
      const status = String(item.estado ?? item.status ?? "").toLowerCase();
      return status === "activa" || status === "active" || status === "activo";
    });

    if (!matricula) {
      return null;
    }

    return {
      careerName:
        matricula.carrera?.nombre ??
        matricula.carrera?.name ??
        matricula.careerName ??
        matricula.carreraId ??
        "Sin carrera",
      careerId:
        matricula.carrera?.nombre ??
        matricula.carrera?.name ??
        matricula.careerName ??
        matricula.carreraId ??
        "",
      period: matricula.periodoIngreso ?? matricula.period ?? "Sin periodo",
    };
  }, [selectedStudent]);

  const eligibleGroups = useMemo(() => {
    if (!activeEnrollment) return [];

    const allowedSubjects = planByCareer[activeEnrollment.careerName] ?? [];

    return groupsCatalog.filter((group) => {
      const noDuplicate = !records.some(
        (record) => record.studentId === Number(selectedStudentId) && record.groupId === group.id && record.status === "activa"
      );

      return (
        group.semesterState === "activo" &&
        group.careerName === activeEnrollment.careerName &&
        allowedSubjects.includes(group.subjectCode) &&
        noDuplicate
      );
    });
  }, [activeEnrollment, records, selectedStudentId]);

  const selectedGroupSet = useMemo(() => new Set(selectedGroupIds), [selectedGroupIds]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((item) => item !== groupId)
        : [...current, groupId]
    );
  };

  const hasDuplicateEnrollment = (studentId: number, groupId: string) => {
    return records.some(
      (record) => record.studentId === studentId && record.groupId === groupId && record.status === "activa"
    );
  };

  const handleCreateEnrollment = () => {
    if (!selectedStudent) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona un estudiante",
        text: "Debes elegir un estudiante para continuar.",
      });
      return;
    }

    const matricula = selectedStudent.matriculas?.find((item: any) => {
      const status = String(item.estado ?? item.status ?? "").toLowerCase();
      return status === "activa" || status === "active" || status === "activo";
    });

    if (!matricula) {
      Swal.fire({
        icon: "error",
        title: "Sin matrícula activa",
        text: "Solo se puede inscribir un estudiante con matrícula activa en una carrera.",
      });
      return;
    }

    if (selectedGroupIds.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona grupos",
        text: "Debes elegir uno o varios grupos del semestre activo.",
      });
      return;
    }

    const selectedCareerName =
      matricula.carrera?.nombre ??
      matricula.carrera?.name ??
      matricula.careerName ??
      matricula.carreraId ??
      "";

    const invalidGroups = selectedGroupIds.filter((groupId) => {
      const group = groupsCatalog.find((item) => item.id === groupId);
      if (!group) return true;

      const allowedSubjects = planByCareer[selectedCareerName] ?? [];
      const groupBelongsToPlan = allowedSubjects.includes(group.subjectCode);
      const sameCareer = group.careerName === selectedCareerName;
      const activeSemester = group.semesterState === "activo";
      const duplicate = hasDuplicateEnrollment(Number(selectedStudent.id), groupId);

      return !groupBelongsToPlan || !sameCareer || !activeSemester || duplicate;
    });

    if (invalidGroups.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Grupos no válidos",
        text:
          "Uno o más grupos no pertenecen al plan de estudios, no están activos o ya fueron inscritos.",
      });
      return;
    }

    const newRecords: EnrollmentRecord[] = selectedGroupIds.map((groupId) => {
      const group = groupsCatalog.find((item) => item.id === groupId)!;

      return {
        id: `${selectedStudent.id}-${groupId}-${Date.now()}`,
        studentId: Number(selectedStudent.id),
        studentName: `${selectedStudent.first_name ?? ""} ${selectedStudent.last_name ?? ""}`.trim() || "Sin nombre",
        studentEmail: String(selectedStudent.email ?? ""),
        groupId,
        groupCode: group.code,
        subjectName: group.subjectName,
        careerName: group.careerName,
        semester: group.semester,
        status: "activa",
        createdAt: new Date().toISOString(),
      };
    });

    setRecords((current) => [...current, ...newRecords]);
    setSelectedGroupIds([]);

    Swal.fire({
      icon: "success",
      title: "Inscripción creada",
      text: "El estudiante quedó vinculado a los grupos seleccionados.",
    });
  };

  const cancelEnrollment = (recordId: string) => {
    setRecords((current) =>
      current.map((record) =>
        record.id === recordId ? { ...record, status: "cancelada" } : record
      )
    );
  };

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Cargando estudiantes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">HU-07</p>
        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Inscribir estudiante en grupo
        </h1>
        <p className="text-sm text-gray-500">
          Sólo aparecen grupos del semestre activo cuya asignatura pertenece al plan de la carrera del estudiante.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Seleccionar estudiante
          </h2>

          <div className="mt-4">
            <GenericSearch
              label="Buscar estudiante"
              placeholder="Nombre, código, email o identificación"
              value={studentSearch}
              onChange={setStudentSearch}
            />
          </div>

          <div className="mt-4 max-h-96 overflow-y-auto rounded-xl border border-stroke dark:border-strokedark">
            <table className="w-full table-auto text-left">
              <thead>
                <tr className="bg-gray-2 dark:bg-meta-4">
                  <th className="px-4 py-3">Elegir</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Matrícula activa</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const matriculaActiva = student.matriculas?.find((item: any) => {
                    const status = String(item.estado ?? item.status ?? "").toLowerCase();
                    return status === "activa" || status === "active" || status === "activo";
                  });

                  return (
                    <tr key={student.id} className="border-b border-stroke dark:border-strokedark">
                      <td className="px-4 py-3">
                        <input
                          type="radio"
                          name="student"
                          checked={selectedStudentId === student.id}
                          onChange={() => {
                            setSelectedStudentId(Number(student.id));
                            setSelectedGroupIds([]);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-black dark:text-white">
                        {`${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "Sin nombre"}
                      </td>
                      <td className="px-4 py-3">{student.email ?? "-"}</td>
                      <td className="px-4 py-3">
                        {matriculaActiva
                          ? `${matriculaActiva.carrera?.nombre ?? matriculaActiva.carrera?.name ?? "Carrera"}`
                          : "No tiene"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Grupos disponibles
          </h2>

          {selectedStudent ? (
            <div className="mt-4 rounded-xl bg-gray-2 p-4 dark:bg-meta-4">
              <p className="text-sm text-gray-500">Estudiante seleccionado</p>
              <p className="font-semibold text-black dark:text-white">
                {`${selectedStudent.first_name ?? ""} ${selectedStudent.last_name ?? ""}`.trim() || "Sin nombre"}
              </p>
              <p className="text-sm text-gray-500">{selectedStudent.email}</p>
              <p className="mt-1 text-sm text-gray-500">
                Carrera activa: {activeEnrollment?.careerName ?? "Sin matrícula activa"}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Selecciona un estudiante para cargar los grupos válidos.
            </p>
          )}

          <div className="mt-4 space-y-3">
            {eligibleGroups.map((group) => (
              <label
                key={group.id}
                className="flex items-start gap-3 rounded-xl border border-stroke p-4 dark:border-strokedark"
              >
                <input
                  type="checkbox"
                  checked={selectedGroupSet.has(group.id)}
                  onChange={() => toggleGroup(group.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-semibold text-black dark:text-white">
                    {group.code} - {group.subjectName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {group.careerName} | Semestre {group.semester} | {group.teacher}
                  </p>
                  <p className="text-sm text-gray-500">
                    Cupo: {group.enrolled}/{group.capacity}
                  </p>
                </div>
              </label>
            ))}

            {selectedStudent && eligibleGroups.length === 0 && (
              <p className="rounded-xl border border-dashed border-stroke p-4 text-sm text-gray-500 dark:border-strokedark">
                No hay grupos activos disponibles para esta carrera o ya fueron inscritos.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreateEnrollment}
            className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Inscribir estudiante
          </button>
        </section>
      </div>

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Inscripciones creadas
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="bg-gray-2 dark:bg-meta-4">
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3">Asignatura</th>
                <th className="px-4 py-3">Carrera</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-3 text-black dark:text-white">{record.studentName}</td>
                  <td className="px-4 py-3">{record.groupCode}</td>
                  <td className="px-4 py-3">{record.subjectName}</td>
                  <td className="px-4 py-3">{record.careerName}</td>
                  <td className="px-4 py-3">{record.status}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => cancelEnrollment(record.id)}
                      className="rounded-md border border-stroke px-3 py-1 text-sm"
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default InscripcionesManagement;
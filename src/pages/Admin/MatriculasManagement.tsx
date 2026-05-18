import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import GenericSearch from "../../components/GenericSearch";
import { userService } from "../../service/userService";

type AdminUser = Record<string, any>;

type CareerOption = {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
};

type EnrollmentRecord = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  careerId: string;
  careerName: string;
  period: string;
  estado_academico: "activo" | "retirado" | "suspendido" | "en_riesgo";
  createdAt: string;
};

const careerCatalog: CareerOption[] = [
  {
    id: "car-1",
    nombre: "Ingenieria de Sistemas",
    codigo: "IS-001",
    descripcion: "Carrera orientada al desarrollo de software y sistemas.",
  },
  {
    id: "car-2",
    nombre: "Contabilidad",
    codigo: "CON-001",
    descripcion: "Carrera orientada a gestion financiera y contable.",
  },
  {
    id: "car-3",
    nombre: "Administracion",
    codigo: "ADM-001",
    descripcion: "Carrera enfocada en gestion y direccion organizacional.",
  },
];

const studentInfoFieldLabels: Record<string, string> = {
  identification: "Cedula",
  email: "Correo",
  phone: "Telefono",
  code: "Codigo",
  is_active: "Estado",
};

const MatriculasManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>([]);
  const [period, setPeriod] = useState("2026-P1");
  const [periodError, setPeriodError] = useState("");
  const [estado_academico, setEstado_academico] = useState<"activo" | "retirado" | "suspendido" | "en_riesgo">("activo");
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
      return (
        name.includes(text) ||
        email.includes(text) ||
        code.includes(text) ||
        identification.includes(text)
      );
    });
  }, [studentSearch, students]);

  const selectedStudent = useMemo(() => {
    return students.find((student) => student.id === selectedStudentId) ?? null;
  }, [selectedStudentId, students]);

  const selectedStudentProfileImage = useMemo(() => {
    if (!selectedStudent) return "/images/user/owner.jpg";

    return (
      selectedStudent.photo_url ??
      selectedStudent.profile_photo ??
      selectedStudent.avatar ??
      selectedStudent.image ??
      "/images/user/owner.jpg"
    );
  }, [selectedStudent]);

  const selectedStudentInfoEntries = useMemo(() => {
    if (!selectedStudent) return [];

    const fieldsToShow = ["identification", "email", "phone", "code", "is_active"];

    return fieldsToShow.map((key) => {
      const value = selectedStudent[key];

      return {
        key,
        label: studentInfoFieldLabels[key] ?? key,
        value:
          key === "is_active"
            ? value
              ? "Activo"
              : "Inactivo"
            : value === null || value === undefined || value === ""
              ? "-"
              : String(value),
      };
    });
  }, [selectedStudent]);

  const validatePeriod = (value: string): boolean => {
    const periodRegex = /^\d{4}-P[1-3]$/;
    return periodRegex.test(value);
  };

  const selectedCareerNames = useMemo(() => {
    return careerCatalog
      .filter((career) => selectedCareerIds.includes(career.id))
      .map((career) => career.nombre);
  }, [selectedCareerIds]);

  const enrollmentSummaryEntries = useMemo(() => {
    return [
      {
        label: "Estudiante",
        value: selectedStudent
          ? `${selectedStudent.first_name ?? ""} ${selectedStudent.last_name ?? ""}`.trim() || "Sin nombre"
          : "Sin seleccionar",
      },
      {
        label: "Correo",
        value: selectedStudent?.email ?? "-",
      },
      {
        label: "Carreras seleccionadas",
        value: selectedCareerNames.length > 0 ? selectedCareerNames.join(", ") : "Ninguna",
      },
      {
        label: "Cantidad de carreras",
        value: String(selectedCareerIds.length),
      },
      {
        label: "Periodo de ingreso",
        value: period || "-",
      },
      {
        label: "Estado academico inicial",
        value: estado_academico,
      },
      {
        label: "Validez del periodo",
        value: !period ? "Pendiente" : validatePeriod(period) ? "Valido" : "Invalido",
      },
    ];
  }, [estado_academico, period, selectedCareerIds.length, selectedCareerNames, selectedStudent]);

  const studentAlreadyHasCareer = (studentId: string, careerId: string) => {
    return records.some(
      (record) =>
        record.studentId === studentId &&
        record.careerId === careerId &&
        record.estado_academico === "activo"
    );
  };

  const toggleCareer = (careerId: string) => {
    setSelectedCareerIds((current) =>
      current.includes(careerId)
        ? current.filter((item) => item !== careerId)
        : [...current, careerId]
    );
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    if (value && !validatePeriod(value)) {
      setPeriodError("Formato invalido. Use: YYYY-P# (ej: 2026-P1)");
    } else {
      setPeriodError("");
    }
  };

  const editEstadoAcademico = (recordId: string, newEstado: typeof estado_academico) => {
    setRecords((current) =>
      current.map((record) =>
        record.id === recordId ? { ...record, estado_academico: newEstado } : record
      )
    );

    Swal.fire({
      icon: "success",
      title: "Estado actualizado",
      text: `El estado academico fue actualizado a "${newEstado}".`,
    });
  };

  const handleCreateEnrollment = () => {
    if (!selectedStudent) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona un estudiante",
        text: "Debes elegir un estudiante para matricularlo.",
      });
      return;
    }

    if (!selectedStudent.is_active) {
      Swal.fire({
        icon: "error",
        title: "Estudiante inactivo",
        text: "No se puede matricular un estudiante con la cuenta desactivada.",
      });
      return;
    }

    if (!period || !validatePeriod(period)) {
      Swal.fire({
        icon: "error",
        title: "Periodo de ingreso invalido",
        text: "El formato debe ser YYYY-P# (ej: 2026-P1, 2026-P2, 2026-P3).",
      });
      return;
    }

    if (selectedCareerIds.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona al menos una carrera",
        text: "Puedes matricular al estudiante en una o varias carreras a la vez.",
      });
      return;
    }

    const duplicateCareers = selectedCareerIds.filter((careerId) =>
      studentAlreadyHasCareer(String(selectedStudent.id), careerId)
    );

    if (duplicateCareers.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Duplicado detectado",
        text: "El estudiante ya tiene matricula activa en una de las carreras seleccionadas.",
      });
      return;
    }

    const newRecords: EnrollmentRecord[] = selectedCareerIds.map((careerId) => {
      const career = careerCatalog.find((item) => item.id === careerId);
      return {
        id: `${selectedStudent.id}-${careerId}-${Date.now()}`,
        studentId: String(selectedStudent.id),
        studentName: `${selectedStudent.first_name ?? ""} ${selectedStudent.last_name ?? ""}`.trim() || "Sin nombre",
        studentEmail: String(selectedStudent.email ?? ""),
        careerId,
        careerName: career?.nombre ?? careerId,
        period,
        estado_academico,
        createdAt: new Date().toISOString(),
      };
    });

    setRecords((current) => [...current, ...newRecords]);
    setSelectedCareerIds([]);
    setEstado_academico("activo");
    setPeriod("2026-P1");
    setPeriodError("");

    Swal.fire({
      icon: "success",
      title: "Matricula creada",
      text: "El estudiante fue matriculado en las carreras seleccionadas.",
    });
  };

  const cancelEnrollment = (recordId: string) => {
    setRecords((current) =>
      current.map((record) =>
        record.id === recordId ? { ...record, estado_academico: "retirado" } : record
      )
    );

    Swal.fire({
      icon: "success",
      title: "Matricula retirada",
      text: "El estudiante ha sido retirado de esta carrera.",
    });
  };

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Cargando estudiantes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">HU-06</p>
        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Matricular estudiante
        </h1>
        <p className="text-sm text-gray-500">
          Selecciona un estudiante activo y asignale una o varias carreras en un
          mismo registro.
        </p>
      </div>

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Buscar estudiante
        </h2>
        <div className="mt-4">
          <GenericSearch
            label="Filtro rapido"
            placeholder="Nombre, codigo, email o identificacion"
            value={studentSearch}
            onChange={setStudentSearch}
          />
        </div>

        <div className="mt-4 max-h-96 overflow-y-auto rounded-xl border border-stroke dark:border-strokedark">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="bg-gray-2 dark:bg-meta-4">
                <th className="px-4 py-3">Seleccionar</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-3">
                    <input
                      type="radio"
                      name="student"
                      checked={selectedStudentId === student.id}
                      onChange={() => {
                        setSelectedStudentId(String(student.id));
                        setSelectedCareerIds([]);
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-black dark:text-white">
                    {`${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "Sin nombre"}
                  </td>
                  <td className="px-4 py-3">{student.email ?? "-"}</td>
                  <td className="px-4 py-3">{student.is_active ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(320px,0.9fr)]">
        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Informacion del estudiante seleccionado
          </h2>

          {selectedStudent ? (
            <div className="mt-4 grid gap-6">
              <div className="flex flex-col items-center rounded-2xl border border-stroke bg-gray-2 p-5 dark:border-strokedark dark:bg-meta-4">
                <img
                  src={selectedStudentProfileImage}
                  alt={`${selectedStudent.first_name ?? "Estudiante"} ${selectedStudent.last_name ?? ""}`.trim()}
                  className="h-36 w-36 rounded-full object-cover ring-4 ring-white dark:ring-boxdark"
                />
                <p className="mt-4 text-center text-base font-semibold text-black dark:text-white">
                  {`${selectedStudent.first_name ?? ""} ${selectedStudent.last_name ?? ""}`.trim() || "Sin nombre"}
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-stroke dark:border-strokedark">
                <table className="w-full table-auto text-left">
                  <thead>
                    <tr className="bg-gray-2 dark:bg-meta-4">
                      <th className="px-4 py-3">Campo</th>
                      <th className="px-4 py-3">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudentInfoEntries.map((entry) => (
                      <tr key={entry.key} className="border-b border-stroke dark:border-strokedark">
                        <td className="px-4 py-3 font-medium text-black dark:text-white">
                          {entry.label}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {entry.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Selecciona un estudiante para visualizar su informacion.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Seleccionar carrera y datos de la matricula
          </h2>

          {selectedStudent ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Seleccionar carrera
                </label>
                <div className="space-y-3">
                  {careerCatalog.map((career) => {
                    const alreadyAssigned = studentAlreadyHasCareer(String(selectedStudent.id), career.id);

                    return (
                      <label
                        key={career.id}
                        className={`flex items-start gap-3 rounded-xl border p-4 ${
                          alreadyAssigned
                            ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                            : "border-stroke dark:border-strokedark"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={alreadyAssigned}
                          checked={selectedCareerIds.includes(career.id)}
                          onChange={() => toggleCareer(career.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-semibold text-black dark:text-white">
                            {career.nombre}
                          </p>
                          <p className="text-sm text-gray-500">{career.codigo}</p>
                          <p className="text-sm text-gray-500">{career.descripcion}</p>
                          {alreadyAssigned && (
                            <p className="mt-1 text-xs font-medium text-amber-600">
                              Ya tiene matricula activa en esta carrera
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Periodo de ingreso (Ej: 2026-P1)
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className={`w-full rounded-md border bg-transparent px-4 py-3 outline-none dark:bg-form-input dark:text-white ${
                    periodError
                      ? "border-red-500 dark:border-red-500"
                      : "border-stroke dark:border-strokedark"
                  }`}
                  placeholder="2026-P1"
                />
                {periodError && (
                  <p className="mt-1 text-xs text-red-500">{periodError}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Estado academico inicial
                </label>
                <select
                  value={estado_academico}
                  onChange={(e) => setEstado_academico(e.target.value as typeof estado_academico)}
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
                >
                  <option value="activo">Activo</option>
                  <option value="retirado">Retirado</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="en_riesgo">En Riesgo</option>
                </select>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Selecciona un estudiante de la lista para continuar.
            </p>
          )}

          <button
            type="button"
            onClick={handleCreateEnrollment}
            className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Matricular estudiante
          </button>
        </section>

        <section className="h-fit rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Informacion de la matricula
          </h2>

          <div className="mt-4 overflow-x-auto rounded-xl border border-stroke dark:border-strokedark">
            <table className="w-full table-auto text-left">
              <thead>
                <tr className="bg-gray-2 dark:bg-meta-4">
                  <th className="px-4 py-3">Campo</th>
                  <th className="px-4 py-3">Resumen</th>
                </tr>
              </thead>
              <tbody>
                {enrollmentSummaryEntries.map((entry) => (
                  <tr key={entry.label} className="border-b border-stroke dark:border-strokedark">
                    <td className="px-4 py-3 font-medium text-black dark:text-white">
                      {entry.label}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {entry.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Matriculas creadas
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="bg-gray-2 dark:bg-meta-4">
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-4 py-3">Carrera</th>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Estado Academico</th>
                <th className="px-4 py-3">Creada</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-3 text-black dark:text-white">{record.studentName}</td>
                  <td className="px-4 py-3">{record.careerName}</td>
                  <td className="px-4 py-3">{record.period}</td>
                  <td className="px-4 py-3">
                    <select
                      value={record.estado_academico}
                      onChange={(e) =>
                        editEstadoAcademico(record.id, e.target.value as typeof estado_academico)
                      }
                      className="rounded border border-stroke bg-transparent px-2 py-1 text-sm outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
                    >
                      <option value="activo">Activo</option>
                      <option value="retirado">Retirado</option>
                      <option value="suspendido">Suspendido</option>
                      <option value="en_riesgo">En Riesgo</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">{new Date(record.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => cancelEnrollment(record.id)}
                      className="rounded-md border border-red-500 px-3 py-1 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Retirar
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

export default MatriculasManagement;

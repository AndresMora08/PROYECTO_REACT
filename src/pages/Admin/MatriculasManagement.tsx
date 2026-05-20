import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import GenericSearch from "../../components/GenericSearch";
import { Carrera } from "../../models/Carrera";
import { planEstudioService } from "../../service/planEstudioService";
import { userService } from "../../service/userService";
import { enrollmentService } from "../../service/enrollmentService";

type AdminUser = Record<string, any>;

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

const studentInfoFieldLabels: Record<string, string> = {
  first_name: "Nombre",
  last_name: "Apellido",
  identification: "Cedula",
  email: "Correo",
  code: "Codigo",
  is_active: "Estado",
  created_at: "Creado",
  updated_at: "Actualizado",
};

const MatriculasManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [careers, setCareers] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(true);

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>([]);
  const [period, setPeriod] = useState("2026-P1");
  const [periodError, setPeriodError] = useState("");

  const [estado_academico, setEstado_academico] = useState<
    "activo" | "retirado" | "suspendido" | "en_riesgo"
  >("activo");

  const [records, setRecords] = useState<EnrollmentRecord[]>([]);

  const [updateCareerId, setUpdateCareerId] = useState("");

  const [updateEstado, setUpdateEstado] = useState<
    "activo" | "retirado" | "suspendido" | "en_riesgo"
  >("activo");

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);

      const [usersResponse, careersResponse] = await Promise.all([
        userService.getUsers(),
        planEstudioService.getCarreras(),
      ]);

      setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      setCareers(Array.isArray(careersResponse) ? careersResponse : []);

      setLoading(false);
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
    return (
      students.find((student) => student.id === selectedStudentId) ?? null
    );
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

    const fieldsToShow = [
      "first_name",
      "last_name",
      "identification",
      "email",
      "code",
      "is_active",
      "created_at",
      "updated_at",
    ];

    return fieldsToShow.map((key) => {
      const value = selectedStudent[key];

      const isDateField =
        key === "created_at" || key === "updated_at";

      return {
        key,
        label: studentInfoFieldLabels[key] ?? key,

        value:
          key === "is_active"
            ? value
              ? "Activo"
              : "Inactivo"
            : isDateField && value
            ? new Date(value).toLocaleString()
            : value === null ||
              value === undefined ||
              value === ""
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
    return careers
      .filter((career) => selectedCareerIds.includes(career.id))
      .map((career) => career.name);
  }, [careers, selectedCareerIds]);

  const enrollmentSummaryEntries = useMemo(() => {
    return [
      {
        label: "Estudiante",

        value: selectedStudent
          ? `${selectedStudent.first_name ?? ""} ${
              selectedStudent.last_name ?? ""
            }`.trim() || "Sin nombre"
          : "Sin seleccionar",
      },

      {
        label: "Correo",
        value: selectedStudent?.email ?? "-",
      },

      {
        label: "Carreras seleccionadas",

        value:
          selectedCareerNames.length > 0
            ? selectedCareerNames.join(", ")
            : "Ninguna",
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

        value: !period
          ? "Pendiente"
          : validatePeriod(period)
          ? "Valido"
          : "Invalido",
      },
    ];
  }, [
    estado_academico,
    period,
    selectedCareerIds.length,
    selectedCareerNames,
    selectedStudent,
  ]);

  const studentAlreadyHasCareer = (
    studentId: string,
    careerId: string
  ) => {
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
      setPeriodError(
        "Formato invalido. Use: YYYY-P# (ej: 2026-P1)"
      );
    } else {
      setPeriodError("");
    }
  };

  const handleCreateEnrollment = async () => {
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
        text: "No se puede matricular un estudiante inactivo.",
      });

      return;
    }

    if (!period || !validatePeriod(period)) {
      Swal.fire({
        icon: "error",
        title: "Periodo invalido",
        text: "El formato debe ser YYYY-P#",
      });

      return;
    }

    if (selectedCareerIds.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona una carrera",
        text: "Debes seleccionar al menos una carrera.",
      });

      return;
    }

    try {
      const createdRecords: EnrollmentRecord[] = [];

      for (const careerId of selectedCareerIds) {
        const alreadyAssigned = studentAlreadyHasCareer(
          String(selectedStudent.id),
          careerId
        );

        if (alreadyAssigned) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se puede matricular",
          });

          return;
        }

        await enrollmentService.createEnrollment({
          student_id: String(selectedStudent.id),
          career_id: careerId,
          period,
          estado_academico,
        });

        const career = careers.find(
          (item) => item.id === careerId
        );

        createdRecords.push({
          id: `${selectedStudent.id}-${careerId}-${Date.now()}`,
          studentId: String(selectedStudent.id),

          studentName:
            `${selectedStudent.first_name ?? ""} ${
              selectedStudent.last_name ?? ""
            }`.trim() || "Sin nombre",

          studentEmail: String(selectedStudent.email ?? ""),

          careerId,

          careerName: career?.name ?? careerId,

          period,

          estado_academico,

          createdAt: new Date().toISOString(),
        });
      }

      setRecords((current) => [
        ...current,
        ...createdRecords,
      ]);

      setSelectedCareerIds([]);
      setEstado_academico("activo");
      setPeriod("2026-P1");
      setPeriodError("");

      Swal.fire({
        icon: "success",
        title: "Exito",
        text: "Matricula creada exitosamente",
      });
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se puede matricular",
      });
    }
  };

  const handleUpdateEstado = async () => {
    if (!selectedStudent || !updateCareerId) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Selecciona estudiante y carrera.",
      });

      return;
    }

    try {
      await enrollmentService.updateEnrollmentStatus(
        String(selectedStudent.id),
        updateCareerId,
        updateEstado
      );

      setRecords((current) =>
        current.map((record) =>
          record.studentId === String(selectedStudent.id) &&
          record.careerId === updateCareerId
            ? {
                ...record,
                estado_academico: updateEstado,
              }
            : record
        )
      );

      Swal.fire({
        icon: "success",
        title: "Estado actualizado",
        text: "Estado academico actualizado correctamente.",
      });
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No fue posible actualizar el estado academico.",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Cargando estudiantes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">
          HU-06
        </p>

        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Matricular estudiante
        </h1>

        <p className="text-sm text-gray-500">
          Selecciona un estudiante activo y asignale una o varias carreras.
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
                <tr
                  key={student.id}
                  className="border-b border-stroke dark:border-strokedark"
                >
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
                    {`${student.first_name ?? ""} ${
                      student.last_name ?? ""
                    }`.trim() || "Sin nombre"}
                  </td>

                  <td className="px-4 py-3">
                    {student.email ?? "-"}
                  </td>

                  <td className="px-4 py-3">
                    {student.is_active ? "Activo" : "Inactivo"}
                  </td>
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
                  alt="student"
                  className="h-36 w-36 rounded-full object-cover ring-4 ring-white dark:ring-boxdark"
                />

                <p className="mt-4 text-center text-base font-semibold text-black dark:text-white">
                  {`${selectedStudent.first_name ?? ""} ${
                    selectedStudent.last_name ?? ""
                  }`.trim() || "Sin nombre"}
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
                      <tr
                        key={entry.key}
                        className="border-b border-stroke dark:border-strokedark"
                      >
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
              Selecciona un estudiante.
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
                  {careers.map((career) => {
                    const alreadyAssigned = studentAlreadyHasCareer(
                      String(selectedStudent.id),
                      career.id
                    );

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
                            {career.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {career.codigo}
                          </p>

                          <p className="text-sm text-gray-500">
                            {career.descripcion || "Sin descripcion"}
                          </p>

                          {alreadyAssigned && (
                            <p className="mt-1 text-xs font-medium text-amber-600">
                              Ya tiene matricula activa
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
                  Periodo de ingreso
                </label>

                <input
                  type="text"
                  value={period}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  placeholder="2026-P1"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
                />

                {periodError && (
                  <p className="mt-1 text-xs text-red-500">
                    {periodError}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Estado academico inicial
                </label>

                <select
                  value={estado_academico}
                  onChange={(e) =>
                    setEstado_academico(
                      e.target.value as typeof estado_academico
                    )
                  }
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
              Selecciona un estudiante.
            </p>
          )}
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
                  <tr
                    key={entry.label}
                    className="border-b border-stroke dark:border-strokedark"
                  >
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

          <div className="mt-5">
            <button
              type="button"
              onClick={handleCreateEnrollment}
              className="w-full rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700"
            >
              Confirmar creacion de matricula
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Actualizar estado academico
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Actualiza el estado academico de un estudiante.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Selector de carrera
            </label>

            <select
              value={updateCareerId}
              onChange={(e) => setUpdateCareerId(e.target.value)}
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
            >
              <option value="">Selecciona una carrera</option>

              {careers.map((career) => (
                <option
                  key={career.id}
                  value={career.id}
                >
                  {career.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Selector de estado academico
            </label>

            <select
              value={updateEstado}
              onChange={(e) =>
                setUpdateEstado(
                  e.target.value as typeof updateEstado
                )
              }
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
            >
              <option value="activo">Activo</option>
              <option value="retirado">Retirado</option>
              <option value="suspendido">Suspendido</option>
              <option value="en_riesgo">En Riesgo</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUpdateEstado}
          className="mt-6 rounded-md bg-primary px-5 py-3 text-sm font-medium text-white"
        >
          Actualizar
        </button>
      </section>
    </div>
  );
};

export default MatriculasManagement;
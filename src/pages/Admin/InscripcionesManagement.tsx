import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import GenericSearch from "../../components/GenericSearch";
import { Carrera } from "../../models/Carrera";
import { planEstudioService } from "../../service/planEstudioService";
import { userService } from "../../service/userService";

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

      const identification = String(
        student.identification ?? ""
      ).toLowerCase();

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
          ? `${
              selectedStudent.first_name ?? ""
            } ${selectedStudent.last_name ?? ""}`.trim() ||
            "Sin nombre"
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
        text: "El formato debe ser YYYY-P# (ej: 2026-P1).",
      });

      return;
    }

    if (selectedCareerIds.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona al menos una carrera",
        text: "Debes seleccionar minimo una carrera.",
      });

      return;
    }

    Swal.fire({
      icon: "success",
      title: "Matricula creada",
      text: "El estudiante fue matriculado correctamente.",
    });
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
          Selecciona un estudiante activo y asignale
          una o varias carreras.
        </p>
      </div>

      {/* BUSCAR ESTUDIANTE */}

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
                      checked={
                        selectedStudentId === student.id
                      }
                      onChange={() => {
                        setSelectedStudentId(
                          String(student.id)
                        );

                        setSelectedCareerIds([]);
                      }}
                    />
                  </td>

                  <td className="px-4 py-3 text-black dark:text-white">
                    {`${
                      student.first_name ?? ""
                    } ${student.last_name ?? ""}`.trim() ||
                      "Sin nombre"}
                  </td>

                  <td className="px-4 py-3">
                    {student.email ?? "-"}
                  </td>

                  <td className="px-4 py-3">
                    {student.is_active
                      ? "Activo"
                      : "Inactivo"}
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
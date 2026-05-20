import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import GenericSearch from "../../components/GenericSearch";
import { Carrera } from "../../models/Carrera";
import { Student } from "../../models/Estudiante"; // Usamos tu modelo Student
import { planEstudioService } from "../../service/planEstudioService";
import { userService } from "../../service/userService";
import { registrationService } from "../../service/registrationsService";

type AcademicStatus = "ACTIVE" | "WITHDRAWN" | "SUSPENDED" | "AT_RISK";

type RegistrationRecord = {
  id: string; 
  studentId: string;
  studentName: string;
  studentEmail: string;
  careerId: string;
  careerName: string;
  admission_period: string;
  academic_status: AcademicStatus;
  is_active: boolean;
  createdAt: string;
};

const studentInfoFieldLabels: Record<string, string> = {
  first_name:     "Nombre",
  last_name:      "Apellido",
  identification: "Cédula",
  code:           "Código",
  created_at:     "Creado",
  updated_at:     "Actualizado",
};

const academicStatusLabels: Record<AcademicStatus, string> = {
  ACTIVE:    "Activo",
  WITHDRAWN: "Retirado",
  SUSPENDED: "Suspendido",
  AT_RISK:   "En Riesgo",
};

const MatriculasManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [careers, setCareers] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(true);

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>([]);
  const [period, setPeriod] = useState("2026-1");
  const [periodError, setPeriodError] = useState("");
  const [academic_status, setAcademic_status] = useState<AcademicStatus>("ACTIVE");

  // Esta es tu lista local de matrículas en el componente
  const [records, setRecords] = useState<RegistrationRecord[]>([]);
  const [updateCareerId, setUpdateCareerId] = useState("");
  const [updateEstado, setUpdateEstado] = useState<AcademicStatus>("ACTIVE");

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [studentsResponse, careersResponse] = await Promise.all([
          userService.getStudents(),
          planEstudioService.getCarreras(),
        ]);
        
        setStudents(Array.isArray(studentsResponse) ? studentsResponse : []);
        setCareers(Array.isArray(careersResponse) ? careersResponse : []);

        console.log("=== VERIFICACIÓN INICIAL DE MATRÍCULAS ===");
        console.log("Estudiantes cargados con sus estructuras de datos:", studentsResponse);
        
        studentsResponse.forEach((estudiante: Student) => {
          if (estudiante.matriculas && estudiante.matriculas.length > 0) {
            console.log(`Matrículas asociadas de fábrica a ${estudiante.first_name}:`, estudiante.matriculas);
          }
        });

      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const filteredStudents = useMemo(() => {
    const text = studentSearch.toLowerCase();
    return students.filter((student) => {
      if (!text) return true;
      const name = `${student.first_name ?? ""} ${student.last_name ?? ""}`.toLowerCase();
      const id = String(student.identification ?? "").toLowerCase();
      return name.includes(text) || id.includes(text);
    });
  }, [studentSearch, students]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => String(s.id) === String(selectedStudentId)) ?? null;
  }, [selectedStudentId, students]);

  const selectedStudentProfileImage = "/images/user/owner.jpg"; 

  const selectedStudentInfoEntries = useMemo(() => {
    if (!selectedStudent) return [];
    const fields = ["first_name", "last_name", "identification", "created_at", "updated_at"];
    return fields.map((key) => {
      const value = (selectedStudent as any)[key];
      const isDate = key === "created_at" || key === "updated_at";
      return {
        key,
        label: studentInfoFieldLabels[key] ?? key,
        value:
          isDate && value
            ? new Date(value).toLocaleString()
            : value === null || value === undefined || value === ""
            ? "-"
            : String(value),
      };
    });
  }, [selectedStudent]);

  const validatePeriod = (value: string): boolean => /^\d{4}-[1-3]$/.test(value);

  const selectedCareerNames = useMemo(() => {
    return careers.filter((c) => selectedCareerIds.includes(c.id)).map((c) => c.name);
  }, [careers, selectedCareerIds]);

  const enrollmentSummaryEntries = useMemo(() => [
    {
      label: "Estudiante",
      value: selectedStudent
        ? `${selectedStudent.first_name ?? ""} ${selectedStudent.last_name ?? ""}`.trim() || "Sin nombre"
        : "Sin seleccionar",
    },
    { label: "Carreras seleccionadas", value: selectedCareerNames.length > 0 ? selectedCareerNames.join(", ") : "Ninguna" },
    { label: "Cantidad de carreras", value: String(selectedCareerIds.length) },
    { label: "Periodo de ingreso", value: period || "-" },
    { label: "Estado académico inicial", value: academicStatusLabels[academic_status] },
    {
      label: "Validez del periodo",
      value: !period ? "Pendiente" : validatePeriod(period) ? "Válido" : "Inválido",
    },
  ], [academic_status, period, selectedCareerIds.length, selectedCareerNames, selectedStudent]);

  const studentAlreadyHasCareer = (studentId: string, careerId: string) =>
    records.some((r) => r.studentId === studentId && r.careerId === careerId && r.academic_status === "ACTIVE");

  const toggleCareer = (careerId: string) =>
    setSelectedCareerIds((cur) =>
      cur.includes(careerId) ? cur.filter((id) => id !== careerId) : [...cur, careerId]
    );

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    setPeriodError(value && !validatePeriod(value) ? "Formato inválido. Use: YYYY-# (ej: 2026-1)" : "");
  };

  const handleCreateEnrollment = async () => {
  if (!selectedStudentId || !selectedStudent) {
    Swal.fire({ icon: "warning", title: "Selecciona un estudiante", text: "Debes elegir un estudiante para matricularlo." });
    return;
  }
  if (!period || !validatePeriod(period)) {
    Swal.fire({ icon: "error", title: "Periodo inválido", text: "El formato debe ser YYYY-# (ej: 2026-1)" });
    return;
  }
  if (selectedCareerIds.length === 0) {
    Swal.fire({ icon: "warning", title: "Selecciona una carrera", text: "Debes seleccionar al menos una carrera." });
    return;
  }

  try {
    const createdRecords: RegistrationRecord[] = [];

    console.log("%c--- PROCESANDO NUEVA MATRÍCULA ---", "color: #10b981; font-weight: bold;");
    console.log("Lista de matrículas actuales ANTES del proceso:", records);

    const nombreEstudiante = `${selectedStudent.first_name ?? ""} ${selectedStudent.last_name ?? ""}`.trim() || "El estudiante";

    for (const careerId of selectedCareerIds) {
      const career = careers.find((c) => c.id === careerId);
      const nombreCarrera = career?.name ?? "la carrera seleccionada";

      // 1. Validación local (Por si acaso)
      if (studentAlreadyHasCareer(String(selectedStudentId), careerId)) {
        Swal.fire({ 
          icon: "info", 
          title: "Vinculación existente", 
          html: `El estudiante <b>${nombreEstudiante}</b> ya posee una matrícula <b>ACTIVA</b> en la carrera de <b>${nombreCarrera}</b>.`,
          confirmButtonColor: "#f59e0b"
        });
        return;
      }

      const payload = {
        student_id:       String(selectedStudentId),
        career_id:        careerId,
        admission_period: period,
        academic_status:  academic_status,
        is_active:        true,
      };

      // Aquí es donde el backend puede fallar si ya está duplicado en la BD
      const responseData = await registrationService.createRegistration(payload);

      const nuevaMatricula: RegistrationRecord = {
        id:               String(responseData?.id ?? `${selectedStudentId}-${careerId}-${Date.now()}`),
        studentId:        String(selectedStudentId),
        studentName:      nombreEstudiante,
        studentEmail:     "-",
        careerId,
        careerName:       nombreCarrera,
        admission_period: period,
        academic_status,
        is_active:        true,
        createdAt:        new Date().toISOString(),
      };

      console.log("Nueva matrícula generada individualmente por el Backend:", nuevaMatricula);
      createdRecords.push(nuevaMatricula);
    }

    setRecords((cur) => {
      const listaActualizada = [...cur, ...createdRecords];
      console.log("%c=== LISTA DE MATRÍCULAS ACTUALIZADA (TOTAL) ===", "color: #3b82f6; font-weight: bold;");
      console.table(listaActualizada);
      return listaActualizada;
    });

    setSelectedCareerIds([]);
    setAcademic_status("ACTIVE");
    setPeriod("2026-1");
    setPeriodError("");

    Swal.fire({ icon: "success", title: "Éxito", text: "Matrícula creada exitosamente" });
  } catch (error: any) {
    // === AQUÍ ESTÁ EL CAMBIO CLAVE ===
    console.error("Error completo atrapado en el proceso de matrícula:", error);

    // Intentamos extraer el mensaje exacto que configuraste en tu API (NestJS, Express, etc.)
    const backendMessage = error.response?.data?.message || error.message || "Error desconocido en el servidor";

    Swal.fire({ 
      icon: "error", 
      title: "No se pudo crear la matrícula", 
      html: ` El servidor respondió:<br><b class="text-red-500">${Array.isArray(backendMessage) ? backendMessage.join(", ") : backendMessage}</b>`,
    });
  }
};

  const handleUpdateEstado = async () => {
    if (!selectedStudentId || !updateCareerId) {
      Swal.fire({ icon: "warning", title: "Datos incompletos", text: "Selecciona estudiante y carrera." });
      return;
    }

    const existingRecord = records.find(
      (r) => r.studentId === String(selectedStudentId) && r.careerId === updateCareerId
    );

    if (!existingRecord) {
      Swal.fire({ icon: "error", title: "Matrícula no encontrada", text: "No se encontró una matrícula local para actualizar." });
      return;
    }

    try {
      console.log("%c--- ACTUALIZANDO ESTADO DE MATRÍCULA ---", "color: #f59e0b; font-weight: bold;");
      console.log("Matrícula seleccionada antes del cambio:", existingRecord);

      await registrationService.updateRegistration(existingRecord.id, {
        student_id:       existingRecord.studentId,
        career_id:        existingRecord.careerId,
        admission_period: existingRecord.admission_period,
        academic_status:  updateEstado,
        is_active:        existingRecord.is_active,
      });

      setRecords((cur) => {
        const listaActualizada = cur.map((r) => (r.id === existingRecord.id ? { ...r, academic_status: updateEstado } : r));
        console.log("Lista completa de matrículas tras actualizar estado:");
        console.table(listaActualizada);
        return listaActualizada;
      });

      Swal.fire({ icon: "success", title: "Estado actualizado", text: "Estado académico actualizado correctamente." });
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: "Error", text: "No fue posible actualizar el estado académico." });
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Cargando estudiantes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">HU-06</p>
        <h1 className="text-3xl font-semibold text-black dark:text-white">Matricular estudiante</h1>
        <p className="text-sm text-gray-500">Selecciona un estudiante y asígnale una o varias carreras.</p>
      </div>

      {/* Buscar estudiante */}
      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">Buscar estudiante</h2>
        <div className="mt-4">
          <GenericSearch
            label="Filtro rápido"
            placeholder="Nombre, apellidos o identificación"
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
                <th className="px-4 py-3">Identificación (Cédula)</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-3">
                    <input
                      type="radio"
                      name="student"
                      checked={String(selectedStudentId) === String(student.id)}
                      onChange={() => {
                        setSelectedStudentId(String(student.id));
                        setSelectedCareerIds([]);
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-black dark:text-white">
                    {`${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "Sin nombre"}
                  </td>
                  <td className="px-4 py-3">{student.identification ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grid Principal */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(320px,0.9fr)]">
        {/* Info estudiante */}
        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">Información del estudiante</h2>
          {selectedStudent ? (
            <div className="mt-4 grid gap-6">
              <div className="flex flex-col items-center rounded-2xl border border-stroke bg-gray-2 p-5 dark:border-strokedark dark:bg-meta-4">
                <img src={selectedStudentProfileImage} alt="student" className="h-36 w-36 rounded-full object-cover ring-4 ring-white dark:ring-boxdark" />
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
                        <td className="px-4 py-3 font-medium text-black dark:text-white">{entry.label}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{entry.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Selecciona un estudiante de la lista superior.</p>
          )}
        </section>

        {/* Seleccionar carrera y datos */}
        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">Datos de la matrícula</h2>
          {selectedStudent ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">Seleccionar carrera</label>
                <div className="space-y-3">
                  {careers.map((career) => {
                    const alreadyAssigned = studentAlreadyHasCareer(String(selectedStudentId), career.id);
                    return (
                      <label key={career.id} className={`flex items-start gap-3 rounded-xl border p-4 ${alreadyAssigned ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20" : "border-stroke dark:border-strokedark"}`}>
                        <input type="checkbox" disabled={alreadyAssigned} checked={selectedCareerIds.includes(career.id)} onChange={() => toggleCareer(career.id)} className="mt-1" />
                        <div>
                          <p className="font-semibold text-black dark:text-white">{career.name}</p>
                          <p className="text-sm text-gray-500">{career.codigo}</p>
                          {alreadyAssigned && <p className="mt-1 text-xs font-medium text-amber-600">Ya tiene matrícula activa</p>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">Periodo de ingreso</label>
                <input type="text" value={period} onChange={(e) => handlePeriodChange(e.target.value)} placeholder="2026-1" className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white" />
                {periodError && <p className="mt-1 text-xs text-red-500">{periodError}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">Estado académico inicial</label>
                <select value={academic_status} onChange={(e) => setAcademic_status(e.target.value as AcademicStatus)} className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white">
                  <option value="ACTIVE">Activo</option>
                  <option value="WITHDRAWN">Retirado</option>
                  <option value="SUSPENDED">Suspendido</option>
                  <option value="AT_RISK">En Riesgo</option>
                </select>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Selecciona un estudiante.</p>
          )}
        </section>

        {/* Resumen + Confirmar */}
        <section className="h-fit rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">Resumen</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-stroke dark:border-strokedark">
            <table className="w-full table-auto text-left">
              <tbody>
                {enrollmentSummaryEntries.map((entry) => (
                  <tr key={entry.label} className="border-b border-stroke dark:border-strokedark">
                    <td className="px-4 py-3 text-sm font-medium text-black dark:text-white">{entry.label}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{entry.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5">
            <button type="button" onClick={handleCreateEnrollment} className="w-full rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700">
              Confirmar creación de matrícula
            </button>
          </div>
        </section>
      </div>

      {/* Actualizar estado */}
      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">Actualizar estado académico</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Carrera asignada</label>
            <select value={updateCareerId} onChange={(e) => setUpdateCareerId(e.target.value)} className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white">
              <option value="">Selecciona una carrera</option>
              {careers.map((career) => (
                <option key={career.id} value={career.id}>{career.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Nuevo Estado</label>
            <select value={updateEstado} onChange={(e) => setUpdateEstado(e.target.value as AcademicStatus)} className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white">
              <option value="ACTIVE">Activo</option>
              <option value="WITHDRAWN">Retirado</option>
              <option value="SUSPENDED">Suspendido</option>
              <option value="AT_RISK">En Riesgo</option>
            </select>
          </div>
        </div>
        <button type="button" onClick={handleUpdateEstado} className="mt-6 rounded-md bg-primary px-5 py-3 text-sm font-medium text-white">
          Actualizar Estado
        </button>
      </section>
    </div>
  );
};

export default MatriculasManagement;
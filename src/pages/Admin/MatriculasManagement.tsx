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
  studentId: number;
  studentName: string;
  studentEmail: string;
  careerId: string;
  careerName: string;
  period: string;
  state: "activa" | "inactiva" | "retirada";
  createdAt: string;
};

const careerCatalog: CareerOption[] = [
  {
    id: "car-1",
    nombre: "Ingeniería de Sistemas",
    codigo: "IS-001",
    descripcion: "Carrera orientada al desarrollo de software y sistemas.",
  },
  {
    id: "car-2",
    nombre: "Contabilidad",
    codigo: "CON-001",
    descripcion: "Carrera orientada a gestión financiera y contable.",
  },
  {
    id: "car-3",
    nombre: "Administración",
    codigo: "ADM-001",
    descripcion: "Carrera enfocada en gestión y dirección organizacional.",
  },
];

const MatriculasManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>([]);
  const [period, setPeriod] = useState("2026-1");
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

  const studentAlreadyHasCareer = (studentId: number, careerId: string) => {
    return records.some(
      (record) => record.studentId === studentId && record.careerId === careerId && record.state === "activa"
    );
  };

  const toggleCareer = (careerId: string) => {
    setSelectedCareerIds((current) =>
      current.includes(careerId)
        ? current.filter((item) => item !== careerId)
        : [...current, careerId]
    );
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

    if (selectedCareerIds.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona al menos una carrera",
        text: "Puedes matricular al estudiante en una o varias carreras a la vez.",
      });
      return;
    }

    const duplicateCareers = selectedCareerIds.filter((careerId) =>
      studentAlreadyHasCareer(Number(selectedStudent.id), careerId)
    );

    if (duplicateCareers.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Duplicado detectado",
        text: "El estudiante ya tiene matrícula activa en una de las carreras seleccionadas.",
      });
      return;
    }

    const newRecords: EnrollmentRecord[] = selectedCareerIds.map((careerId) => {
      const career = careerCatalog.find((item) => item.id === careerId);
      return {
        id: `${selectedStudent.id}-${careerId}-${Date.now()}`,
        studentId: Number(selectedStudent.id),
        studentName: `${selectedStudent.first_name ?? ""} ${selectedStudent.last_name ?? ""}`.trim() || "Sin nombre",
        studentEmail: String(selectedStudent.email ?? ""),
        careerId,
        careerName: career?.nombre ?? careerId,
        period,
        state: "activa",
        createdAt: new Date().toISOString(),
      };
    });

    setRecords((current) => [...current, ...newRecords]);
    setSelectedCareerIds([]);

    Swal.fire({
      icon: "success",
      title: "Matrícula creada",
      text: "El estudiante fue matriculado en las carreras seleccionadas.",
    });
  };

  const cancelEnrollment = (recordId: string) => {
    setRecords((current) =>
      current.map((record) =>
        record.id === recordId ? { ...record, state: "inactiva" } : record
      )
    );
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
          Selecciona un estudiante activo y asígnale una o varias carreras en un
          mismo registro.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Buscar estudiante
          </h2>
          <div className="mt-4">
            <GenericSearch
              label="Filtro rápido"
              placeholder="Nombre, código, email o identificación"
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
                  <tr key={student.id} className="border-b border-stroke dark:border-strokedrokedark">
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        name="student"
                        checked={selectedStudentId === student.id}
                        onChange={() => {
                          setSelectedStudentId(Number(student.id));
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

        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Asignar carreras
          </h2>

          {selectedStudent ? (
            <div className="mt-4 rounded-xl bg-gray-2 p-4 dark:bg-meta-4">
              <p className="text-sm text-gray-500">Estudiante seleccionado</p>
              <p className="font-semibold text-black dark:text-white">
                {`${selectedStudent.first_name ?? ""} ${selectedStudent.last_name ?? ""}`.trim() || "Sin nombre"}
              </p>
              <p className="text-sm text-gray-500">{selectedStudent.email}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Selecciona un estudiante de la lista para continuar.
            </p>
          )}

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Periodo de ingreso
            </label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
            />
          </div>

          <div className="mt-4 space-y-3">
            {careerCatalog.map((career) => {
              const alreadyAssigned = selectedStudent
                ? studentAlreadyHasCareer(Number(selectedStudent.id), career.id)
                : false;

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
                    disabled={!selectedStudent || alreadyAssigned}
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
                        Ya tiene matrícula activa en esta carrera
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleCreateEnrollment}
            className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Matricular estudiante
          </button>
        </section>
      </div>

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Matrículas creadas
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="bg-gray-2 dark:bg-meta-4">
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-4 py-3">Carrera</th>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creada</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-3 text-black dark:text-white">{record.studentName}</td>
                  <td className="px-4 py-3">{record.careerName}</td>
                  <td className="px-4 py-3">{record.period}</td>
                  <td className="px-4 py-3">{record.state}</td>
                  <td className="px-4 py-3">{new Date(record.createdAt).toLocaleString()}</td>
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

export default MatriculasManagement;
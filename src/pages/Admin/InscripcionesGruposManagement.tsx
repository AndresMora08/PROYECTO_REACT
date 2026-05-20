import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import GenericSearch from "../../components/GenericSearch";

import { Group } from "../../models/Grupo";
import { Semester } from "../../models/Semestre";
import {
  Registration,
  AcademicStatus,
} from "../../models/Matricula";

import { PlanEstudio } from "../../models/PlanEstudio";
import { Carrera } from "../../models/Carrera";
import { Student } from "../../models/Estudiante";

import { userService } from "../../service/userService";
import { groupService } from "../../service/groupService";
import { semesterService } from "../../service/semesterService";
import { planEstudioService } from "../../service/planEstudioService";
import { enrollmentService } from "../../service/enrollmentService";

type GroupWithDetails = Group & {
  Asignatura?: {
    id: string;
    name: string;
    credits: number;
  };

  Docente?: {
    first_name: string;
    last_name: string;
  };
};

const studentInfoFieldLabels: Record<string, string> = {
  first_name: "Nombre",
  last_name: "Apellido",
  identification: "Cédula",
  code: "Código",
  email: "Correo",
  created_at: "Creado",
  updated_at: "Actualizado",
};

const MAX_CREDITS_PER_SEMESTER = 18;

const InscripcionesGruposManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [careers, setCareers] = useState<Carrera[]>([]);

  const [planesByCarrera, setPlanesByCarrera] =
    useState<Record<string, PlanEstudio>>({});

  const [loading, setLoading] = useState(true);

  const [studentSearch, setStudentSearch] =
    useState("");

  const [selectedStudentId, setSelectedStudentId] =
    useState<string | null>(null);

  const [selectedGroupIds, setSelectedGroupIds] =
    useState<string[]>([]);

  const [confirming, setConfirming] =
    useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [
          studentsResponse,
          groupsResponse,
          semestersResponse,
          careersResponse,
        ] = await Promise.all([
          userService.getStudents(),
          groupService.getGroups(),
          semesterService.getSemesters(),
          planEstudioService.getCarreras(),
        ]);

        setStudents(
          Array.isArray(studentsResponse)
            ? studentsResponse
            : []
        );

        setGroups(
          Array.isArray(groupsResponse)
            ? groupsResponse
            : []
        );

        setSemesters(
          Array.isArray(semestersResponse)
            ? semestersResponse
            : []
        );

        setCareers(
          Array.isArray(careersResponse)
            ? careersResponse
            : []
        );

        const planesMap: Record<
          string,
          PlanEstudio
        > = {};

        for (const carrera of careersResponse) {
          try {
            const planes =
              await planEstudioService.getPlanesPorCarrera(
                carrera.id
              );

            if (
              Array.isArray(planes) &&
              planes.length > 0
            ) {
              planesMap[carrera.id] =
                planes[0];
            }
          } catch (error) {
            console.error(
              "Error obteniendo plan:",
              error
            );
          }
        }

        setPlanesByCarrera(planesMap);
      } catch (error) {
        console.error(error);

        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No fue posible cargar los datos",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredStudents = useMemo(() => {
    const text =
      studentSearch.toLowerCase();

    return students.filter((student) => {
      if (!text) return true;

      const fullName =
        `${student.first_name ?? ""} ${
          student.last_name ?? ""
        }`.toLowerCase();

      const identification = String(
        student.identification ?? ""
      ).toLowerCase();

      const email = String(
        student.email ?? ""
      ).toLowerCase();

      const code = String(
        student.code ?? ""
      ).toLowerCase();

      return (
        fullName.includes(text) ||
        identification.includes(text) ||
        email.includes(text) ||
        code.includes(text)
      );
    });
  }, [students, studentSearch]);

  const selectedStudent = useMemo(() => {
    return (
      students.find(
        (s) =>
          String(s.id) ===
          String(selectedStudentId)
      ) ?? null
    );
  }, [students, selectedStudentId]);

  const selectedStudentProfileImage =
    useMemo(() => {
      if (!selectedStudent)
        return "/images/user/owner.jpg";

      return (
        (selectedStudent as any)
          .photo_url ||
        (selectedStudent as any)
          .profile_photo ||
        (selectedStudent as any)
          .avatar ||
        "/images/user/owner.jpg"
      );
    }, [selectedStudent]);

  const selectedStudentInfoEntries =
    useMemo(() => {
      if (!selectedStudent) return [];

      const fields = [
        "first_name",
        "last_name",
        "identification",
        "code",
        "email",
        "created_at",
        "updated_at",
      ];

      return fields.map((key) => {
        const value = (selectedStudent as any)[
          key
        ];

        const isDate =
          key === "created_at" ||
          key === "updated_at";

        return {
          key,

          label:
            studentInfoFieldLabels[key] ??
            key,

          value:
            isDate && value
              ? new Date(
                  value
                ).toLocaleString()
              : value === null ||
                value === undefined ||
                value === ""
              ? "-"
              : String(value),
        };
      });
    }, [selectedStudent]);

  const activeSemester = useMemo(() => {
    return (
      semesters.find(
        (semester) =>
          semester.is_active === true
      ) ?? null
    );
  }, [semesters]);

  /*
    =========================================
    MATRÍCULA ACTIVA
    =========================================
  */

  const activeRegistration =
    useMemo(() => {
      if (
        !selectedStudent?.matriculas
      )
        return null;

      return (
        selectedStudent.matriculas.find(
          (
            registration: Registration
          ) =>
            registration.is_active &&
            registration.academic_status ===
              AcademicStatus.ACTIVE
        ) ?? null
      );
    }, [selectedStudent]);

  const hasActiveRegistration =
    !!activeRegistration;

  /*
    =========================================
    CARRERA ACTIVA
    =========================================
  */

  const activeCareerId =
    useMemo(() => {
      if (!activeRegistration)
        return null;

      return String(
        activeRegistration.career_id
      );
    }, [activeRegistration]);

  /*
    =========================================
    PLAN DE ESTUDIO
    =========================================
  */

  const activePlan = useMemo(() => {
    if (!activeCareerId)
      return null;

    return (
      planesByCarrera[
        activeCareerId
      ] ?? null
    );
  }, [
    activeCareerId,
    planesByCarrera,
  ]);

  /*
    =========================================
    ASIGNATURAS PERMITIDAS
    =========================================
  */

  const allowedSubjectIds =
    useMemo(() => {
      if (!activePlan?.subjects)
        return [];

      return activePlan.subjects.map(
        (subject: any) =>
          String(
            subject.id ??
              subject.subject?.id
          )
      );
    }, [activePlan]);

  /*
    =========================================
    GRUPOS DISPONIBLES
    =========================================
  */

  const availableGroups =
    useMemo(() => {
      if (!activeSemester)
        return [];

      return groups.filter((group) => {
        const sameSemester =
          String(
            group.semester_id
          ) ===
          String(activeSemester.id);

        const validSubject =
          allowedSubjectIds.includes(
            String(group.subject_id)
          );

        return (
          sameSemester &&
          validSubject
        );
      });
    }, [
      groups,
      activeSemester,
      allowedSubjectIds,
    ]);

  /*
    =========================================
    INSCRIPCIONES ACTIVAS
    =========================================
  */

  const enrolledGroupIds =
    useMemo(() => {
      if (
        !(selectedStudent as any)
          ?.inscripciones
      )
        return [];

      return (
        (selectedStudent as any)
          .inscripciones || []
      )
        .filter(
          (inscripcion: any) =>
            inscripcion.status ===
            "ACTIVE"
        )
        .map((inscripcion: any) =>
          String(
            inscripcion.group_id
          )
        );
    }, [selectedStudent]);

  /*
    =========================================
    GRUPOS SELECCIONADOS
    =========================================
  */

  const selectedGroups =
    useMemo(() => {
      return selectedGroupIds
        .map((id) =>
          availableGroups.find(
            (g) =>
              String(g.id) ===
              String(id)
          )
        )
        .filter(
          Boolean
        ) as GroupWithDetails[];
    }, [
      selectedGroupIds,
      availableGroups,
    ]);

  /*
    =========================================
    TOTAL CRÉDITOS
    =========================================
  */

  const totalCredits =
    useMemo(() => {
      return selectedGroups.reduce(
        (acc, group) => {
          return (
            acc +
            (group.Asignatura
              ?.credits ?? 0)
          );
        },
        0
      );
    }, [selectedGroups]);

  /*
    =========================================
    VALIDACIONES
    =========================================
  */

  const validation = useMemo(() => {
    const errors: string[] = [];

    if (!selectedStudent) {
      errors.push(
        "Debes seleccionar un estudiante"
      );
    }

    if (
      selectedStudent &&
      !selectedStudent.is_active
    ) {
      errors.push(
        "El estudiante está inactivo"
      );
    }

    if (!hasActiveRegistration) {
      errors.push(
        "El estudiante no posee matrícula activa"
      );
    }

    if (
      selectedGroupIds.length === 0
    ) {
      errors.push(
        "Selecciona al menos un grupo"
      );
    }

    if (
      totalCredits >
      MAX_CREDITS_PER_SEMESTER
    ) {
      errors.push(
        `Los créditos exceden el límite permitido (${MAX_CREDITS_PER_SEMESTER})`
      );
    }

    const duplicated =
      selectedGroupIds.filter((id) =>
        enrolledGroupIds.includes(
          String(id)
        )
      );

    if (duplicated.length > 0) {
      errors.push(
        "El estudiante ya posee inscripciones activas en algunos grupos seleccionados"
      );
    }

    return {
      errors,
      isValid:
        errors.length === 0,
    };
  }, [
    selectedStudent,
    hasActiveRegistration,
    selectedGroupIds,
    totalCredits,
    enrolledGroupIds,
  ]);

  /*
    =========================================
    TOGGLE GROUP
    =========================================
  */

  const toggleGroup = (
    groupId: string
  ) => {
    setSelectedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter(
            (id) => id !== groupId
          )
        : [...current, groupId]
    );
  };

  /*
    =========================================
    CREAR INSCRIPCIONES
    =========================================
  */

  const handleCreateEnrollments =
    async () => {
      if (!validation.isValid) {
        Swal.fire({
          icon: "error",
          title:
            "Validación fallida",

          html: validation.errors
            .map(
              (error) =>
                `<p>❌ ${error}</p>`
            )
            .join(""),
        });

        return;
      }

      try {
        setConfirming(true);

        const result =
          await enrollmentService.enrollStudentInMultipleGroups(
            String(
              selectedStudentId
            ),
            selectedGroupIds
          );

        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: `${result.successful.length} inscripción(es) creadas correctamente`,
        });

        setSelectedGroupIds([]);
      } catch (error: any) {
        console.error(error);

        const backendMessage =
          error?.response?.data
            ?.message ||
          error.message ||
          "Error desconocido";

        Swal.fire({
          icon: "error",
          title:
            "No fue posible crear las inscripciones",

          html: `
            <div class="text-left">
              ${
                Array.isArray(
                  backendMessage
                )
                  ? backendMessage
                      .map(
                        (
                          m: string
                        ) =>
                          `<p>• ${m}</p>`
                      )
                      .join("")
                  : backendMessage
              }
            </div>
          `,
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
          Selecciona un estudiante con
          matrícula activa y grupos
          válidos del plan de estudios.
        </p>
      </div>

      {/* BUSCAR ESTUDIANTE */}

      <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Buscar estudiante
        </h2>

        <div className="mt-4">
          <GenericSearch
            label="Filtro rápido"
            placeholder="Nombre, email, código o identificación"
            value={studentSearch}
            onChange={
              setStudentSearch
            }
          />
        </div>

        <div className="mt-4 max-h-96 overflow-y-auto rounded-xl border border-stroke dark:border-strokedark">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="bg-gray-2 dark:bg-meta-4">
                <th className="px-4 py-3">
                  Seleccionar
                </th>

                <th className="px-4 py-3">
                  Nombre
                </th>

                <th className="px-4 py-3">
                  Identificación
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map(
                (student) => (
                  <tr
                    key={student.id}
                    className="border-b border-stroke dark:border-strokedark"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        name="student"
                        checked={
                          String(
                            selectedStudentId
                          ) ===
                          String(
                            student.id
                          )
                        }
                        onChange={() => {
                          setSelectedStudentId(
                            String(
                              student.id
                            )
                          );

                          setSelectedGroupIds(
                            []
                          );
                        }}
                      />
                    </td>

                    <td className="px-4 py-3">
                      {`${student.first_name ?? ""} ${
                        student.last_name ??
                        ""
                      }`.trim()}
                    </td>

                    <td className="px-4 py-3">
                      {student.identification ??
                        "-"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* INFO ESTUDIANTE */}

      {selectedStudent && (
        <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Información del estudiante
          </h2>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-col items-center">
              <img
                src={
                  selectedStudentProfileImage
                }
                alt="student"
                className="h-32 w-32 rounded-full object-cover border-4 border-primary"
              />
            </div>

            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              {selectedStudentInfoEntries.map(
                (entry) => (
                  <div
                    key={entry.key}
                    className="rounded-xl bg-gray-2 p-4 dark:bg-meta-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {entry.label}
                    </p>

                    <p className="mt-2 text-sm font-semibold text-black dark:text-white">
                      {entry.value}
                    </p>
                  </div>
                )
              )}

              <div className="rounded-xl bg-gray-2 p-4 dark:bg-meta-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Estado matrícula
                </p>

                <p className="mt-2 text-sm font-semibold text-black dark:text-white">
                  {hasActiveRegistration
                    ? "Activa"
                    : "Sin matrícula activa"}
                </p>
              </div>

              <div className="rounded-xl bg-gray-2 p-4 dark:bg-meta-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Carrera activa
                </p>

                <p className="mt-2 text-sm font-semibold text-black dark:text-white">
                  {activeRegistration
                    ?.career?.name ??
                    "-"}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* GRUPOS */}

      {selectedStudent &&
        hasActiveRegistration && (
          <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Seleccionar grupos
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Semestre activo:{" "}
              {activeSemester?.name ??
                "-"}
            </p>

            <div className="mt-5 space-y-4">
              {availableGroups.map(
                (group) => {
                  const alreadyEnrolled =
                    enrolledGroupIds.includes(
                      String(group.id)
                    );

                  const selected =
                    selectedGroupIds.includes(
                      String(group.id)
                    );

                  return (
                    <label
                      key={group.id}
                      className={`flex items-start gap-4 rounded-xl border p-4 ${
                        selected
                          ? "border-primary bg-blue-50 dark:bg-blue-900"
                          : "border-stroke dark:border-strokedark"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={
                          alreadyEnrolled
                        }
                        checked={
                          selected
                        }
                        onChange={() =>
                          toggleGroup(
                            String(
                              group.id
                            )
                          )
                        }
                      />

                      <div className="flex-1">
                        <p className="font-semibold text-black dark:text-white">
                          {
                            group.name
                          }{" "}
                          (
                          {
                            group.group_code
                          }
                          )
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Asignatura:{" "}
                          {
                            group
                              .Asignatura
                              ?.name
                          }{" "}
                          (
                          {
                            group
                              .Asignatura
                              ?.credits
                          }{" "}
                          créditos)
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Docente:{" "}
                          {
                            group
                              .Docente
                              ?.first_name
                          }{" "}
                          {
                            group
                              .Docente
                              ?.last_name
                          }
                        </p>

                        {alreadyEnrolled && (
                          <p className="mt-2 text-xs text-orange-500">
                            Ya inscrito
                          </p>
                        )}
                      </div>
                    </label>
                  );
                }
              )}
            </div>

            {selectedGroupIds.length >
              0 && (
              <div className="mt-4 rounded-xl bg-blue-50 p-4 dark:bg-blue-900">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-200">
                  Créditos:{" "}
                  {totalCredits} /{" "}
                  {
                    MAX_CREDITS_PER_SEMESTER
                  }
                </p>
              </div>
            )}
          </section>
        )}

      {/* CONFIRMAR */}

      {selectedStudent &&
        hasActiveRegistration && (
          <section className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Confirmar inscripción
            </h2>

            {validation.errors.length >
              0 && (
              <div className="mt-4 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900">
                {validation.errors.map(
                  (
                    error,
                    index
                  ) => (
                    <p
                      key={index}
                      className="text-sm text-red-700 dark:text-red-200"
                    >
                      ❌ {error}
                    </p>
                  )
                )}
              </div>
            )}

            <div className="mt-6 flex gap-4">
              <button
                onClick={
                  handleCreateEnrollments
                }
                disabled={
                  !validation.isValid ||
                  confirming
                }
                className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                {confirming
                  ? "Inscribiendo..."
                  : "Crear inscripciones"}
              </button>

              <button
                onClick={() => {
                  setSelectedStudentId(
                    null
                  );

                  setSelectedGroupIds(
                    []
                  );

                  setStudentSearch(
                    ""
                  );
                }}
                className="rounded-lg border border-stroke px-6 py-3 font-semibold"
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
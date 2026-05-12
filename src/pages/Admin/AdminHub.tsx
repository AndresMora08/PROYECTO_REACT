import React from "react";
import { Link } from "react-router-dom";

const adminSections = [
  {
    title: "Usuarios",
    description:
      "Crear, editar, desactivar y filtrar docentes y estudiantes.",
    path: "/admin/users",
    accent: "from-blue-500 to-cyan-400",
  },
  {
    title: "Carreras y semestres",
    description:
      "Administrar carreras, semestres activos y cierres por periodo.",
    path: "/admin/careers-semesters",
    accent: "from-emerald-500 to-teal-400",
  },
  {
    title: "Plan de estudios",
    description:
      "Versionar asignaturas por carrera y revisar histórico de cambios.",
    path: "/admin/study-plan",
    accent: "from-amber-500 to-orange-400",
  },
  {
    title: "Matrículas",
    description:
      "Matricular un estudiante en una o varias carreras y cancelar registros.",
    path: "/admin/matriculas",
    accent: "from-fuchsia-500 to-pink-400",
  },
  {
    title: "Inscripciones",
    description:
      "Inscribir estudiantes en grupos activos que pertenezcan a su plan de estudios.",
    path: "/admin/inscripciones",
    accent: "from-sky-500 to-indigo-400",
  },
  {
    title: "Rúbricas",
    description:
      "Crear rúbricas con criterios ponderados, borrador y publicación.",
    path: "/admin/rubricas",
    accent: "from-violet-500 to-purple-400",
  },
];

const AdminHub: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">
          Administración
        </p>
        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Módulo administrativo
        </h1>
        <p className="max-w-3xl text-sm text-gray-500">
          Desde aquí entras a las tres historias base de administrador. La idea
          es que cada una tenga su propia pantalla para no mezclar procesos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {adminSections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark"
          >
            <div
              className={`mb-4 h-2 w-20 rounded-full bg-gradient-to-r ${section.accent}`}
            />
            <h2 className="text-xl font-semibold text-black dark:text-white">
              {section.title}
            </h2>
            <p className="mt-2 text-sm text-gray-500">{section.description}</p>
            <Link
              to={section.path}
              className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Abrir módulo
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminHub;
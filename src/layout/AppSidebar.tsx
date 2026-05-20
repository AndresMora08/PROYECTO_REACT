import { useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

import {
  BoxCubeIcon,
  CalenderIcon,
  GridIcon,
  UserCircleIcon,
} from "../icons";

import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

// ===============================
// ADMIN
// ===============================
const adminNavItems: NavItem[] = [
  { name: "Control de Cuentas", path: "/admin/users", icon: <BoxCubeIcon /> },
  { name: "Estructura Académica", path: "/admin/careers-semesters", icon: <BoxCubeIcon /> },
  { name: "Planes de Estudio", path: "/admin/study-plan", icon: <BoxCubeIcon /> },
  { name: "Catálogo de Materias", path: "/admin/asignaturas", icon: <BoxCubeIcon /> },
  { name: "Asignación Docente", path: "/admin/asignar-docente", icon: <BoxCubeIcon /> },
  { name: "Matrícula en Carreras", path: "/admin/matriculas", icon: <BoxCubeIcon /> },
  { name: "Inscripción a Grupos", path: "/admin/inscripciones", icon: <BoxCubeIcon /> },
];

// ===============================
// DOCENTE (7 HUs correctas)
// ===============================
const docenteNavItems: NavItem[] = [
  { name: "Gestor de Rúbricas", path: "/docente/rubricas", icon: <UserCircleIcon /> },
  { name: "Criterios y Escalas", path: "/docente/criterios", icon: <UserCircleIcon /> },
  { name: "Vincular Evaluación", path: "/docente/vincular-rubrica", icon: <UserCircleIcon /> },
  { name: "Calificar Estudiantes", path: "/docente/calificar", icon: <UserCircleIcon /> },
  { name: "Registrar Notas Finales", path: "/docente/notas-finales", icon: <UserCircleIcon /> },
];

// ===============================
// ESTUDIANTE
// ===============================
const estudianteNavItems: NavItem[] = [
  { name: "Guías de Evaluación", path: "/estudiante/rubricas", icon: <UserCircleIcon /> },
  { name: "Mis Calificaciones", path: "/estudiante/calificaciones", icon: <UserCircleIcon /> },
];

// ===============================
// COMPARTIDOS
// ===============================
const sharedNavItems: NavItem[] = [
  { name: "Inicio", path: "/", icon: <GridIcon /> },
  { name: "Calendario", path: "/calendar", icon: <CalenderIcon /> },
  { name: "Perfil", path: "/profile", icon: <UserCircleIcon /> },
];

// ===============================
// ROLE
// ===============================
function getNavItems(role?: string) {
  switch (role) {
    case "ADMIN":
      return [...adminNavItems, ...sharedNavItems];
    case "TEACHER":
      return [...docenteNavItems, ...sharedNavItems];
    case "STUDENT":
      return [...estudianteNavItems, ...sharedNavItems];
    default:
      return sharedNavItems;
  }
}

// ===============================
// COMPONENTE
// ===============================
const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered } = useSidebar();
  const location = useLocation();

  const user = useSelector((s: RootState) => s.user.user);
  const role = user?.role?.toUpperCase();

  const navItems = useMemo(() => getNavItems(role), [role]);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300
      ${isExpanded || isHovered || isMobileOpen ? "w-[280px]" : "w-[90px]"}`}
    >
      <div className="p-4">
        <div className="mb-6 text-sm font-semibold text-gray-500 uppercase">
          Menú
        </div>

        <ul className="flex flex-col gap-2">
          {navItems.map((item) => {
            const active = isActive(item.path);

            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition
                    ${
                      active
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                >
                  <span className="text-lg">{item.icon}</span>

                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="text-sm">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default AppSidebar;
// src/layout/AppSidebar.tsx

import React, { useCallback, useMemo } from "react";

import { Link, useLocation } from "react-router-dom";

import { useSelector } from "react-redux";

import { RootState } from "../store/store";

import { useSidebar } from "../context/SidebarContext";

import {
  BoxCubeIcon,
  CalenderIcon,
  GridIcon,
  UserCircleIcon,
} from "../icons";

// =====================================
// TYPES
// =====================================

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

// =====================================
// ADMIN NAVIGATION
// =====================================

const adminNavItems: NavItem[] = [
  {
    name: "Gestionar Usuarios",
    path: "/users/list",
    icon: <BoxCubeIcon />,
  },

  {
    name: "Carreras y Semestres",
    path: "/admin/careers-semesters",
    icon: <BoxCubeIcon />,
  },

  {
    name: "Plan de Estudios",
    path: "/admin/study-plan",
    icon: <BoxCubeIcon />,
  },

  {
    name: "Asignaturas",
    path: "/subjects/list",
    icon: <BoxCubeIcon />,
  },

  {
    name: "Grupos Académicos",
    path: "/groups/list",
    icon: <BoxCubeIcon />,
  },

  {
    name: "Matricular Estudiante",
    path: "/admin/matriculas",
    icon: <BoxCubeIcon />,
  },

  {
    name: "Inscribir Estudiante",
    path: "/admin/inscripciones",
    icon: <BoxCubeIcon />,
  },
];

// =====================================
// TEACHER NAVIGATION
// =====================================

const docenteNavItems: NavItem[] = [
  {
    name: "Crear Rúbrica",
    path: "/admin/rubricas",
    icon: <UserCircleIcon />,
  },

  {
    name: "Definir Escalas",
    path: "/rubrics/define-scales",
    icon: <UserCircleIcon />,
  },

  {
    name: "Asignar Rúbrica",
    path: "/evaluations/list",
    icon: <UserCircleIcon />,
  },

  {
    name: "Calificar Estudiantes",
    path: "/evaluations/calificar",
    icon: <UserCircleIcon />,
  },

  {
    name: "Registrar Nota Final",
    path: "/groups/list",
    icon: <UserCircleIcon />,
  },
];

// =====================================
// STUDENT NAVIGATION
// =====================================

const estudianteNavItems: NavItem[] = [
  {
    name: "Consultar Rúbricas",
    path: "/estudiante/rubricas",
    icon: <UserCircleIcon />,
  },

  {
    name: "Mis Calificaciones",
    path: "/estudiante/calificaciones",
    icon: <UserCircleIcon />,
  },
];

// =====================================
// SHARED NAVIGATION
// =====================================

const sharedNavItems: NavItem[] = [
  {
    name: "Inicio",
    path: "/",
    icon: <GridIcon />,
  },

  {
    name: "Calendario",
    path: "/calendar",
    icon: <CalenderIcon />,
  },

  {
    name: "Perfil",
    path: "/profile",
    icon: <UserCircleIcon />,
  },
];

// =====================================
// ROLE NAVIGATION LOGIC
// =====================================

function getNavItems(role?: string): NavItem[] {
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

// =====================================
// COMPONENT
// =====================================

const AppSidebar: React.FC = () => {
  // =====================================
  // SIDEBAR STATE
  // =====================================

  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // =====================================
  // CURRENT ROUTE
  // =====================================

  const location = useLocation();

  // =====================================
  // USER FROM REDUX
  // =====================================

  const user = useSelector((state: RootState) => state.user.user);

  // =====================================
  // ROLE
  // =====================================

  const role = user?.role?.toUpperCase();

  // =====================================
  // DYNAMIC MENU
  // =====================================

  const navItems = useMemo(() => {
    return getNavItems(role);
  }, [role]);

  // =====================================
  // ACTIVE ROUTE DETECTOR
  // =====================================

  const isActive = useCallback(
    (path: string) => {
      return location.pathname === path;
    },
    [location.pathname]
  );

  // =====================================
  // RENDER
  // =====================================

  return (
    <aside
      className={`
        fixed top-0 left-0 z-50 h-screen
        border-r border-gray-200 bg-white
        dark:border-gray-800 dark:bg-gray-900
        transition-all duration-300

        ${
          isExpanded || isHovered || isMobileOpen
            ? "w-[280px]"
            : "w-[90px]"
        }
      `}
    >
      {/* =====================================
          LOGO / HEADER
      ===================================== */}

      <div className="flex h-[70px] items-center justify-center border-b border-gray-200 dark:border-gray-800">
        <h1
          className={`
            font-bold text-gray-800 dark:text-white
            transition-all duration-300

            ${
              isExpanded || isHovered || isMobileOpen
                ? "text-xl"
                : "hidden"
            }
          `}
        >
          Campus App
        </h1>
      </div>

      {/* =====================================
          MENU CONTENT
      ===================================== */}

      <div className="overflow-y-auto px-4 py-6">
        {/* SECTION TITLE */}

        <div
          className={`
            mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400

            ${
              isExpanded || isHovered || isMobileOpen
                ? "block"
                : "hidden"
            }
          `}
        >
          Navegación
        </div>

        {/* MENU LIST */}

        <ul className="flex flex-col gap-2">
          {navItems.map((item) => {
            const active = isActive(item.path);

            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`
                    group flex items-center gap-3 rounded-xl px-3 py-3
                    transition-all duration-200

                    ${
                      active
                        ? `
                          bg-blue-50
                          text-blue-600
                          dark:bg-blue-500/10
                          dark:text-blue-400
                        `
                        : `
                          text-gray-700
                          hover:bg-gray-100
                          dark:text-gray-300
                          dark:hover:bg-gray-800
                        `
                    }
                  `}
                >
                  {/* ICON */}

                  <span
                    className={`
                      flex min-w-[24px] justify-center text-lg
                    `}
                  >
                    {item.icon}
                  </span>

                  {/* LABEL */}

                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="truncate text-sm font-medium">
                      {item.name}
                    </span>
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
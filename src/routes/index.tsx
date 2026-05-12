import { lazy } from "react";

const AdminHub = lazy(() => import("../pages/Admin/AdminHub"));
const UsersManagement = lazy(() => import("../pages/Admin/UsersManagement"));
const CareersSemestersManagement = lazy(
    () => import("../pages/Admin/CareersSemestersManagement")
);
const StudyPlanManagement = lazy(
    () => import("../pages/Admin/StudyPlanManagement")
);
const MatriculasManagement = lazy(
    () => import("../pages/Admin/MatriculasManagement")
);
const InscripcionesManagement = lazy(
    () => import("../pages/Admin/InscripcionesManagement")
);
const RubricasManagement = lazy(
    () => import("../pages/Admin/RubricasManagement")
);

// ======================================================
// 🔹 USERS
// ======================================================

// 🔹 LISTADO
const UserList = lazy(
    () => import("../pages/Users/ListUsers")
);

// 🔹 CREAR
const UserCreate = lazy(
    () => import("../pages/Users/CreateUsers")
);

// 🔹 EDITAR
const UserUpdate = lazy(
    () => import("../pages/Users/UpdateUsers")
);


// ======================================================
// 🔹 RUTAS
// ======================================================

const coreRoutes = [

    // =========================================
    // 🔹 ADMIN HUB
    // =========================================

    {
        path: "/admin",
        title: "Panel Administrativo",
        component: AdminHub,
    },

    // =========================================
    // 🔹 ADMIN - USUARIOS
    // =========================================

    {
        path: "/admin/users",
        title: "Gestionar Usuarios",
        component: UsersManagement,
    },

    // =========================================
    // 🔹 ADMIN - CARRERAS Y SEMESTRES
    // =========================================

    {
        path: "/admin/careers-semesters",
        title: "Carreras y Semestres",
        component: CareersSemestersManagement,
    },

    // =========================================
    // 🔹 ADMIN - PLAN DE ESTUDIOS
    // =========================================

    {
        path: "/admin/study-plan",
        title: "Plan de Estudios",
        component: StudyPlanManagement,
    },

    // =========================================
    // 🔹 ADMIN - MATRICULAS
    // =========================================

    {
        path: "/admin/matriculas",
        title: "Matricular Estudiante",
        component: MatriculasManagement,
    },

    // =========================================
    // 🔹 ADMIN - INSCRIPCIONES
    // =========================================

    {
        path: "/admin/inscripciones",
        title: "Inscribir Estudiante en Grupo",
        component: InscripcionesManagement,
    },

    // =========================================
    // 🔹 ADMIN - RUBRICAS
    // =========================================

    {
        path: "/admin/rubricas",
        title: "Crear Rúbrica",
        component: RubricasManagement,
    },

    // =========================================
    // 🔹 LISTA USUARIOS
    // =========================================

    {
        path: "/users/list",
        title: "Lista Usuarios",
        component: UserList,
    },

    // =========================================
    // 🔹 CREAR USUARIO
    // =========================================

    {
        path: "/users/create",
        title: "Crear Usuario",
        component: UserCreate,
    },

    // =========================================
    // 🔹 EDITAR USUARIO
    // =========================================

    {
        path: "/users/update/:id",
        title: "Editar Usuario",
        component: UserUpdate,
    },

];

const routes = [...coreRoutes];

export default routes;
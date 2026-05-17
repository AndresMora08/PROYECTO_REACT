
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
const SubjectList = lazy(() => import("../pages/Asignaturas/ListAsignaturas"));
const SubjectCreate = lazy(() => import("../pages/Asignaturas/CreateAsignaturas"));
const SubjectUpdate = lazy(() => import("../pages/Asignaturas/UpdateAsignaturas"));

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
// 🔹 GRUPOS (NUEVOS COMPONENTES)
// ======================================================
const ListGroups = lazy(
    () => import("../pages/Grupos/ListGroupsCU-05")
);
const AssignTeacher = lazy(
    () => import("../pages/Grupos/AgregarTeacher")
);

const FinalizarNotas = lazy(
    () => import("../pages/Grupos/FinalizarNotas")
);

const ConsultarRubrica = lazy(() => import("../pages/Evaluaciones/ConsultarRubrica"));


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
    
    // =========================================
    // 🔹 ASIGNATURAS
    // =========================================
    { path: "/subjects/list",        title: "Asignaturas",          component: SubjectList },
    { path: "/subjects/create",      title: "Nueva Asignatura",     component: SubjectCreate },
    { path: "/subjects/update/:id",  title: "Editar Asignatura",    component: SubjectUpdate },

    // =========================================
    // 🔹 GRUPOS ACADÉMICOS
    // =========================================
    { 
        path: "/groups/list", 
        title: "Grupos Académicos", 
        component: ListGroups 
    },
    { 
        path: "/groups/manage/:groupId", 
        title: "Asignar Docente a Grupo", 
        component: AssignTeacher 
    },
    {
        path: "/groups/finalizar/:groupId",
        title: "Registrar Nota Final",
        component: FinalizarNotas,
    },
    {
        path: "/evaluations/:evaluationId/rubrica",
        title: "Consultar Rúbrica",
        component: ConsultarRubrica,
    },

];

const routes = [...coreRoutes];

export default routes;
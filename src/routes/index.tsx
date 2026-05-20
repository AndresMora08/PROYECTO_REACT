import { lazy } from "react";

// ======================================================
// 🔹 ADMIN
// ======================================================

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

const InscripcionesGruposManagement = lazy(
    () => import("../pages/Admin/InscripcionesGruposManagement")
);

const RubricasManagement = lazy(
    () => import("../pages/Admin/RubricasManagement")
);

// ======================================================
// 🔹 ASIGNATURAS
// ======================================================

const SubjectList = lazy(
    () => import("../pages/Asignaturas/ListAsignaturas")
);

const SubjectCreate = lazy(
    () => import("../pages/Asignaturas/CreateAsignaturas")
);

const SubjectUpdate = lazy(
    () => import("../pages/Asignaturas/UpdateAsignaturas")
);

// ======================================================
// 🔹 USERS
// ======================================================

const UserList = lazy(
    () => import("../pages/Users/ListUsers")
);

const UserCreate = lazy(
    () => import("../pages/Users/CreateUsers")
);

const UserUpdate = lazy(
    () => import("../pages/Users/UpdateUsers")
);

// ======================================================
// 🔹 GRUPOS
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

// ======================================================
// 🔹 EVALUACIONES Y RÚBRICAS
// ======================================================

const ConsultarRubrica = lazy(
    () => import("../pages/evaluaciones/ConsultarRubrica")
);

const SelectEvaluation = lazy(
    () => import("../pages/evaluaciones/SelectEvaluation")
);

const AssignRubricEvaluation = lazy(
    () => import("../pages/evaluaciones/AssignRubricEvaluation")
);

// ======================================================
// 🔹 DEFINIR CRITERIOS Y ESCALAS (CU-09)
// ======================================================

const Step1_SelectRubric = lazy(
    () => import("../pages/rubricas/selectRubric")
);

const Step2_SelectCriterion = lazy(
    () => import("../pages/rubricas/selectCriterion")
);

const Step3_DefineScales = lazy(
    () => import("../pages/rubricas/defineScales")
);

 // ======================================================
 // 🔹 CALIFICACIONES CON RÚBRICA (CU-11)
 // ======================================================

const CU11_Step1_SelectStudent = lazy(
    () => import("../pages/rubricas/selectStudent")
);

const CU11_Step2_EvaluateCriteria = lazy(
    () => import("../pages/rubricas/evaluateCriteria")
);

const CU11_Step3_ReviewSend = lazy(
    () => import("../pages/rubricas/reviewSend")
);

// ======================================================
// 🔹 ESTUDIANTE
// ======================================================

const StudentEvaluations = lazy(() => import("../pages/Estudiante/StudentEvaluations"));
const StudentGrades = lazy(() => import("../pages/Estudiante/StudentGrades"));
const StudentGradeDetail = lazy(() => import("../pages/Estudiante/StudentGradeDetail"));
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
    // 🔹 ADMIN - INSCRIPCIONES (HU-07)
    // =========================================

    {
        path: "/admin/inscripciones",
        title: "Inscribir Estudiante en Grupo",
        component: InscripcionesGruposManagement,
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

    {
        path: "/subjects/list",
        title: "Asignaturas",
        component: SubjectList,
    },

    {
        path: "/subjects/create",
        title: "Nueva Asignatura",
        component: SubjectCreate,
    },

    {
        path: "/subjects/update/:id",
        title: "Editar Asignatura",
        component: SubjectUpdate,
    },

    // =========================================
    // 🔹 GRUPOS ACADÉMICOS
    // =========================================

    {
        path: "/groups/list",
        title: "Grupos Académicos",
        component: ListGroups,
    },

    {
        path: "/groups/manage/:groupId",
        title: "Asignar Docente a Grupo",
        component: AssignTeacher,
    },

    {
        path: "/groups/finalizar/:groupId",
        title: "Registrar Nota Final",
        component: FinalizarNotas,
    },

    // =========================================
    // 🔹 CONSULTAR RÚBRICA
    // =========================================

    {
        path: "/evaluations/:evaluationId/rubrica",
        title: "Consultar Rúbrica",
        component: ConsultarRubrica,
    },

    // =========================================
    // 🔹 ESTUDIANTE - EVALUACIONES
    // =========================================

    {
        path: "/estudiante/evaluaciones",
        title: "Mis Evaluaciones",
        component: StudentEvaluations,
    },
    {
        path: "/estudiante/calificaciones",
        title: "Mis Calificaciones",
        component: StudentGrades,
    },
    {
        path: "/estudiante/calificaciones/:gradeId",
        title: "Detalle de Calificación",
        component: StudentGradeDetail,
    },

    // =========================================
    // 🔹 EVALUACIONES (CU-10)
    // =========================================

    {
        path: "/evaluations/list",
        title: "Seleccionar Evaluación",
        component: SelectEvaluation,
    },

    {
        path: "/evaluations/:evaluationId/assign-rubric",
        title: "Asignar Rúbrica",
        component: AssignRubricEvaluation,
    },

    // =========================================
    // 🔹 DEFINIR CRITERIOS Y ESCALAS (CU-09)
    // =========================================

    {
        path: "/rubrics/define-scales",
        title: "Seleccionar Rúbrica — CU-09",
        component: Step1_SelectRubric,
    },

    {
        path: "/rubrics/:rubricId/define-scales/criteria",
        title: "Seleccionar Criterio — CU-09",
        component: Step2_SelectCriterion,
    },

    {
        path: "/rubrics/:rubricId/define-scales/criteria/:criterionId/scales",
        title: "Definir Escalas — CU-09",
        component: Step3_DefineScales,
    },

        // =========================================
    // 🔹 CALIFICAR CON RÚBRICA (CU-11)
    // =========================================

    {
        path: "/evaluations/:evaluationId/calificar",
        title: "Seleccionar Estudiante",
        component: CU11_Step1_SelectStudent,
    },

    {
        path: "/evaluations/calificar",
        title: "Seleccionar Evaluación",
        component: CU11_Step1_SelectStudent,
    },

    {
        path: "/evaluations/:evaluationId/calificar/:enrollmentId/criterios",
        title: "Evaluar Criterios",
        component: CU11_Step2_EvaluateCriteria,
    },

    {
        path: "/evaluations/:evaluationId/calificar/:enrollmentId/revisar/:gradeId",
        title: "Revisar y Enviar Calificación",
        component: CU11_Step3_ReviewSend,
    },
];

const routes = [...coreRoutes];

export default routes;
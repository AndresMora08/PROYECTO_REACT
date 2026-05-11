import { lazy } from "react";

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
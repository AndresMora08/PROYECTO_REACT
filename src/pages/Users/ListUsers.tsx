import React, {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import Swal from "sweetalert2";

import GenericTable
from "../../components/GenericTable";

import SearchInput
from "../../components/GenericSearch";

import { User }
from "../../models/User";

import { userService }
from "../../service/userService";

const Users: React.FC = () => {

    const navigate = useNavigate();

    // =====================================================
    // 🔹 ESTADOS
    // =====================================================

    const [data, setData] =
        useState<User[]>([]);

    const [search, setSearch] =
        useState<string>("");

    const [loading, setLoading] =
        useState<boolean>(true);

    // =====================================================
    // 🔹 CARGA INICIAL
    // =====================================================

    useEffect(() => {

        fetchData();

    }, []);

    // =====================================================
    // 🔹 BUSCADOR REACTIVO
    // =====================================================

    

    // =====================================================
    // 🔹 OBTENER USUARIOS
    // =====================================================

    const fetchData = async () => {

        try {

            setLoading(true);

            const response =
                await userService.getUsers();

            // 🔹 Validar que sí sea arreglo
            const users =
                Array.isArray(response)
                    ? response
                    : [];

            console.log(
                "USUARIOS:",
                users
            );

            setData(users);

        } catch (error) {

            console.error(error);

            Swal.fire({
                icon: "error",
                title: "Error",
                text:
                    "No se pudieron obtener los usuarios"
            });

        } finally {

            setLoading(false);

        }

    };

    // =====================================================
    // 🔹 BUSCAR
    // =====================================================

   

    // =====================================================
    // 🔹 ACCIONES
    // =====================================================

    const handleAction = async (
        action: string,
        item: any
    ) => {

        // 🔹 Editar
        if (action === "edit") {

            navigate(
                `/users/update/${item.id}`
            );

        }

        // 🔹 Desactivar
        else if (
            action === "disable"
        ) {

            Swal.fire({

                title:
                    "¿Desea desactivar este usuario?",

                text:
                    "El usuario ya no podrá acceder al sistema.",

                icon: "warning",

                showCancelButton: true,

                confirmButtonColor:
                    "#3085d6",

                cancelButtonColor:
                    "#d33",

                confirmButtonText:
                    "Sí, desactivar",

                cancelButtonText:
                    "Cancelar",

            }).then(async (result) => {

                if (result.isConfirmed) {

                    try {

                        const success =
                            await userService.deactivateUser(
                                item.id
                            );

                        if (success) {

                            Swal.fire({

                                icon: "success",

                                title:
                                    "Usuario desactivado",

                                text:
                                    "El usuario fue desactivado correctamente"

                            });

                            fetchData();

                        }

                    } catch (error) {

                        console.error(error);

                        Swal.fire({

                            icon: "error",

                            title: "Error",

                            text:
                                "No se pudo desactivar el usuario"

                        });

                    }

                }

            });

        }

    };

    // =====================================================
    // 🔹 CREAR
    // =====================================================

    const handleCreate = () => {

        navigate("/users/create");

    };

    // =====================================================
    // 🔹 LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="p-4">

                <p>
                    Cargando usuarios...
                </p>

            </div>

        );

    }
const filtered = data.filter((item: any) => {
    const text = search.toLowerCase();
    if (!text) return true;
    return (
        item.first_name?.toLowerCase().includes(text) ||
        item.last_name?.toLowerCase().includes(text) ||
        item.code?.toLowerCase().includes(text) ||
        item.email?.toLowerCase().includes(text)
    );
});
    return (

        <div className="space-y-5">

            {/* HEADER */}
            <div className="flex items-center justify-between">

                <div>

                    <h2 className="text-2xl font-semibold text-black dark:text-white">

                        Lista de Usuarios

                    </h2>

                    <p className="text-sm text-gray-500">

                        Gestión y administración de usuarios

                    </p>

                </div>

                {/* 🔹 BOTÓN CREAR */}
                <button

                    type="button"

                    onClick={handleCreate}

                    className="
                        rounded-md
                        bg-blue-600
                        px-4 py-2
                        text-sm font-medium
                        text-white
                        transition
                        hover:bg-blue-700
                    "
                >

                    Crear Usuario

                </button>

            </div>

            {/* BUSCADOR */}
            <SearchInput

                label="Buscar usuario"
                placeholder="Buscar por nombre, código o email..."
                value={search}
                onChange={setSearch}

            />

            {/* TABLA */}
            <GenericTable

                data={filtered.map((item: any) => ({

                    id: item.id,

                    code:
                        item.code,

                    name:
                        `${item.first_name || ""} ${item.last_name || ""}`,

                    email:
                        item.email,

                    role:
                        item.role,

                    status:
                        item.is_active
                            ? "Activo"
                            : "Inactivo",

                    createdAt: item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "Sin fecha",

                }))}

                columns={[

                    "code",
                    "name",
                    "email",
                    "role",
                    "status",
                    "createdAt"

                ]}

                actions={[

                    {
                        name: "edit",
                        label: "Editar"
                    },

                    {
                        name: "disable",
                        label: "Desactivar"
                    }

                ]}

                onAction={handleAction}

                selectable={false}

            />

        </div>

    );

};

export default Users;
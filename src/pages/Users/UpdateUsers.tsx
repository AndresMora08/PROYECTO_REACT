import React, {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import Swal from "sweetalert2";

import GenericForm
from "../../components/GenericForm";

import { userService }
from "../../service/userService";

import { Teacher }
from "../../models/Docente";

import { Student }
from "../../models/Estudiante";

const UpdateUser: React.FC = () => {

    const navigate = useNavigate();

    const { id } = useParams();

    // =====================================================
    // 🔹 USER STATE
    // =====================================================

    const [user, setUser] =
        useState<
            Teacher |
            Student |
            null
        >(null);

    // =====================================================
    // 🔹 LOAD
    // =====================================================

    useEffect(() => {

        if (id) {

            fetchUser(Number(id));

        }

    }, [id]);

    // =====================================================
    // 🔹 GET USER
    // =====================================================

    const fetchUser = async (
        userId: number
    ) => {

        const response =
            await userService.getUserById(
                userId
            );

        if (response) {

            setUser(
                response as
                Teacher |
                Student
            );

        }

        else {

            Swal.fire({
                icon: "error",
                title: "Error",
                text:
                    "Usuario no encontrado"
            });

            navigate("/users/list");

        }

    };

    // =====================================================
    // 🔹 SUBMIT
    // =====================================================

    const handleSubmit = async (
        formData: Record<string, any>
    ) => {

        if (!id) return;

        try {

            const updatedUser =
                await userService.updateUser(
                    Number(id),
                    {

                        email:
                            formData.email,

                        code:
                            formData.code,

                        password:
                            formData.password,

                        firstName:
                            formData.firstName,

                        lastName:
                            formData.lastName,

                        identification:
                            formData.identification,

                        ...(user?.role === "TEACHER"
                            ? {
                                phone:
                                    formData.phone,

                                speciality:
                                    formData.speciality
                            }
                            : {})

                    }
                );

            if (updatedUser) {

                Swal.fire({
                    icon: "success",
                    title:
                        "Usuario actualizado",
                    text:
                        "Los datos fueron actualizados correctamente"
                });

                navigate("/users/list");

            }

            else {

                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text:
                        "No se pudo actualizar"
                });

            }

        } catch (error) {

            console.error(error);

            Swal.fire({
                icon: "error",
                title: "Error",
                text:
                    "No se pudo actualizar el usuario"
            });

        }

    };

    // =====================================================
    // 🔹 LOADING
    // =====================================================

    if (!user) {

        return (

            <div className="p-4">

                <p>
                    Cargando usuario...
                </p>

            </div>

        );

    }

    return (

        <div className="space-y-5">

            {/* HEADER */}
            <div>

                <h2 className="text-2xl font-semibold text-black dark:text-white">
                    Editar Usuario
                </h2>

                <p className="text-sm text-gray-500">
                    Actualiza la información del usuario
                </p>

            </div>

            {/* FORM */}
            <GenericForm

                initialValues={{

                    email:
                        user.email,

                    code:
                        user.code,

                    password:
                        user.password,

                    firstName:
                        user.firstName,

                    lastName:
                        user.lastName,

                    identification:
                        user.identification,

                    ...(user.role === "TEACHER"
                        ? {

                            phone:
                                (user as Teacher)
                                    .phone,

                            speciality:
                                (user as Teacher)
                                    .speciality

                        }
                        : {})

                }}

                fields={[

                    {
                        name: "email",
                        label: "Email",
                        type: "email"
                    },

                    {
                        name: "code",
                        label: "Código",
                        type: "text"
                    },

                    {
                        name: "password",
                        label: "Password",
                        type: "password"
                    },

                    {
                        name: "firstName",
                        label: "Nombre",
                        type: "text"
                    },

                    {
                        name: "lastName",
                        label: "Apellido",
                        type: "text"
                    },

                    {
                        name: "identification",
                        label: "Identificación",
                        type: "text"
                    },

                    ...(user.role === "TEACHER"

                        ? [

                            {
                                name: "phone",
                                label: "Teléfono",
                                type: "text"
                            },

                            {
                                name: "speciality",
                                label: "Especialidad",
                                type: "text"
                            }

                        ]

                        : [])

                ]}

                buttonLabel="Guardar cambios"

                onSubmit={handleSubmit}

            />

        </div>

    );

};

export default UpdateUser;
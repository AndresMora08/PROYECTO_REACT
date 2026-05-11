import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

import Swal from "sweetalert2";

import GenericForm from "../../components/GenericForm";

import { User } from "../../models/User";
import { Student } from "../../models/Estudiante";
import { Teacher } from "../../models/Docente";

import { userService } from "../../service/userService";

const CreateUser: React.FC = () => {

    const navigate = useNavigate();

    // =====================================================
    // 🔹 PASO ACTUAL
    // =====================================================

    const [step, setStep] = useState<number>(1);

    // =====================================================
    // 🔹 DATOS BASE USER
    // =====================================================

    const [baseUserData, setBaseUserData] =
        useState<Partial<User>>({});

    // =====================================================
    // 🔹 GUARDAR PRIMER FORM
    // =====================================================

    const handleBaseSubmit = (
        formData: Record<string, any>
    ) => {
        console.log("Base User Data:", formData);

        setBaseUserData({

            email: formData.email,

            password: formData.password,

            code: formData.code,

            role: formData.role,

            isActive: true

        });

        setStep(2);

    };

    // =====================================================
    // 🔹 CREAR ESTUDIANTE O DOCENTE
    // =====================================================

    const handleProfileSubmit = async (
        formData: Record<string, any>
    ) => {
        console.log("📋 PASO 2 - baseUserData:", baseUserData); // ← agrega esto
      console.log("📋 PASO 2 - formData:", formData);
        try {

            // =============================================
            // 🔹 STUDENT
            // =============================================

            if (
                baseUserData.role === "STUDENT"
            ) {

                const student: Student = {

                    id: 0,

                    email:
                        baseUserData.email || "",

                    password:
                        baseUserData.password || "",

                    role:
                        baseUserData.role || "",

                    isActive:
                        baseUserData.isActive || true,

                    code:
                        baseUserData.code || "",

                    firstName:
                        formData.firstName,

                    lastName:
                        formData.lastName,

                    identification:
                        Number(
                            formData.identification
                        ),

                    matriculas: [],

                    inscripciones: [],

                    calificaciones: []

                };

                const response =
                    await userService
                        .registerStudent(
                            student
                            
                        );

                console.log("Respuesta del servicio:", response); // ← agrega esto

                

                    Swal.fire({
                        icon: "success",
                        title:
                            "Estudiante creado",
                        text:
                            "El estudiante fue registrado correctamente"
                    });

                    navigate("/users/list");

                

            }

            // =============================================
            // 🔹 TEACHER
            // =============================================

            else if (
                baseUserData.role === "TEACHER"
            ) {

                const teacher: Teacher = {

                    id: 0,

                    email:
                        baseUserData.email || "",

                    password:
                        baseUserData.password || "",

                    role:
                        baseUserData.role || "",

                    isActive:
                        baseUserData.isActive || true,

                    code:
                        baseUserData.code || "",

                    firstName:
                        formData.firstName,

                    lastName:
                        formData.lastName,

                    phone:
                        formData.phone,

                    identification:
                        Number(
                            formData.identification
                        ),

                    speciality:
                        formData.speciality,

                    grupos: []

                };

                const response =
                    await userService
                        .registerTeacher(
                            teacher
                        );

                

                    Swal.fire({
                        icon: "success",
                        title:
                            "Docente creado",
                        text:
                            "El docente fue registrado correctamente"
                    });

                    navigate("/users/list");

                

            }

        } catch (error) {

            console.error(error);

            Swal.fire({
                icon: "error",
                title: "Error",
                text:
                    "No se pudo crear el usuario"
            });

        }

    };

    return (

        <div className="space-y-5">

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <div>

                <h2 className="text-2xl font-semibold text-black dark:text-white">

                    Crear Usuario

                </h2>

                <p className="text-sm text-gray-500">

                    Registro de estudiantes y docentes

                </p>

            </div>

            {/* ================================================= */}
            {/* PASO 1 */}
            {/* ================================================= */}

            {
                step === 1 && (

                    <GenericForm

                        fields={[

                            {
                                name: "email",
                                label: "Email",
                                type: "email"
                            },

                            {
                                name: "password",
                                label: "Contraseña",
                                type: "password"
                            },

                            {
                                name: "code",
                                label: "Código",
                                type: "text"
                            },

                            {
                                name: "role",
                                label: "Rol",
                                type: "select",
                                options: [
                                    "STUDENT",
                                    "TEACHER"
                                ]
                            }

                        ]}

                        buttonLabel="Continuar"

                        onSubmit={handleBaseSubmit}

                    />

                )
            }

            {/* ================================================= */}
            {/* PASO 2 STUDENT */}
            {/* ================================================= */}

            {
                step === 2 &&
                baseUserData.role === "STUDENT" && (

                    <GenericForm

                        fields={[

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
                            }

                        ]}

                        buttonLabel="Crear Estudiante"

                        onSubmit={
                            handleProfileSubmit
                        }

                    />

                )
            }

            {/* ================================================= */}
            {/* PASO 2 TEACHER */}
            {/* ================================================= */}

            {
                step === 2 &&
                baseUserData.role === "TEACHER" && (

                    <GenericForm

                        fields={[

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
                                name: "phone",
                                label: "Teléfono",
                                type: "text"
                            },

                            {
                                name: "identification",
                                label: "Identificación",
                                type: "text"
                            },

                            {
                                name: "speciality",
                                label: "Especialidad",
                                type: "text"
                            }

                        ]}

                        buttonLabel="Crear Docente"

                        onSubmit={
                            handleProfileSubmit
                        }

                    />

                )
            }

        </div>

    );

};

export default CreateUser;
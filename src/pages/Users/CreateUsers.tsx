import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericForm from "../../components/GenericForm";
import {
    userService,
    RegisterStudentDTO,
    RegisterTeacherDTO
} from "../../service/userService";

import SecurityService from "../../service/securityService";

const CreateUser: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<number>(1);
    const [baseUserData, setBaseUserData] = useState<Record<string, any>>({});
    const [isEvaluatingBase, setIsEvaluatingBase] = useState(false);

    const handleBackToBase = () => {
        setStep(1);
    };

    const validateBaseStep = (formData: Record<string, any>) => {
        const email = String(formData.email ?? "").trim();
        const password = String(formData.password ?? "").trim();
        const code = String(formData.code ?? "").trim();
        const role = String(formData.role ?? "").trim();

        if (!email || !password || !code || !role) {
            Swal.fire({
                icon: "warning",
                title: "Completa la zona 1",
                text: "Antes de pasar a la segunda zona debes completar correo, contraseña, código y rol.",
                customClass: { popup: 'rounded-3xl shadow-2xl border-none' }
            });
            return null;
        }

        return { email, password, code, role };
    };

    const handleBaseSubmit = async (formData: Record<string, any>) => {
        const validatedBaseData = validateBaseStep(formData);

        if (!validatedBaseData) {
            return;
        }

        setIsEvaluatingBase(true);

        try {
            const users = await userService.getUsers();
            const normalizedEmail = validatedBaseData.email.toLowerCase();
            const normalizedCode = validatedBaseData.code.toLowerCase();

            const duplicateUser = users.find((user) => {
                const userEmail = String(user.email ?? "").toLowerCase();
                const userCode = String(user.code ?? "").toLowerCase();

                return userEmail === normalizedEmail || userCode === normalizedCode;
            });

            if (duplicateUser) {
                Swal.fire({
                    icon: "warning",
                    title: "Datos ya registrados",
                    text: "El correo o el código ya existen. Corrige la zona 1 antes de pasar a la segunda.",
                    customClass: { popup: 'rounded-3xl shadow-2xl border-none' }
                });
                return;
            }

            setBaseUserData({
                email: validatedBaseData.email,
                password: validatedBaseData.password,
                code: validatedBaseData.code,
                role: validatedBaseData.role
            });
            setStep(2);
        } finally {
            setIsEvaluatingBase(false);
        }
    };

    const handleProfileSubmit = async (formData: Record<string, any>) => {
        try {

            // =========================
            // ADMIN (NUEVO)
            // =========================
            if (baseUserData.role === "ADMIN") {
                await SecurityService.registerAdmin({
                    email: baseUserData.email,
                    password: baseUserData.password,
                    code: baseUserData.code,
                    
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    identification: String(formData.identification)
                });
            }

            // =========================
            // STUDENT
            // =========================
            else if (baseUserData.role === "STUDENT") {
                const studentPayload: RegisterStudentDTO = {
                    email: baseUserData.email,
                    password: baseUserData.password,
                    code: baseUserData.code,
                    role: baseUserData.role,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    identification: String(formData.identification)
                };

                await userService.registerStudent(studentPayload);
            }

            // =========================
            // TEACHER (EXISTENTE)
            // =========================
            else {
                const teacherPayload: RegisterTeacherDTO = {
                    email: baseUserData.email,
                    password: baseUserData.password,
                    code: baseUserData.code,
                    role: baseUserData.role,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    identification: String(formData.identification),
                    phone: formData.phone || null,
                    specialty: formData.specialty || null
                };

                await userService.registerTeacher(teacherPayload);
            }

            Swal.fire({
                icon: "success",
                title: "¡Usuario creado!",
                text: "El perfil ha sido registrado exitosamente.",
                customClass: { popup: 'rounded-3xl shadow-2xl border-none' }
            });

            navigate("/users/list");

        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error de Registro",
                text: "Verifica los datos o que el código/email no estén duplicados en el sistema.",
                customClass: { popup: 'rounded-3xl shadow-2xl border-none' }
            });
        }
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

            <style>{`
                @keyframes slideInUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .stagger-1 { animation: slideInUp 0.5s ease-out forwards; }
                .stagger-2 { animation: slideInUp 0.5s ease-out 0.1s forwards; opacity: 0; }
                .stagger-3 { animation: slideInUp 0.5s ease-out 0.2s forwards; opacity: 0; }
            `}</style>

            {/* HEADER */}
            <div className="stagger-1 border-b border-slate-200 pb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Alta de <span className="text-blue-700">Nuevo Usuario</span>
                    </h2>
                    <p className="mt-2 text-slate-500">
                        Asistente de registro en 2 pasos para cuentas institucionales.
                    </p>
                </div>
                <button
                    onClick={() => navigate("/users/list")}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg"
                >
                    Cancelar
                </button>
            </div>

            {/* WIZARD INDICATOR */}
            <div className="stagger-2 flex items-center justify-center mb-8">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold shadow-sm transition-colors ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                    <div className={`h-1 w-16 rounded transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold shadow-sm transition-colors ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                </div>
            </div>

            {/* FORMULARIO */}
            <div className="stagger-3 rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">

                {step === 1 && (
                    <GenericForm
                        fields={[
                            { name: "email", label: "Correo Electrónico Institucional", type: "email" },
                            { name: "password", label: "Contraseña Segura", type: "password" },
                            { name: "code", label: "Código Único (Ej. TCH-001)", type: "text" },

                            // 🔥 AQUÍ SE AGREGA ADMIN
                            {
                                name: "role",
                                label: "Rol en el Sistema",
                                type: "select",
                                options: ["ADMIN", "STUDENT", "TEACHER"]
                            }
                        ]}
                        buttonLabel={isEvaluatingBase ? "Evaluando..." : "Evaluar y continuar ➔"}
                        onSubmit={handleBaseSubmit}
                    />
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <GenericForm
                            fields={[
                                { name: "first_name", label: "Nombre(s)", type: "text" },
                                { name: "last_name", label: "Apellido(s)", type: "text" },
                                { name: "identification", label: "Identificación (DNI/Cédula)", type: "text" },

                                ...(baseUserData.role === "TEACHER"
                                    ? [
                                        { name: "phone", label: "Número de Contacto", type: "text" },
                                        { name: "specialty", label: "Especialidad Académica", type: "text" }
                                    ]
                                    : [])
                            ]}
                            buttonLabel={
                                baseUserData.role === "STUDENT"
                                    ? "Finalizar y Registrar Estudiante"
                                    : baseUserData.role === "ADMIN"
                                        ? "Finalizar y Registrar Administrador"
                                        : "Finalizar y Registrar Docente"
                            }
                            onSubmit={handleProfileSubmit}
                        />

                        <div className="flex justify-start">
                            <button
                                type="button"
                                onClick={handleBackToBase}
                                className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                ← Volver a la zona 1
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CreateUser;
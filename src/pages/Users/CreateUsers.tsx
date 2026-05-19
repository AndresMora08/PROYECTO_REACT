import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericForm from "../../components/GenericForm";
import { userService, RegisterStudentDTO, RegisterTeacherDTO } from "../../service/userService";

const CreateUser: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<number>(1);
    const [baseUserData, setBaseUserData] = useState<Record<string, any>>({});

    const handleBaseSubmit = (formData: Record<string, any>) => {
        setBaseUserData({
            email: formData.email,
            password: formData.password,
            code: formData.code,
            role: formData.role
        });
        setStep(2);
    };

    const handleProfileSubmit = async (formData: Record<string, any>) => {
        try {
            if (baseUserData.role === "STUDENT") {
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
            } else {
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
            <div className="stagger-3 rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="mb-6 pb-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">Paso 1: Credenciales de Acceso</h3>
                            <p className="text-sm text-slate-500">Defina el rol y los datos para iniciar sesión.</p>
                        </div>
                        <GenericForm
                            fields={[
                                { name: "email", label: "Correo Electrónico Institucional", type: "email" },
                                { name: "password", label: "Contraseña Segura", type: "password" },
                                { name: "code", label: "Código Único (Ej. TCH-001)", type: "text" },
                                { name: "role", label: "Rol en el Sistema", type: "select", options: ["STUDENT", "TEACHER"] }
                            ]}
                            buttonLabel="Continuar al Perfil ➔"
                            onSubmit={handleBaseSubmit}
                        />
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                         <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Paso 2: Datos Personales</h3>
                                <p className="text-sm text-slate-500">
                                    Completando perfil para cuenta <strong className="text-blue-600">{baseUserData.role}</strong>
                                </p>
                            </div>
                            <button 
                                onClick={() => setStep(1)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg"
                            >
                                ← Volver al Paso 1
                            </button>
                        </div>
                        <GenericForm
                            fields={[
                                { name: "first_name", label: "Nombre(s)", type: "text" },
                                { name: "last_name", label: "Apellido(s)", type: "text" },
                                { name: "identification", label: "Identificación (DNI/Cédula)", type: "text" },
                                ...(baseUserData.role === "TEACHER" ? [
                                    { name: "phone", label: "Número de Contacto", type: "text" },
                                    { name: "specialty", label: "Especialidad Académica", type: "text" }
                                ] : [])
                            ]}
                            buttonLabel={baseUserData.role === "STUDENT" ? "Finalizar y Registrar Estudiante" : "Finalizar y Registrar Docente"}
                            onSubmit={handleProfileSubmit}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateUser;
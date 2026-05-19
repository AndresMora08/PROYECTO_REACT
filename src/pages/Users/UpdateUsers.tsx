import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import GenericForm from "../../components/GenericForm";
import { userService } from "../../service/userService";

const UpdateUser: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // 💡 Parámetro UUID (string)
    const [user, setUser] = useState<any | null>(null);

    useEffect(() => {
        if (id) {
            fetchUserCompleteData(id);
        }
    }, [id]);

    const fetchUserCompleteData = async (userId: string) => {
        const baseUser = await userService.getUserById(userId);
        if (baseUser) {
            let fullProfileData: any = { ...baseUser };

            // 🔹 Caso 1: Si es profesor, buscamos el registro en la lista de docentes
            if (baseUser.code?.startsWith("TCH") || baseUser.role === "TEACHER") {
                const teachers = await userService.getTeachers();
                const currentTeacher = teachers.find(t => t.user_id === baseUser.id);
                
                if (currentTeacher) {
                    fullProfileData = {
                        ...fullProfileData,
                        first_name: currentTeacher.first_name,
                        last_name: currentTeacher.last_name,
                        identification: currentTeacher.identification,
                        phone: currentTeacher.phone,
                        specialty: currentTeacher.specialty
                    };
                }
            }
            // 🔹 Caso 2: Si es estudiante, buscamos el registro en la lista de estudiantes
            else if (baseUser.code?.startsWith("STU") || baseUser.role === "STUDENT") {
                const students = await userService.getStudents();
                const currentStudent = students.find(s => s.user_id === baseUser.id);

                if (currentStudent) {
                    fullProfileData = {
                        ...fullProfileData,
                        first_name: currentStudent.first_name,
                        last_name: currentStudent.last_name,
                        identification: currentStudent.identification
                    };
                }
            }

            setUser(fullProfileData);
        } else {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Usuario no encontrado",
                customClass: { popup: 'rounded-3xl shadow-2xl border-none' }
            });
            navigate("/users/list");
        }
    };

    const handleSubmit = async (formData: Record<string, any>) => {
        if (!id) return;
        try {
            // Mapeo unificado para el payload de actualización del usuario
            const payload = {
                email: formData.email,
                code: formData.code,
                first_name: formData.first_name,
                last_name: formData.last_name,
                identification: String(formData.identification), // Guardamos como string
                ...(user?.role === "TEACHER" ? {
                    phone: formData.phone ?? null,
                    specialty: formData.specialty ?? null 
                } : {})
            };

            const updated = await userService.updateUser(id, payload);
            if (updated) {
                Swal.fire({ 
                    icon: "success", 
                    title: "¡Actualizado!", 
                    text: "Perfil modificado correctamente.",
                    customClass: { popup: 'rounded-3xl shadow-2xl border-none' }
                });
                navigate("/users/list");
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo actualizar la información.",
                customClass: { popup: 'rounded-3xl shadow-2xl border-none' }
            });
        }
    };

    if (!user) return (
        <div className="flex min-h-[500px] items-center justify-center bg-slate-50/50 backdrop-blur-sm rounded-3xl">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg"></div>
        </div>
    );

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <style>{`
                @keyframes slideInUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .stagger-1 { animation: slideInUp 0.5s ease-out forwards; }
                .stagger-2 { animation: slideInUp 0.5s ease-out 0.1s forwards; opacity: 0; }
            `}</style>

            <div className="stagger-1 border-b border-slate-200 pb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Editar <span className="text-blue-700">Perfil de Usuario</span>
                    </h2>
                    <p className="mt-2 text-slate-500">
                        Modifique los datos de acceso y perfil de <strong>{user.code}</strong>.
                    </p>
                </div>
                <button 
                    onClick={() => navigate("/users/list")}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg"
                >
                    Volver a la lista
                </button>
            </div>

            <div className="stagger-2 rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
                <GenericForm
                    initialValues={{
                        email: user.email,
                        code: user.code,
                        first_name: user.first_name || "", 
                        last_name: user.last_name || "",
                        identification: user.identification || "",
                        ...(user.role === "TEACHER" ? {
                            phone: user.phone || "",
                            specialty: user.specialty || "" 
                        } : {})
                    }}
                    fields={[
                        { name: "email", label: "Correo Electrónico", type: "email" },
                        { name: "code", label: "Código Único", type: "text" },
                        { name: "first_name", label: "Nombre(s)", type: "text" },
                        { name: "last_name", label: "Apellido(s)", type: "text" },
                        { name: "identification", label: "Identificación (DNI/Cédula)", type: "text" },
                        ...(user.role === "TEACHER" ? [
                            { name: "phone", label: "Número de Contacto", type: "text" },
                            { name: "specialty", label: "Especialidad Académica", type: "text" } 
                        ] : [])
                    ]}
                    buttonLabel="Guardar Cambios"
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
};

export default UpdateUser;
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
            Swal.fire("Error", "Usuario no encontrado", "error");
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
                Swal.fire({ icon: "success", title: "Actualizado correctamente" });
                navigate("/users/list");
            }
        } catch (error) {
            Swal.fire("Error", "No se pudo actualizar", "error");
        }
    };

    if (!user) return <div className="p-4">Cargando...</div>;

    return (
        <div className="space-y-5">
            <h2 className="text-2xl font-semibold">Editar Usuario</h2>
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
                    { name: "email", label: "Email", type: "email" },
                    { name: "code", label: "Código", type: "text" },
                    { name: "first_name", label: "Nombre", type: "text" },
                    { name: "last_name", label: "Apellido", type: "text" },
                    { name: "identification", label: "Identificación", type: "text" },
                    // 🔹 Solo añade los campos de Teléfono y Especialidad si el usuario cargado es un Docente
                    ...(user.role === "TEACHER" ? [
                        { name: "phone", label: "Teléfono", type: "text" },
                        { name: "specialty", label: "Especialidad", type: "text" } 
                    ] : [])
                ]}
                buttonLabel="Actualizar Usuario"
                onSubmit={handleSubmit}
            />
        </div>
    );
};

export default UpdateUser;
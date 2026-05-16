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
                    identification: String(formData.identification) // 💡 Conservamos como string
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
                    specialty: formData.specialty || null // 💡 CORRECCIÓN: 'specialty' sin la 'i'
                };
                await userService.registerTeacher(teacherPayload);
            }

            Swal.fire({ icon: "success", title: "Usuario creado con éxito" });
            navigate("/users/list");
        } catch (error) {
            Swal.fire({ icon: "error", title: "Error al crear", text: "Verifica los datos o que el código/email no estén duplicados." });
        }
    };

    return (
        <div className="space-y-5">
            <h2 className="text-2xl font-semibold">Crear Usuario</h2>
            
            {step === 1 && (
                <GenericForm
                    fields={[
                        { name: "email", label: "Email", type: "email" },
                        { name: "password", label: "Contraseña", type: "password" },
                        { name: "code", label: "Código", type: "text" },
                        { name: "role", label: "Rol", type: "select", options: ["STUDENT", "TEACHER"] }
                    ]}
                    buttonLabel="Continuar"
                    onSubmit={handleBaseSubmit}
                />
            )}

            {step === 2 && (
                <GenericForm
                    fields={[
                        { name: "first_name", label: "Nombre", type: "text" },
                        { name: "last_name", label: "Apellido", type: "text" },
                        { name: "identification", label: "Identificación", type: "text" },
                        ...(baseUserData.role === "TEACHER" ? [
                            { name: "phone", label: "Teléfono", type: "text" },
                            { name: "specialty", label: "Especialidad", type: "text" } // 💡 CORRECCIÓN: 'specialty'
                        ] : [])
                    ]}
                    buttonLabel={baseUserData.role === "STUDENT" ? "Registrar Estudiante" : "Registrar Docente"}
                    onSubmit={handleProfileSubmit}
                />
            )}
        </div>
    );
};

export default CreateUser;
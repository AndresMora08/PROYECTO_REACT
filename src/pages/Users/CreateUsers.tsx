import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericForm from "../../components/GenericForm";
import { User } from "../../models/User";
import { userService } from "../../service/userService";

const CreateUser: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<number>(1);
    const [baseUserData, setBaseUserData] = useState<Partial<User>>({});

    const handleBaseSubmit = (formData: Record<string, any>) => {
        setBaseUserData({
            email: formData.email,
            password: formData.password,
            code: formData.code,
            role: formData.role,
            is_active: true
        });
        setStep(2);
    };

    const handleProfileSubmit = async (formData: Record<string, any>) => {
        try {
            // CORRECCIÓN: Unificamos los datos base con los del perfil
            const fullData = {
                ...baseUserData,
                first_name: formData.first_name, // CORRECCIÓN: snake_case
                last_name: formData.last_name,
                identification: Number(formData.identification)
            };

            if (baseUserData.role === "STUDENT") {
                await userService.registerStudent(fullData as any);
            } else {
                await userService.registerTeacher({
                    ...fullData,
                    phone: formData.phone,
                    speciality: formData.speciality
                } as any);
            }

            Swal.fire({ icon: "success", title: "Usuario creado" });
            navigate("/users/list");
        } catch (error) {
            Swal.fire({ icon: "error", title: "Error al crear" });
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
                        // CORRECCIÓN: Nombres de campos idénticos al modelo User
                        { name: "first_name", label: "Nombre", type: "text" },
                        { name: "last_name", label: "Apellido", type: "text" },
                        { name: "identification", label: "Identificación", type: "text" },
                        ...(baseUserData.role === "TEACHER" ? [
                            { name: "phone", label: "Teléfono", type: "text" },
                            { name: "speciality", label: "Especialidad", type: "text" }
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
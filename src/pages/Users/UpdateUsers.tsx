import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import GenericForm from "../../components/GenericForm";
import { userService } from "../../service/userService";
import { User } from "../../models/User";

const UpdateUser: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (id) fetchUser(Number(id));
    }, [id]);

    const fetchUser = async (userId: number) => {
        const response = await userService.getUserById(userId);
        if (response) setUser(response);
        else {
            Swal.fire("Error", "Usuario no encontrado", "error");
            navigate("/users/list");
        }
    };

    const handleSubmit = async (formData: Record<string, any>) => {
        if (!id) return;
        try {
            // CORRECCIÓN: Mapeo de campos antes de enviar al servicio
            const payload = {
                email: formData.email,
                code: formData.code,
                first_name: formData.first_name,
                last_name: formData.last_name,
                identification: Number(formData.identification),
                ...(user?.role === "TEACHER" ? {
                    phone: formData.phone,
                    specialty: formData.speciality
                } : {})
            };

            const updated = await userService.updateUser(Number(id), payload as any);
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
                    first_name: user.first_name, // CORRECCIÓN: Acceso directo por modelo unificado
                    last_name: user.last_name,
                    identification: user.identification,
                    ...(user.role === "TEACHER" ? {
                        phone: (user as any).phone,
                        speciality: (user as any).specialty
                    } : {})
                }}
                fields={[
                    { name: "email", label: "Email", type: "email" },
                    { name: "code", label: "Código", type: "text" },
                    { name: "first_name", label: "Nombre", type: "text" },
                    { name: "last_name", label: "Apellido", type: "text" },
                    { name: "identification", label: "Identificación", type: "text" },
                    ...(user.role === "TEACHER" ? [
                        { name: "phone", label: "Teléfono", type: "text" },
                        { name: "speciality", label: "Especialidad", type: "text" }
                    ] : [])
                ]}
                buttonLabel="Actualizar Usuario"
                onSubmit={handleSubmit}
            />
        </div>
    );
};

export default UpdateUser;
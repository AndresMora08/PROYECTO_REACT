import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericTable from "../../components/GenericTable";
import SearchInput from "../../components/GenericSearch";
import { User } from "../../models/User";
import { userService } from "../../service/userService";

// Interfaz para la vista que contiene la combinación de la cuenta con su perfil
interface DisplayUser extends User {
    fullName: string;
}

const Users: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<DisplayUser[]>([]);
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // 🔹 MODIFICACIÓN: Consumimos de forma paralela los tres endpoints necesarios
            const [responseUsers, responseTeachers, responseStudents] = await Promise.all([
                userService.getUsers(),
                userService.getTeachers(),
                userService.getStudents()
            ]);

            console.log("Usuarios crudos:", responseUsers);
            console.log("Docentes crudos:", responseTeachers);
            console.log("Estudiantes crudos:", responseStudents);

            const mergedUsers: DisplayUser[] = responseUsers.map((user) => {
                // Guardián de Tipo: Si el usuario carece de ID, evitamos comparar campos indefinidos
                if (!user.id) {
                    return {
                        ...user,
                        fullName: "Usuario sin ID"
                    };
                }

                // 🔹 Caso 1: El usuario es un Docente (Código empieza por TCH o rol TEACHER)
                if (user.code?.startsWith("TCH") || user.role === "TEACHER") {
                    const teacherProfile = responseTeachers.find(t => t.user_id === user.id);
                    return {
                        ...user,
                        fullName: teacherProfile 
                            ? `${teacherProfile.first_name} ${teacherProfile.last_name}` 
                            : "Docente sin Perfil"
                    };
                }
                
                // 🔹 Caso 2: El usuario es un Estudiante (Código empieza por STU o rol STUDENT)
                if (user.code?.startsWith("STU") || user.role === "STUDENT") {
                    const studentProfile = responseStudents.find(s => s.user_id === user.id);
                    return {
                        ...user,
                        fullName: studentProfile 
                            ? `${studentProfile.first_name} ${studentProfile.last_name}` 
                            : "Estudiante sin Perfil"
                    };
                }
                
                // Caso por defecto: Administradores u otras cuentas de sistema
                return {
                    ...user,
                    fullName: user.role === "ADMIN" ? "Administrador" : "Sistema / Soporte"
                };
            });

            setData(mergedUsers);
        } catch (error) {
            Swal.fire({ icon: "error", title: "Error", text: "Error al cargar datos" });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: string, item: any) => {
        if (action === "edit") navigate(`/users/update/${item.id}`);
        else if (action === "disable") {
            if (!item.id) {
                Swal.fire("Error", "El usuario no posee un ID válido", "error");
                return;
            }

            const result = await Swal.fire({
                title: "¿Desactivar usuario?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, desactivar"
            });
            if (result.isConfirmed) {
                const success = await userService.deactivateUser(item.id); 
                if (success) {
                    Swal.fire("Desactivado", "", "success");
                    fetchData();
                }
            }
        }
    };

    const filtered = data.filter((item) => {
        const text = search.toLowerCase();
        if (!text) return true;
        return (
            item.fullName.toLowerCase().includes(text) ||
            item.code?.toLowerCase().includes(text) ||
            item.email?.toLowerCase().includes(text) ||
            item.role?.toLowerCase().includes(text)
        );
    });

    if (loading) return <div className="p-4">Cargando usuarios...</div>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Lista de Usuarios</h2>
                <button onClick={() => navigate("/users/create")} className="bg-blue-600 text-white px-4 py-2 rounded-md">
                    Crear Usuario
                </button>
            </div>
            <SearchInput label="Buscar usuario" placeholder="Nombre, código o email..." value={search} onChange={setSearch} />
            
            <GenericTable
                data={filtered.map((item) => ({
                    id: item.id,
                    code: item.code,
                    name: item.fullName,
                    email: item.email,
                    role: item.role ?? "N/A",
                    status: item.is_active ? "Activo" : "Inactivo",
                    createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"
                }))}
                columns={["code", "name", "email", "role", "status", "createdAt"]}
                actions={[
                    { name: "edit", label: "Editar" },
                    { name: "disable", label: "Desactivar" }
                ]}
                onAction={handleAction}
            />
        </div>
    );
};

export default Users;
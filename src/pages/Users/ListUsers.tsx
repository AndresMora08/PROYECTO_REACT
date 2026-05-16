import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericTable from "../../components/GenericTable";
import SearchInput from "../../components/GenericSearch";
import { User } from "../../models/User";
import { userService } from "../../service/userService";

const Users: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<User[]>([]);
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await userService.getUsers();
            setData(Array.isArray(response) ? response : []);
        } catch (error) {
            Swal.fire({ icon: "error", title: "Error", text: "Error al cargar datos" });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: string, item: any) => {
        if (action === "edit") navigate(`/users/update/${item.id}`);
        else if (action === "disable") {
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

    // CORRECCIÓN: Filtro actualizado para incluir identificación y usar campos de User
    const filtered = data.filter((item) => {
        const text = search.toLowerCase();
        if (!text) return true;
        return (
            item.first_name?.toLowerCase().includes(text) ||
            item.last_name?.toLowerCase().includes(text) ||
            item.code?.toLowerCase().includes(text) ||
            item.email?.toLowerCase().includes(text)
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
                    // CORRECCIÓN: Unión de nombres simplificada
                    name: `${item.first_name || ""} ${item.last_name || ""}`,
                    email: item.email,
                    role: item.role,
                    // CORRECCIÓN: Acceso a is_active
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
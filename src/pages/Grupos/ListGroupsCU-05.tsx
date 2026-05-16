import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericTable from "../../components/GenericTable";
import SearchInput from "../../components/GenericSearch";
import { Group } from "../../models/Grupo"; 
import { groupService } from "../../service/groupService";

const ListGroups: React.FC = () => {
    const navigate = useNavigate();

    const [data, setData] = useState<Group[]>([]);
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await groupService.getGroups();
            setData(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: "error", title: "Error", text: "No se pudieron obtener los grupos" });
        } finally {
            setLoading(false);
        }
    };

    const filtered = data.filter((item) => {
        const text = search.toLowerCase();
        return (
            !text ||
            item.name?.toLowerCase().includes(text) ||
            item.group_code?.toLowerCase().includes(text) ||
            item.Asignatura?.name?.toLowerCase().includes(text)
        );
    });

    const showDetails = (group: Group) => {
        Swal.fire({
            title: `<strong>Detalles del Grupo: ${group.name}</strong>`,
            icon: "info",
            html: `
                <div style="text-align: left; font-size: 0.9rem;">
                    <p><strong>Código:</strong> ${group.group_code}</p>
                    <p><strong>Asignatura:</strong> ${group.Asignatura?.name || "N/A"}</p>
                    <p><strong>Docente:</strong> ${group.Docente?.first_name || ""} ${group.Docente?.last_name || "No asignado"}</p>
                    <p><strong>Capacidad:</strong> ${group.capacity} estudiantes</p>
                    <p><strong>Semestre:</strong> ${group.semestre?.name || "N/A"}</p>
                </div>
            `,
            confirmButtonText: "Cerrar",
            confirmButtonColor: "#3b82f6"
        });
    };

    const handleAction = (action: string, item: any) => {
        // Buscamos el objeto original usando el ID que pasamos en el map de abajo
        const fullItem = data.find(g => g.id === item.id);
        
        if (action === "select") {
            navigate(`/groups/manage/${item.id}`);
        } 
        else if (action === "details" && fullItem) {
            showDetails(fullItem);
        }
    };

    if (loading) return <div className="p-4"><p>Cargando grupos...</p></div>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-black dark:text-white">Grupos Académicos</h2>
                    <p className="text-sm text-gray-500">Gestión y visualización de grupos programados</p>
                </div>
                <button
                    onClick={() => navigate("/groups/create")}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    + Nuevo Grupo
                </button>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                    <SearchInput
                        label="Buscar grupo"
                        placeholder="Buscar por nombre, código o asignatura..."
                        value={search}
                        onChange={setSearch}
                    />
                </div>
            </div>

            <GenericTable
                // 1. RENOMBRAMOS LAS LLAVES AQUÍ
                data={filtered.map((item) => ({
                    id: item.id, // Se pasa pero no se pone en 'columns', así no se ve pero existe para las acciones
                    "Código": item.group_code,
                    "Nombre Grupo": item.name,
                    "Asignatura": item.Asignatura?.name || "—",
                    "Cod. Asignatura": item.Asignatura?.code || "—",
                    "Carrera/Programa": "Programa Académico",
                    "Cupos": item.capacity,
                    "Docente Actual": item.Docente ? `${item.Docente.first_name} ${item.Docente.last_name}` : "Sin docente",
                }))}
                // 2. LAS COLUMNAS AHORA SON LOS NOMBRES EN ESPAÑOL
                columns={[
                    "Código", 
                    "Nombre Grupo", 
                    "Asignatura", 
                    "Cod. Asignatura", 
                    "Carrera/Programa", 
                    "Cupos", 
                    "Docente Actual"
                ]}
                actions={[
                    { name: "select", label: "Seleccionar" },
                    { name: "details", label: "Ver detalles" },
                ]}
                onAction={handleAction}
                selectable={false}
            />
        </div>
    );
};

export default ListGroups;
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericTable from "../../components/GenericTable";
import SearchInput from "../../components/GenericSearch";
import { Subject } from "../../models/Asignatura";
import { subjectService } from "../../service/subjectService";

const ListSubjects: React.FC = () => {

    const navigate = useNavigate();

    const [data, setData] = useState<Subject[]>([]);
    const [search, setSearch] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("todas");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchData();
    }, []);

    // =====================================================
    // 🔹 OBTENER ASIGNATURAS
    // =====================================================
    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await subjectService.getSubjects();
            setData(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: "error", title: "Error", text: "No se pudieron obtener las asignaturas" });
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // 🔹 FILTRO LOCAL
    // =====================================================
    const filtered = data.filter((item) => {
        const text = search.toLowerCase();
        const matchSearch =
            !text ||
            item.name?.toLowerCase().includes(text) ||
            item.code?.toLowerCase().includes(text);

        const matchStatus =
            statusFilter === "todas" ||
            (statusFilter === "activa" && item.is_active) ||
            (statusFilter === "archivada" && !item.is_active);

        return matchSearch && matchStatus;
    });

    // =====================================================
    // 🔹 ACCIONES
    // =====================================================
    const handleAction = async (action: string, item: any) => {

        if (action === "edit") {
            navigate(`/subjects/update/${item.id}`);
        }

        else if (action === "archive") {
            Swal.fire({
                title: "¿Archivar esta asignatura?",
                text: "La asignatura no podrá usarse en nuevos planes ni grupos.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Sí, archivar",
                cancelButtonText: "Cancelar",
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await subjectService.archiveSubject(item.id);
                        Swal.fire({ icon: "success", title: "Archivada", text: "La asignatura fue archivada correctamente" });
                        fetchData();
                    } catch (error) {
                        Swal.fire({ icon: "error", title: "Error", text: "No se pudo archivar la asignatura" });
                    }
                }
            });
        }
    };

    if (loading) return <div className="p-4"><p>Cargando asignaturas...</p></div>;

    return (
        <div className="space-y-5">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-black dark:text-white">
                        Asignaturas
                    </h2>
                    <p className="text-sm text-gray-500">
                        Catálogo de asignaturas disponibles en el sistema
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/subjects/create")}
                    className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800"
                >
                    + Nueva asignatura
                </button>
            </div>

            {/* FILTROS */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                    <SearchInput
                        label="Buscar asignatura"
                        placeholder="Buscar por nombre o código..."
                        value={search}
                        onChange={setSearch}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-black dark:text-white">Estado</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-md border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
                    >
                        <option value="todas">Todas</option>
                        <option value="activa">Activa</option>
                        <option value="archivada">Archivada</option>
                    </select>
                </div>
                <button
                    type="button"
                    onClick={() => { setSearch(""); setStatusFilter("todas"); }}
                    className="rounded-md border border-stroke px-4 py-3 text-sm text-gray-500 transition hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4"
                >
                    Limpiar filtros
                </button>
            </div>

            {/* TABLA */}
            <GenericTable
                data={filtered.map((item) => ({
                    id: item.id,
                    code: item.code,
                    name: item.name,
                    description: item.description || "—",
                    credits: item.credits,
                    status: item.is_active ? "Activa" : "Archivada",
                    updatedAt: item.updated_at
                        ? new Date(item.updated_at).toLocaleString()
                        : "Sin fecha",
                }))}
                columns={["code", "name", "description", "credits", "status", "updatedAt"]}
                actions={[
                    { name: "edit", label: "Editar" },
                    { name: "archive", label: "Archivar" },
                ]}
                onAction={handleAction}
                selectable={false}
            />

        </div>
    );
};

export default ListSubjects;
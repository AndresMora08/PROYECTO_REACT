import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericTable from "../../components/GenericTable";
import SearchInput from "../../components/GenericSearch";
import { User } from "../../models/User";
import { userService } from "../../service/userService";
import { groupService } from "../../service/groupService";

const AssignTeacher: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();

    const [teachers, setTeachers] = useState<User[]>([]);
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchTeachers();
    }, []);

    // =====================================================
    // 🔹 OBTENER Y FILTRAR DOCENTES
    // =====================================================
    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const allUsers = await userService.getUsers();
            
            // Filtramos por rol (asumiendo que el campo es 'role' y el valor es 'teacher' o 'docente')
            const filteredTeachers = allUsers.filter(user => 
                user.role?.toLowerCase() === "teacher" || 
                user.role?.toLowerCase() === "docente"
            );
            
            setTeachers(filteredTeachers);
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los docentes" });
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // 🔹 FILTRO DE BÚSQUEDA
    // =====================================================
    const filtered = teachers.filter((t) => {
        const text = search.toLowerCase();
        return (
            !text ||
            t.first_name?.toLowerCase().includes(text) ||
            t.last_name?.toLowerCase().includes(text) ||
            t.identification?.includes(text) ||
            (t as any).specialty?.toLowerCase().includes(text) // specialty viene en el objeto teacher
        );
    });

    // =====================================================
    // 🔹 ACCIONES
    // =====================================================
    const handleAction = async (action: string, item: any) => {
        if (action === "select") {
            confirmAssignment(item);
        } else if (action === "details") {
            showTeacherDetails(item);
        }
    };

    const confirmAssignment = (teacher: any) => {
        Swal.fire({
            title: "¿Asignar este docente?",
            text: `Vas a asignar a ${teacher["Nombre Completo"]} al grupo.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, asignar",
            cancelButtonText: "Cancelar"
        }).then(async (result) => {
            if (result.isConfirmed && groupId) {
                try {
                    await groupService.assignTeacher(groupId, teacher.id);
                    Swal.fire("¡Asignado!", "El docente ha sido vinculado al grupo correctamente.", "success");
                    navigate("/groups"); // Volver a la lista de grupos
                } catch (error) {
                    Swal.fire("Error", "No se pudo realizar la asignación", "error");
                }
            }
        });
    };

    const showTeacherDetails = (teacher: any) => {
        // Buscamos el objeto original para tener todos los datos (email, especialidad, etc)
        const fullTeacher = teachers.find(t => t.id === teacher.id);
        
        Swal.fire({
            title: `<strong>Información del Docente</strong>`,
            icon: "info",
            html: `
                <div style="text-align: left; font-size: 0.9rem;">
                    <p><strong>Nombre:</strong> ${fullTeacher?.first_name} ${fullTeacher?.last_name}</p>
                    <p><strong>Identificación:</strong> ${fullTeacher?.identification}</p>
                    <p><strong>Código:</strong> ${fullTeacher?.code || 'N/A'}</p>
                    <p><strong>Email:</strong> ${fullTeacher?.email}</p>
                    <p><strong>Especialidad:</strong> ${(fullTeacher as any).specialty || 'No especificada'}</p>
                    <p><strong>Teléfono:</strong> ${(fullTeacher as any).phone || 'N/A'}</p>
                </div>
            `,
            showCloseButton: true,
            confirmButtonText: "Cerrar"
        });
    };

    if (loading) return <div className="p-4"><p>Cargando docentes...</p></div>;

    return (
        <div className="space-y-5">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-black dark:text-white">
                        Seleccionar Docente
                    </h2>
                    <p className="text-sm text-gray-500">
                        Busca y selecciona el docente que impartirá este grupo
                    </p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="text-sm font-medium text-gray-600 hover:underline"
                >
                    Volver atrás
                </button>
            </div>

            {/* BUSCADOR */}
            <div className="max-w-md">
                <SearchInput
                    label="Filtrar por nombre o especialidad"
                    placeholder="Ej: Juan Pérez o Matemáticas..."
                    value={search}
                    onChange={setSearch}
                />
            </div>

            {/* TABLA DE DOCENTES */}
            <GenericTable
                data={filtered.map((t) => ({
                    id: t.id,
                    "Código": t.code || "—",
                    "Nombre Completo": `${t.first_name} ${t.last_name}`,
                    "Identificación": t.identification,
                    "Especialidad": (t as any).specialty || "General",
                    "Correo": t.email,
                }))}
                columns={[
                    "Código",
                    "Nombre Completo",
                    "Identificación",
                    "Especialidad",
                    "Correo"
                ]}
                actions={[
                    { name: "select", label: "Seleccionar" },
                    { name: "details", label: "Ver más" },
                ]}
                onAction={handleAction}
            />
        </div>
    );
};

export default AssignTeacher;
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericTable from "../../components/GenericTable";
import SearchInput from "../../components/GenericSearch";
import { User } from "../../models/User";
import { Teacher } from "../../models/Docente";
import { userService } from "../../service/userService";
import { groupService } from "../../service/groupService";

// Creamos un tipo personalizado para la vista que contiene la combinación de ambos
interface CombinedTeacher extends Teacher {
    code: string;
    email: string;
}

const AssignTeacher: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();

    const [teachers, setTeachers] = useState<CombinedTeacher[]>([]);
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchTeachers();
    }, []);

    // =====================================================
    // 🔹 OBTENER Y COMBINAR DOCENTES
    // =====================================================
    const fetchTeachers = async () => {
        try {
            setLoading(true);

            // Ejecutamos ambas peticiones en paralelo
            const [allUsers, allTeachers] = await Promise.all([
                userService.getUsers(),
                userService.getTeachers() // Método que trae el listado de /api/academic/teachers
            ]);

            // Cruzamos los datos usando 'user_id'
            const mergedData: CombinedTeacher[] = allTeachers.map((teacher: Teacher) => {
               
                // Buscamos el usuario dueño de este perfil de profesor
                const matchingUser = allUsers.find((user: User) => user.id === teacher.user_id);

                return {
                    ...teacher,
                    // Si encuentra el usuario, extrae código y correo; si no, pone un guion
                    code: matchingUser ? matchingUser.code : "—",
                    email: matchingUser ? matchingUser.email : "—",
                };
            });

            setTeachers(mergedData);
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
            t.identification?.toLowerCase().includes(text) ||
            t.code?.toLowerCase().includes(text) ||
            t.email?.toLowerCase().includes(text) ||
            t.specialty?.toLowerCase().includes(text)
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
        
        const fullTeacher = teachers.find(t => t.id === teacher.id);
        
        console.log("Docente seleccionado para asignar:", fullTeacher);
        console.log("DEBUG ASIGNACIÓN -> GroupId:", groupId, " | TeacherUserId:", fullTeacher?.user_id);
        Swal.fire({
            title: "¿Asignar este docente?",
            text: `Vas a asignar a ${fullTeacher?.first_name} ${fullTeacher?.last_name} al grupo.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, asignar",
            cancelButtonText: "Cancelar"
        }).then(async (result) => {
            if (result.isConfirmed && groupId) {
                try {
                    // Pasamos el ID del profesor (el id académico: '5152271f...')
                    await groupService.assignTeacher(groupId,fullTeacher?.id?fullTeacher.id:"");
                    Swal.fire("¡Asignado!", "El docente ha sido vinculado al grupo correctamente.", "success");
                    navigate("/groups/list"); 
                } catch (error) {
                    Swal.fire("Error", "No se pudo realizar la asignación", "error");
                }
            }
        });
    };

    const showTeacherDetails = (teacher: any) => {
        const fullTeacher = teachers.find(t => t.id === teacher.id);
        
        Swal.fire({
            title: `<strong>Información del Docente</strong>`,
            icon: "info",
            html: `
                <div style="text-align: left; font-size: 0.9rem;">
                    <p><strong>Nombre:</strong> ${fullTeacher?.first_name} ${fullTeacher?.last_name}</p>
                    <p><strong>Identificación:</strong> ${fullTeacher?.identification}</p>
                    <p><strong>Código:</strong> ${fullTeacher?.code}</p>
                    <p><strong>Email:</strong> ${fullTeacher?.email}</p>
                    <p><strong>Especialidad:</strong> ${fullTeacher?.specialty || 'No especificada'}</p>
                    <p><strong>Teléfono:</strong> ${fullTeacher?.phone || 'N/A'}</p>
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
                    label="Filtrar por nombre, identificación, código o correo"
                    placeholder="Ej: Teach3, TCH-003..."
                    value={search}
                    onChange={setSearch}
                />
            </div>

            {/* TABLA DE DOCENTES */}
            <GenericTable
                data={filtered.map((t) => ({
                    id: t.id, // ID del Profesor
                    "Código": t.code,
                    "Nombre Completo": `${t.first_name} ${t.last_name}`,
                    "Identificación": t.identification,
                    "Especialidad": t.specialty || "General",
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
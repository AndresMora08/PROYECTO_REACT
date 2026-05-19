import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericTable from "../../components/GenericTable";
import SearchInput from "../../components/GenericSearch";
import { User } from "../../models/User";
import { Teacher } from "../../models/Docente";
import { userService } from "../../service/userService";
import { groupService } from "../../service/groupService";

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

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const [allUsers, allTeachers] = await Promise.all([
                userService.getUsers(),
                userService.getTeachers()
            ]);

            const mergedData: CombinedTeacher[] = allTeachers.map((teacher: Teacher) => {
                const matchingUser = allUsers.find((user: User) => user.id === teacher.user_id);
                return {
                    ...teacher,
                    code: matchingUser ? matchingUser.code : "—",
                    email: matchingUser ? matchingUser.email : "—",
                };
            });

            setTeachers(mergedData);
        } catch (error) {
            console.error(error);
            Swal.fire({ 
                icon: "error", 
                title: "Error de Red", 
                text: "No se pudieron cargar los docentes",
                customClass: { popup: 'rounded-3xl border-none shadow-2xl' }
            });
        } finally {
            setLoading(false);
        }
    };

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

    const handleAction = async (action: string, item: any) => {
        if (action === "select") {
            confirmAssignment(item);
        } else if (action === "details") {
            showTeacherDetails(item);
        }
    };

    const confirmAssignment = (teacher: any) => {
        const fullTeacher = teachers.find(t => t.id === teacher.id);
        
        Swal.fire({
            title: "¿Confirmar Asignación?",
            text: `Se vinculará a ${fullTeacher?.first_name} ${fullTeacher?.last_name} como responsable de este grupo académico.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#005088", // McKinsey Blue
            cancelButtonColor: "#64748b",
            confirmButtonText: "Confirmar Asignación",
            cancelButtonText: "Revisar",
            reverseButtons: true,
            customClass: {
                popup: 'rounded-2xl border-none p-8',
                title: 'text-2xl font-bold text-slate-800',
                htmlContainer: 'text-slate-600 mt-2',
                confirmButton: 'rounded-lg px-8 py-3 shadow-lg shadow-blue-900/20 transition-all hover:scale-105',
                cancelButton: 'rounded-lg px-8 py-3'
            }
        }).then(async (result) => {
            if (result.isConfirmed && groupId) {
                try {
                    await groupService.assignTeacher(groupId, fullTeacher?.id ? fullTeacher.id : "");
                    Swal.fire({
                        title: "¡Éxito!",
                        text: "El docente ha sido asignado correctamente.",
                        icon: "success",
                        timer: 2000,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-2xl' }
                    });
                    navigate("/groups/list"); 
                } catch (error) {
                    Swal.fire({
                        title: "Error Crítico",
                        text: "No se pudo procesar la asignación en el servidor académico.",
                        icon: "error",
                        customClass: { popup: 'rounded-2xl' }
                    });
                }
            }
        });
    };

    const showTeacherDetails = (teacher: any) => {
        const fullTeacher = teachers.find(t => t.id === teacher.id);
        
        Swal.fire({
            title: `<span class="text-slate-800 font-bold">Perfil del Docente</span>`,
            icon: "info",
            html: `
                <div class="mt-4 space-y-4 text-left p-2">
                    <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner grid grid-cols-1 gap-3">
                        <p class="flex justify-between border-b border-slate-200 pb-2"><strong class="text-slate-500 uppercase text-xs tracking-wider">Nombre Completo</strong> <span class="text-slate-900 font-medium">${fullTeacher?.first_name} ${fullTeacher?.last_name}</span></p>
                        <p class="flex justify-between border-b border-slate-200 pb-2"><strong class="text-slate-500 uppercase text-xs tracking-wider">ID Institucional</strong> <span class="text-slate-900 font-medium">${fullTeacher?.identification}</span></p>
                        <p class="flex justify-between border-b border-slate-200 pb-2"><strong class="text-slate-500 uppercase text-xs tracking-wider">Código de Usuario</strong> <span class="text-slate-900 font-medium">${fullTeacher?.code}</span></p>
                        <p class="flex justify-between border-b border-slate-200 pb-2"><strong class="text-slate-500 uppercase text-xs tracking-wider">Especialidad</strong> <span class="text-blue-700 font-bold">${fullTeacher?.specialty || 'General'}</span></p>
                        <p class="flex justify-between border-b border-slate-200 pb-2"><strong class="text-slate-500 uppercase text-xs tracking-wider">Contacto</strong> <span class="text-slate-900 font-medium">${fullTeacher?.email}</span></p>
                    </div>
                </div>
            `,
            showCloseButton: true,
            confirmButtonText: "Finalizar Revisión",
            confirmButtonColor: "#0f172a",
            customClass: {
                popup: 'rounded-3xl border-none shadow-2xl',
                confirmButton: 'rounded-xl px-10 py-3 mt-4'
            }
        });
    };

    if (loading) return (
        <div className="flex min-h-[500px] items-center justify-center bg-slate-50/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-500/20"></div>
                <p className="text-slate-400 font-medium tracking-wide">Iniciando motor de búsqueda...</p>
            </div>
        </div>
    );

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            <style>{`
                @keyframes slideInUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .stagger-1 { animation: slideInUp 0.5s ease-out forwards; }
                .stagger-2 { animation: slideInUp 0.5s ease-out 0.1s forwards; opacity: 0; }
                .stagger-3 { animation: slideInUp 0.5s ease-out 0.2s forwards; opacity: 0; }
            `}</style>

            {/* HEADER SECTION */}
            <div className="stagger-1 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-slate-200 pb-8">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Asignación de <span className="text-blue-700">Cátedra</span>
                    </h2>
                    <p className="mt-2 text-lg text-slate-500 dark:text-gray-400 max-w-2xl">
                        Gestione el equipo docente para el grupo académico. Seleccione un perfil basado en su especialidad y disponibilidad.
                    </p>
                </div>
                
                <button
                    onClick={() => navigate(-1)}
                    className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-blue-700"
                >
                    <svg className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Regresar al Listado
                </button>
            </div>

            {/* SEARCH & FILTER SECTION */}
            <div className="stagger-2 grid grid-cols-1 gap-6">
                <div className="relative rounded-2xl bg-white p-2 shadow-xl shadow-slate-200/50 dark:bg-gray-800">
                    <SearchInput
                        label=""
                        placeholder="Filtrar por nombre, identificación, código de usuario o correo..."
                        value={search}
                        onChange={setSearch}
                    />
                </div>
            </div>

            {/* TABLE SECTION */}
            <div className="stagger-3 rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/40 dark:border-gray-700 dark:bg-gray-800 overflow-hidden transition-all hover:shadow-slate-300/50">
                <div className="p-1">
                    <GenericTable
                        data={filtered.map((t) => ({
                            id: t.id,
                            "Código": t.code,
                            "Nombre Completo": `${t.first_name} ${t.last_name}`,
                            "Identificación": t.identification,
                            "Especialidad": t.specialty || "General",
                            "Correo Electrónico": t.email,
                        }))}
                        columns={[
                            "Código",
                            "Nombre Completo",
                            "Identificación",
                            "Especialidad",
                            "Correo Electrónico"
                        ]}
                        actions={[
                            { name: "select", label: "Vincular al Grupo" },
                            { name: "details", label: "Consultar Historial" },
                        ]}
                        onAction={handleAction}
                    />
                </div>
            </div>

            <div className="flex justify-center text-slate-300 text-xs tracking-widest uppercase py-4">
                Academic Management System • Advanced Interface
            </div>

        </div>
    );
};

export default AssignTeacher;


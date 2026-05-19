import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import GenericTable from "../../components/GenericTable";
import SearchInput from "../../components/GenericSearch";

import { Group } from "../../models/Grupo";
import { Teacher } from "../../models/Docente";
import { Subject } from "../../models/Asignatura";
import { Semester } from "../../models/Semestre";

import { groupService } from "../../service/groupService";
import { userService } from "../../service/userService";
import { subjectService } from "../../service/subjectService";
import { semesterService } from "../../service/semesterService";

const ListGroups: React.FC = () => {
    const navigate = useNavigate();

    const [data, setData] = useState<Group[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");

    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchData();
    }, []);

    // =====================================================
    // 🔹 CARGAR DATOS
    // =====================================================
    const fetchData = async () => {
        try {
            setLoading(true);

            const [
                groupsResponse,
                teachersResponse,
                subjectsResponse,
                semestersResponse,
            ] = await Promise.all([
                groupService.getGroups(),
                userService.getTeachers(),
                subjectService.getSubjects(),
                semesterService.getSemesters(),
            ]);

            setData(Array.isArray(groupsResponse) ? groupsResponse : []);
            setTeachers(Array.isArray(teachersResponse) ? teachersResponse : []);
            setSubjects(Array.isArray(subjectsResponse) ? subjectsResponse : []);

            const allSemesters: Semester[] = Array.isArray(semestersResponse) ? semestersResponse : [];
            setSemesters(allSemesters);

            // Pre-seleccionar el semestre activo automáticamente
            const active = allSemesters.find((s) => s.is_active);
            if (active) setSelectedSemesterId(active.id);

        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                title: "Error de Conexión",
                text: "No se pudieron cargar los datos académicos",
                customClass: { popup: 'rounded-3xl border-none shadow-2xl' }
            });
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // 🔹 SEMESTRE SELECCIONADO (objeto completo)
    // =====================================================
    const selectedSemester = semesters.find((s) => s.id === selectedSemesterId) ?? null;

    // =====================================================
    // 🔹 OBTENER DOCENTE
    // =====================================================
    const getTeacherName = (teacherId?: string) => {
        if (!teacherId) return "Sin docente";
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) return "Sin docente";
        return `${teacher.first_name} ${teacher.last_name}`;
    };

    // =====================================================
    // 🔹 OBTENER ASIGNATURA
    // =====================================================
    const getSubject = (subjectId?: string) => {
        if (!subjectId) return null;
        return subjects.find(s => s.id === subjectId) || null;
    };

    // =====================================================
    // 🔹 FILTRAR
    // =====================================================
    const filtered = data
        // 1. Filtrar por semestre seleccionado
        .filter((item) =>
            !selectedSemesterId || item.semester_id === selectedSemesterId
        )
        // 2. Filtrar por texto de búsqueda
        .filter((item) => {
            const text = search.toLowerCase();
            const subject = getSubject(item.subject_id);

            return (
                !text ||
                item.name?.toLowerCase().includes(text) ||
                item.group_code?.toLowerCase().includes(text) ||
                subject?.name?.toLowerCase().includes(text) ||
                subject?.code?.toLowerCase().includes(text) ||
                getTeacherName(item.teacher_id).toLowerCase().includes(text)
            );
        });

    // =====================================================
    // 🔹 DETALLES
    // =====================================================
    const showDetails = (group: Group) => {
        const subject = getSubject(group.subject_id);
        const semester = semesters.find((s) => s.id === group.semester_id);

        Swal.fire({
            title: `<span class="text-slate-800 font-bold">Detalles del Grupo</span>`,
            icon: "info",
            html: `
                <div class="mt-4 space-y-4 text-left p-2">
                    <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="col-span-1 sm:col-span-2 flex justify-between items-center border-b border-slate-200 pb-3">
                            <strong class="text-slate-500 uppercase text-xs tracking-wider">Nombre del Grupo</strong>
                            <span class="text-blue-700 font-extrabold text-lg bg-blue-50 px-3 py-1 rounded-lg">${group.name}</span>
                        </div>
                        <div class="flex flex-col border-b border-slate-200 pb-2">
                            <strong class="text-slate-500 uppercase text-xs tracking-wider mb-1">Código Único</strong> 
                            <span class="text-slate-900 font-medium">${group.group_code}</span>
                        </div>
                        <div class="flex flex-col border-b border-slate-200 pb-2">
                            <strong class="text-slate-500 uppercase text-xs tracking-wider mb-1">Capacidad</strong> 
                            <span class="text-slate-900 font-medium">${group.capacity} Estudiantes</span>
                        </div>
                        <div class="col-span-1 sm:col-span-2 flex flex-col border-b border-slate-200 pb-2">
                            <strong class="text-slate-500 uppercase text-xs tracking-wider mb-1">Asignatura Programada</strong> 
                            <span class="text-slate-900 font-medium">${subject?.name || "N/A"} <span class="text-slate-400">(${subject?.code || "N/A"})</span></span>
                        </div>
                        <div class="col-span-1 sm:col-span-2 flex flex-col border-b border-slate-200 pb-2">
                            <strong class="text-slate-500 uppercase text-xs tracking-wider mb-1">Docente Titular</strong> 
                            <span class="text-slate-900 font-medium">${getTeacherName(group.teacher_id)}</span>
                        </div>
                        <div class="col-span-1 sm:col-span-2 flex justify-between items-center pt-2 mt-1">
                            <strong class="text-slate-500 uppercase text-xs tracking-wider">Ciclo/Semestre</strong>
                            <span class="text-slate-900 font-semibold bg-slate-200/50 px-3 py-1 rounded-md text-sm">${semester?.name || group.semester_id || "N/A"}</span>
                        </div>
                    </div>
                </div>
            `,
            showCloseButton: true,
            confirmButtonText: "Cerrar Panel",
            confirmButtonColor: "#0f172a",
            customClass: {
                popup: 'rounded-3xl border-none shadow-2xl',
                confirmButton: 'rounded-xl px-10 py-3 mt-4 transition-transform hover:scale-105'
            }
        });
    };

    // =====================================================
    // 🔹 ACCIONES
    // =====================================================
    const handleAction = (action: string, item: any) => {
        const fullItem = data.find(g => g.id === item.id);

        if (action === "select") {
            navigate(`/groups/manage/${item.id}`);
        } else if (action === "details" && fullItem) {
            showDetails(fullItem);
        }
    };

    // =====================================================
    // 🔹 LOADING
    // =====================================================
    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center bg-slate-50/50 backdrop-blur-sm rounded-3xl">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-500/20"></div>
                    <p className="text-slate-400 font-medium tracking-wide">Sincronizando grupos académicos...</p>
                </div>
            </div>
        );
    }

    // =====================================================
    // 🔹 RENDER
    // =====================================================
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
            <div className="stagger-1 border-b border-slate-200 pb-8">
                <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Gestión de <span className="text-blue-700">Grupos Académicos</span>
                </h2>
                <p className="mt-2 text-lg text-slate-500 dark:text-gray-400 max-w-3xl">
                    Administre, visualice y filtre los grupos programados en el sistema académico. Revise la asignación docente y detalles de cupos.
                </p>
            </div>

            {/* PANEL DE FILTROS SECTION */}
            <div className="stagger-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-gray-700 dark:bg-gray-800 transition-all">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    
                    {/* BUSCADOR */}
                    <div className="flex-1 w-full lg:max-w-xl">
                        <SearchInput
                            label="Buscar grupo"
                            placeholder="Ej. Matemáticas, GRP-01, Nombre del docente..."
                            value={search}
                            onChange={setSearch}
                        />
                    </div>

                    {/* SELECTOR DE SEMESTRE */}
                    <div className="w-full lg:w-auto">
                        <label className="mb-2 block text-sm font-bold tracking-wide text-slate-700 dark:text-gray-300">
                            Semestre Activo
                        </label>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="relative">
                                <select
                                    value={selectedSemesterId}
                                    onChange={(e) => setSelectedSemesterId(e.target.value)}
                                    className="
                                        w-full appearance-none rounded-xl border border-slate-200 bg-slate-50
                                        py-3 pl-4 pr-10 text-sm font-medium text-slate-700 shadow-sm transition-colors
                                        focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20
                                        dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:min-w-[280px] cursor-pointer
                                    "
                                >
                                    <option value="">— Todos los semestres —</option>
                                    {semesters.map((sem) => (
                                        <option key={sem.id} value={sem.id}>
                                            {sem.name}
                                            {sem.code && sem.code !== sem.name ? ` • ${sem.code}` : ""}
                                            {sem.is_active ? " (Activo)" : ""}
                                        </option>
                                    ))}
                                </select>

                                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </span>
                            </div>

                            {selectedSemester && (
                                <span className={`
                                    inline-flex w-fit items-center rounded-lg px-3 py-1.5 text-xs font-bold tracking-widest uppercase shadow-sm
                                    ${selectedSemester.is_active
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200"
                                        : "bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-400 border border-slate-200"
                                    }
                                `}>
                                    {selectedSemester.is_active ? "Activo" : "Histórico"}
                                </span>
                            )}
                        </div>
                    </div>

                </div>

                {/* BANNER INFORMATIVO */}
                {selectedSemesterId && (
                    <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800 shadow-inner dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300">
                        <svg className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7-4a1 1 0 10-2 0v4a1 1 0 001 1h2a1 1 0 100-2H11V6z" clipRule="evenodd" />
                        </svg>
                        <p className="leading-relaxed">
                            Mostrando exclusivamente los grupos pertenecientes al <strong className="font-semibold text-blue-900 dark:text-blue-200">semestre académico seleccionado</strong>. Para visualizar el histórico general, cambie el filtro a "Todos los semestres".
                        </p>
                    </div>
                )}
            </div>

            {/* TABLA DE CONTENIDO SECTION */}
            <div className="stagger-3 rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/40 dark:border-gray-700 dark:bg-gray-800 overflow-hidden transition-all hover:shadow-slate-300/50">
                <div className="p-1">
                    <GenericTable
                        data={filtered.map((item) => {
                            const subject = getSubject(item.subject_id);
                            return {
                                id: item.id,
                                "Código": item.group_code,
                                "Nombre Grupo": item.name,
                                "Asignatura": subject?.name || "—",
                                "Cod. Asignatura": subject?.code || "—",
                                "Carrera/Programa": "Programa Académico",
                                "Cupos": item.capacity,
                                "Docente Actual": getTeacherName(item.teacher_id),
                            };
                        })}
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
                            { name: "select", label: "Gestionar" },
                            { name: "details", label: "Ver Detalles" },
                        ]}
                        onAction={handleAction}
                        selectable={false}
                    />
                </div>
            </div>

            <div className="flex justify-center text-slate-300 text-xs tracking-widest uppercase py-4">
                Academic Management System • Advanced Interface
            </div>

        </div>
    );
};

export default ListGroups;
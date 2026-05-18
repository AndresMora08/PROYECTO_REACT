import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import GenericTable from "../../components/GenericTable";
import SearchInput from "../../components/GenericSearch";

import { Group } from "../../models/Grupo";
import { Teacher } from "../../models/Docente";
import { Subject } from "../../models/Asignatura";

import { groupService } from "../../service/groupService";
import { userService } from "../../service/userService";
import { subjectService } from "../../service/subjectService";

const ListGroups: React.FC = () => {
    const navigate = useNavigate();

    const [data, setData] = useState<Group[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

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
                subjectsResponse
            ] = await Promise.all([
                groupService.getGroups(),
                userService.getTeachers(),
                subjectService.getSubjects()
            ]);

            console.log("Grupos:", groupsResponse);
            console.log("Docentes:", teachersResponse);
            console.log("Asignaturas:", subjectsResponse);

            setData(Array.isArray(groupsResponse) ? groupsResponse : []);
            setTeachers(Array.isArray(teachersResponse) ? teachersResponse : []);
            setSubjects(Array.isArray(subjectsResponse) ? subjectsResponse : []);

        } catch (error) {
            console.error(error);

            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron cargar los datos"
            });

        } finally {
            setLoading(false);
        }
    };

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
        if (!subjectId) {
            return null;
        }

        return subjects.find(s => s.id === subjectId) || null;
    };

    // =====================================================
    // 🔹 FILTRAR
    // =====================================================
    const filtered = data.filter((item) => {

        const text = search.toLowerCase();

        const subject = getSubject(item.subject_id);

        return (
            !text ||

            item.name?.toLowerCase().includes(text) ||

            item.group_code?.toLowerCase().includes(text) ||

            subject?.name?.toLowerCase().includes(text) ||

            subject?.code?.toLowerCase().includes(text) ||

            getTeacherName(item.teacher_id)
                .toLowerCase()
                .includes(text)
        );
    });

    // =====================================================
    // 🔹 DETALLES
    // =====================================================
    const showDetails = (group: Group) => {

        const subject = getSubject(group.subject_id);

        Swal.fire({
            title: `<strong>Detalles del Grupo: ${group.name}</strong>`,
            icon: "info",

            html: `
                <div style="text-align: left; font-size: 0.9rem;">

                    <p>
                        <strong>Código:</strong>
                        ${group.group_code}
                    </p>

                    <p>
                        <strong>Asignatura:</strong>
                        ${subject?.name || "N/A"}
                    </p>

                    <p>
                        <strong>Código Asignatura:</strong>
                        ${subject?.code || "N/A"}
                    </p>

                    <p>
                        <strong>Docente:</strong>
                        ${getTeacherName(group.teacher_id)}
                    </p>

                    <p>
                        <strong>Capacidad:</strong>
                        ${group.capacity} estudiantes
                    </p>

                    <p>
                        <strong>Semestre:</strong>
                        ${group.semester_id || "N/A"}
                    </p>

                </div>
            `,

            confirmButtonText: "Cerrar",
            confirmButtonColor: "#3b82f6"
        });
    };

    // =====================================================
    // 🔹 ACCIONES
    // =====================================================
    const handleAction = (action: string, item: any) => {

        const fullItem = data.find(g => g.id === item.id);

        if (action === "select") {
            navigate(`/groups/manage/${item.id}`);
        }

        else if (action === "details" && fullItem) {
            showDetails(fullItem);
        }
    };

    // =====================================================
    // 🔹 LOADING
    // =====================================================
    if (loading) {
        return (
            <div className="p-4">
                <p>Cargando grupos...</p>
            </div>
        );
    }

    // =====================================================
    // 🔹 RENDER
    // =====================================================
    return (
        <div className="space-y-5">

            {/* HEADER */}
            <div className="flex items-center justify-between">

                <div>
                    <h2 className="text-2xl font-semibold text-black dark:text-white">
                        Grupos Académicos
                    </h2>

                    <p className="text-sm text-gray-500">
                        Gestión y visualización de grupos programados
                    </p>
                </div>

                <button
                    onClick={() => navigate("/groups/create")}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    + Nuevo Grupo
                </button>

            </div>

            {/* BUSCADOR */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end">

                <div className="flex-1">
                    <SearchInput
                        label="Buscar grupo"
                        placeholder="Buscar por nombre, código, asignatura o docente..."
                        value={search}
                        onChange={setSearch}
                    />
                </div>

            </div>

            {/* TABLA */}
            <GenericTable

                data={filtered.map((item) => {

                    const subject = getSubject(item.subject_id);

                    return {
                        id: item.id,

                        "Código":
                            item.group_code,

                        "Nombre Grupo":
                            item.name,

                        "Asignatura":
                            subject?.name || "—",

                        "Cod. Asignatura":
                            subject?.code || "—",

                        "Carrera/Programa":
                            "Programa Académico",

                        "Cupos":
                            item.capacity,

                        "Docente Actual":
                            getTeacherName(item.teacher_id),
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
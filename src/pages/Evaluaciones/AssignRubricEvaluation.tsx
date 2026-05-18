import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; 
import Swal from "sweetalert2";
import SearchInput from "../../components/GenericSearch"; 
import GenericTable from "../../components/GenericTable";   
import { rubricService } from "../../service/rubricService";
import { evaluationService } from "../../service/evaluationService";
import { groupService } from "../../service/groupService"; 

import { Rubrica } from "../../models/Rubrica";
import { Evaluacion } from "../../models/Evaluacion";
import { RootState } from "../../store/store"; // 💡 Importamos el tipado de tu store (ajusta la ruta si es necesario)

export const AssignRubricEvaluation: React.FC = () => {
    const { evaluationId } = useParams<{ evaluationId: string }>();
    const navigate = useNavigate();

    // 💡 AHORA SÍ: Leemos el usuario exactamente como está estructurado en tu userSlice.ts
    const currentUser = useSelector((state: RootState) => state.user.user);

    // Estados de datos
    const [rubrics, setRubrics] = useState<Rubrica[]>([]);
    const [evaluation, setEvaluation] = useState<Evaluacion | null>(null);
    const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
    
    // Estados de interacción
    const [search, setSearch] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    
    // Estados para almacenar las selecciones antes de guardar
    const [selectedRubric, setSelectedRubric] = useState<Rubrica | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

    useEffect(() => {
        if (evaluationId && currentUser) {
            loadInitialData();
        }
    }, [evaluationId, currentUser]);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            // 1. Cargar la evaluación
            const evData = await evaluationService.getEvaluationById(evaluationId!);
            setEvaluation(evData);

            // 2. Cargar TODAS las rúbricas y filtrar solo las públicas
            const rubricsData = await rubricService.getRubrics();
            const publicRubrics = rubricsData.filter(r => r.is_public === true);
            setRubrics(publicRubrics);

            if (publicRubrics.length === 0) {
                Swal.fire({
                    title: "No hay rúbricas públicas",
                    text: "¿Deseas ir al gestor de rúbricas (CU-07)?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Ir a Rúbricas"
                }).then((result) => {
                    if (result.isConfirmed) navigate("/rubrics/create");
                });
            }

            // 3. Obtener los grupos para extraer las asignaturas del docente logueado
            const groupsData = await groupService.getGroups(); 
            // 💡 Usamos currentUser.id (o como esté en tu modelo User)
            const myGroups = groupsData.filter((g: any) => g.teacher_id === currentUser?.id);
            
            const uniqueSubjects = new Map();
            myGroups.forEach((group: any) => {
                if (group.subject_id && !uniqueSubjects.has(group.subject_id)) {
                    uniqueSubjects.set(group.subject_id, {
                        id: group.subject_id,
                        name: group.subject?.name || "Asignatura Desconocida" 
                    });
                }
            });
            setTeacherSubjects(Array.from(uniqueSubjects.values()));

        } catch (error) {
            console.error("Error cargando datos:", error);
            Swal.fire("Error", "No se pudo recuperar la información.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRubrics = useMemo(() => {
        if (!search.trim()) return rubrics;
        const text = search.toLowerCase();
        return rubrics.filter(r => 
            r.title.toLowerCase().includes(text) || 
            (r.description && r.description.toLowerCase().includes(text))
        );
    }, [search, rubrics]);

    // Vista previa
    const handlePreview = (rubric: Rubrica) => {
        Swal.fire({
            title: `Vista Previa: ${rubric.title}`,
            html: `<p>${rubric.description || "Sin descripción"}</p>`,
            icon: "info"
        });
    };

    // Seleccionar Rúbrica en memoria
    const handleSelectInTable = (rubric: Rubrica) => {
        setSelectedRubric(rubric);
        Swal.fire({
            title: "Seleccionada",
            text: `Se ha marcado la rúbrica: ${rubric.title}`,
            icon: "success",
            timer: 1500,
            showConfirmButton: false
        });
    };

    // Función MAESTRA de la tabla genérica (Atrapa los clics de los botones)
    const handleTableAction = (actionName: string, item: any) => {
        if (actionName === "view") {
            handlePreview(item as Rubrica);
        } else if (actionName === "select") {
            handleSelectInTable(item as Rubrica);
        }
    };

    // Función MAESTRA QUE ENVÍA LOS DATOS AL BACKEND
    const handleFinalSubmit = async () => {
        if (!selectedRubric) {
            Swal.fire("Atención", "Debes seleccionar una rúbrica de la tabla.", "warning");
            return;
        }
        if (!selectedSubjectId) {
            Swal.fire("Atención", "Debes elegir una asignatura del desplegable.", "warning");
            return;
        }

        Swal.fire({
            title: "¿Confirmar Asociación?",
            text: `Vas a vincular la rúbrica "${selectedRubric.title}" a la evaluación.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, asociar",
            cancelButtonText: "Cancelar"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await evaluationService.associateRubric(evaluationId!, selectedRubric.id!, selectedSubjectId);
                    Swal.fire("¡Éxito!", "Asociación guardada correctamente.", "success");
                    navigate("/evaluations/list"); 
                } catch (error) {
                    console.error("Error al asociar:", error);
                    Swal.fire("Error", "No se pudo realizar la vinculación en el servidor.", "error");
                }
            }
        });
    };

    // -------------------------------------------------------------
    // ADAPTACIÓN PARA GENERIC TABLE
    // -------------------------------------------------------------
    
    const columns = ["Título", "Descripción", "Pública"];

    const actions = [
        { name: "view", label: "Vista Previa" },
        { name: "select", label: "Seleccionar" }
    ];

    const tableData = filteredRubrics.map(r => ({
        ...r,
        "Título": r.title,
        "Descripción": r.description || "Sin descripción",
        "Pública": r.is_public ? "Sí" : "No"
    }));

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4">
            {/* ENCABEZADO */}
            <div className="bg-white p-4 border rounded-lg shadow-sm">
                <h2 className="text-xl font-bold text-gray-800">Selección de Rúbrica y Asignatura</h2>
                <p className="text-sm text-gray-500">Evaluación: {evaluation?.name || "Cargando..."}</p>
            </div>

            {/* TABLA DE RÚBRICAS */}
            <div className="bg-white border rounded-lg shadow-sm p-4">
                <SearchInput
                    label="Filtrar rúbricas públicas"
                    value={search}
                    onChange={setSearch}
                />
                <div className="mt-4">
                    {isLoading ? (
                        <div className="text-center text-gray-500 py-4">Cargando...</div>
                    ) : (
                        <GenericTable 
                            columns={columns} 
                            data={tableData} 
                            actions={actions} 
                            onAction={handleTableAction}
                            selectable={true}
                            onRowClick={(item) => handleSelectInTable(item as Rubrica)}
                        />
                    )}
                </div>
            </div>

            {/* SECCIÓN FINAL: SELECCIÓN DE ASIGNATURA Y BOTÓN DE GUARDAR */}
            <div className="bg-gray-50 p-6 border rounded-lg shadow-inner mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Configuración Final</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    
                    {/* Resumen de Rúbrica Seleccionada */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Rúbrica Elegida:</label>
                        <div className={`p-3 border rounded ${selectedRubric ? 'bg-white border-green-400' : 'bg-gray-100 border-gray-300'}`}>
                            {selectedRubric ? (
                                <span className="text-green-700 font-medium">✅ {selectedRubric.title}</span>
                            ) : (
                                <span className="text-gray-500 italic">Ninguna seleccionada...</span>
                            )}
                        </div>
                    </div>

                    {/* Desplegable de Asignaturas del Docente */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Asignatura a Vincular:</label>
                        <select 
                            className="w-full p-3 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                        >
                            <option value="">-- Selecciona una asignatura --</option>
                            {teacherSubjects.map(sub => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>
                        {teacherSubjects.length === 0 && !isLoading && (
                            <p className="text-xs text-red-500 mt-1">No se encontraron asignaturas asignadas a tu usuario.</p>
                        )}
                    </div>
                </div>

                {/* BOTÓN MAESTRO PARA ASOCIAR */}
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={handleFinalSubmit}
                        disabled={!selectedRubric || !selectedSubjectId}
                        className={`px-6 py-3 rounded font-bold text-white transition-colors ${
                            (!selectedRubric || !selectedSubjectId) 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-800 shadow-md"
                        }`}
                    >
                        Asociar Rúbrica y Asignatura
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignRubricEvaluation;
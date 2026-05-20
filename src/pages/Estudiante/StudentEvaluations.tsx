import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import SearchInput from "../../components/GenericSearch";
import GenericCard from "../../components/GenericCard";
import { RootState } from "../../store/store";
import { enrollmentService } from "../../service/enrollmentService";
import { evaluationService } from "../../service/evaluationService";
import { Evaluacion } from "../../models/Evaluacion";

const StudentEvaluations: React.FC = () => {
    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state.user.user);

    const [evaluations, setEvaluations] = useState<Evaluacion[]>([]);
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            if (!user?.id) {
                setEvaluations([]);
                return;
            }

            // 1) obtener inscripciones activas del estudiante
            const inscripciones = await enrollmentService.getStudentInscriptions(user.id);
            const activeGroupIds = (inscripciones || [])
                .filter((i: any) => (i.status?.toUpperCase?.() === "ACTIVE") || (i.estado_academico?.toUpperCase?.() === "ACTIVO") || (i.estado_academico?.toUpperCase?.() === "ACTIVE"))
                .map((i: any) => i.group_id || i.groupId || i.group);

            // 2) cargar todas las evaluaciones y filtrar por grupos del estudiante
            const all = await evaluationService.getEvaluations();
            const filtered = (all || []).filter((ev: Evaluacion) => activeGroupIds.includes(ev.group_id));

            setEvaluations(filtered);
        } catch (err) {
            console.error("Error cargando evaluaciones del estudiante:", err);
            setEvaluations([]);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        if (!search.trim()) return evaluations;
        const t = search.toLowerCase();
        return evaluations.filter((ev) => (ev.name || ev.title || "").toLowerCase().includes(t) || (ev.description || "").toLowerCase().includes(t));
    }, [search, evaluations]);

    const handleViewRubric = (id: string) => {
        navigate(`/evaluations/${id}/rubrica`);
    };

    if (!user) return <div className="p-6">Debes iniciar sesión para ver tus evaluaciones.</div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Evaluaciones</h2>
                <p className="text-sm text-gray-500">Listado de evaluaciones de tus asignaturas activas.</p>
            </div>

            <div className="max-w-md">
                <SearchInput label="Buscar evaluación" placeholder="Ej: Parcial 1" value={search} onChange={setSearch} />
            </div>

            {loading ? (
                <div className="p-4 text-gray-500">Cargando evaluaciones...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center p-10 bg-gray-50 border border-dashed rounded-lg">
                    <p className="text-gray-500">No hay evaluaciones para tus grupos activos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((ev) => (
                        <GenericCard
                            key={ev.id}
                            id={ev.id!}
                            title={ev.name || ev.title || "Evaluación"}
                            subtitle={ev.weight ? `Peso: ${ev.weight}%` : undefined}
                            description={ev.description}
                            actionLabel={ev.rubrica_id ? "Ver rúbrica" : "Sin rúbrica"}
                            onAction={() => ev.rubrica_id ? handleViewRubric(ev.id!) : undefined}
                            customStatus={
                                ev.rubrica_id ? (
                                    <span className="text-xs text-green-700 font-medium bg-green-100 px-2 py-1 rounded">✅ Rúbrica disponible</span>
                                ) : (
                                    <span className="text-xs text-orange-700 font-medium bg-orange-100 px-2 py-1 rounded">⚠️ Sin rúbrica</span>
                                )
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentEvaluations;

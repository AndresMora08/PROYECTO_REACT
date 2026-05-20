import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { enrollmentService } from "../../service/enrollmentService";
import { gradeService } from "../../service/gradeService";
import GenericCard from "../../components/GenericCard";

const StudentGrades: React.FC = () => {
    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state.user.user);

    const [grades, setGrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            if (!user?.id) return setGrades([]);

            const inscripciones = await enrollmentService.getStudentInscriptions(user.id);
            const enrollmentIds = (inscripciones || []).map((i: any) => i.id || i.inscripcion_id || i.enrollment_id);

            const allGrades = await gradeService.getGrades();
            const myGrades = (allGrades || []).filter((g: any) => enrollmentIds.includes(g.enrollment_id) && (g.status === "ENVIADA" || g.status === "SENT"));

            setGrades(myGrades);
        } catch (err) {
            console.error("Error cargando calificaciones del estudiante:", err);
            setGrades([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Mis Calificaciones</h2>
                <p className="text-sm text-gray-500">Calificaciones finales enviadas por los docentes.</p>
            </div>

            {loading ? (
                <div className="p-4 text-gray-500">Cargando calificaciones...</div>
            ) : grades.length === 0 ? (
                <div className="text-center p-10 bg-gray-50 border border-dashed rounded-lg">
                    <p className="text-gray-500">No hay calificaciones publicadas todavía.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grades.map((g) => (
                        <GenericCard
                            key={g.id}
                            id={g.id}
                            title={g.rubrica?.title ?? g.rubric?.title ?? `Calificación ${g.id?.slice?.(0,6)}`}
                            subtitle={g.final_score !== undefined ? `${Number(g.final_score).toFixed(2)} / 100` : "Nota pendiente"}
                            description={g.evaluation?.name ?? g.evaluacion?.name}
                            actionLabel="Ver detalle"
                            onAction={() => navigate(`/estudiante/calificaciones/${g.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentGrades;

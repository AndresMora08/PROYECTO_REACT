import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gradeService } from "../../service/gradeService";
import { gradeDetailService } from "../../service/gradeDetailService";
import Swal from "sweetalert2";

const StudentGradeDetail: React.FC = () => {
    const { gradeId } = useParams<{ gradeId: string }>();
    const navigate = useNavigate();

    const [grade, setGrade] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (gradeId) load();
    }, [gradeId]);

    const load = async () => {
        setLoading(true);
        try {
            const data = await gradeService.getGradeById(gradeId!);
            setGrade(data);
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "No se pudo cargar la calificación.", "error").then(() => navigate(-1));
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6 text-gray-500">Cargando calificación...</div>;
    if (!grade) return null;

    // Intentar obtener array de detalles desde múltiples keys posibles
    const details: any[] = grade.details || grade.detalles || grade.grade_details || grade.calificacion_detalles || grade.calificacionDetalles || [];

    const criterios = grade.rubrica?.criterios || grade.rubric?.criterios || [];

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Detalle de la Calificación</h2>
                <p className="text-sm text-gray-500">Desglose por criterio y nivel obtenido.</p>
            </div>

            <div className="bg-white border rounded-lg p-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400">Rúbrica</p>
                        <p className="font-semibold">{grade.rubrica?.title ?? grade.rubric?.title}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Nota final</p>
                        <p className="font-semibold">{grade.final_score !== undefined ? Number(grade.final_score).toFixed(2) : "—"} / 100</p>
                    </div>
                </div>

                {grade.observations && (
                    <div className="mt-4">
                        <p className="text-xs text-gray-400">Observaciones</p>
                        <p className="font-normal">{grade.observations}</p>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {criterios.map((c: any) => {
                    const found = details.find((d: any) => {
                        if (d.escala && d.escala.criterion_id) return String(d.escala.criterion_id) === String(c.id);
                        // intentar match por scale_id dentro de las escalas del criterio
                        if (d.scale_id && Array.isArray(c.escalas)) return c.escalas.some((e: any) => String(e.id) === String(d.scale_id));
                        return false;
                    });

                    return (
                        <div key={c.id} className="bg-white border rounded-lg p-4">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-sm font-semibold">{c.name}</p>
                                    {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">Peso: {c.weight}%</p>
                                </div>
                            </div>

                            <div className="mt-3 border-t pt-3">
                                {found ? (
                                    <div>
                                        <p className="text-sm"><strong>Nivel:</strong> {found.escala?.name ?? found.levelName ?? "-"} {found.escala?.value !== undefined && <span className="text-xs text-gray-500">({found.escala.value})</span>}</p>
                                        <p className="text-sm"><strong>Puntaje:</strong> {found.score ?? found.puntaje ?? "-"}</p>
                                        {found.comment && <p className="text-sm text-gray-600">Comentario: {found.comment}</p>}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No hay detalle para este criterio.</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between">
                <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded">← Volver</button>
                <a
                    href="#"
                    onClick={async (e) => {
                        e.preventDefault();
                        try {
                            // Intento descargar reporte desde notasService si existe; como fallback genero JSON
                            const resp = await fetch(window.location.href, { method: "GET" });
                            const blob = new Blob([JSON.stringify(grade, null, 2)], { type: "application/json" });
                            const a = document.createElement("a");
                            a.href = URL.createObjectURL(blob);
                            a.download = `calificacion_${gradeId}.json`;
                            a.click();
                        } catch (err) {
                            console.error(err);
                            Swal.fire("Error", "No se pudo generar el reporte.", "error");
                        }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded"
                >
                    Descargar reporte
                </a>
            </div>
        </div>
    );
};

export default StudentGradeDetail;

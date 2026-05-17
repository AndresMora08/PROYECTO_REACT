import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { rubricasService, RubricaDto, CriterioDto, EscalaDto } from "../../service/rubricasService";

const ConsultarRubrica: React.FC = () => {
    const { evaluationId, rubricaId } = useParams<{ evaluationId?: string; rubricaId?: string }>();
    const [rubrica, setRubrica] = useState<RubricaDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                let data = null;
                if (evaluationId) {
                    data = await rubricasService.getRubricaByEvaluation(evaluationId);
                }
                if (!data && rubricaId) {
                    data = await rubricasService.getRubricaById(rubricaId);
                }
                if (!data) {
                    setError("No hay rúbrica disponible para esta evaluación.");
                } else {
                    setRubrica(data);
                }
            } catch (err: any) {
                console.error(err);
                setError("Error al cargar la rúbrica");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [evaluationId, rubricaId]);

    if (loading) return <div>Cargando rúbrica...</div>;
    if (error) return <div style={{ color: "red" }}>{error}</div>;
    if (!rubrica) return <div>No encontrada.</div>;

    return (
        <div style={{ padding: 16 }}>
            <h1>{rubrica.titulo || "Rúbrica"}</h1>
            {rubrica.descripcion && <p style={{ marginBottom: 12 }}>{rubrica.descripcion}</p>}
            {rubrica.publicado_en && (
                <p className="text-sm text-gray-500">Publicada: {new Date(rubrica.publicado_en).toLocaleString()}</p>
            )}

            <div style={{ marginTop: 16 }}>
                {(rubrica.criterios || []).map((c: CriterioDto, idx: number) => (
                    <section key={c.id ?? idx} style={{ border: "1px solid #e5e7eb", padding: 12, borderRadius: 8, marginBottom: 12 }}>
                        <h3 style={{ margin: 0 }}>{c.nombre} <small style={{ color: '#6b7280' }}>({c.peso ?? 0}%)</small></h3>
                        {c.descripcion && <p style={{ marginTop: 6 }}>{c.descripcion}</p>}

                        <div style={{ marginTop: 8 }}>
                            <strong>Niveles</strong>
                            <ul>
                                {(c.escalas || []).length === 0 && <li style={{ color: '#6b7280' }}>No hay escalas definidas.</li>}
                                {(c.escalas || []).map((e: EscalaDto, i: number) => (
                                    <li key={e.id ?? i}>
                                        <div><strong>{e.nombre ?? `Nivel ${i + 1}`}</strong> {typeof e.valor === 'number' && <em>({e.valor})</em>}</div>
                                        {e.descripcion && <div style={{ color: '#374151' }}>{e.descripcion}</div>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default ConsultarRubrica;

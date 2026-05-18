import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SearchInput from "../../components/GenericSearch"; // 💡 Reutilizamos tu buscador
import GenericCard from "../../components/GenericCard";   // 💡 Usamos la nueva tarjeta genérica
import { Evaluacion } from "../../models/Evaluacion";
import { evaluationService } from "../../service/evaluationService";

const SelectEvaluation: React.FC = () => {
    const navigate = useNavigate();
    const [evaluations, setEvaluations] = useState<Evaluacion[]>([]);
    const [search, setSearch] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchEvaluations();
    }, []);

    const fetchEvaluations = async () => {
        setIsLoading(true);
        try {
            const data = await evaluationService.getEvaluations();
            setEvaluations(data);
        } catch (error) {
            console.error("Error cargando evaluaciones", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filtro usando la información de la evaluación
    const filteredEvaluations = useMemo(() => {
        if (!search.trim()) return evaluations;
        const text = search.toLowerCase();
        return evaluations.filter((ev) => 
            ev.name.toLowerCase().includes(text) || 
            (ev.description && ev.description.toLowerCase().includes(text))
        );
    }, [search, evaluations]);

    const handleSelectAction = (id: string) => {
        // Redirige al siguiente paso
        navigate(`/evaluations/${id}/assign-rubric`);
    };

    return (
        <div className="space-y-6">
            {/* ENCABEZADO */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                    Asociar Rúbrica a Evaluación
                </h2>
                <p className="text-sm text-gray-500">
                    Busca y selecciona la evaluación a la cual deseas vincular una rúbrica.
                </p>
            </div>

            {/* BUSCADOR GENÉRICO */}
            <div className="max-w-md">
                <SearchInput
                    label="Buscar evaluación"
                    placeholder="Ej: Parcial 1, Quiz de lógica..."
                    value={search}
                    onChange={setSearch}
                />
            </div>

            {/* GRILLA DE TARJETAS GENÉRICAS */}
            {isLoading ? (
                <div className="p-4 text-gray-500">Cargando evaluaciones...</div>
            ) : filteredEvaluations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvaluations.map((ev) => (
                        <GenericCard
                            key={ev.id}
                            id={ev.id!}
                            title={ev.name}
                            subtitle={`Peso: ${ev.weight}%`}
                            description={ev.description}
                            actionLabel="Asociar Rúbrica" // Personalizamos el texto del botón
                            onAction={handleSelectAction}
                            
                            // 💡 Aquí inyectamos la lógica ESPECÍFICA de evaluación dentro de la tarjeta genérica
                            customStatus={
                                ev.rubrica_id ? (
                                    <span className="text-xs text-green-700 font-medium bg-green-100 px-2 py-1 rounded">
                                        ✅ Ya tiene rúbrica
                                    </span>
                                ) : (
                                    <span className="text-xs text-orange-700 font-medium bg-orange-100 px-2 py-1 rounded">
                                        ⚠️ Sin rúbrica
                                    </span>
                                )
                            }
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center p-10 bg-gray-50 border border-dashed rounded-lg">
                    <p className="text-gray-500">No se encontraron resultados.</p>
                </div>
            )}
        </div>
    );
};

export default SelectEvaluation;
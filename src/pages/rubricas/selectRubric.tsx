import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SearchInput from "../../components/GenericSearch";
import GenericCard from "../../components/GenericCard";
import { Rubrica } from "../../models/Rubrica";
import { rubricService } from "../../service/rubricService";

/**
 * CU-09 — Paso 1: Seleccionar la Rúbrica a trabajar.
 * Solo se listan rúbricas con is_public = false (borradores),
 * que son las únicas editables para definir criterios y escalas.
 */
const Step1_SelectRubric: React.FC = () => {
    const navigate = useNavigate();
    const [rubrics, setRubrics] = useState<Rubrica[]>([]);
    const [search, setSearch] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchRubrics();
    }, []);

    const fetchRubrics = async () => {
        setIsLoading(true);
        try {
            const data = await rubricService.getRubrics();
            // Solo rúbricas en borrador (no publicadas) son editables
            const drafts = data.filter((r) => r.is_public === false && r.is_archived === false);
            setRubrics(drafts);
        } catch (error) {
            console.error("Error cargando rúbricas:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRubrics = useMemo(() => {
        if (!search.trim()) return rubrics;
        const text = search.toLowerCase();
        return rubrics.filter(
            (r) =>
                r.title.toLowerCase().includes(text) ||
                (r.description && r.description.toLowerCase().includes(text))
        );
    }, [search, rubrics]);

    const handleSelect = (rubricId: string) => {
        // Navegar al paso 2: seleccionar criterio de esa rúbrica
        navigate(`/rubrics/${rubricId}/define-scales/criteria`);
    };

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                    Definir Criterios y Escalas
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Selecciona la rúbrica (en borrador) en la que deseas definir los niveles de desempeño.
                </p>
            </div>

            {/* Buscador */}
            <div className="max-w-md">
                <SearchInput
                    label="Buscar rúbrica"
                    placeholder="Ej: Rúbrica de Programación..."
                    value={search}
                    onChange={setSearch}
                />
            </div>

            {/* Grid de tarjetas */}
            {isLoading ? (
                <div className="p-6 text-gray-400">Cargando rúbricas...</div>
            ) : filteredRubrics.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRubrics.map((rubric) => (
                        <GenericCard
                            key={rubric.id}
                            id={rubric.id!}
                            title={rubric.title}
                            subtitle="Borrador"
                            description={rubric.description}
                            actionLabel="Definir escalas"
                            onAction={handleSelect}
                            customStatus={
                                <span className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                                    📝 No publicada
                                </span>
                            }
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 bg-gray-50 border border-dashed rounded-lg">
                    <p className="text-gray-400 text-sm">
                        {search
                            ? "No se encontraron rúbricas con ese nombre."
                            : "No hay rúbricas en borrador disponibles. Crea una primero."}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Step1_SelectRubric;
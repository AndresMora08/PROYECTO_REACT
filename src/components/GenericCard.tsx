import React, { ReactNode } from "react";

export interface GenericCardProps {
    id: string;
    title: string;
    subtitle?: string;        // Ej: "Peso: 40%" o "Semestre 1"
    description?: string;     // Texto principal
    customStatus?: ReactNode; // 💡 Aquí puedes inyectar etiquetas HTML, íconos o badges personalizados
    actionLabel?: string;     // Texto del botón (por defecto "Seleccionar")
    onAction: (id: string) => void;
}

export const GenericCard: React.FC<GenericCardProps> = ({
    id,
    title,
    subtitle,
    description,
    customStatus,
    actionLabel = "Seleccionar",
    onAction
}) => {
    return (
        <div className="border rounded-lg shadow-sm p-5 bg-white hover:shadow-md transition-shadow flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1" title={title}>
                        {title}
                    </h3>
                    {subtitle && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded ml-2 whitespace-nowrap">
                            {subtitle}
                        </span>
                    )}
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {description || "Sin descripción proporcionada."}
                </p>

                {/* 💡 Espacio libre: si la vista padre le pasa un estado, se renderiza aquí */}
                {customStatus && (
                    <div className="mb-4">
                        {customStatus}
                    </div>
                )}
            </div>

            <button
                onClick={() => onAction(id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
                {actionLabel}
            </button>
        </div>
    );
};

export default GenericCard;
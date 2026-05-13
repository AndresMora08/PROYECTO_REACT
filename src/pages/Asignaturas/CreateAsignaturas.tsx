import React from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericForm from "../../components/GenericForm";
import { subjectService } from "../../service/subjectService";

const CreateSubject: React.FC = () => {

    const navigate = useNavigate();

    const handleSubmit = async (formData: Record<string, any>) => {
        try {
            await subjectService.createSubject({
                name:        formData.name,
                code:        formData.code,
                description: formData.description,
                credits:     Number(formData.credits),
            });

            Swal.fire({
                icon: "success",
                title: "Asignatura creada",
                text: "La asignatura fue registrada correctamente",
            });

            navigate("/subjects/list");

        } catch (error: any) {
            console.error(error);
            const msg = error?.response?.data?.message || "No se pudo crear la asignatura";
            Swal.fire({ icon: "error", title: "Error", text: msg });
        }
    };

    return (
        <div className="space-y-5">

            <div>
                <h2 className="text-2xl font-semibold text-black dark:text-white">
                    Nueva Asignatura
                </h2>
                <p className="text-sm text-gray-500">
                    Registra una nueva asignatura en el catálogo
                </p>
            </div>

            <GenericForm
                fields={[
                    { name: "code",        label: "Código",      type: "text" },
                    { name: "name",        label: "Nombre",      type: "text" },
                    { name: "description", label: "Descripción", type: "text" },
                    { name: "credits",     label: "Créditos",    type: "text" },
                ]}
                buttonLabel="Guardar asignatura"
                onSubmit={handleSubmit}
            />

        </div>
    );
};

export default CreateSubject;
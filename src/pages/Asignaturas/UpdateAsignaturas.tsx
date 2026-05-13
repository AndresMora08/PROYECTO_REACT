import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import GenericForm from "../../components/GenericForm";
import { Subject } from "../../models/Asignatura";
import { subjectService } from "../../service/subjectService";

const UpdateSubject: React.FC = () => {

    const navigate = useNavigate();
    const { id } = useParams();
    const [subject, setSubject] = useState<Subject | null>(null);

    useEffect(() => {
        if (id) fetchSubject(id);
    }, [id]);

    const fetchSubject = async (subjectId: string) => {
        const response = await subjectService.getSubjectById(subjectId);
        if (response) {
            setSubject(response);
        } else {
            Swal.fire({ icon: "error", title: "Error", text: "Asignatura no encontrada" });
            navigate("/subjects/list");
        }
    };

    // =====================================================
    // 🔹 ACTUALIZAR
    // =====================================================
    const handleSubmit = async (formData: Record<string, any>) => {
        if (!id) return;
        try {
            await subjectService.updateSubject(id, {
                name:        formData.name,
                code:        formData.code,
                description: formData.description,
                credits:     Number(formData.credits),
            });

            Swal.fire({ icon: "success", title: "Actualizada", text: "La asignatura fue actualizada correctamente" });
            navigate("/subjects/list");

        } catch (error: any) {
            const msg = error?.response?.data?.message || "No se pudo actualizar";
            Swal.fire({ icon: "error", title: "Error", text: msg });
        }
    };

    // =====================================================
    // 🔹 ARCHIVAR
    // =====================================================
    const handleArchive = () => {
        if (!id) return;
        Swal.fire({
            title: "¿Archivar esta asignatura?",
            text: "La asignatura no podrá usarse en nuevos planes ni grupos.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, archivar",
            cancelButtonText: "Cancelar",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await subjectService.archiveSubject(id);
                    Swal.fire({ icon: "success", title: "Archivada", text: "La asignatura fue archivada correctamente" });
                    navigate("/subjects/list");
                } catch (error) {
                    Swal.fire({ icon: "error", title: "Error", text: "No se pudo archivar la asignatura" });
                }
            }
        });
    };

    if (!subject) return <div className="p-4"><p>Cargando asignatura...</p></div>;

    return (
        <div className="space-y-5">

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-black dark:text-white">
                        Editar Asignatura
                    </h2>
                    <p className="text-sm text-gray-500">
                        Actualiza la información de la asignatura
                    </p>
                </div>

                {/* BOTÓN ARCHIVAR */}
                {subject.is_active && (
                    <button
                        type="button"
                        onClick={handleArchive}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                        Archivar asignatura
                    </button>
                )}
            </div>

            <GenericForm
                initialValues={{
                    code:        subject.code,
                    name:        subject.name,
                    description: subject.description || "",
                    credits:     subject.credits,
                }}
                fields={[
                    { name: "code",        label: "Código",      type: "text" },
                    { name: "name",        label: "Nombre",      type: "text" },
                    { name: "description", label: "Descripción", type: "text" },
                    { name: "credits",     label: "Créditos",    type: "text" },
                ]}
                buttonLabel="Guardar cambios"
                onSubmit={handleSubmit}
            />

        </div>
    );
};

export default UpdateSubject;
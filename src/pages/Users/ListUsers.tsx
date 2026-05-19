import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericTable from "../../components/GenericTable";
import SearchInput from "../../components/GenericSearch";
import { User } from "../../models/User";
import { userService } from "../../service/userService";

interface DisplayUser extends User {
    fullName: string;
}

const Users: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<DisplayUser[]>([]);
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [responseUsers, responseTeachers, responseStudents] = await Promise.all([
                userService.getUsers(),
                userService.getTeachers(),
                userService.getStudents()
            ]);

            const mergedUsers: DisplayUser[] = responseUsers.map((user) => {
                if (!user.id) {
                    return { ...user, fullName: "Usuario sin ID" };
                }
                if (user.code?.startsWith("TCH") || user.role === "TEACHER") {
                    const teacherProfile = responseTeachers.find(t => t.user_id === user.id);
                    return {
                        ...user,
                        fullName: teacherProfile 
                            ? `${teacherProfile.first_name} ${teacherProfile.last_name}` 
                            : "Docente sin Perfil"
                    };
                }
                if (user.code?.startsWith("STU") || user.role === "STUDENT") {
                    const studentProfile = responseStudents.find(s => s.user_id === user.id);
                    return {
                        ...user,
                        fullName: studentProfile 
                            ? `${studentProfile.first_name} ${studentProfile.last_name}` 
                            : "Estudiante sin Perfil"
                    };
                }
                return {
                    ...user,
                    fullName: user.role === "ADMIN" ? "Administrador" : "Sistema / Soporte"
                };
            });

            setData(mergedUsers);
        } catch (error) {
            Swal.fire({ 
                icon: "error", 
                title: "Error de Conexión", 
                text: "No se pudieron sincronizar los usuarios",
                customClass: { popup: 'rounded-3xl shadow-2xl border-none' }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: string, item: any) => {
        if (action === "edit") navigate(`/users/update/${item.id}`);
        else if (action === "disable") {
            if (!item.id) {
                Swal.fire("Error", "El usuario no posee un ID válido", "error");
                return;
            }

            const result = await Swal.fire({
                title: `<span class="text-slate-800">¿Desactivar usuario?</span>`,
                html: `Se suspenderá el acceso al sistema para <strong>${item.name || item.code}</strong>.`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, suspender acceso",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#dc2626",
                cancelButtonColor: "#64748b",
                customClass: {
                    popup: 'rounded-3xl border-none shadow-2xl',
                    confirmButton: 'rounded-xl px-6 py-2',
                    cancelButton: 'rounded-xl px-6 py-2'
                }
            });
            if (result.isConfirmed) {
                const success = await userService.deactivateUser(item.id); 
                if (success) {
                    Swal.fire({
                        icon: "success",
                        title: "Cuenta Desactivada",
                        showConfirmButton: false,
                        timer: 1500,
                        customClass: { popup: 'rounded-3xl shadow-2xl border-none' }
                    });
                    fetchData();
                }
            }
        }
    };

    const filtered = data.filter((item) => {
        const text = search.toLowerCase();
        if (!text) return true;
        return (
            item.fullName.toLowerCase().includes(text) ||
            item.code?.toLowerCase().includes(text) ||
            item.email?.toLowerCase().includes(text) ||
            item.role?.toLowerCase().includes(text)
        );
    });

    if (loading) return (
        <div className="flex min-h-[500px] items-center justify-center bg-slate-50/50 backdrop-blur-sm rounded-3xl">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-500/20"></div>
                <p className="text-slate-400 font-medium tracking-wide">Cargando directorio de usuarios...</p>
            </div>
        </div>
    );

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <style>{`
                @keyframes slideInUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes pulseSpecial {
                    0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(37, 99, 235, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
                }
                .stagger-1 { animation: slideInUp 0.5s ease-out forwards; }
                .stagger-2 { animation: slideInUp 0.5s ease-out 0.1s forwards; opacity: 0; }
                .stagger-3 { animation: slideInUp 0.5s ease-out 0.2s forwards; opacity: 0; }
                
                .btn-create-special {
                    animation: pulseSpecial 2s infinite;
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .btn-create-special:hover {
                    transform: translateY(-2px);
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.5);
                    animation: none; /* Detiene el pulso en hover para mayor control */
                }
            `}</style>

            <div className="stagger-1 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-8 gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                        Directorio de <span className="text-blue-700">Usuarios</span>
                    </h2>
                    <p className="mt-2 text-lg text-slate-500">
                        Gestión global de accesos, roles y perfiles institucionales.
                    </p>
                </div>
                <button 
                    onClick={() => navigate("/users/create")} 
                    className="btn-create-special flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl shadow-md"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Usuario
                </button>
            </div>

            <div className="stagger-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50">
                <SearchInput 
                    label="Búsqueda Avanzada" 
                    placeholder="Ej. Juan Pérez, STU-001, admin@correo.com..." 
                    value={search} 
                    onChange={setSearch} 
                />
            </div>
            
            <div className="stagger-3 rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/40 overflow-hidden transition-all hover:shadow-slate-300/50">
                <div className="p-1">
                    <GenericTable
                        data={filtered.map((item) => ({
                            id: item.id,
                            code: item.code,
                            name: item.fullName,
                            email: item.email,
                            role: item.role ?? "N/A",
                            status: item.is_active ? "Activo" : "Inactivo",
                            createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"
                        }))}
                        columns={["code", "name", "email", "role", "status", "createdAt"]}
                        actions={[
                            { name: "edit", label: "Editar Perfil" },
                            { name: "disable", label: "Suspender" }
                        ]}
                        onAction={handleAction}
                    />
                </div>
            </div>

            <div className="flex justify-center text-slate-300 text-xs tracking-widest uppercase py-4">
                Academic Management System • Advanced Interface
            </div>
        </div>
    );
};

export default Users;
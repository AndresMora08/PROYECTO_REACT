import React, { useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";

import GenericSearch from "../../components/GenericSearch";
import GenericTable from "../../components/GenericTable";
import { userService } from "../../service/userService";

type AdminUser = Record<string, any>;

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [careerFilter, setCareerFilter] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(Array.isArray(response) ? response : []);
      setLoading(false);
    };

    loadUsers();
  }, []);

  const careerOptions = useMemo(() => {
    const values = users
      .map((user) =>
        user.career_name ??
        user.carrera?.nombre ??
        user.carrera?.name ??
        user.matriculas?.[0]?.carrera?.nombre ??
        user.matriculas?.[0]?.career_name ??
        user.carrera_id ??
        "Sin carrera"
      )
      .filter(Boolean);

    return Array.from(new Set(values));
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.toLowerCase();
      const email = String(user.email ?? "").toLowerCase();
      const code = String(user.code ?? "").toLowerCase();
      const role = String(user.role ?? "").toLowerCase();
      const status = user.is_active ? "activo" : "inactivo";
      const career = String(
        user.career_name ??
          user.carrera?.nombre ??
          user.carrera?.name ??
          user.matriculas?.[0]?.carrera?.nombre ??
          user.matriculas?.[0]?.career_name ??
          user.carrera_id ??
          "Sin carrera"
      ).toLowerCase();

      const text = search.toLowerCase();
      const matchesText =
        !text ||
        fullName.includes(text) ||
        email.includes(text) ||
        code.includes(text);

      const matchesRole = !roleFilter || role === roleFilter.toLowerCase();
      const matchesStatus =
        !statusFilter || status === statusFilter.toLowerCase();
      const matchesCareer =
        !careerFilter || career === careerFilter.toLowerCase();

      return matchesText && matchesRole && matchesStatus && matchesCareer;
    });
  }, [careerFilter, roleFilter, search, statusFilter, users]);

  const handleAction = async (action: string, item: AdminUser) => {
    if (action === "edit") {
      Swal.fire({
        icon: "info",
        title: "Edición pendiente",
        text:
          "La pantalla de edición ya existe en usuarios, aquí puedes enlazarla o reutilizarla si quieres un módulo específico.",
      });
      return;
    }

    if (action === "disable") {
      const result = await Swal.fire({
        title: "¿Deseas desactivar este usuario?",
        text: "El usuario quedará inactivo sin eliminar el registro.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, desactivar",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        const success = await userService.deactivateUser(item.id);
        if (success) {
          Swal.fire({
            icon: "success",
            title: "Usuario desactivado",
          });
          const response = await userService.getUsers();
          setUsers(Array.isArray(response) ? response : []);
        }
      }
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">
          HU-01
        </p>
        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Gestionar usuarios
        </h1>
        <p className="text-sm text-gray-500">
          Aquí puedes crear, editar, desactivar y filtrar usuarios por rol,
          carrera y estado.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <GenericSearch
          label="Buscar"
          placeholder="Nombre, código o email"
          value={search}
          onChange={setSearch}
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Rol
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
          >
            <option value="">Todos</option>
            <option value="STUDENT">Estudiante</option>
            <option value="TEACHER">Docente</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
          >
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Carrera
          </label>
          <select
            value={careerFilter}
            onChange={(e) => setCareerFilter(e.target.value)}
            className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 outline-none dark:border-strokedark dark:bg-form-input dark:text-white"
          >
            <option value="">Todas</option>
            {careerOptions.map((career) => (
              <option key={career} value={career}>
                {career}
              </option>
            ))}
          </select>
        </div>
      </div>

      <GenericTable
        data={filteredUsers.map((user) => ({
          id: user.id,
          code: user.code ?? "-",
          name: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Sin nombre",
          email: user.email ?? "-",
          role: user.role ?? "-",
          career:
            user.career_name ??
            user.carrera?.nombre ??
            user.carrera?.name ??
            user.matriculas?.[0]?.carrera?.nombre ??
            user.matriculas?.[0]?.career_name ??
            user.carrera_id ??
            "Sin carrera",
          status: user.is_active ? "Activo" : "Inactivo",
        }))}
        columns={["code", "name", "email", "role", "career", "status"]}
        actions={[
          { name: "edit", label: "Editar" },
          { name: "disable", label: "Desactivar" },
        ]}
        onAction={handleAction}
        selectable={false}
      />
    </div>
  );
};

export default UsersManagement;
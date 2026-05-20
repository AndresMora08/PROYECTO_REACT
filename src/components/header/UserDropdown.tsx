import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/store";

import { clearUser } from "../../store/userSlice";
import SecurityService from "../../service/securityService";
import { userService } from "../../service/userService";

const UserDropdown = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState<string>("Usuario");

  const trigger = useRef<HTMLButtonElement>(null);
  const dropdown = useRef<HTMLDivElement>(null);

  // ================================
  // CARGAR NOMBRE REAL SEGÚN ROL
  // ================================
  useEffect(() => {
    const loadName = async () => {
      try {
        if (!user?.id) return;

        const role = (user.role || "").toUpperCase();

        // ================================
        // STUDENT
        // ================================
        if (role === "STUDENT") {
          const students = await userService.getStudents();

          const student = students.find(
            (s: any) =>
              s.user_id === user.id ||
              s.id === user.id ||
              s.email === user.email
          );

          if (student) {
            setFullName(
              `${student.first_name || ""} ${student.last_name || ""}`.trim()
            );
            return;
          }
        }

        // ================================
        // TEACHER
        // ================================
        if (role === "TEACHER") {
          const teachers = await userService.getTeachers();

          const teacher = teachers.find(
            (t: any) =>
              t.user_id === user.id ||
              t.id === user.id ||
              t.email === user.email
          );

          if (teacher) {
            setFullName(
              `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim()
            );
            return;
          }
        }

        // ================================
        // ADMIN
        // ================================
        if (role === "ADMIN") {
          // Intentar usar nombre del usuario directamente
          if ((user as any).first_name || (user as any).last_name) {
            setFullName(
              `${(user as any).first_name || ""} ${
                (user as any).last_name || ""
              }`.trim()
            );
            return;
          }

          // Intentar usar propiedad name
          if ((user as any).name) {
            setFullName((user as any).name);
            return;
          }

          // Fallback con email
          if (user.email) {
            const emailName = user.email.split("@")[0];
            setFullName(emailName);
            return;
          }
        }

        // ================================
        // FALLBACK GENERAL
        // ================================
        if (user.email) {
          setFullName(user.email.split("@")[0]);
        }
      } catch (error) {
        console.error("Error cargando nombre:", error);

        if (user?.email) {
          setFullName(user.email.split("@")[0]);
        }
      }
    };

    loadName();
  }, [user]);

  // ================================
  // CLICK FUERA DEL DROPDOWN
  // ================================
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!dropdown.current || !trigger.current) return;

      if (
        dropdown.current.contains(target) ||
        trigger.current.contains(target)
      ) {
        return;
      }

      setDropdownOpen(false);
    };

    document.addEventListener("click", handler);

    return () => document.removeEventListener("click", handler);
  }, []);

  // ================================
  // ESC PARA CERRAR
  // ================================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ================================
  // LOGOUT
  // ================================
  const handleLogout = () => {
    SecurityService.logout();

    dispatch(clearUser());

    setDropdownOpen(false);

    navigate("/signin");
  };

  const firstLetter = fullName.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        ref={trigger}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center text-gray-700 dark:text-gray-400"
      >
        {/* Avatar */}
        <span className="mr-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white font-bold uppercase">
          {firstLetter || "U"}
        </span>

        {/* Nombre */}
        <span className="hidden lg:block text-left">
          <span className="block font-medium text-black dark:text-white">
            {fullName}
          </span>

          <span className="block text-xs text-gray-500">
            {user?.role || "Usuario"}
          </span>
        </span>
      </button>

      {/* Dropdown */}
      <div
        ref={dropdown}
        className={`absolute right-0 mt-4 w-[260px] rounded-2xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900 ${
          dropdownOpen ? "block" : "hidden"
        }`}
      >
        {/* Header */}
        <div className="border-b border-gray-200 pb-3 dark:border-gray-700">
          <p className="font-medium text-black dark:text-white">
            {fullName}
          </p>

          <p className="text-sm text-gray-500">
            {user?.email}
          </p>
        </div>

        {/* Links */}
        <ul className="border-b border-gray-200 py-3 dark:border-gray-700">
          <li>
            <Link
              to="/profile"
              onClick={() => setDropdownOpen(false)}
              className="block rounded-lg px-3 py-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Mi perfil
            </Link>
          </li>

          <li>
            <Link
              to="/settings"
              onClick={() => setDropdownOpen(false)}
              className="block rounded-lg px-3 py-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Configuración
            </Link>
          </li>
        </ul>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-2 w-full rounded-lg px-3 py-2 text-left text-red-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default UserDropdown;
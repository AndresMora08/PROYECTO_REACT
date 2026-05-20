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
  const navigate = useNavigate(); // ✅ IMPORTANTE

  const [fullName, setFullName] = useState<string>("Usuario");

  const trigger = useRef<HTMLButtonElement>(null);
  const dropdown = useRef<HTMLDivElement>(null);

  // ================================
  // NOMBRE REAL
  // ================================
  useEffect(() => {
    const loadName = async () => {
      if (!user?.id) return;

      const role = (user.role || "").toUpperCase();

      if (role === "STUDENT") {
        const students = await userService.getStudents();
        const student = students.find((s) => s.user_id === user.id);

        if (student) {
          setFullName(`${student.first_name} ${student.last_name}`);
        }
      }

      if (role === "TEACHER") {
        const teachers = await userService.getTeachers();
        const teacher = teachers.find((t) => t.user_id === user.id);

        if (teacher) {
          setFullName(`${teacher.first_name} ${teacher.last_name}`);
        }
      }
    };

    loadName();
  }, [user]);

  // ================================
  // CLICK OUTSIDE
  // ================================
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!dropdown.current || !trigger.current) return;

      if (
        dropdown.current.contains(target) ||
        trigger.current.contains(target)
      ) return;

      setDropdownOpen(false);
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // ================================
  // ESC
  // ================================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ================================
  // LOGOUT (CORREGIDO)
  // ================================
  const handleLogout = () => {
    SecurityService.logout();
    dispatch(clearUser());
    setDropdownOpen(false);

    navigate("/signin"); // ✅ REDIRECCIÓN AQUÍ
  };

  const firstLetter = fullName.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        ref={trigger}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center text-gray-700 dark:text-gray-400"
      >
        <span className="mr-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white font-bold uppercase">
          {firstLetter || "U"}
        </span>

        <span className="hidden lg:block text-left">
          <span className="block font-medium text-black dark:text-white">
            {fullName}
          </span>

          <span className="block text-xs text-gray-500">
            {user?.role || "Usuario"}
          </span>
        </span>
      </button>

      <div
        ref={dropdown}
        className={`absolute right-0 mt-4 w-[260px] rounded-2xl border bg-white p-3 shadow-lg dark:bg-gray-900 ${
          dropdownOpen ? "block" : "hidden"
        }`}
      >
        <div className="pb-3 border-b">
          <p className="font-medium">{fullName}</p>
        </div>

        <ul className="pt-3 pb-3 border-b">
          <li>
            <Link
              to="/profile"
              onClick={() => setDropdownOpen(false)}
              className="block px-3 py-2 hover:bg-gray-100 rounded-lg"
            >
              Mi perfil
            </Link>
          </li>

          <li>
            <Link
              to="/settings"
              onClick={() => setDropdownOpen(false)}
              className="block px-3 py-2 hover:bg-gray-100 rounded-lg"
            >
              Configuración
            </Link>
          </li>
        </ul>

        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 mt-2 text-red-500 hover:bg-gray-100 rounded-lg"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default UserDropdown;
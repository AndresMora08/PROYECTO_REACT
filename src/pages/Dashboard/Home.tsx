import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { userService } from "../../service/userService";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  const user = useSelector((state: RootState) => state.user.user);
  const [fullName, setFullName] = useState<string>("Usuario");

  // ========================================================
  // MISMA LÓGICA DE TU STORE / DROPDOWN PARA CARGAR EL NOMBRE
  // ========================================================
  useEffect(() => {
    const loadName = async () => {
      try {
        if (!user?.id) return;

        const role = (user.role || "").toUpperCase();

        if (role === "STUDENT") {
          const students = await userService.getStudents();
          const student = students.find(
            (s: any) =>
              s.user_id === user.id ||
              s.id === user.id ||
              s.email === user.email
          );
          if (student) {
            setFullName(`${student.first_name || ""} ${student.last_name || ""}`.trim());
            return;
          }
        }

        if (role === "TEACHER") {
          const teachers = await userService.getTeachers();
          const teacher = teachers.find(
            (t: any) =>
              t.user_id === user.id ||
              t.id === user.id ||
              t.email === user.email
          );
          if (teacher) {
            setFullName(`${teacher.first_name || ""} ${teacher.last_name || ""}`.trim());
            return;
          }
        }

        if (role === "ADMIN") {
          if ((user as any).first_name || (user as any).last_name) {
            setFullName(`${(user as any).first_name || ""} ${(user as any).last_name || ""}`.trim());
            return;
          }
          if ((user as any).name) {
            setFullName((user as any).name);
            return;
          }
          if (user.email) {
            setFullName(user.email.split("@")[0]);
            return;
          }
        }

        if (user.email) {
          setFullName(user.email.split("@")[0]);
        }
      } catch (error) {
        console.error("Error cargando nombre en Home:", error);
        if (user?.email) {
          setFullName(user.email.split("@")[0]);
        }
      }
    };

    loadName();
  }, [user]);

  const userRole = user?.role ? user.role.toUpperCase() : "PORTAL";
  const isAdmin = userRole === "ADMIN";

  return (
    <>
      <PageMeta
        title="Inicio | Sistema de Gestión Académica"
        description="Portal principal del Sistema de Gestión Académica, Rúbricas y Evaluaciones."
      />

      {/* Contenedor principal con grid y animación de entrada */}
      <div className="grid grid-cols-12 gap-4 md:gap-6 lg:gap-8 dynamic-fade-in">
        
        {/* Banner de Bienvenida Estilizado de Gran Tamaño */}
        <div className={`col-span-12 rounded-2xl bg-white p-8 dark:bg-boxdark sm:p-12 shadow-lg flex items-center min-h-[65vh] transition-all duration-300 transform hover:scale-[1.002] ${
          isAdmin 
            ? "border-l-6 border-amber-500 shadow-amber-500/5 dark:shadow-amber-500/2 animate-gold-pulse" 
            : "border-l-6 border-primary"
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
            
            {/* Bloque Izquierdo: Textos de Bienvenida */}
            <div className="space-y-6 lg:col-span-7">
              
              {/* Badge de Sesión condicional */}
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                isAdmin 
                  ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20 shadow-sm" 
                  : "bg-primary/10 text-primary dark:bg-primary/20"
              }`}>
                {isAdmin ? "👑 Super Administrador" : `Sesión Activa • {userRole}`}
              </span>

              {/* Título de Bienvenida con el Nombre Animado y Brillante */}
              <h1 className="text-4xl font-extrabold text-black dark:text-white md:text-5xl lg:text-6xl tracking-tighter leading-tight">
                ¡Hola de nuevo,<br/> 
                <span className={`inline-block text-shimmer font-black pb-1 ${
                  isAdmin ? "text-shimmer-gold" : "text-shimmer-blue"
                }`}>
                  {fullName}
                </span>! 👋
              </h1>

              <p className="text-lg text-body dark:text-bodydark md:text-xl leading-relaxed max-w-xl">
                Te damos la bienvenida a tu panel principal. Para comenzar a trabajar, explora y utiliza el <strong className="text-black dark:text-white">menú desplegable ubicado en la parte izquierda</strong> de la pantalla, donde encontrarás todas las herramientas habilitadas para tu perfil.
              </p>
            </div>

            {/* Bloque Derecho: Icono SVG Limpio */}
            <div className="hidden lg:flex lg:col-span-5 justify-center items-center opacity-85 dark:opacity-75">
              <svg 
                className={`w-56 h-56 transition-all duration-500 ${
                  isAdmin ? "text-amber-500/20 dark:text-amber-400/10 scale-105" : "text-primary/20 dark:text-white/10"
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.232.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.232.477-4.5 1.253" 
                />
              </svg>
            </div>

          </div>
        </div>

      </div>

      {/* Estilos para animaciones de entrada, pulso y el Brillo del Nombre */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes goldPulse {
          0% { border-color: #f59e0b; box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.05); }
          50% { border-color: #fbbf24; box-shadow: 0 10px 25px -3px rgba(245, 158, 11, 0.15); }
          100% { border-color: #f59e0b; box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.05); }
        }
        @keyframes shimmerEffect {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .dynamic-fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .animate-gold-pulse {
          animation: goldPulse 3s ease-in-out infinite;
        }

        /* Base para el texto con brillo metálico */
        .text-shimmer {
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmerEffect 4s linear infinite;
        }
        /* Brillo Azul (General) */
        .text-shimmer-blue {
          background-image: linear-gradient(to right, #3C50E0 0%, #10B981 25%, #6577F3 50%, #10B981 75%, #3C50E0 100%);
        }
        /* Brillo Dorado (Admin) */
        .text-shimmer-gold {
          background-image: linear-gradient(to right, #d97706 0%, #fcd34d 25%, #f59e0b 50%, #fcd34d 75%, #d97706 100%);
        }
      `}</style>
    </>
  );
}
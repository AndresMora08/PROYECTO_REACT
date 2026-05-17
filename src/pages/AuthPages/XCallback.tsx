import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import securityService from "../../service/securityService";
import Swal from "sweetalert2";

export default function XCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const errorParam = searchParams.get("error");
        
        console.log("X Callback - Code:", code);
        console.log("X Callback - Error param:", errorParam);
        
        if (errorParam) {
          const errorDesc = searchParams.get("error_description") || "X authentication was cancelled";
          setError(errorDesc);
          Swal.fire({
            icon: "error",
            title: "X Auth Failed",
            text: errorDesc,
          });
          setTimeout(() => navigate("/signin"), 3000);
          setLoading(false);
          return;
        }
        
        if (!code) {
          const msg = "No authorization code received from X";
          setError(msg);
          console.error(msg);
          Swal.fire({
            icon: "error",
            title: "Authentication Failed",
            text: msg,
          });
          setTimeout(() => navigate("/signin"), 3000);
          setLoading(false);
          return;
        }

        console.log("Processing X callback with code:", code);
        
        // Procesa el callback de X
        const user = await securityService.handleXCallback(code);
        
        console.log("X authentication successful:", user);
        
        Swal.fire({
          icon: "success",
          title: "Welcome!",
          text: `Logged in as ${user.nombre || user.email}`,
          timer: 2000,
        });
        
        // Redirige al dashboard
        setLoading(false);
        navigate("/");
      } catch (err: any) {
        console.error("X callback error:", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to authenticate with X";
        setError(errorMessage);
        
        Swal.fire({
          icon: "error",
          title: "Authentication Error",
          text: errorMessage,
          didClose: () => navigate("/signin"),
        });
        
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (!loading && error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
            Error de Autenticación
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <p className="text-gray-600 dark:text-gray-400">
            Redirigiendo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-blue-600 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
          Autenticando con X...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Por favor espera mientras procesamos tu solicitud.
        </p>
      </div>
    </div>
  );
}

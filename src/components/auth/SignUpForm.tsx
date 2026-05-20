import { useState } from "react";
import { Link } from "react-router";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import securityService from "../../service/securityService";
import { userService } from "../../service/userService";

export default function SignUpForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });

  const handleChange = (name: string, value: string) => {
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const buildStudentCode = (email: string) => {
    const normalized = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const suffix = Date.now().toString().slice(-4);
    return `STU-${(normalized || "USER").slice(0, 8)}-${suffix}`;
  };

  const buildIdentification = (email: string, role: string) => {
    const prefix = role === "ADMIN" ? "ADM" : role === "TEACHER" ? "TCH" : "STU";
    const normalized = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const suffix = Date.now().toString().slice(-4);
    return `${prefix}-${(normalized || "USER").slice(0, 8)}-${suffix}`;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isChecked) {
      Swal.fire({
        icon: "warning",
        title: "Acepta los términos",
        text: "Debes aceptar las condiciones para continuar.",
      });
      return;
    }

    const email = formData.email.trim();
    const password = formData.password.trim();
    const firstName = formData.first_name.trim();
    const lastName = formData.last_name.trim();
    const role = formData.role;

    if (!email || !password || !firstName || !lastName || !role) {
      Swal.fire({
        icon: "warning",
        title: "Completa el formulario",
        text: "Todos los campos son obligatorios.",
      });
      return;
    }

    try {
      setLoading(true);

      const code =
        role === "ADMIN"
          ? `ADM-${Date.now().toString().slice(-6)}`
          : role === "TEACHER"
          ? `TCH-${Date.now().toString().slice(-6)}`
          : buildStudentCode(email);

      const identification = buildIdentification(email, role);

      if (role === "ADMIN") {
        await securityService.registerAdmin({
          email,
          password,
          code,
          first_name: firstName,
          last_name: lastName,
          identification,
        });
      } else if (role === "TEACHER") {
        await userService.registerTeacher({
          email,
          password,
          code,
          role,
          first_name: firstName,
          last_name: lastName,
          identification,
          phone: null,
          specialty: null,
        });
      } else {
        await userService.registerStudent({
          email,
          password,
          code,
          role,
          first_name: firstName,
          last_name: lastName,
          identification,
        });
      }

      Swal.fire({
        icon: "success",
        title: "Cuenta creada",
        text: "Tu registro fue exitoso. Ahora puedes iniciar sesión.",
      });

      navigate("/signin");
    } catch (error) {
      console.error("Error al registrar estudiante:", error);
      Swal.fire({
        icon: "error",
        title: "No se pudo registrar la cuenta",
        text: "Verifica que el correo, la cédula o el código no estén duplicados.",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign up!
            </p>
          </div>
          <div>
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                  Or
                </span>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* <!-- First Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      First Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="fname"
                      name="fname"
                      placeholder="Enter your first name"
                      value={formData.first_name}
                      onChange={(e: any) => handleChange("first_name", e.target.value)}
                    />
                  </div>
                  {/* <!-- Last Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Last Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="lname"
                      name="lname"
                      placeholder="Enter your last name"
                      value={formData.last_name}
                      onChange={(e: any) => handleChange("last_name", e.target.value)}
                    />
                  </div>
                </div>
                {/* <!-- Email --> */}
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e: any) => handleChange("email", e.target.value)}
                  />
                </div>
                <div>
                  <Label>
                    Role<span className="text-error-500">*</span>
                  </Label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    className="w-full rounded-md border border-stroke bg-transparent py-3 px-4 outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="STUDENT">Estudiante</option>
                    <option value="TEACHER">Profesor</option>
                  </select>
                </div>
                {/* <!-- Password --> */}
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e: any) => handleChange("password", e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                {/* <!-- Checkbox --> */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    By creating an account means you agree to the{" "}
                    <span className="text-gray-800 dark:text-white/90">
                      Terms and Conditions,
                    </span>{" "}
                    and our{" "}
                    <span className="text-gray-800 dark:text-white">
                      Privacy Policy
                    </span>
                  </p>
                </div>
                {/* <!-- Button --> */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Creating account..." : "Sign Up"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account? {""}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

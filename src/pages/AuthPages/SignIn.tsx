// src/components/SignInForm.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GenericForm from "../../components/GenericForm"; 
import securityService from "../../service/securityService";
import { userService } from "../../service/userService"; 

// Firebase
import { auth } from "../../firebase"; 
import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider, AuthProvider } from "firebase/auth";

const Logotypes = {
    Google: () => (
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
    ),
    GitHub: () => (
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="github" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="currentColor" d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.5 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5.7 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-.7zm-14.4-1.7c-1.3 1.3-.7 4.3 1.6 6.2 2.3 2.3 5.2 2.6 6.5.7 1.3-1.3.7-4.3-1.6-6.2-2.2-2.3-5.2-2.6-6.5-.7z"></path></svg>
    ),
    Microsoft: () => (
        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23"><path fill="#f3f3f3" d="M0 0h23v23H0z"/><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
    )
};

export default function SignInForm() {
    const navigate = useNavigate();

    const formFields = [
        { name: "email", label: "Correo Electrónico", type: "email" },
        { name: "password", label: "Contraseña", type: "password" }
    ];

    const handleLogin = async (data: Record<string, any>) => {
        try {
            await securityService.login({
                email: data.email,
                password: data.password
            });
            Swal.fire({ icon: "success", title: "¡Bienvenido!", text: "Sesión iniciada correctamente.", timer: 2000, showConfirmButton: false });
            navigate("/"); 
        } catch (error) {
            Swal.fire({ icon: "error", title: "Error de acceso", text: "Correo o contraseña incorrectos. Por favor, intenta de nuevo." });
        }
    };

    const handleSocialLogin = async (provider: AuthProvider, providerName: string) => {
        try {
            // 1. Obtener datos de Firebase
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;
            
            if (!firebaseUser.email) {
                throw new Error("El proveedor no devolvió un correo electrónico válido.");
            }

            // 2. Traer todos los usuarios del backend para verificar la cuenta base
            const allUsers = await userService.getUsers();
            const existingUser = allUsers.find(u => u.email === firebaseUser.email);

            if (!existingUser) {
                Swal.fire({
                    icon: "warning",
                    title: "Cuenta no registrada",
                    text: `El correo ${firebaseUser.email} no está registrado. Por favor, realiza tu registro académico primero.`,
                    confirmButtonText: "Ir a Registro",
                    confirmButtonColor: "#3b82f6"
                }).then(() => {
                    navigate("/signup"); 
                });
                return;
            }

            // 3. 🔹 CRÍTICO: Buscar el perfil específico (Student o Teacher) para obtener el First Name
            let userFirstName = "";
            const userRole = existingUser.role?.toUpperCase();

            try {
                if (userRole === "STUDENT") {
                    const students = await userService.getStudents();
                    // Buscamos cruzando por id, por una propiedad user_id o por email de forma segura
                    const studentProfile = students.find(
                        (s: any) => s.id === existingUser.id || s.user_id === existingUser.id || s.email === existingUser.email
                    );
                    if (studentProfile) {
                        userFirstName = studentProfile.first_name;
                    }
                } else if (userRole === "TEACHER") {
                    const teachers = await userService.getTeachers();
                    const teacherProfile = teachers.find(
                        (t: any) => t.id === existingUser.id || t.user_id === existingUser.id || t.email === existingUser.email
                    );
                    if (teacherProfile) {
                        userFirstName = teacherProfile.first_name;
                    }
                }
            } catch (profileError) {
                console.error("Error intentando obtener el perfil académico detallado:", profileError);
            }

            // Fallback por si las moscas el perfil no tiene el campo poblado, usamos el de Firebase
            if (!userFirstName) {
                userFirstName = firebaseUser.displayName?.split(" ")[0] || "Usuario";
            }

            // 4. Si pasa las validaciones, iniciar sesión en nuestra app
            const token = await firebaseUser.getIdToken();
            await securityService.loginWithValidatedSocialUser(existingUser, token);

            Swal.fire({
                icon: "success",
                title: `¡Bienvenido, ${userFirstName}!`,
                text: `Sesión iniciada correctamente con ${providerName}.`,
                timer: 2500,
                showConfirmButton: false
            });
            
            navigate("/"); 

        } catch (error: any) {
            console.error(`Error de autenticación con ${providerName}:`, error);
            if (error.code !== "auth/popup-closed-by-user") {
                Swal.fire({
                    icon: "error",
                    title: "Error de acceso",
                    text: `No se pudo completar la autenticación social.`,
                });
            }
        }
    };

    const loginGoogle = () => handleSocialLogin(new GoogleAuthProvider(), "Google");
    const loginGitHub = () => handleSocialLogin(new GithubAuthProvider(), "GitHub");

    return (
        <div className="flex flex-col flex-1">
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                        Iniciar Sesión
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Accede a tu cuenta académica
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-6">
                    <button type="button" onClick={loginGoogle} className="flex w-full items-center justify-center rounded-lg border border-stroke bg-white p-3 text-sm font-medium hover:bg-gray-50 dark:border-stroke dark:bg-boxdark dark:hover:bg-opacity-90">
                        <Logotypes.Google /> Iniciar con Google
                    </button>
                    
                    <button type="button" className="flex w-full items-center justify-center rounded-lg border border-stroke bg-white p-3 text-sm font-medium hover:bg-gray-50 dark:border-stroke dark:bg-boxdark dark:hover:bg-opacity-90">
                        <Logotypes.Microsoft /> Iniciar con Microsoft
                    </button>
                    
                    <button type="button" onClick={loginGitHub} className="flex w-full items-center justify-center rounded-lg border border-stroke bg-white p-3 text-sm font-medium hover:bg-gray-50 dark:border-stroke dark:bg-boxdark dark:hover:bg-opacity-90">
                        <Logotypes.GitHub /> Iniciar con GitHub
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-gray-500 dark:bg-gray-900">O usa tu correo</span></div>
                </div>

                <GenericForm fields={formFields} buttonLabel="Entrar al Sistema" onSubmit={handleLogin} />

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-700 dark:text-gray-400">
                        ¿No tienes cuenta? {" "}
                        <Link to="/signup" className="text-primary hover:underline">
                            Regístrate aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
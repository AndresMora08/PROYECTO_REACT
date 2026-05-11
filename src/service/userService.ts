import axios from "axios";

import { User } from "../models/User";
import { Teacher } from "../models/Docente";
import { Student } from "../models/Estudiante";

// =====================================================
// 🔹 URL BASE
// =====================================================

const API_URL =
    import.meta.env.VITE_API_URL + "/api/users";

class UserService {

    // =====================================================
    // 🔹 OBTENER TODOS
    // =====================================================
async getUsers(): Promise<User[]> {

    try {

        const response =
            await axios.get(
                `${API_URL}`
            );

        console.log(
            "RESPONSE:",
            response.data
        );

        // 🔹 Retornar el arreglo real
        return response.data.data || [];

    } catch (error) {

        console.error(
            "Error al obtener usuarios:",
            error
        );

        return [];

    }

}

    // =====================================================
    // 🔹 OBTENER POR ID
    // =====================================================

    async getUserById(
        id: number
    ): Promise<User | null> {

        try {

            const response =
                await axios.get<User>(
                    `${API_URL}/${id}`
                );

            return response.data;

        } catch (error) {

            console.error(
                "Usuario no encontrado:",
                error
            );

            return null;

        }

    }

    // =====================================================
    // 🔹 REGISTRAR DOCENTE
    // =====================================================

    async registerTeacher(
        teacher: Omit<Teacher, "id">
    ): Promise<Teacher | null> {

        try {

            const response =
                await axios.post<Teacher>(

                    `${API_URL}/public/register-teacher`,

                    {

                        email:
                            teacher.email,

                        password:
                            teacher.password,

                        code:
                            teacher.code,

                        role:
                            teacher.role,

                        first_name:
                            teacher.firstName,

                        last_name:
                            teacher.lastName,

                        identification:
                            teacher.identification,

                        phone:
                            teacher.phone,

                        specialty:
                            teacher.speciality

                    }

                );

            return response.data;

        } catch (error) {

            console.error(
                "Error al registrar docente:",
                error
            );

            return null;

        }

    }

    // =====================================================
    // 🔹 REGISTRAR ESTUDIANTE
    // =====================================================

    async registerStudent(student: Omit<Student, "id">): Promise<Student | null> {

    try {

        const response = await axios.post<Student>(

            `${API_URL}/public/register-student`,

            {
                email: student.email,
                password: student.password,
                code: student.code,
                role: student.role,
                first_name: student.firstName,
                last_name: student.lastName,
                identification: student.identification
            }

        );

        // ✔️ CAMBIO AQUÍ (más seguro)
        return response.data ?? null;

    } catch (error) {

        console.error("Error al registrar estudiante:", error);

        return null;

    }
}

    // =====================================================
    // 🔹 ACTUALIZAR
    // =====================================================

    async updateUser(
    id: number,
    user: Partial<User & Student & Teacher>
): Promise<User | null> {

    try {

        const response =
            await axios.put<User>(

                `${API_URL}/${id}`,

                user

            );

        return response.data;

    } catch (error) {

        console.error(
            "Error al actualizar usuario:",
            error
        );

        return null;

    }

}

    // =====================================================
    // 🔹 ELIMINAR
    // =====================================================

    async deleteUser(
        id: number
    ): Promise<boolean> {

        try {

            await axios.delete(
                `${API_URL}/${id}`
            );

            return true;

        } catch (error) {

            console.error(
                "Error al eliminar usuario:",
                error
            );

            return false;

        }

    }

    // =====================================================
    // 🔹 BUSCAR
    // =====================================================

    async searchUsers(params: {

        first_name?: string;

        code?: string;

        identification?: string;

    }): Promise<User[]> {

        try {

            const response =
                await axios.get(
                    `${API_URL}/search`,
                    {
                        params
                    }
                );

            console.log(
                "SEARCH RESPONSE:",
                response.data
            );

            // 🔹 Validar respuesta
            if (response.data.data) {

                return response.data.data;

            }

            return response.data;

        } catch (error) {

            console.error(
                "Error al buscar usuarios:",
                error
            );

            return [];

        }

    }

    // =====================================================
    // 🔹 DESACTIVAR
    // =====================================================

    async deactivateUser(
        id: number
    ): Promise<boolean> {

        try {

            await axios.patch(
                `${API_URL}/${id}/deactivate`
            );

            return true;

        } catch (error) {

            console.error(
                "Error al desactivar usuario:",
                error
            );

            return false;

        }

    }

}

export const userService =
    new UserService();
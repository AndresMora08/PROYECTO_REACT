

import axios from "axios";

import { User } from "../models/User";
import { Teacher } from "../models/Docente";
import { Student } from "../models/Estudiante";


const API_URL = "http://127.0.0.1:5000/api/users";

class UserService {
    // ... resto igual

    // =====================================================
    // 🔹 OBTENER TODOS
    // =====================================================
async getUsers(): Promise<User[]> {

    try {

        const response = await axios.get("http://127.0.0.1:5000/api/users");

        console.log("FULL RESPONSE:", response);
        console.log("DATA:", response.data);

        // ✔️ MISMA LÓGICA QUE YA FUNCIONA PERO SEGURA
        return response.data.data ?? [];

    } catch (error) {

        console.error("Error al obtener usuarios:", error);

        return [];

    }

}

    // =====================================================
    // 🔹 OBTENER POR ID
    // =====================================================

   async getUserById(id: number): Promise<User | null> {
    try {
        const response = await axios.get<any>(
            `http://127.0.0.1:5000/api/users/${id}`
        );
        // ✅ igual que getUsers
        console.log("RESPONSE COMPLETO:", response);        // ← agrega
        console.log("RESPONSE.DATA:", response.data);       // ← agrega
        console.log("RESPONSE.DATA.DATA:", response.data.data); //
        return response.data.data ?? response.data;
    } catch (error) {
        console.error("Usuario no encontrado:", error);
        console.error("Error al obtener usuario por ID:", error);
        return null;
    }
}

    // =====================================================
    // 🔹 REGISTRAR DOCENTE
    // =====================================================

   async registerStudent(
    student: Omit<Student, "id">
): Promise<Student | null> {

    // Sin try/catch → el error sube al Swal de CreateUser
    const response = await axios.post<Student>(
        `${API_URL}/public/register-student`,
        {
            email:          student.email,
            password:       student.password,
            code:           student.code,
            role:           student.role,
            first_name:     student.firstName,   // ✅ snake_case
            last_name:      student.lastName,    // ✅ snake_case
            identification: student.identification
        }
    );

    return response.data;
}

async registerTeacher(
    teacher: Omit<Teacher, "id">
): Promise<Teacher | null> {

    const response = await axios.post<Teacher>(
        `${API_URL}/public/register-teacher`,
        {
            email:          teacher.email,
            password:       teacher.password,
            code:           teacher.code,
            role:           teacher.role,
            first_name:     teacher.firstName,   // ✅ snake_case
            last_name:      teacher.lastName,    // ✅ snake_case
            identification: teacher.identification,
            phone:          teacher.phone,
            specialty:      teacher.speciality   // ✅ sin "i" al final
        }
    );

    return response.data;
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

                `${"http://127.0.0.1:5000"}/api/users/${id}`,

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
                `${"http://127.0.0.1:5000"}/api/users/${id}`
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
                    `${"http://127.0.0.1:5000"}/api/users/search`,
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
                `${"http://127.0.0.1:5000"}/api/users/${id}/deactivate`
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
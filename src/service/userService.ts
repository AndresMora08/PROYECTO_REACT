import axios from "axios";
import { User } from "../models/User";
import { Teacher } from "../models/Docente";
import { Student } from "../models/Estudiante";

const API_URL = "http://127.0.0.1:5000/api/users";

// 🔹 DTOs (Data Transfer Objects) para los formularios de registro público,
// ya que el backend espera tanto los datos de la cuenta de usuario como del perfil.
export interface RegisterStudentDTO {
    email: string;
    password?: string;
    code: string;
    role?: string;
    first_name: string;
    last_name: string;
    identification: string;
}

export interface RegisterTeacherDTO {
    email: string;
    password?: string;
    code: string;
    role?: string;
    first_name: string;
    last_name: string;
    identification: string;
    phone?: string | null;
    specialty?: string | null;
}

class UserService {
    async getUsers(): Promise<User[]> {
        try {
            const response = await axios.get(API_URL);
            // Acceso seguro: soporta si la API devuelve el array directo o envuelto en .data
            return response.data.data ?? response.data ?? [];
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            return [];
        }
    }

    // 💡 CORRECCIÓN: Los IDs en tu backend son UUIDs (strings)
    async getUserById(id: string): Promise<User | null> {
        try {
            const response = await axios.get(`${API_URL}/${id}`);
            return response.data.data ?? response.data ?? null;
        } catch (error) {
            console.error("Error al obtener usuario por ID:", error);
            return null;
        }
    }

    // 💡 CORRECCIÓN: Tipado con la interfaz de registro combinado
    async registerStudent(student: RegisterStudentDTO): Promise<any> {
        try {
            const response = await axios.post(`${API_URL}/public/register-student`, {
                email: student.email,
                password: student.password,
                code: student.code,
                role: student.role ?? "STUDENT",
                first_name: student.first_name,
                last_name: student.last_name,
                identification: student.identification
            });
            return response.data.data ?? response.data;
        } catch (error) {
            console.error("Error al registrar estudiante:", error);
            throw error;
        }
    }

    // 💡 CORRECCIÓN: Se usa 'specialty' de forma correcta y tipado limpio
    async registerTeacher(teacher: RegisterTeacherDTO): Promise<any> {
        try {
            const response = await axios.post(`${API_URL}/public/register-teacher`, {
                email: teacher.email,
                password: teacher.password,
                code: teacher.code,
                role: teacher.role ?? "TEACHER",
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                identification: teacher.identification,
                phone: teacher.phone ?? null,
                specialty: teacher.specialty ?? null 
            });
            return response.data.data ?? response.data;
        } catch (error) {
            console.error("Error al registrar docente:", error);
            throw error;
        }
    }

    // 💡 CORRECCIÓN: Tipo de ID cambiado a string
    async updateUser(id: string, user: Partial<User>): Promise<User | null> {
        try {
            const response = await axios.put(`${API_URL}/${id}`, user);
            return response.data.data ?? response.data ?? null;
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            return null;
        }
    }

    // 💡 CORRECCIÓN: Tipo de ID cambiado a string
    async deactivateUser(id: string): Promise<boolean> {
        try {
            await axios.patch(`${API_URL}/${id}/deactivate`);
            return true;
        } catch (error) {
            console.error("Error al desactivar:", error);
            return false;
        }
    }

    // 💡 CORRECCIÓN CRÍTICA: Cambiado de Promise<User[]> a Promise<Teacher[]>
    // Esta ruta consulta perfiles académicos de profesores, no registros base de usuarios.
    async getTeachers(): Promise<Teacher[]> {
        try {
            const response = await axios.get(`http://127.0.0.1:5000/api/academic/teachers/search`);
            return response.data.data ?? response.data ?? [];
        } catch (error) {
            console.error("Error al obtener docentes:", error);
            return [];
        }
    }
    async getStudents(): Promise<Student[]> {
        try {
            const response = await axios.get(`http://127.0.0.1:5000/api/academic/students/search`);
            return response.data.data ?? response.data ?? [];
        } catch (error) {
            console.error("Error al obtener estudiantes:", error);
            return [];
        }
    }
}

export const userService = new UserService();
import axios from "axios";
import { User } from "../models/User";
import { Teacher } from "../models/Docente";
import { Student } from "../models/Estudiante";

const API_URL = "http://127.0.0.1:5000/api/users";

class UserService {
    async getUsers(): Promise<User[]> {
        try {
            const response = await axios.get(API_URL);
            // CORRECCIÓN: Acceso seguro a la data envuelta
            return response.data.data ?? [];
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            return [];
        }
    }

    async getUserById(id: number): Promise<User | null> {
        try {
            const response = await axios.get(`${API_URL}/${id}`);
            // CORRECCIÓN: Manejo de respuesta única
            return response.data.data ?? response.data;
        } catch (error) {
            console.error("Error al obtener usuario por ID:", error);
            return null;
        }
    }

    async registerStudent(student: Omit<Student, "id">): Promise<Student | null> {
        // CORRECCIÓN: Aseguramos que los nombres de los campos sean snake_case para el API
        const response = await axios.post( `${API_URL}/public/register-student`, {
            email: student.email,
            password: student.password,
            code: student.code,
            role: student.role,
            first_name: student.first_name,
            last_name: student.last_name,
            identification: student.identification
        });
        return response.data;
    }

    async registerTeacher(teacher: Omit<Teacher, "id">): Promise<Teacher | null> {
        // CORRECCIÓN: Mapeo de campos de docente incluyendo especialidad
        const response = await axios.post( `${API_URL}/public/register-teacher`, {
            email: teacher.email,
            password: teacher.password,
            code: teacher.code,
            role: teacher.role,
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            identification: teacher.identification,
            phone: teacher.phone,
            specialty: (teacher as any).speciality // CORRECCIÓN: El backend usa 'specialty' sin la 'i'
        });
        return response.data;
    }

    async updateUser(id: number, user: Partial<User>): Promise<User | null> {
        try {
            const response = await axios.put(`${API_URL}/${id}`, user);
            return response.data;
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            return null;
        }
    }

    async deactivateUser(id: number): Promise<boolean> {
        try {
            await axios.patch(`${API_URL}/${id}/deactivate`);
            return true;
        } catch (error) {
            console.error("Error al desactivar:", error);
            return false;
        }
    }
}

export const userService = new UserService();
// src/models/User.ts

export interface User {

    id: number;

    password: string;

    email: string;

    role: string;

    isActive: boolean;

    code: string;

}
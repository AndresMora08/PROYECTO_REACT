// src/models/User.ts

export interface User {
    id: string;
    password: string;
    email: string;
    role: string;
    is_active: boolean; 
    code: string;

    created_at?: string;
}
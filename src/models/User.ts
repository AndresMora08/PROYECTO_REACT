// src/models/User.ts

export interface User {
    id: number;
    password: string;
    email: string;
    role: string;
    is_active: boolean; 
    code: string;
    first_name: string;
    last_name: string;
    identification: string;
    created_at?: string;
}
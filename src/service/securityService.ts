// src/services/SecurityService.ts
import axios from "axios";
import { User } from "../models/User";
import { StorageProvider } from "../storage/StorageProvider";
import { LocalStorageProvider } from "../storage/LocalStorageProvider";
import { store } from "../store/store";
import { setUser } from "../store/userSlice";

class SecurityService extends EventTarget {
    private readonly keyToken: string = "token";
    private readonly userKey: string = "user";
    // Basado en Postman: {{base_url}}/api/auth
    private readonly API_URL: string = "http://127.0.0.1:5000/api/auth"; 
    private user: User | null = null;
    private storage: StorageProvider;

    constructor(storage: StorageProvider = new LocalStorageProvider()) {
        super();
        this.storage = storage;
        this.user = this.loadStoredUser();
    }

    private loadStoredUser(): User | null {
        const stored = this.storage.getItem(this.userKey);
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            this.storage.removeItem(this.userKey);
            return null;
        }
    }

    async login(credentials: any) {
    const response = await axios.post(`${this.API_URL}/login`, credentials);
    
    console.log("Respuesta bruta del servidor:", response.data);

    if (response.status === 200) {
        // 🔹 NOTA: Accedemos a response.data.data porque el objeto real viene ahí
        const { user, access_token } = response.data.data; 
        
        this.user = user;

        // Guardamos el token
        this.storage.setItem(this.keyToken, access_token);
        
        // Guardamos el usuario (importante persistirlo como string)
        this.storage.setItem(this.userKey, JSON.stringify(user)); 
        
        // Actualizamos Redux
        store.dispatch(setUser(user));
        
        return user; 
    }
    throw new Error("Credenciales inválidas");
}

    logout() {
        this.storage.clear();
        store.dispatch(setUser(null));
    }

    isAuthenticated(): boolean {
        return !!this.storage.getItem(this.keyToken);
    }
}

export default new SecurityService();
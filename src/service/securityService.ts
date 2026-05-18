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
        
        if (response.status === 200) {
            const { user, access_token } = response.data.data; 
            
            this.user = user;
            this.storage.setItem(this.keyToken, access_token);
            this.storage.setItem(this.userKey, JSON.stringify(user)); 
            store.dispatch(setUser(user));
            
            return user; 
        }
        throw new Error("Credenciales inválidas");
    }

    // ... (Mantén aquí tus métodos handleGithubCallback, handleGoogleCallback, etc. si aún los usas) ...

    /**
     * 🔹 NUEVO MÉTODO: Loguea al usuario usando los datos validados de tu BD
     * y el token generado por Firebase.
     */
    async loginWithValidatedSocialUser(dbUser: User, firebaseToken: string) {
        this.user = dbUser;
        
        // Guardamos el token de Firebase para mantener la sesión
        this.storage.setItem(this.keyToken, firebaseToken);
        
        // Guardamos el usuario exactamente como viene de tu backend (con su rol real)
        this.storage.setItem(this.userKey, JSON.stringify(dbUser)); 
        
        // Actualizamos Redux
        store.dispatch(setUser(dbUser));
        
        return dbUser; 
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
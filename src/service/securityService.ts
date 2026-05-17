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

    /**
     * Inicia el flujo de autenticación con GitHub
     */
    loginWithGithub() {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "your_github_client_id";
        const redirectUri = `${window.location.origin}/auth/github/callback`;
        const scope = "user:email";
        
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
        
        // Abre una ventana popup
        window.location.href = githubAuthUrl;
    }

    /**
     * Maneja el callback de autenticación con GitHub
     */
    async handleGithubCallback(code: string) {
        try {
            console.log("SecurityService: Handling GitHub callback with code:", code);
            
            const endpoint = `${this.API_URL}/auth/github`;
            console.log("SecurityService: Calling endpoint:", endpoint);
            
            const response = await axios.post(endpoint, { code });
            
            console.log("SecurityService: GitHub response:", response.data);
            
            if (response.status === 200) {
                const { user, access_token } = response.data.data || response.data;
                
                if (!user || !access_token) {
                    throw new Error("Invalid response format: missing user or access_token");
                }
                
                this.user = user;
                this.storage.setItem(this.keyToken, access_token);
                this.storage.setItem(this.userKey, JSON.stringify(user));
                store.dispatch(setUser(user));
                
                console.log("SecurityService: GitHub authentication successful");
                return user;
            }
        } catch (error: any) {
            console.error("SecurityService: GitHub authentication error:", error);
            const message = error.response?.data?.message || error.message || "GitHub authentication failed";
            throw new Error(message);
        }
    }

    /**
     * Maneja el callback de autenticación con Google
     */
    async handleGoogleCallback(code: string) {
        try {
            console.log("SecurityService: Handling Google callback with code:", code);
            
            const endpoint = `${this.API_URL}/auth/google`;
            console.log("SecurityService: Calling endpoint:", endpoint);
            
            const response = await axios.post(endpoint, { code });
            
            console.log("SecurityService: Google response:", response.data);
            
            if (response.status === 200) {
                const { user, access_token } = response.data.data || response.data;
                
                if (!user || !access_token) {
                    throw new Error("Invalid response format: missing user or access_token");
                }
                
                this.user = user;
                this.storage.setItem(this.keyToken, access_token);
                this.storage.setItem(this.userKey, JSON.stringify(user));
                store.dispatch(setUser(user));
                
                console.log("SecurityService: Google authentication successful");
                return user;
            }
        } catch (error: any) {
            console.error("SecurityService: Google authentication error:", error);
            const message = error.response?.data?.message || error.message || "Google authentication failed";
            throw new Error(message);
        }
    }

    /**
     * Maneja el callback de autenticación con X
     */
    async handleXCallback(code: string) {
        try {
            console.log("SecurityService: Handling X callback with code:", code);
            
            const endpoint = `${this.API_URL}/auth/x`;
            console.log("SecurityService: Calling endpoint:", endpoint);
            
            const response = await axios.post(endpoint, { code });
            
            console.log("SecurityService: X response:", response.data);
            
            if (response.status === 200) {
                const { user, access_token } = response.data.data || response.data;
                
                if (!user || !access_token) {
                    throw new Error("Invalid response format: missing user or access_token");
                }
                
                this.user = user;
                this.storage.setItem(this.keyToken, access_token);
                this.storage.setItem(this.userKey, JSON.stringify(user));
                store.dispatch(setUser(user));
                
                console.log("SecurityService: X authentication successful");
                return user;
            }
        } catch (error: any) {
            console.error("SecurityService: X authentication error:", error);
            const message = error.response?.data?.message || error.message || "X authentication failed";
            throw new Error(message);
        }
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
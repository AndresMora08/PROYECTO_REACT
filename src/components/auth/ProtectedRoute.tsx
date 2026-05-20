// src/components/guards/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { LocalStorageProvider } from "../../storage/LocalStorageProvider";
import { User } from "../../models/User";

const storage = new LocalStorageProvider();

const isAuthenticated = (): boolean => {
    const token = storage.getItem("token");
    const user = storage.getItem("user");
    if (!token || !user) return false;
    try {
        const parsedUser: User = JSON.parse(user);
        return !!parsedUser;
    } catch {
        return false;
    }
};

const ProtectedRoute = () => {
    return isAuthenticated() ? <Outlet /> : <Navigate to="/auth/signin" replace />;
};

export default ProtectedRoute;
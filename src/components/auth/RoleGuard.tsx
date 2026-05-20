// src/components/guards/RoleGuard.tsx
// Guards access by role — redirects unauthorized users to /unauthorized
import { Navigate, Outlet } from "react-router-dom";
import { LocalStorageProvider } from "../../storage/LocalStorageProvider";
import { User } from "../../models/User";

const storage = new LocalStorageProvider();

interface RoleGuardProps {
    allowedRoles: string[];
}

const getStoredUser = (): User | null => {
    const user = storage.getItem("user");
    if (!user) return null;
    try {
        return JSON.parse(user) as User;
    } catch {
        return null;
    }
};

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
    const user = getStoredUser();

    if (!user) {
        return <Navigate to="/auth/signin" replace />;
    }

    const userRole = user.role?.toUpperCase() ?? "";
    const hasAccess = allowedRoles.some(
        (role) => role.toUpperCase() === userRole
    );

    return hasAccess ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default RoleGuard;
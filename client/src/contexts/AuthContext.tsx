import { createContext, useContext, ReactNode } from "react";
import { useIsDesktop } from "@/hooks/use-device-type";

interface User {
  id: string;
  username: string;
  role: "admin" | "staff";
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  canMakeChanges: boolean;
  deviceRestricted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, user }: { children: ReactNode; user: User | null }) {
  const isAdmin = user?.role === "admin";
  const isDesktop = useIsDesktop();
  
  const isStaffOrAdmin = user?.role === "admin" || user?.role === "staff";
  const canMakeChanges = isStaffOrAdmin ? isDesktop : true;
  const deviceRestricted = isStaffOrAdmin && !isDesktop;

  return (
    <AuthContext.Provider value={{ user, isAdmin, canMakeChanges, deviceRestricted }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

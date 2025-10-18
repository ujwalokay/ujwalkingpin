import { createContext, useContext, ReactNode } from "react";

interface User {
  id: string;
  username: string;
  role: "admin" | "staff";
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  canMakeChanges: boolean;
  deviceRestricted: boolean;
  onboardingCompleted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, user }: { children: ReactNode; user: User | null }) {
  const isAdmin = user?.role === "admin";
  
  const isStaffOrAdmin = user?.role === "admin" || user?.role === "staff";
  const canMakeChanges = isStaffOrAdmin ? true : true;
  const deviceRestricted = false;
  const onboardingCompleted = user?.onboardingCompleted ?? true;

  return (
    <AuthContext.Provider value={{ user, isAdmin, canMakeChanges, deviceRestricted, onboardingCompleted }}>
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

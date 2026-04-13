import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Plan = "freemium" | "paid" | null;

export interface User {
  email: string;
  name: string;
  plan: Plan;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setPlan: (plan: Plan) => void;
  demoCompleted: boolean;
  markDemoComplete: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demoCompleted, setDemoCompleted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("mm_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("mm_user");
      }
    }
    const demo = localStorage.getItem("mm_demo_completed");
    if (demo === "true") setDemoCompleted(true);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const accounts = JSON.parse(localStorage.getItem("mm_accounts") || "{}");
    const stored = accounts[email];
    if (!stored) throw new Error("No account found with that email.");
    if (stored.password !== password) throw new Error("Incorrect password.");
    const u: User = { email, name: stored.name, plan: stored.plan };
    setUser(u);
    localStorage.setItem("mm_user", JSON.stringify(u));
  };

  const register = async (email: string, password: string, name: string) => {
    const accounts = JSON.parse(localStorage.getItem("mm_accounts") || "{}");
    if (accounts[email]) throw new Error("An account with this email already exists.");
    accounts[email] = { password, name, plan: null };
    localStorage.setItem("mm_accounts", JSON.stringify(accounts));
    const u: User = { email, name, plan: null };
    setUser(u);
    localStorage.setItem("mm_user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mm_user");
  };

  const setPlan = (plan: Plan) => {
    if (!user) return;
    const updated = { ...user, plan };
    setUser(updated);
    localStorage.setItem("mm_user", JSON.stringify(updated));
    const accounts = JSON.parse(localStorage.getItem("mm_accounts") || "{}");
    if (accounts[user.email]) {
      accounts[user.email].plan = plan;
      localStorage.setItem("mm_accounts", JSON.stringify(accounts));
    }
  };

  const markDemoComplete = () => {
    setDemoCompleted(true);
    localStorage.setItem("mm_demo_completed", "true");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, setPlan, demoCompleted, markDemoComplete }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

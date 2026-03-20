import { createContext, useContext, ReactNode } from "react";
import {
  useGetMe,
  useLogout,
  getGetMeQueryKey,
  type SessionUser,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { clearToken } from "@/lib/token";

interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  logout: () => void;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
      staleTime: Infinity,
    },
  });

  const { mutate: performLogout, isPending: isLoggingOut } = useLogout({
    mutation: {
      onSuccess: () => {
        clearToken();
        queryClient.clear();
        setLocation("/login");
      },
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: data?.user || null,
        isLoading,
        logout: () => performLogout(),
        isLoggingOut,
      }}
    >
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

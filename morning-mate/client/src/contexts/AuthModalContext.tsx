import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AuthModal } from "@/components/AuthModal";

interface AuthModalContextValue {
  openAuthModal: (onSuccess?: () => void) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue>({
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [successCallback, setSuccessCallback] = useState<(() => void) | undefined>(undefined);

  const openAuthModal = useCallback((onSuccess?: () => void) => {
    setSuccessCallback(() => onSuccess);
    setOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setOpen(false);
    setSuccessCallback(undefined);
  }, []);

  const handleSuccess = () => {
    successCallback?.();
    // Clear any stale local app state so new/returning account starts clean
    localStorage.removeItem("GJ_State_v1");
    localStorage.removeItem("gj_free_mornings");
    window.location.reload();
  };

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthModal
        open={open}
        onOpenChange={(o) => { if (!o) closeAuthModal(); }}
        onSuccess={handleSuccess}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}

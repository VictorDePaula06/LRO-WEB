"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNavBar from "./MobileNavBar";
import CustomDialog from "./CustomDialog";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("PWA Service Worker registrado com sucesso escopo:", reg.scope))
        .catch((err) => console.error("Falha ao registrar PWA Service Worker:", err));
    }
  }, []);

  const handleLogoutConfirm = () => {
    localStorage.clear();
    setLogoutDialogOpen(false);
    router.push("/login");
  };
  
  // Hides the sidebar and overrides layout margins on specific authentication or worker pages
  const isAuthOrColabPage = pathname === "/login" || pathname === "/colab";

  if (isAuthOrColabPage) {
    return (
      <div className="app-container" style={{ display: "block" }}>
        <div style={{ padding: 0, minHeight: "100vh" }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar onLogout={() => setLogoutDialogOpen(true)} />
      <main className="main-content">
        {children}
      </main>
      <MobileNavBar onLogout={() => setLogoutDialogOpen(true)} />

      <CustomDialog
        isOpen={logoutDialogOpen}
        title="Sair da Gerência"
        message="Deseja realmente encerrar a sua sessão administrativa no LRO?"
        type="confirm"
        confirmText="Sair"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutDialogOpen(false)}
      />
    </div>
  );
}

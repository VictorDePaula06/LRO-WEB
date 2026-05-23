"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNavBar from "./MobileNavBar";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("PWA Service Worker registrado com sucesso escopo:", reg.scope))
        .catch((err) => console.error("Falha ao registrar PWA Service Worker:", err));
    }
  }, []);
  
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
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <MobileNavBar />
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wrench, Users, LogOut, Briefcase } from "lucide-react";
import CustomDialog from "./CustomDialog";

export default function MobileNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleLogoutConfirm = () => {
    localStorage.clear();
    setDialogOpen(false);
    router.push("/login");
  };

  return (
    <nav className="mobile-nav-bar">
      <Link 
        href="/" 
        className={`mobile-nav-item ${pathname === "/" ? "active" : ""}`}
      >
        <LayoutDashboard size={20} />
        <span>Painel</span>
      </Link>
      
      <Link 
        href="/tools" 
        className={`mobile-nav-item ${pathname.startsWith("/tools") ? "active" : ""}`}
      >
        <Wrench size={20} />
        <span>Ferramentas</span>
      </Link>
      
      <Link 
        href="/employees" 
        className={`mobile-nav-item ${pathname.startsWith("/employees") ? "active" : ""}`}
      >
        <Users size={20} />
        <span>Equipe</span>
      </Link>
      
      <Link 
        href="/obras" 
        className={`mobile-nav-item ${pathname.startsWith("/obras") ? "active" : ""}`}
      >
        <Briefcase size={20} />
        <span>Obras</span>
      </Link>
      
      <button 
        onClick={() => setDialogOpen(true)}
        className="mobile-nav-item logout-btn"
        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
      >
        <LogOut size={20} style={{ color: "var(--danger-color)" }} />
        <span style={{ color: "var(--danger-color)" }}>Sair</span>
      </button>

      <CustomDialog
        isOpen={dialogOpen}
        title="Sair da Gerência"
        message="Deseja realmente encerrar a sua sessão administrativa no LRO?"
        type="confirm"
        confirmText="Sair"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setDialogOpen(false)}
      />
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wrench, Users, LogOut, Briefcase } from "lucide-react";

interface MobileNavBarProps {
  onLogout: () => void;
}

export default function MobileNavBar({ onLogout }: MobileNavBarProps) {
  const pathname = usePathname();

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
        onClick={onLogout}
        className="mobile-nav-item logout-btn"
        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
      >
        <LogOut size={20} style={{ color: "var(--danger-color)" }} />
        <span style={{ color: "var(--danger-color)" }}>Sair</span>
      </button>
    </nav>
  );
}

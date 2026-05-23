"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wrench, Users, Briefcase, LogOut } from "lucide-react";

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand-section">
        <div className="brand-logo">LR</div>
        <div>
          <h2 className="brand-name">LRO</h2>
          <p className="brand-subtitle">Demolições</p>
        </div>
      </div>

      <nav className="nav-list">
        <li>
          <Link 
            href="/" 
            className={`nav-link ${pathname === "/" ? "active" : ""}`}
          >
            <LayoutDashboard size={20} />
            <span>Painel Principal</span>
          </Link>
        </li>
        <li>
          <Link 
            href="/tools" 
            className={`nav-link ${pathname.startsWith("/tools") ? "active" : ""}`}
          >
            <Wrench size={20} />
            <span>Ferramentas</span>
          </Link>
        </li>
        <li>
          <Link 
            href="/employees" 
            className={`nav-link ${pathname.startsWith("/employees") ? "active" : ""}`}
          >
            <Users size={20} />
            <span>Funcionários</span>
          </Link>
        </li>
        <li>
          <Link 
            href="/obras" 
            className={`nav-link ${pathname.startsWith("/obras") ? "active" : ""}`}
          >
            <Briefcase size={20} />
            <span>Obras / Canteiros</span>
          </Link>
        </li>
      </nav>

      <div className="sidebar-footer" style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", marginTop: "auto" }}>
        <button 
          onClick={onLogout}
          className="nav-link nav-link-logout"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "0.85rem 1rem",
            borderRadius: "8px",
            color: "var(--danger-color)",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            fontWeight: "600",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            transition: "all 0.2s ease",
            fontFamily: "inherit"
          }}
        >
          <LogOut size={20} />
          <span>Sair da Conta</span>
        </button>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
          <p>LRO Sistema v1.0</p>
          <p>© 2026 LRO Demolições</p>
        </div>
      </div>
    </aside>
  );
}

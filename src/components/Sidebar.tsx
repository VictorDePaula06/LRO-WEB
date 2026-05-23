"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wrench, Users } from "lucide-react";

export default function Sidebar() {
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
      </nav>

      <div className="sidebar-footer">
        <p>LRO Sistema v1.0</p>
        <p>© 2026 LRO Demolições</p>
      </div>
    </aside>
  );
}

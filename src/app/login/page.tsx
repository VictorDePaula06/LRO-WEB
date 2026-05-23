"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEmployees } from "@/services/dataService";
import { Employee } from "@/types";
import { KeyRound, ShieldAlert, User, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [roleMode, setRoleMode] = useState<"admin" | "colab">("colab");
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Form states
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [pin, setPin] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Check if already logged in
    const sessionRole = localStorage.getItem("lro_user_role");
    if (sessionRole === "admin") {
      router.push("/");
    } else if (sessionRole === "colab") {
      router.push("/colab");
    }

    // Fetch employees for select list
    const fetchEmps = async () => {
      try {
        const emps = await getEmployees();
        setEmployees(emps);
      } catch (err) {
        console.error("Erro ao carregar colaboradores:", err);
      }
    };
    fetchEmps();
  }, [router]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (roleMode === "admin") {
      if (adminPassword === "admin123") {
        localStorage.setItem("lro_user_role", "admin");
        localStorage.setItem("lro_user_name", "Gerente LRO");
        router.push("/");
      } else {
        setErrorMsg("Senha administrativa incorreta.");
      }
    } else {
      if (!selectedEmpId || !pin) {
        setErrorMsg("Selecione seu nome e digite seu PIN.");
        return;
      }

      const emp = employees.find(e => e.id === selectedEmpId);
      if (emp) {
        if (emp.pin === pin) {
          localStorage.setItem("lro_user_role", "colab");
          localStorage.setItem("lro_user_id", emp.id);
          localStorage.setItem("lro_user_name", emp.name);
          router.push("/colab");
        } else {
          setErrorMsg("PIN incorreto. Tente novamente.");
        }
      } else {
        setErrorMsg("Funcionário não encontrado.");
      }
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      width: "100vw",
      position: "fixed",
      top: 0,
      left: 0,
      backgroundColor: "var(--bg-primary)",
      zIndex: 9999,
      padding: "1rem"
    }}>
      <div className="section-card" style={{ width: "100%", maxWidth: "420px", margin: 0, padding: "2.5rem 2rem" }}>
        
        {/* Brand */}
        <div className="brand-section" style={{ justifyContent: "center", marginBottom: "2rem" }}>
          <div className="brand-logo">LR</div>
          <div>
            <h2 className="brand-name">LRO</h2>
            <p className="brand-subtitle">Demolições</p>
          </div>
        </div>

        <h3 style={{ textAlign: "center", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          Acesso ao Sistema
        </h3>

        {/* Tab Selector */}
        <div style={{ 
          display: "flex", 
          backgroundColor: "var(--bg-tertiary)", 
          borderRadius: "8px", 
          padding: "0.25rem", 
          marginBottom: "1.5rem" 
        }}>
          <button 
            type="button"
            onClick={() => { setRoleMode("colab"); setErrorMsg(""); }}
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              backgroundColor: roleMode === "colab" ? "var(--bg-secondary)" : "transparent",
              color: roleMode === "colab" ? "var(--accent-color)" : "var(--text-secondary)"
            }}
          >
            <User size={16} />
            Colaborador
          </button>
          <button 
            type="button"
            onClick={() => { setRoleMode("admin"); setErrorMsg(""); }}
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              backgroundColor: roleMode === "admin" ? "var(--bg-secondary)" : "transparent",
              color: roleMode === "admin" ? "var(--accent-color)" : "var(--text-secondary)"
            }}
          >
            <Shield size={16} />
            Gerência
          </button>
        </div>

        {errorMsg && (
          <div style={{ 
            color: "var(--danger-color)", 
            fontSize: "0.85rem", 
            marginBottom: "1.25rem", 
            backgroundColor: "rgba(239, 68, 68, 0.1)", 
            padding: "0.75rem", 
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <ShieldAlert size={16} />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLoginSubmit}>
          {roleMode === "colab" ? (
            <>
              <div className="form-group">
                <label htmlFor="employeeSelect">Selecione seu Nome</label>
                <select
                  id="employeeSelect"
                  className="form-control"
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  required
                >
                  <option value="">-- Quem é você? --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="pinInput">PIN de 4 dígitos</label>
                <input
                  type="password"
                  id="pinInput"
                  className="form-control"
                  placeholder="Digite seu código de 4 dígitos"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  required
                  style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "8px" }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Padrão para testes: José (1234), Antônio (1111)
                </span>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label htmlFor="adminPass">Senha Administrativa</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  id="adminPass"
                  className="form-control"
                  placeholder="Senha da gerência"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  style={{ paddingLeft: "2.5rem" }}
                />
                <KeyRound size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Senha padrão para testes: admin123
              </span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: "100%", marginTop: "1rem", padding: "0.85rem" }}
          >
            Entrar no Portal
          </button>
        </form>
      </div>
    </div>
  );
}

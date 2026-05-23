"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  getTools, 
  getEmployees, 
  getLoans, 
  createLoan, 
  approveReturn, 
  rejectReturn,
  returnLoan 
} from "@/services/dataService";
import { Tool, Employee, Loan } from "@/types";
import { 
  Wrench, 
  Users, 
  ClipboardCheck, 
  AlertTriangle, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Check, 
  X,
  Camera,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Calendar
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Proof Image Preview Modal State
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);
  const [selectedProofLoanName, setSelectedProofLoanName] = useState("");

  const verifyAuth = () => {
    const role = localStorage.getItem("lro_user_role");
    if (role !== "admin") {
      router.push("/login");
      return false;
    }
    return true;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedTools, fetchedEmployees, fetchedLoans] = await Promise.all([
        getTools(),
        getEmployees(),
        getLoans()
      ]);
      setTools(fetchedTools);
      setEmployees(fetchedEmployees);
      setLoans(fetchedLoans);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verifyAuth()) {
      fetchData();
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // Stats calculation
  const totalTools = tools.length;
  const loanedTools = tools.filter(t => t.status === "loaned").length;
  const pendingReturnTools = tools.filter(t => t.status === "pending").length;
  const maintenanceTools = tools.filter(t => t.status === "maintenance").length;
  
  const availableToolsList = tools.filter(t => t.status === "available");
  
  // Calculate overdue loans (active status and due date passed)
  const overdueLoans = loans.filter(l => {
    if (l.status !== "active") return false;
    return new Date(l.dueDate) < new Date();
  }).length;

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToolId || !selectedEmployeeId || !dueDate) {
      setErrorMsg("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setErrorMsg("");
      await createLoan(selectedToolId, selectedEmployeeId, dueDate);
      
      // Reset & Refresh
      setSelectedToolId("");
      setSelectedEmployeeId("");
      setDueDate("");
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao realizar empréstimo.");
    }
  };

  // Instant Check-in from Admin (bypasses collaborator request flow)
  const handleReturnToolAdmin = async (loanId: string) => {
    if (confirm("Confirmar a devolução direta desta ferramenta?")) {
      try {
        await returnLoan(loanId);
        await fetchData();
      } catch (err) {
        console.error("Erro ao devolver ferramenta:", err);
        alert("Erro ao realizar a devolução.");
      }
    }
  };

  // Approve Collaborator Return request
  const handleApproveReturn = async (loanId: string) => {
    try {
      await approveReturn(loanId);
      await fetchData();
    } catch (err) {
      console.error("Erro ao aprovar devolução:", err);
      alert("Erro ao aprovar devolução.");
    }
  };

  // Reject Collaborator Return request
  const handleRejectReturn = async (loanId: string) => {
    const motive = confirm("Deseja rejeitar esta devolução? A ferramenta voltará ao estado de 'Emprestada' com o funcionário.");
    if (motive) {
      try {
        await rejectReturn(loanId);
        await fetchData();
      } catch (err) {
        console.error("Erro ao rejeitar devolução:", err);
        alert("Erro ao rejeitar devolução.");
      }
    }
  };

  const formatShortDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  // Filter latest loans (last 6)
  const sortedLoans = [...loans].sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime()).slice(0, 6);

  // Active loans currently (out in the field)
  const activeLoans = loans.filter(l => l.status === "active");

  // Pending return loans (collaborator requests with photos waiting for manager)
  const pendingReturns = loans.filter(l => l.status === "pending");

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>Carregando dados da gerência...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <header className="page-header">
        <div className="page-title">
          <h1>Painel da Gerência</h1>
          <p>Controle centralizado, aprovações por foto e inventário LRO</p>
        </div>
        
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-secondary btn-danger" onClick={handleLogout}>
            Sair
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <PlusCircle size={18} />
            Nova Saída (Check-out)
          </button>
        </div>
      </header>

      {/* Grid Estatísticas */}
      <section className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Wrench size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalTools}</span>
            <span className="stat-label">Total no Inventário</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{loanedTools}</span>
            <span className="stat-label">Com Funcionários</span>
          </div>
        </div>

        <div className="stat-card">
          <div 
            className="stat-card" 
            style={{ 
              border: pendingReturns.length > 0 ? "1px solid var(--warning-color)" : "1px solid var(--border-color)", 
              padding: 0,
              boxShadow: "none",
              backgroundColor: "transparent",
              gap: "1.25rem",
              width: "100%"
            }}
          >
            <div 
              className="stat-icon" 
              style={{ 
                backgroundColor: pendingReturns.length > 0 ? "rgba(245, 158, 11, 0.15)" : "var(--bg-tertiary)",
                color: pendingReturns.length > 0 ? "var(--warning-color)" : "var(--text-muted)",
                animation: pendingReturns.length > 0 ? "pulse 2s infinite" : "none"
              }}
            >
              <Camera size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{pendingReturns.length}</span>
              <span className="stat-label">Aprovações de Devolução</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon danger">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{overdueLoans}</span>
            <span className="stat-label">Atrasos na Obra</span>
          </div>
        </div>
      </section>

      {/* NEW SECTION: PENDING RETURNS AWAITING PHOTO APPROVAL */}
      {pendingReturns.length > 0 && (
        <section className="section-card" style={{ border: "1px solid var(--warning-color)" }}>
          <div className="section-title">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--warning-color)" }}>
              <Camera size={20} />
              Devoluções Aguardando Aprovação por Foto ({pendingReturns.length})
            </h2>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Verifique a foto tirada pelo colaborador na obra
            </span>
          </div>

          <div className="table-container">
            <table className="lro-table">
              <thead>
                <tr>
                  <th>Ferramenta</th>
                  <th>Colaborador</th>
                  <th>Data Devolução</th>
                  <th>Comprovante Fotográfico</th>
                  <th style={{ textAlign: "right" }}>Ações da Gerência</th>
                </tr>
              </thead>
              <tbody>
                {pendingReturns.map((loan) => (
                  <tr key={loan.id}>
                    <td data-label="Ferramenta" style={{ fontWeight: 700 }}>{loan.toolName}</td>
                    <td data-label="Colaborador">{loan.employeeName}</td>
                    <td data-label="Data Devolução">{loan.returnRequestDate ? formatShortDate(loan.returnRequestDate) : "—"}</td>
                    <td data-label="Comprovante">
                      {loan.returnProofImage ? (
                        <div 
                          onClick={() => {
                            setSelectedProofImage(loan.returnProofImage || null);
                            setSelectedProofLoanName(loan.toolName);
                          }}
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "0.5rem", 
                            cursor: "pointer",
                            color: "var(--accent-color)",
                            fontWeight: 600
                          }}
                        >
                          <div style={{ width: "40px", height: "40px", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
                            <img src={loan.returnProofImage} alt="Prova" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <span style={{ fontSize: "0.8rem", textDecoration: "underline", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            Ver Foto <ExternalLink size={12} />
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>Sem foto</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleApproveReturn(loan.id)}
                          style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem", backgroundColor: "var(--success-color)", boxShadow: "none" }}
                        >
                          <ThumbsUp size={14} />
                          Aprovar
                        </button>
                        <button 
                          className="btn btn-secondary btn-danger"
                          onClick={() => handleRejectReturn(loan.id)}
                          style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}
                        >
                          <ThumbsDown size={14} />
                          Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Main Sections (Columns Layout) */}
      <div className="layout-columns">
        {/* Left Column: Active Loans */}
        <section className="section-card">
          <div className="section-title">
            <h2>Ferramentas em Uso com a Equipe ({activeLoans.length})</h2>
          </div>

          {activeLoans.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
              Nenhuma ferramenta está na rua no momento. Todas estão na base!
            </p>
          ) : (
            <div className="table-container">
              <table className="lro-table">
                <thead>
                  <tr>
                    <th>Ferramenta</th>
                    <th>Responsável</th>
                    <th>Data Saída</th>
                    <th>Previsão Devolução</th>
                    <th style={{ textAlign: "right" }}>Devolução Direta</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map((loan) => {
                    const isOverdue = new Date(loan.dueDate) < new Date();
                    return (
                      <tr key={loan.id}>
                        <td data-label="Ferramenta" style={{ fontWeight: 600 }}>{loan.toolName}</td>
                        <td data-label="Responsável">{loan.employeeName}</td>
                        <td data-label="Data Saída">{formatShortDate(loan.loanDate)}</td>
                        <td data-label="Previsão" style={{ color: isOverdue ? "var(--danger-color)" : "inherit", fontWeight: isOverdue ? "700" : "inherit" }}>
                          {new Date(loan.dueDate).toLocaleDateString("pt-BR")}
                          {isOverdue && " (Atrasado)"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            className="btn btn-secondary btn-danger"
                            onClick={() => handleReturnToolAdmin(loan.id)}
                            style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
                            title="Registrar devolução imediatamente sem foto do colaborador"
                          >
                            Retorno Base
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right Column: Recent Activity Logs */}
        <section className="section-card">
          <div className="section-title">
            <h2>Histórico de Movimentações</h2>
          </div>

          {sortedLoans.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
              Nenhum histórico registrado ainda.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {sortedLoans.map((loan) => (
                <div 
                  key={loan.id} 
                  style={{ 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: "0.75rem",
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid var(--border-color)"
                  }}
                >
                  <div 
                    style={{ 
                      backgroundColor: loan.status === "returned" ? "rgba(16, 185, 129, 0.1)" : loan.status === "pending" ? "rgba(245, 158, 11, 0.1)" : "var(--accent-glow)",
                      color: loan.status === "returned" ? "var(--success-color)" : loan.status === "pending" ? "var(--warning-color)" : "var(--accent-color)",
                      padding: "0.5rem",
                      borderRadius: "6px"
                    }}
                  >
                    {loan.status === "returned" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div style={{ flex: 1, fontSize: "0.85rem" }}>
                    <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {loan.toolName}
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>
                      {loan.status === "returned" 
                        ? "Devolvido por " 
                        : loan.status === "pending" 
                        ? "Solicitou devolução " 
                        : "Retirado por "} 
                      <strong>{loan.employeeName}</strong>
                    </p>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {formatShortDate(loan.returnDate || loan.returnRequestDate || loan.loanDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODAL: REGISTRAR EMPRÉSTIMO (CHECK-OUT) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Registrar Saída de Ferramenta</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateLoan}>
              {errorMsg && (
                <div style={{ color: "var(--danger-color)", fontSize: "0.85rem", marginBottom: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "6px" }}>
                  {errorMsg}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="toolSelect">Selecione a Ferramenta Disponível</label>
                <select 
                  id="toolSelect"
                  className="form-control"
                  value={selectedToolId}
                  onChange={(e) => setSelectedToolId(e.target.value)}
                  required
                >
                  <option value="">-- Selecione uma ferramenta --</option>
                  {availableToolsList.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.brand ? `(${t.brand})` : ""} {t.serialNumber && t.serialNumber !== "N/A" ? `- SN: ${t.serialNumber}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="employeeSelect">Funcionário que está retirando</label>
                <select 
                  id="employeeSelect"
                  className="form-control"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  required
                >
                  <option value="">-- Selecione o funcionário --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dueDateInput">Data de Devolução Prevista</label>
                <input 
                  type="date" 
                  id="dueDateInput"
                  className="form-control"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  Confirmar Empréstimo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER COMPROVANTE FOTOGRÁFICO DE DEVOLUÇÃO */}
      {selectedProofImage && (
        <div className="modal-overlay" onClick={() => setSelectedProofImage(null)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: "550px", padding: "1.5rem" }}
          >
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Camera size={18} />
                Comprovante: {selectedProofLoanName}
              </h3>
              <button className="modal-close" onClick={() => setSelectedProofImage(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ 
              width: "100%", 
              maxHeight: "450px", 
              borderRadius: "12px", 
              overflow: "hidden", 
              border: "1px solid var(--border-color)", 
              backgroundColor: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <img 
                src={selectedProofImage} 
                alt="Comprovante de Devolução" 
                style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }} 
              />
            </div>
            
            <div style={{ display: "flex", justifyContent: "center", marginTop: "1.25rem" }}>
              <button className="btn btn-secondary" onClick={() => setSelectedProofImage(null)}>
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Pulse animation for warnings */}
      <style jsx global>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
      `}</style>
    </div>
  );
}

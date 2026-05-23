"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  getLoans, 
  getTools, 
  requestReturnLoan 
} from "@/services/dataService";
import { Loan, Tool } from "@/types";
import { 
  LogOut, 
  Wrench, 
  Clock, 
  Camera, 
  Check, 
  X,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import PhotoUpload from "@/components/PhotoUpload";

export default function CollaboratorPortal() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Return State
  const [activeReturnLoan, setActiveReturnLoan] = useState<Loan | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [returnCondition, setReturnCondition] = useState<'perfect' | 'repair'>('perfect');
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPortalData = async (uid: string) => {
    try {
      setLoading(true);
      const [allLoans, allTools] = await Promise.all([
        getLoans(),
        getTools()
      ]);
      setTools(allTools);
      // Filter loans for this specific collaborator that are active or pending approval
      const userLoans = allLoans.filter(l => l.employeeId === uid && l.status !== "returned");
      setLoans(userLoans);
    } catch (err) {
      console.error("Erro ao carregar dados do portal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("lro_user_role");
    const uid = localStorage.getItem("lro_user_id");
    const name = localStorage.getItem("lro_user_name");

    if (role !== "colab" || !uid || !name) {
      localStorage.clear();
      router.push("/login");
      return;
    }

    setUserId(uid);
    setUserName(name);
    fetchPortalData(uid);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleOpenReturnModal = (loan: Loan) => {
    setActiveReturnLoan(loan);
    setProofImage(null);
    setReturnCondition('perfect');
    setErrorMsg("");
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReturnLoan) return;
    if (!proofImage) {
      setErrorMsg("Você precisa tirar uma foto da ferramenta para comprovar a devolução.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await requestReturnLoan(activeReturnLoan.id, proofImage, returnCondition);
      
      // Close & Refresh
      setActiveReturnLoan(null);
      setProofImage(null);
      await fetchPortalData(userId);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao solicitar devolução.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        backgroundColor: "var(--bg-primary)"
      }}>
        <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>Carregando suas ferramentas...</p>
      </div>
    );
  }

  // Find tool images for visual enhancement
  const getToolImage = (toolId: string) => {
    const t = tools.find(x => x.id === toolId);
    return t?.image || null;
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      
      {/* Header Mobile Oriented */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "2rem",
        backgroundColor: "var(--bg-secondary)",
        padding: "1rem",
        borderRadius: "12px",
        border: "1px solid var(--border-color)"
      }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Portal do Colaborador
          </span>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{userName}</h2>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            color: "var(--danger-color)",
            border: "none",
            borderRadius: "8px",
            padding: "0.6rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.85rem",
            fontWeight: 600
          }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </header>

      {/* Intro info */}
      <div style={{ 
        backgroundColor: "rgba(16, 185, 129, 0.05)", 
        border: "1px solid rgba(16, 185, 129, 0.15)", 
        padding: "1rem", 
        borderRadius: "12px", 
        marginBottom: "2rem",
        fontSize: "0.85rem",
        display: "flex",
        gap: "0.75rem",
        alignItems: "center"
      }}>
        <AlertCircle size={20} style={{ color: "var(--accent-color)", flexShrink: 0 }} />
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.4 }}>
          Ao devolver uma ferramenta, <strong>tire uma foto nítida da máquina na base</strong> para comprovar. A gerência irá revisar e aprovar o recebimento.
        </p>
      </div>

      {/* Loans Title */}
      <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" }}>
        Minha Carga de Ferramentas ({loans.length})
      </h3>

      {loans.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "3rem 1.5rem", 
          backgroundColor: "var(--bg-secondary)", 
          border: "1px dashed var(--border-color)", 
          borderRadius: "16px",
          color: "var(--text-secondary)"
        }}>
          <Wrench size={32} style={{ color: "var(--text-muted)", marginBottom: "1rem" }} />
          <p style={{ fontWeight: 600 }}>Você não tem nenhuma ferramenta com você!</p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Peça para a gerência realizar a saída de uma máquina para você.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loans.map(loan => {
            const isPending = loan.status === "pending";
            const toolPic = getToolImage(loan.toolId);
            const isOverdue = !isPending && new Date(loan.dueDate) < new Date();

            return (
              <div 
                key={loan.id}
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: isPending ? "1px solid var(--border-color)" : isOverdue ? "1px solid var(--danger-color)" : "1px solid var(--border-color)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "var(--card-shadow)"
                }}
              >
                {/* Tool Meta and Picture if exists */}
                <div style={{ display: "flex", padding: "1.25rem", gap: "1rem", alignItems: "center" }}>
                  <div style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden"
                  }}>
                    {toolPic ? (
                      <img src={toolPic} alt={loan.toolName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Wrench size={24} style={{ color: "var(--text-muted)" }} />
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
                      {loan.toolName}
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                      Ref Empréstimo: {loan.id.substring(5, 12)}
                    </span>
                    
                    {/* Due Date Indicator */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem", fontSize: "0.8rem", color: isOverdue ? "var(--danger-color)" : "var(--text-secondary)" }}>
                      <Clock size={14} />
                      <span>
                        {isPending ? "Aguardando aprovação" : `Prazo: ${new Date(loan.dueDate).toLocaleDateString("pt-BR")}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ 
                  backgroundColor: "var(--bg-tertiary)", 
                  padding: "0.75rem 1.25rem", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  borderTop: "1px solid var(--border-color)"
                }}>
                  {isPending ? (
                    <>
                      <span className="badge badge-warning" style={{ fontSize: "0.7rem", padding: "0.3rem 0.6rem" }}>
                        Devolução Enviada
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        Aguardando confirmação
                      </span>
                    </>
                  ) : (
                    <>
                      {isOverdue ? (
                        <span className="badge badge-danger" style={{ fontSize: "0.7rem", padding: "0.3rem 0.6rem" }}>
                          Atrasada!
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ fontSize: "0.7rem", padding: "0.3rem 0.6rem", opacity: 0.8 }}>
                          Em posse
                        </span>
                      )}
                      <button
                        className="btn btn-primary"
                        onClick={() => handleOpenReturnModal(loan)}
                        style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
                      >
                        <Camera size={14} />
                        Devolver (Comprovar)
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: SUBMETER PROVA DE DEVOLUÇÃO */}
      {activeReturnLoan && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Comprovante de Devolução</h3>
              <button className="modal-close" onClick={() => setActiveReturnLoan(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
                Você está devolvendo: <strong>{activeReturnLoan.toolName}</strong>. 
                <br />
                Por favor, tire uma foto legível da ferramenta no local de entrega.
              </p>

              {errorMsg && (
                <div style={{ 
                  color: "var(--danger-color)", 
                  fontSize: "0.85rem", 
                  marginBottom: "1rem", 
                  backgroundColor: "rgba(239, 68, 68, 0.1)", 
                  padding: "0.5rem", 
                  borderRadius: "6px" 
                }}>
                  {errorMsg}
                </div>
              )}

              {/* Photo Input Stream/Capture */}
              <PhotoUpload 
                onChange={(base64) => setProofImage(base64)}
                label="Foto da Máquina Instalada / Entregue"
                value={proofImage}
              />

              <div className="form-group" style={{ marginTop: "1.25rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Estado de Entrega do Equipamento
                </label>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <label 
                    style={{ 
                      flex: 1, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      gap: "0.5rem", 
                      padding: "0.65rem 0.5rem", 
                      borderRadius: "8px", 
                      border: returnCondition === 'perfect' ? "2px solid var(--accent-color)" : "1px solid var(--border-color)",
                      backgroundColor: returnCondition === 'perfect' ? "rgba(16, 185, 129, 0.06)" : "var(--bg-tertiary)",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <input 
                      type="radio" 
                      name="returnCondition" 
                      checked={returnCondition === 'perfect'}
                      onChange={() => setReturnCondition('perfect')}
                      style={{ accentColor: "var(--accent-color)" }}
                    />
                    <span>🟢 Funcionando</span>
                  </label>
                  
                  <label 
                    style={{ 
                      flex: 1, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      gap: "0.5rem", 
                      padding: "0.65rem 0.5rem", 
                      borderRadius: "8px", 
                      border: returnCondition === 'repair' ? "2px solid var(--danger-color)" : "1px solid var(--border-color)",
                      backgroundColor: returnCondition === 'repair' ? "rgba(239, 68, 68, 0.06)" : "var(--bg-tertiary)",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <input 
                      type="radio" 
                      name="returnCondition" 
                      checked={returnCondition === 'repair'}
                      onChange={() => setReturnCondition('repair')}
                      style={{ accentColor: "var(--danger-color)" }}
                    />
                    <span>🔴 Precisa Conserto</span>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.75rem" }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setActiveReturnLoan(null)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Check size={16} />
                      Enviar Devolução
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

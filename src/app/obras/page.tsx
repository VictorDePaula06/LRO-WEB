"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  getObras, 
  addObra, 
  updateObra, 
  deleteObra,
  getLoans
} from "@/services/dataService";
import { Obra, Loan } from "@/types";
import { 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Briefcase,
  MapPin,
  ClipboardCheck,
  AlertTriangle
} from "lucide-react";
import CustomDialog from "@/components/CustomDialog";

export default function ObrasPage() {
  const router = useRouter();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState<"info" | "warning" | "danger" | "confirm">("info");
  const [dialogConfirmText, setDialogConfirmText] = useState("OK");
  const [dialogOnConfirm, setDialogOnConfirm] = useState<() => void>(() => {});

  const triggerDialog = (
    title: string,
    message: string,
    type: "info" | "warning" | "danger" | "confirm",
    onConfirm: () => void,
    confirmText = "OK"
  ) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogType(type);
    setDialogConfirmText(confirmText);
    setDialogOnConfirm(() => () => {
      onConfirm();
      setDialogOpen(false);
    });
    setDialogOpen(true);
  };

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<Obra["status"]>("active");
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  
  const [errorMsg, setErrorMsg] = useState("");

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
      const [obrasData, loansData] = await Promise.all([
        getObras(),
        getLoans()
      ]);
      setObras(obrasData);
      setLoans(loansData);
    } catch (err) {
      console.error("Erro ao buscar obras:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verifyAuth()) {
      fetchData();
    }
  }, [router]);

  const handleAddObraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setErrorMsg("O nome do canteiro/obra é obrigatório.");
      return;
    }

    try {
      setErrorMsg("");
      await addObra({
        name,
        address: address || "Sem Endereço Registrado",
        status
      });

      // Clear & Close
      setName("");
      setAddress("");
      setStatus("active");
      setIsAddOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao cadastrar obra.");
    }
  };

  const handleOpenEdit = (obra: Obra) => {
    setEditingObra(obra);
    setName(obra.name);
    setAddress(obra.address || "");
    setStatus(obra.status);
    setIsEditOpen(true);
  };

  const handleEditObraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingObra || !name) return;

    try {
      setErrorMsg("");
      await updateObra(editingObra.id, {
        name,
        address: address || "Sem Endereço Registrado",
        status
      });

      // Clear & Close
      setEditingObra(null);
      setName("");
      setAddress("");
      setStatus("active");
      setIsEditOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao editar obra.");
    }
  };

  const handleDeleteObra = async (id: string, obraName: string) => {
    // Safety check: is any tool currently out in this canteiro?
    const activeLoans = loans.filter(l => l.obraName === obraName && l.status !== "returned");
    if (activeLoans.length > 0) {
      triggerDialog(
        "Canteiro Ativo",
        `O canteiro "${obraName}" possui ${activeLoans.length} ferramenta(s) atualmente sob uso no local. Por favor, faça a devolução das ferramentas na gerência antes de remover o canteiro.`,
        "warning",
        () => {}
      );
      return;
    }

    triggerDialog(
      "Excluir Canteiro?",
      `Deseja realmente remover o canteiro/obra "${obraName}" do sistema LRO?`,
      "confirm",
      async () => {
        try {
          await deleteObra(id);
          await fetchData();
          triggerDialog("Excluído com Sucesso", "O canteiro de obras foi removido do cadastro.", "info", () => {});
        } catch (err) {
          console.error(err);
          triggerDialog("Erro na Operação", "Não foi possível excluir o canteiro do sistema.", "danger", () => {});
        }
      },
      "Excluir"
    );
  };

  // Helper to count active tools alocated to this obra
  const getActiveToolsForObraCount = (obraName: string) => {
    return loans.filter(l => l.obraName === obraName && l.status === "active").length;
  };

  const getStatusBadge = (s: Obra["status"]) => {
    switch (s) {
      case "active":
        return <span className="badge badge-success">Ativa (Em Demolição)</span>;
      case "completed":
        return <span className="badge badge-secondary" style={{ opacity: 0.7 }}>Concluída</span>;
      default:
        return <span className="badge">{s}</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>Carregando canteiros...</p>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <div className="page-title">
          <h1>Controle de Obras / Canteiros</h1>
          <p>Cadastre e gerencie os canteiros ativos de demolição da LRO</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setIsAddOpen(true);
          setName("");
          setAddress("");
          setStatus("active");
          setErrorMsg("");
        }}>
          <PlusCircle size={18} />
          Cadastrar Canteiro (Obra)
        </button>
      </header>

      <section className="section-card">
        <div className="section-title">
          <h2>Canteiros Cadastrados ({obras.length})</h2>
        </div>

        {obras.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
            Nenhuma obra cadastrada. Clique em "Cadastrar Canteiro (Obra)" para começar.
          </p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-container desktop-only">
              <table className="lro-table">
                <thead>
                  <tr>
                    <th>Identificação</th>
                    <th>Endereço do Canteiro</th>
                    <th>Status</th>
                    <th>Ferramentas Alocadas</th>
                    <th style={{ textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {obras.map((obra) => {
                    const toolsCount = getActiveToolsForObraCount(obra.name);
                    return (
                      <tr key={obra.id}>
                        <td data-label="Identificação" style={{ fontWeight: 700 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Briefcase size={16} style={{ color: "var(--accent-color)" }} />
                            <span>{obra.name}</span>
                          </div>
                        </td>
                        <td data-label="Endereço">
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <MapPin size={13} style={{ color: "var(--text-muted)" }} />
                            <span>{obra.address || "Sem endereço cadastrado"}</span>
                          </div>
                        </td>
                        <td data-label="Status">{getStatusBadge(obra.status)}</td>
                        <td data-label="Ferramentas">
                          {toolsCount > 0 ? (
                            <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                              {toolsCount} {toolsCount === 1 ? "máquina ativa" : "máquinas ativas"}
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ opacity: 0.6 }}>Nenhuma</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => handleOpenEdit(obra)}
                              style={{ padding: "0.4rem", borderRadius: "6px" }}
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn btn-secondary btn-danger" 
                              onClick={() => handleDeleteObra(obra.id, obra.name)}
                              style={{ padding: "0.4rem", borderRadius: "6px" }}
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Grid View */}
            <div className="mobile-only">
              <div className="mobile-cards-grid">
                {obras.map((obra) => {
                  const toolsCount = getActiveToolsForObraCount(obra.name);
                  return (
                    <div key={obra.id} className="employee-mobile-card">
                      <div className="emp-card-header">
                        <div className="emp-card-avatar-wrapper" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", borderRadius: "8px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Briefcase size={22} style={{ color: "var(--accent-color)" }} />
                        </div>
                        <div className="emp-card-title-block">
                          <h3>{obra.name}</h3>
                          <span className="emp-card-role">{obra.address || "Sem endereço"}</span>
                        </div>
                      </div>

                      <div className="emp-card-body" style={{ borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                        <div className="emp-info-row">
                          <span>Status:</span>
                          {getStatusBadge(obra.status)}
                        </div>
                        <div className="emp-info-row">
                          <span>Máquinas no Local:</span>
                          {toolsCount > 0 ? (
                            <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                              {toolsCount} {toolsCount === 1 ? "máquina" : "máquinas"}
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ opacity: 0.8 }}>Nenhuma</span>
                          )}
                        </div>
                      </div>

                      <div className="emp-card-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(obra)}>
                          <Edit2 size={14} /> Editar
                        </button>
                        <button className="btn btn-secondary btn-danger btn-sm" onClick={() => handleDeleteObra(obra.id, obra.name)}>
                          <Trash2 size={14} /> Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </section>

      {/* MODAL: ADICIONAR OBRA */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Cadastrar Novo Canteiro (Obra)</h3>
              <button className="modal-close" onClick={() => setIsAddOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddObraSubmit}>
              {errorMsg && (
                <div style={{ color: "var(--danger-color)", fontSize: "0.85rem", marginBottom: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "6px" }}>
                  {errorMsg}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="nameAdd">Nome da Obra / Canteiro</label>
                <input 
                  type="text" 
                  id="nameAdd"
                  className="form-control"
                  placeholder="Ex: Obra Shopping Bourbon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="addressAdd">Endereço da Demolição</label>
                <input 
                  type="text" 
                  id="addressAdd"
                  className="form-control"
                  placeholder="Ex: Av. Francisco Matarazzo, 858 - Água Branca"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="statusAdd">Status Inicial</label>
                <select 
                  id="statusAdd"
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Obra["status"])}
                >
                  <option value="active">Canteiro Ativo (Em Demolição)</option>
                  <option value="completed">Concluída (Finalizada)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  Cadastrar Obra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR OBRA */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Editar Canteiro (Obra)</h3>
              <button className="modal-close" onClick={() => setIsEditOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleEditObraSubmit}>
              {errorMsg && (
                <div style={{ color: "var(--danger-color)", fontSize: "0.85rem", marginBottom: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "6px" }}>
                  {errorMsg}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="nameEdit">Nome da Obra / Canteiro</label>
                <input 
                  type="text" 
                  id="nameEdit"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="addressEdit">Endereço da Demolição</label>
                <input 
                  type="text" 
                  id="addressEdit"
                  className="form-control"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="statusEdit">Status do Canteiro</label>
                <select 
                  id="statusEdit"
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Obra["status"])}
                >
                  <option value="active">Canteiro Ativo (Em Demolição)</option>
                  <option value="completed">Concluída (Finalizada)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomDialog
        isOpen={dialogOpen}
        title={dialogTitle}
        message={dialogMessage}
        type={dialogType}
        confirmText={dialogConfirmText}
        onConfirm={dialogOnConfirm}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}

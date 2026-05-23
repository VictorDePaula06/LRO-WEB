"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  getTools, 
  addTool, 
  updateTool, 
  deleteTool 
} from "@/services/dataService";
import { Tool } from "@/types";
import { 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Wrench, 
  Check, 
  X,
  AlertTriangle
} from "lucide-react";
import PhotoUpload from "@/components/PhotoUpload";

export default function ToolsPage() {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [status, setStatus] = useState<Tool["status"]>("available");
  const [image, setImage] = useState<string | null>(null);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  
  const [errorMsg, setErrorMsg] = useState("");

  const verifyAuth = () => {
    const role = localStorage.getItem("lro_user_role");
    if (role !== "admin") {
      router.push("/login");
      return false;
    }
    return true;
  };

  const fetchTools = async () => {
    try {
      setLoading(true);
      const data = await getTools();
      setTools(data);
    } catch (err) {
      console.error("Erro ao buscar ferramentas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verifyAuth()) {
      fetchTools();
    }
  }, [router]);

  const handleAddToolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setErrorMsg("O nome da ferramenta é obrigatório.");
      return;
    }

    try {
      setErrorMsg("");
      await addTool({
        name,
        brand,
        serialNumber: serialNumber || "N/A",
        status,
        image
      });

      // Clear & Close
      setName("");
      setBrand("");
      setSerialNumber("");
      setStatus("available");
      setImage(null);
      setIsAddOpen(false);
      await fetchTools();
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao adicionar ferramenta.");
    }
  };

  const handleOpenEdit = (tool: Tool) => {
    setEditingTool(tool);
    setName(tool.name);
    setBrand(tool.brand || "");
    setSerialNumber(tool.serialNumber || "");
    setStatus(tool.status);
    setImage(tool.image || null);
    setIsEditOpen(true);
  };

  const handleEditToolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTool || !name) return;

    try {
      setErrorMsg("");
      await updateTool(editingTool.id, {
        name,
        brand,
        serialNumber: serialNumber || "N/A",
        status,
        image
      });

      // Clear & Close
      setEditingTool(null);
      setName("");
      setBrand("");
      setSerialNumber("");
      setStatus("available");
      setImage(null);
      setIsEditOpen(false);
      await fetchTools();
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao editar ferramenta.");
    }
  };

  const handleDeleteTool = async (id: string, toolName: string) => {
    const tool = tools.find(t => t.id === id);
    if (tool?.status === "loaned" || tool?.status === "pending") {
      alert(`A ferramenta "${toolName}" está em trânsito com colaborador e não pode ser excluída até ser aprovada.`);
      return;
    }

    if (confirm(`Deseja realmente excluir a ferramenta "${toolName}" permanentemente?`)) {
      try {
        await deleteTool(id);
        await fetchTools();
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir ferramenta.");
      }
    }
  };

  const getStatusBadge = (s: Tool["status"]) => {
    switch (s) {
      case "available":
        return <span className="badge badge-success">Disponível</span>;
      case "loaned":
        return <span className="badge badge-warning">Emprestada</span>;
      case "pending":
        return <span className="badge badge-warning" style={{ animation: "pulse 2s infinite" }}>Pendente de Aprovação</span>;
      case "maintenance":
        return <span className="badge badge-danger">Manutenção</span>;
      default:
        return <span className="badge">{s}</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>Carregando inventário...</p>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <div className="page-title">
          <h1>Cadastro de Ferramentas</h1>
          <p>Gerencie o inventário de máquinas, equipamentos e ferramentas da LRO</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setIsAddOpen(true);
          setName("");
          setBrand("");
          setSerialNumber("");
          setStatus("available");
          setImage(null);
          setErrorMsg("");
        }}>
          <PlusCircle size={18} />
          Cadastrar Ferramenta
        </button>
      </header>

      <section className="section-card">
        <div className="section-title">
          <h2>Todas as Ferramentas ({tools.length})</h2>
        </div>

        {tools.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
            Nenhuma ferramenta cadastrada no inventário. Clique em "Cadastrar Ferramenta" para começar.
          </p>
        ) : (
          <div className="table-container">
            <table className="lro-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Ferramenta</th>
                  <th>Marca</th>
                  <th>Nº Série / Identificador</th>
                  <th>Status</th>
                  <th>Responsável Atual</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.id}>
                    <td data-label="Foto">
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        backgroundColor: "var(--bg-tertiary)",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {tool.image ? (
                          <img src={tool.image} alt={tool.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <Wrench size={18} style={{ color: "var(--text-muted)" }} />
                        )}
                      </div>
                    </td>
                    <td data-label="Ferramenta" style={{ fontWeight: 600 }}>{tool.name}</td>
                    <td data-label="Marca">{tool.brand || "—"}</td>
                    <td data-label="Nº Série" style={{ fontFamily: "monospace" }}>{tool.serialNumber || "—"}</td>
                    <td data-label="Status">{getStatusBadge(tool.status)}</td>
                    <td data-label="Responsável" style={{ fontStyle: tool.currentEmployeeName ? "normal" : "italic", color: tool.currentEmployeeName ? "var(--text-primary)" : "var(--text-muted)" }}>
                      {tool.currentEmployeeName || "Na Base"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleOpenEdit(tool)}
                          style={{ padding: "0.4rem", borderRadius: "6px" }}
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="btn btn-secondary btn-danger" 
                          onClick={() => handleDeleteTool(tool.id, tool.name)}
                          style={{ padding: "0.4rem", borderRadius: "6px" }}
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODAL: ADICIONAR FERRAMENTA */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Cadastrar Nova Ferramenta</h3>
              <button className="modal-close" onClick={() => setIsAddOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddToolSubmit}>
              {errorMsg && (
                <div style={{ color: "var(--danger-color)", fontSize: "0.85rem", marginBottom: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "6px" }}>
                  {errorMsg}
                </div>
              )}

              {/* Photo Upload Capture component */}
              <PhotoUpload 
                onChange={(base64) => setImage(base64)}
                value={image}
                label="Foto do Equipamento"
              />

              <div className="form-group">
                <label htmlFor="nameAdd">Nome / Descrição da Ferramenta</label>
                <input 
                  type="text" 
                  id="nameAdd"
                  className="form-control"
                  placeholder="Ex: Martelete Demolidor Makita 15kg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="brandAdd">Marca</label>
                <input 
                  type="text" 
                  id="brandAdd"
                  className="form-control"
                  placeholder="Ex: Makita, Bosch, DeWalt"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="serialAdd">Número de Série / Código Identificador</label>
                <input 
                  type="text" 
                  id="serialAdd"
                  className="form-control"
                  placeholder="Ex: SN-93821 ou código interno"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="statusAdd">Status Inicial</label>
                <select 
                  id="statusAdd"
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Tool["status"])}
                >
                  <option value="available">Disponível para Empréstimo</option>
                  <option value="maintenance">Em Manutenção</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  Cadastrar Ferramenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR FERRAMENTA */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Editar Ferramenta</h3>
              <button className="modal-close" onClick={() => setIsEditOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleEditToolSubmit}>
              {errorMsg && (
                <div style={{ color: "var(--danger-color)", fontSize: "0.85rem", marginBottom: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "6px" }}>
                  {errorMsg}
                </div>
              )}

              {/* Photo Upload Capture component */}
              <PhotoUpload 
                onChange={(base64) => setImage(base64)}
                value={image}
                label="Foto do Equipamento"
              />

              <div className="form-group">
                <label htmlFor="nameEdit">Nome / Descrição da Ferramenta</label>
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
                <label htmlFor="brandEdit">Marca</label>
                <input 
                  type="text" 
                  id="brandEdit"
                  className="form-control"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="serialEdit">Número de Série / Código Identificador</label>
                <input 
                  type="text" 
                  id="serialEdit"
                  className="form-control"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="statusEdit">Status da Ferramenta</label>
                <select 
                  id="statusEdit"
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Tool["status"])}
                  disabled={editingTool?.status === "loaned" || editingTool?.status === "pending"}
                >
                  <option value="available">Disponível para Empréstimo</option>
                  <option value="maintenance">Em Manutenção</option>
                  {(editingTool?.status === "loaned" || editingTool?.status === "pending") && (
                    <option value={editingTool.status}>
                      {editingTool.status === "loaned" ? "Emprestada" : "Devolução Pendente"} (Tratar pelo Painel)
                    </option>
                  )}
                </select>
                {(editingTool?.status === "loaned" || editingTool?.status === "pending") && (
                  <p style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--warning-color)", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                    <AlertTriangle size={12} />
                    Esta ferramenta está em posse ou devolução com colaborador. Faça a devolução ou aprove no Painel Principal.
                  </p>
                )}
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
    </div>
  );
}

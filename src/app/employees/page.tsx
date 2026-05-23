"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  getEmployees, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee,
  getLoans
} from "@/services/dataService";
import { Employee, Loan } from "@/types";
import { 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  User,
  Phone,
  Key
} from "lucide-react";
import PhotoUpload from "@/components/PhotoUpload";

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
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
      const [empData, loanData] = await Promise.all([
        getEmployees(),
        getLoans()
      ]);
      setEmployees(empData);
      setLoans(loanData);
    } catch (err) {
      console.error("Erro ao buscar funcionários:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verifyAuth()) {
      fetchData();
    }
  }, [router]);

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !pin) {
      setErrorMsg("Nome, cargo e código PIN são campos obrigatórios.");
      return;
    }

    if (pin.length !== 4) {
      setErrorMsg("O código PIN deve conter exatamente 4 dígitos numéricos.");
      return;
    }

    try {
      setErrorMsg("");
      await addEmployee({
        name,
        role,
        phone: phone || "Sem Telefone",
        pin,
        image
      });

      // Clear & Close
      setName("");
      setRole("");
      setPhone("");
      setPin("");
      setImage(null);
      setIsAddOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao cadastrar funcionário.");
    }
  };

  const handleOpenEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setName(employee.name);
    setRole(employee.role);
    setPhone(employee.phone || "");
    setPin(employee.pin || "");
    setImage(employee.image || null);
    setIsEditOpen(true);
  };

  const handleEditEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !name || !role || !pin) return;

    if (pin.length !== 4) {
      setErrorMsg("O código PIN deve conter exatamente 4 dígitos numéricos.");
      return;
    }

    try {
      setErrorMsg("");
      await updateEmployee(editingEmployee.id, {
        name,
        role,
        phone: phone || "Sem Telefone",
        pin,
        image
      });

      // Clear & Close
      setEditingEmployee(null);
      setName("");
      setRole("");
      setPhone("");
      setPin("");
      setImage(null);
      setIsEditOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao editar funcionário.");
    }
  };

  const handleDeleteEmployee = async (id: string, empName: string) => {
    // Check if employee has any active loans (checked-out tools)
    const activeLoans = loans.filter(l => l.employeeId === id && l.status !== "returned");
    if (activeLoans.length > 0) {
      alert(`O funcionário "${empName}" possui ${activeLoans.length} ferramenta(s) sob sua responsabilidade (em posse ou aguardando aprovação). Devolva e aprove tudo antes de excluí-lo do sistema.`);
      return;
    }

    if (confirm(`Deseja realmente excluir o funcionário "${empName}" permanentemente?`)) {
      try {
        await deleteEmployee(id);
        await fetchData();
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir funcionário.");
      }
    }
  };

  // Helper to count active tools for an employee
  const getActiveToolsCount = (empId: string) => {
    return loans.filter(l => l.employeeId === empId && l.status !== "returned").length;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>Carregando equipe...</p>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <div className="page-title">
          <h1>Cadastro de Funcionários</h1>
          <p>Gerencie a equipe e acompanhe quem é responsável por cada ferramenta</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setIsAddOpen(true);
          setName("");
          setRole("");
          setPhone("");
          setPin("");
          setImage(null);
          setErrorMsg("");
        }}>
          <PlusCircle size={18} />
          Cadastrar Funcionário
        </button>
      </header>

      <section className="section-card">
        <div className="section-title">
          <h2>Equipe Cadastrada ({employees.length})</h2>
        </div>

        {employees.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
            Nenhum funcionário cadastrado. Clique em "Cadastrar Funcionário" para começar.
          </p>
        ) : (
          <div className="table-container">
            <table className="lro-table">
              <thead>
                <tr>
                  <th>Perfil</th>
                  <th>Nome</th>
                  <th>Cargo / Função</th>
                  <th>Telefone de Contato</th>
                  <th>Código PIN (Acesso)</th>
                  <th>Ferramentas com Ele</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const toolsCount = getActiveToolsCount(emp.id);
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          overflow: "hidden",
                          backgroundColor: "var(--bg-tertiary)",
                          border: "1px solid var(--border-color)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          {emp.image ? (
                            <img src={emp.image} alt={emp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <User size={18} style={{ color: "var(--text-muted)" }} />
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{emp.name}</td>
                      <td>{emp.role}</td>
                      <td>
                        {emp.phone && emp.phone !== "Sem Telefone" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Phone size={13} style={{ color: "var(--text-muted)" }} />
                            <span>{emp.phone}</span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Sem telefone</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Key size={13} style={{ color: "var(--accent-color)" }} />
                          <span style={{ fontFamily: "monospace", letterSpacing: "1px", fontWeight: 700 }}>
                            {emp.pin}
                          </span>
                        </div>
                      </td>
                      <td>
                        {toolsCount > 0 ? (
                          <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                            {toolsCount} {toolsCount === 1 ? "ferramenta" : "ferramentas"}
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ opacity: 0.6 }}>Nenhuma</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => handleOpenEdit(emp)}
                            style={{ padding: "0.4rem", borderRadius: "6px" }}
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-secondary btn-danger" 
                            onClick={() => handleDeleteEmployee(emp.id, emp.name)}
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
        )}
      </section>

      {/* MODAL: ADICIONAR FUNCIONÁRIO */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Cadastrar Novo Funcionário</h3>
              <button className="modal-close" onClick={() => setIsAddOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddEmployeeSubmit}>
              {errorMsg && (
                <div style={{ color: "var(--danger-color)", fontSize: "0.85rem", marginBottom: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "6px" }}>
                  {errorMsg}
                </div>
              )}

              {/* Photo circular capture upload */}
              <PhotoUpload 
                onChange={(base64) => setImage(base64)}
                value={image}
                label="Foto de Perfil (Funcionário)"
                circular={true}
              />

              <div className="form-group">
                <label htmlFor="nameAdd">Nome Completo</label>
                <input 
                  type="text" 
                  id="nameAdd"
                  className="form-control"
                  placeholder="Ex: Carlos Augusto Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="roleAdd">Cargo / Função</label>
                <input 
                  type="text" 
                  id="roleAdd"
                  className="form-control"
                  placeholder="Ex: Operador de Martelete, Pedreiro, Ajudante"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneAdd">Telefone de Contato (WhatsApp)</label>
                <input 
                  type="text" 
                  id="phoneAdd"
                  className="form-control"
                  placeholder="Ex: (11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pinAdd">PIN de Acesso (4 dígitos numéricos)</label>
                <input 
                  type="password" 
                  id="pinAdd"
                  className="form-control"
                  placeholder="Ex: 5542"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  required
                  style={{ letterSpacing: "4px", fontSize: "1.1rem" }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Este código será usado pelo trabalhador para fazer login no celular dele no canteiro de obras.
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  Cadastrar Equipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR FUNCIONÁRIO */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Editar Funcionário</h3>
              <button className="modal-close" onClick={() => setIsEditOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleEditEmployeeSubmit}>
              {errorMsg && (
                <div style={{ color: "var(--danger-color)", fontSize: "0.85rem", marginBottom: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "6px" }}>
                  {errorMsg}
                </div>
              )}

              {/* Photo circular capture upload */}
              <PhotoUpload 
                onChange={(base64) => setImage(base64)}
                value={image}
                label="Foto de Perfil (Funcionário)"
                circular={true}
              />

              <div className="form-group">
                <label htmlFor="nameEdit">Nome Completo</label>
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
                <label htmlFor="roleEdit">Cargo / Função</label>
                <input 
                  type="text" 
                  id="roleEdit"
                  className="form-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneEdit">Telefone de Contato (WhatsApp)</label>
                <input 
                  type="text" 
                  id="phoneEdit"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pinEdit">PIN de Acesso (4 dígitos numéricos)</label>
                <input 
                  type="password" 
                  id="pinEdit"
                  className="form-control"
                  placeholder="Ex: 5542"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  required
                  style={{ letterSpacing: "4px", fontSize: "1.1rem" }}
                />
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

import { db, isFirebaseConfigured } from "./firebaseConfig";
import { Tool, Employee, Loan, Obra } from "../types";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  setDoc,
  getDoc
} from "firebase/firestore";

// Helper to prevent timezone shift bugs when parsing date inputs (YYYY-MM-DD)
const getLocalEndOfDayISO = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const localDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  return localDate.toISOString();
};

// Seed Data for LocalStorage fallback
const defaultTools: Tool[] = [
  { id: "tool_1", name: "Martelete Rompedor 10kg", brand: "Bosch", serialNumber: "BSH-19283", status: "available", image: null },
  { id: "tool_2", name: "Esmerilhadeira Angular 7\"", brand: "DeWalt", serialNumber: "DW-83921", status: "available", image: null },
  { id: "tool_3", name: "Cortadora de Concreto à Gasolina", brand: "Stihl", serialNumber: "STH-48392", status: "available", image: null },
  { id: "tool_4", name: "Furadeira de Impacto", brand: "Makita", serialNumber: "MKT-90210", status: "available", image: null },
  { id: "tool_5", name: "Marreta de Aço 5kg", brand: "Tramontina", serialNumber: "N/A", status: "available", image: null }
];

const defaultEmployees: Employee[] = [
  { id: "emp_1", name: "José da Silva", role: "Pedreiro", phone: "(11) 98765-4321", pin: "1234", image: null },
  { id: "emp_2", name: "Antônio Santos", role: "Ajudante Geral", phone: "(11) 97654-3210", pin: "1111", image: null },
  { id: "emp_3", name: "Carlos Souza", role: "Operador de Martelete", phone: "(11) 96543-2109", pin: "2222", image: null },
  { id: "emp_4", name: "Marcos Oliveira", role: "Encarregado de Obra", phone: "(11) 95432-1098", pin: "4321", image: null }
];

const defaultObras: Obra[] = [
  { id: "obra_1", name: "Obra Shopping Bourbon", status: "active" },
  { id: "obra_2", name: "Obra Prédio Centro", status: "active" },
  { id: "obra_3", name: "Demolição Galpão Barra", status: "active" },
  { id: "obra_4", name: "Demolição Residência Morumbi", status: "active" },
  { id: "obra_5", name: "Base Central (LRO)", status: "active" }
];

// Helper to initialize LocalStorage if empty
const initLocalStorage = () => {
  if (typeof window === "undefined") return;
  
  if (!localStorage.getItem("lro_tools")) {
    localStorage.setItem("lro_tools", JSON.stringify(defaultTools));
  }
  if (!localStorage.getItem("lro_employees")) {
    localStorage.setItem("lro_employees", JSON.stringify(defaultEmployees));
  }
  if (!localStorage.getItem("lro_obras")) {
    localStorage.setItem("lro_obras", JSON.stringify(defaultObras));
  }
  if (!localStorage.getItem("lro_loans")) {
    localStorage.setItem("lro_loans", JSON.stringify([]));
  }
};

// --- LOCAL STORAGE IMPLEMENTATION ---
const local = {
  getTools: (): Tool[] => {
    initLocalStorage();
    return JSON.parse(localStorage.getItem("lro_tools") || "[]");
  },
  
  saveTools: (tools: Tool[]) => {
    localStorage.setItem("lro_tools", JSON.stringify(tools));
  },
  
  addTool: (toolData: Omit<Tool, "id">): Tool => {
    const tools = local.getTools();
    const newTool: Tool = {
      ...toolData,
      id: "tool_" + Date.now()
    };
    tools.push(newTool);
    local.saveTools(tools);
    return newTool;
  },
  
  updateTool: (id: string, updates: Partial<Tool>) => {
    const tools = local.getTools();
    const updated = tools.map(t => t.id === id ? { ...t, ...updates } : t);
    local.saveTools(updated);
  },
  
  deleteTool: (id: string) => {
    const tools = local.getTools();
    const filtered = tools.filter(t => t.id !== id);
    local.saveTools(filtered);
  },
  
  getEmployees: (): Employee[] => {
    initLocalStorage();
    return JSON.parse(localStorage.getItem("lro_employees") || "[]");
  },
  
  saveEmployees: (employees: Employee[]) => {
    localStorage.setItem("lro_employees", JSON.stringify(employees));
  },
  
  addEmployee: (employeeData: Omit<Employee, "id">): Employee => {
    const employees = local.getEmployees();
    const newEmployee: Employee = {
      ...employeeData,
      id: "emp_" + Date.now()
    };
    employees.push(newEmployee);
    local.saveEmployees(employees);
    return newEmployee;
  },
  
  updateEmployee: (id: string, updates: Partial<Employee>) => {
    const employees = local.getEmployees();
    const updated = employees.map(e => e.id === id ? { ...e, ...updates } : e);
    local.saveEmployees(updated);
  },
  
  deleteEmployee: (id: string) => {
    const employees = local.getEmployees();
    const filtered = employees.filter(e => e.id !== id);
    local.saveEmployees(filtered);
  },
  
  getLoans: (): Loan[] => {
    initLocalStorage();
    const rawLoans = JSON.parse(localStorage.getItem("lro_loans") || "[]") as Loan[];
    let hasChanges = false;
    const patchedLoans = rawLoans.map(l => {
      // Auto-repair older test entries with timezone offset bugs (ends with T00:00:00.000Z)
      if (l.dueDate && l.dueDate.endsWith("T00:00:00.000Z")) {
        hasChanges = true;
        l.dueDate = l.dueDate.replace("T00:00:00.000Z", "T23:59:59.999Z");
      }
      return l;
    });
    if (hasChanges) {
      localStorage.setItem("lro_loans", JSON.stringify(patchedLoans));
    }
    return patchedLoans;
  },
  
  saveLoans: (loans: Loan[]) => {
    localStorage.setItem("lro_loans", JSON.stringify(loans));
  },
  
  createLoan: (toolId: string, employeeId: string, dueDate: string, obraName?: string | null): Loan => {
    const tools = local.getTools();
    const employees = local.getEmployees();
    const loans = local.getLoans();
    
    const tool = tools.find(t => t.id === toolId);
    const employee = employees.find(e => e.id === employeeId);
    
    if (!tool || !employee) throw new Error("Ferramenta ou funcionário não encontrado");
    if (tool.status === "loaned" || tool.status === "pending") throw new Error("Esta ferramenta está indisponível");
    
    const newLoan: Loan = {
      id: "loan_" + Date.now(),
      toolId: tool.id,
      toolName: `${tool.name}${tool.brand ? ` (${tool.brand})` : ""}${tool.serialNumber && tool.serialNumber !== "N/A" ? ` - SN: ${tool.serialNumber}` : ""}`,
      employeeId: employee.id,
      employeeName: employee.name,
      loanDate: new Date().toISOString(),
      dueDate: getLocalEndOfDayISO(dueDate),
      returnDate: null,
      status: "active",
      obraName: obraName || "Base Central (LRO)"
    };
    
    loans.push(newLoan);
    local.saveLoans(loans);
    
    // Update Tool Status
    local.updateTool(toolId, { 
      status: "loaned", 
      currentLoanId: newLoan.id,
      currentEmployeeName: employee.name 
    });
    
    return newLoan;
  },
  
  returnLoan: (loanId: string) => {
    const loans = local.getLoans();
    const loan = loans.find(l => l.id === loanId);
    
    if (!loan) throw new Error("Empréstimo não encontrado");
    
    const returnDate = new Date().toISOString();
    const updatedLoans = loans.map(l => l.id === loanId ? { ...l, returnDate, status: "returned" as const } : l);
    local.saveLoans(updatedLoans);
    
    // Reset Tool Status
    local.updateTool(loan.toolId, { 
      status: "available", 
      currentLoanId: null,
      currentEmployeeName: null 
    });
  },
  
  requestReturnLoan: (loanId: string, proofImageBase64: string, returnCondition: 'perfect' | 'repair') => {
    const loans = local.getLoans();
    const loan = loans.find(l => l.id === loanId);
    
    if (!loan) throw new Error("Empréstimo não encontrado");
    
    const updatedLoans = loans.map(l => l.id === loanId ? { 
      ...l, 
      status: "pending" as const, 
      returnProofImage: proofImageBase64,
      returnRequestDate: new Date().toISOString(),
      returnCondition
    } : l);
    local.saveLoans(updatedLoans);
    
    // Set tool status to pending as well
    local.updateTool(loan.toolId, { status: "pending" });
  },
  
  approveReturn: (loanId: string) => {
    const loans = local.getLoans();
    const loan = loans.find(l => l.id === loanId);
    
    if (!loan) throw new Error("Empréstimo não encontrado");
    
    const returnDate = new Date().toISOString();
    const updatedLoans = loans.map(l => l.id === loanId ? { 
      ...l, 
      status: "returned" as const, 
      returnDate 
    } : l);
    local.saveLoans(updatedLoans);
    
    const toolStatus = loan.returnCondition === "repair" ? "maintenance" as const : "available" as const;
    
    // Reset Tool Status to available or maintenance
    local.updateTool(loan.toolId, { 
      status: toolStatus, 
      currentLoanId: null,
      currentEmployeeName: null 
    });
  },
  
  rejectReturn: (loanId: string) => {
    const loans = local.getLoans();
    const loan = loans.find(l => l.id === loanId);
    
    if (!loan) throw new Error("Empréstimo não encontrado");
    
    const updatedLoans = loans.map(l => l.id === loanId ? { 
      ...l, 
      status: "active" as const, 
      returnProofImage: null,
      returnRequestDate: null
    } : l);
    local.saveLoans(updatedLoans);
    
    // Revert tool status to loaned
    local.updateTool(loan.toolId, { status: "loaned" });
  },
  
  getObras: (): Obra[] => {
    initLocalStorage();
    return JSON.parse(localStorage.getItem("lro_obras") || "[]");
  },
  
  saveObras: (obras: Obra[]) => {
    localStorage.setItem("lro_obras", JSON.stringify(obras));
  },
  
  addObra: (obraData: Omit<Obra, "id">): Obra => {
    const obras = local.getObras();
    const newObra: Obra = {
      ...obraData,
      id: "obra_" + Date.now()
    };
    obras.push(newObra);
    local.saveObras(obras);
    return newObra;
  },
  
  updateObra: (id: string, updates: Partial<Obra>) => {
    const obras = local.getObras();
    const updated = obras.map(o => o.id === id ? { ...o, ...updates } : o);
    local.saveObras(updated);
  },
  
  deleteObra: (id: string) => {
    const obras = local.getObras();
    const filtered = obras.filter(o => o.id !== id);
    local.saveObras(filtered);
  }
};

// --- FIREBASE FIRESTORE IMPLEMENTATION ---
const fb = {
  getTools: async (): Promise<Tool[]> => {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, "tools"));
    const tools = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool));
    
    if (tools.length === 0) {
      console.log("Seeding tools into Firestore...");
      for (const t of defaultTools) {
        const { id, ...data } = t;
        await setDoc(doc(db, "tools", id), data);
      }
      return defaultTools;
    }
    return tools;
  },
  
  addTool: async (toolData: Omit<Tool, "id">): Promise<Tool> => {
    if (!db) throw new Error("Firebase not initialized");
    const docRef = await addDoc(collection(db, "tools"), toolData);
    return { id: docRef.id, ...toolData };
  },
  
  updateTool: async (id: string, updates: Partial<Tool>) => {
    if (!db) throw new Error("Firebase not initialized");
    await updateDoc(doc(db, "tools", id), updates);
  },
  
  deleteTool: async (id: string) => {
    if (!db) throw new Error("Firebase not initialized");
    await deleteDoc(doc(db, "tools", id));
  },
  
  getEmployees: async (): Promise<Employee[]> => {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, "employees"));
    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
    
    if (employees.length === 0) {
      console.log("Seeding employees into Firestore...");
      for (const e of defaultEmployees) {
        const { id, ...data } = e;
        await setDoc(doc(db, "employees", id), data);
      }
      return defaultEmployees;
    }
    return employees;
  },
  
  addEmployee: async (employeeData: Omit<Employee, "id">): Promise<Employee> => {
    if (!db) throw new Error("Firebase not initialized");
    const docRef = await addDoc(collection(db, "employees"), employeeData);
    return { id: docRef.id, ...employeeData };
  },
  
  updateEmployee: async (id: string, updates: Partial<Employee>) => {
    if (!db) throw new Error("Firebase not initialized");
    await updateDoc(doc(db, "employees", id), updates);
  },
  
  deleteEmployee: async (id: string) => {
    if (!db) throw new Error("Firebase not initialized");
    await deleteDoc(doc(db, "employees", id));
  },
  
  getLoans: async (): Promise<Loan[]> => {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, "loans"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan));
  },
  
  createLoan: async (toolId: string, employeeId: string, dueDate: string, obraName?: string | null): Promise<Loan> => {
    if (!db) throw new Error("Firebase not initialized");
    
    const tools = await fb.getTools();
    const employees = await fb.getEmployees();
    
    const tool = tools.find(t => t.id === toolId);
    const employee = employees.find(e => e.id === employeeId);
    
    if (!tool || !employee) throw new Error("Ferramenta ou funcionário não encontrado");
    if (tool.status === "loaned" || tool.status === "pending") throw new Error("Esta ferramenta está indisponível");
    
    const loanData: Omit<Loan, "id"> = {
      toolId: tool.id,
      toolName: `${tool.name}${tool.brand ? ` (${tool.brand})` : ""}${tool.serialNumber && tool.serialNumber !== "N/A" ? ` - SN: ${tool.serialNumber}` : ""}`,
      employeeId: employee.id,
      employeeName: employee.name,
      loanDate: new Date().toISOString(),
      dueDate: getLocalEndOfDayISO(dueDate),
      returnDate: null,
      status: "active",
      obraName: obraName || "Base Central (LRO)"
    };
    
    const docRef = await addDoc(collection(db, "loans"), loanData);
    const newLoan = { id: docRef.id, ...loanData };
    
    await fb.updateTool(toolId, { 
      status: "loaned", 
      currentLoanId: newLoan.id,
      currentEmployeeName: employee.name 
    });
    
    return newLoan;
  },
  
  returnLoan: async (loanId: string) => {
    if (!db) throw new Error("Firebase not initialized");
    
    const loans = await fb.getLoans();
    const loan = loans.find(l => l.id === loanId);
    
    if (!loan) throw new Error("Empréstimo não encontrado");
    
    const returnDate = new Date().toISOString();
    await updateDoc(doc(db, "loans", loanId), { 
      returnDate, 
      status: "returned" as const 
    });
    
    await fb.updateTool(loan.toolId, { 
      status: "available", 
      currentLoanId: null,
      currentEmployeeName: null 
    });
  },

  requestReturnLoan: async (loanId: string, proofImageBase64: string, returnCondition: 'perfect' | 'repair') => {
    if (!db) throw new Error("Firebase not initialized");
    
    const loans = await fb.getLoans();
    const loan = loans.find(l => l.id === loanId);
    
    if (!loan) throw new Error("Empréstimo não encontrado");
    
    await updateDoc(doc(db, "loans", loanId), {
      status: "pending" as const,
      returnProofImage: proofImageBase64,
      returnRequestDate: new Date().toISOString(),
      returnCondition
    });
    
    await fb.updateTool(loan.toolId, { status: "pending" });
  },

  approveReturn: async (loanId: string) => {
    if (!db) throw new Error("Firebase not initialized");
    
    const loans = await fb.getLoans();
    const loan = loans.find(l => l.id === loanId);
    
    if (!loan) throw new Error("Empréstimo não encontrado");
    
    const returnDate = new Date().toISOString();
    await updateDoc(doc(db, "loans", loanId), {
      status: "returned" as const,
      returnDate
    });
    
    const toolStatus = loan.returnCondition === "repair" ? "maintenance" as const : "available" as const;
    
    await fb.updateTool(loan.toolId, {
      status: toolStatus,
      currentLoanId: null,
      currentEmployeeName: null
    });
  },

  rejectReturn: async (loanId: string) => {
    if (!db) throw new Error("Firebase not initialized");
    
    const loans = await fb.getLoans();
    const loan = loans.find(l => l.id === loanId);
    
    if (!loan) throw new Error("Empréstimo não encontrado");
    
    await updateDoc(doc(db, "loans", loanId), {
      status: "active" as const,
      returnProofImage: null,
      returnRequestDate: null
    });
    
    await fb.updateTool(loan.toolId, { status: "loaned" });
  },

  getObras: async (): Promise<Obra[]> => {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, "obras"));
    const obras = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Obra));
    
    if (obras.length === 0) {
      console.log("Seeding obras into Firestore...");
      for (const o of defaultObras) {
        const { id, ...data } = o;
        await setDoc(doc(db, "obras", id), data);
      }
      return defaultObras;
    }
    return obras;
  },
  
  addObra: async (obraData: Omit<Obra, "id">): Promise<Obra> => {
    if (!db) throw new Error("Firebase not initialized");
    const docRef = await addDoc(collection(db, "obras"), obraData);
    return { id: docRef.id, ...obraData };
  },
  
  updateObra: async (id: string, updates: Partial<Obra>) => {
    if (!db) throw new Error("Firebase not initialized");
    await updateDoc(doc(db, "obras", id), updates);
  },
  
  deleteObra: async (id: string) => {
    if (!db) throw new Error("Firebase not initialized");
    await deleteDoc(doc(db, "obras", id));
  }
};

// --- DATA SERVICE UNIFICATION ---
export const getTools = async (): Promise<Tool[]> => {
  return isFirebaseConfigured ? await fb.getTools() : local.getTools();
};

export const addTool = async (toolData: Omit<Tool, "id">): Promise<Tool> => {
  return isFirebaseConfigured ? await fb.addTool(toolData) : local.addTool(toolData);
};

export const updateTool = async (id: string, updates: Partial<Tool>): Promise<void> => {
  isFirebaseConfigured ? await fb.updateTool(id, updates) : local.updateTool(id, updates);
};

export const deleteTool = async (id: string): Promise<void> => {
  isFirebaseConfigured ? await fb.deleteTool(id) : local.deleteTool(id);
};

export const getEmployees = async (): Promise<Employee[]> => {
  return isFirebaseConfigured ? await fb.getEmployees() : local.getEmployees();
};

export const addEmployee = async (employeeData: Omit<Employee, "id">): Promise<Employee> => {
  return isFirebaseConfigured ? await fb.addEmployee(employeeData) : local.addEmployee(employeeData);
};

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<void> => {
  isFirebaseConfigured ? await fb.updateEmployee(id, updates) : local.updateEmployee(id, updates);
};

export const deleteEmployee = async (id: string): Promise<void> => {
  isFirebaseConfigured ? await fb.deleteEmployee(id) : local.deleteEmployee(id);
};

export const getLoans = async (): Promise<Loan[]> => {
  return isFirebaseConfigured ? await fb.getLoans() : local.getLoans();
};

export const createLoan = async (toolId: string, employeeId: string, dueDate: string, obraName?: string | null): Promise<Loan> => {
  return isFirebaseConfigured ? await fb.createLoan(toolId, employeeId, dueDate, obraName) : local.createLoan(toolId, employeeId, dueDate, obraName);
};

export const returnLoan = async (loanId: string): Promise<void> => {
  isFirebaseConfigured ? await fb.returnLoan(loanId) : local.returnLoan(loanId);
};

export const requestReturnLoan = async (loanId: string, proofImageBase64: string, returnCondition: 'perfect' | 'repair'): Promise<void> => {
  isFirebaseConfigured ? await fb.requestReturnLoan(loanId, proofImageBase64, returnCondition) : local.requestReturnLoan(loanId, proofImageBase64, returnCondition);
};

export const approveReturn = async (loanId: string): Promise<void> => {
  isFirebaseConfigured ? await fb.approveReturn(loanId) : local.approveReturn(loanId);
};

export const rejectReturn = async (loanId: string): Promise<void> => {
  isFirebaseConfigured ? await fb.rejectReturn(loanId) : local.rejectReturn(loanId);
};

export const getObras = async (): Promise<Obra[]> => {
  return isFirebaseConfigured ? await fb.getObras() : local.getObras();
};

export const addObra = async (obraData: Omit<Obra, "id">): Promise<Obra> => {
  return isFirebaseConfigured ? await fb.addObra(obraData) : local.addObra(obraData);
};

export const updateObra = async (id: string, updates: Partial<Obra>): Promise<void> => {
  isFirebaseConfigured ? await fb.updateObra(id, updates) : local.updateObra(id, updates);
};

export const deleteObra = async (id: string): Promise<void> => {
  isFirebaseConfigured ? await fb.deleteObra(id) : local.deleteObra(id);
};

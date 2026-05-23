export interface Tool {
  id: string;
  name: string;
  brand: string;
  serialNumber: string;
  status: 'available' | 'loaned' | 'maintenance' | 'pending';
  currentLoanId?: string | null;
  currentEmployeeName?: string | null;
  image?: string | null; // Base64 representation of the tool's photo
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  pin: string; // 4-digit PIN for authentication on the field
  image?: string | null; // Base64 representation of the employee's photo
}

export interface Loan {
  id: string;
  toolId: string;
  toolName: string;
  employeeId: string;
  employeeName: string;
  loanDate: string; // ISO string
  dueDate: string;  // ISO string
  returnDate: string | null; // ISO string or null
  status: 'active' | 'pending' | 'returned'; // 'active' = out in the field, 'pending' = returned by colab waiting for approval, 'returned' = approved and base
  returnProofImage?: string | null; // Base64 photo uploaded by colab on return
  returnRequestDate?: string | null; // ISO string of when return request was made
  obraName?: string | null; // Construction site where the tool is used
  returnCondition?: 'perfect' | 'repair' | null; // Tool condition reported on return
}

export interface Obra {
  id: string;
  name: string;
  address?: string | null;
  status: 'active' | 'completed';
}

export const Role = {
    ADMIN: 'ADMIN',
    USER: 'USER',
    MEMBER: 'MEMBER',
    DIRECTOR: 'DIRECTOR',
    ACCOUNTANT: 'ACCOUNTANT',
    TREASURER: 'TREASURER'
} as const;

export type Role = typeof Role[keyof typeof Role];

export interface User {
    id: number;
    email: string;
    fullName: string;
    role: Role;
}

export interface BudgetAccount {
    id: number;
    code: string;
    name: string;
    year: number;
    allocatedAmount: number; // Decimal string from JSON, likely
    executed: number;
    committed: number;
    currentBalance: number;
    isAlert: boolean;
    available: number;
}

export interface ExpenseItem {
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface ExpenseAttachment {
    id: number;
    fileName: string;
    filePath: string;
}

// ... (User, BudgetAccount, ExpenseItem, ExpenseAttachment) ...

export interface ExpenseQuotation {
    id: number;
    supplierName: string;
    amount: number;
    filePath?: string;
    isSelected: boolean;
}

export interface ExpenseRequest {
    id: number;
    requesterId: number;
    requester?: { fullName: string; email: string };
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    description: string;
    totalAmount: number;
    createdAt: string;
    items: ExpenseItem[];
    attachments: ExpenseAttachment[];
    quotations?: ExpenseQuotation[];
    approvalDocument?: string;
}

export interface Reception {
    id: number;
    purchaseOrderId: number;
    date: string;
    note: string;
}

export interface PurchaseOrder {
    id: number;
    expenseRequestId?: number;
    supplierName: string;
    supplierTaxId?: string;
    date: string;
    status: 'ISSUED' | 'RECEIVED' | 'CLOSED' | 'PARTIAL';
    totalAmount: number;
    expenseRequest?: ExpenseRequest;
    receptions: Reception[];
    invoices?: Invoice[];
}

export interface Payment {
    id: number;
    invoiceId: number;
    bankAccountId?: number;
    amount: number;
    date: string;
    reference?: string;
}

export interface Invoice {
    id: number;
    purchaseOrderId?: number;
    number: string;
    supplierName: string;
    date: string;
    dueDate?: string;
    totalAmount: number;
    status: 'UNPAID' | 'PARTIAL' | 'PAID';
    purchaseOrder?: PurchaseOrder;
    payments: Payment[];
    attachmentPath?: string;
}

export interface Account {
    id: number;
    code: string;
    name: string;
    level: number;
    nature: string;
    parentId?: number;
    isMovement: boolean;
    isActive: boolean;
    children?: Account[];
}

export interface ThirdParty {
    id: number;
    type: string;
    identification?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    isActive: boolean;
}

export interface Program {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
}

export interface Bank {
    id: number;
    name: string;
    swift?: string;
    isActive: boolean;
}

export interface Asset {
    id: number;
    code?: string; // Optional
    name: string;
    description?: string;
    purchaseOrderId?: number;
    invoiceId?: number;
    location?: string;
    unitValue: number; // Renamed from value
    quantity: number; // New field
    status: 'ACTIVE' | 'DISPOSED' | 'DEPRECIATED' | 'IN_USE';
    createdAt: string;
}

export interface Area {
    id: number;
    name: string;
    isActive: boolean;
}

export interface AssetMovement {
    id: number;
    assetId: number;
    type: 'ASSIGNMENT' | 'RETURN' | 'DISPOSAL' | 'RECEPTION';
    quantity: number; // New field
    date: string;
    assignedToUserId?: number;
    user?: User; // Joined user
    areaId?: number;
    area?: Area;
    department?: string; // Kept for backward compatibility if needed, or removed.
    notes?: string;
}

export interface JournalLine {
    id: number;
    accountId: number;
    account?: Account;
    debit: number;
    credit: number;
    description?: string;
    thirdPartyId?: number;
    thirdParty?: ThirdParty;
}

export interface JournalEntry {
    id: number;
    date: string;
    description: string;
    reference?: string;
    status: string;
    lines: JournalLine[];
}

export interface TrialBalanceItem {
    accountId: number;
    code: string;
    name: string;
    debit: number;
    credit: number;
    balance: number;
}

export type UserRole = 'homeowner' | 'contractor';

export type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'Completed';

export type ExpenseCategory =
  | 'Cement'
  | 'Steel'
  | 'Sand'
  | 'Bricks'
  | 'Labour'
  | 'Electrical'
  | 'Plumbing'
  | 'Flooring'
  | 'Painting'
  | 'Other';

export type MaterialCategory =
  | 'Cement'
  | 'Steel'
  | 'Sand'
  | 'Aggregates'
  | 'Bricks'
  | 'Blocks'
  | 'Tiles'
  | 'Electrical materials'
  | 'Plumbing materials'
  | 'Paint'
  | 'Other';

export type ExpenseStatus = 'Draft' | 'Pending' | 'Approved' | 'Disputed';

export type PaymentMethod = 'UPI' | 'Bank transfer' | 'Cash' | 'Cheque' | 'Other';

export type PaymentStatus = 'Completed' | 'Pending' | 'Overdue' | 'Partial';

export type StageStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';

export type DocumentCategory =
  | 'Invoices'
  | 'Receipts'
  | 'Purchase orders'
  | 'Payment proofs'
  | 'Contracts'
  | 'Progress photographs'
  | 'Other documents';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Disputed';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  companyName?: string;
  city: string;
  gstNumber?: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: UserRole | 'Site Supervisor' | 'Architect';
  permissions: 'Full Review & Acknowledge' | 'Record & Manage Site Operations' | 'View Only';
  addedDate: string;
}

export interface BudgetAllocation {
  category: ExpenseCategory;
  allocatedAmount: number;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  description: string;
  status: ProjectStatus;
  totalBudget: number;
  startDate: string;
  expectedCompletionDate: string;
  homeownerName: string;
  homeownerEmail: string;
  homeownerPhone: string;
  contractorName: string;
  contractorCompany: string;
  contractorEmail: string;
  contractorPhone: string;
  builtUpAreaSqFt: number;
  categoryBudgets: BudgetAllocation[];
  members: ProjectMember[];
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  city: string;
  phone: string;
  gstin?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  details?: string;
}

export interface RecordComment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  timestamp: string;
  text: string;
  attachmentName?: string;
}

export interface DisputeRecord {
  reason: string;
  description: string;
  raisedBy: string;
  raisedAt: string;
  attachmentName?: string;
  contractorResponse?: string;
  respondedAt?: string;
  resolved: boolean;
}

export interface Expense {
  id: string;
  projectId: string;
  description: string;
  category: ExpenseCategory;
  vendor: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  linkedPurchaseId?: string;
  stageName: string;
  submittedBy: string;
  submittedAt: string;
  status: ExpenseStatus;
  notes?: string;
  documentIds: string[];
  comments: RecordComment[];
  dispute?: DisputeRecord;
  history: AuditLog[];
}

export interface Purchase {
  id: string;
  projectId: string;
  materialName: string;
  category: MaterialCategory;
  supplier: string;
  quantityOrdered: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  purchaseDate: string;
  expectedDeliveryDate: string;
  notes?: string;
  submittedBy: string;
  submittedAt: string;
  approvalStatus: ApprovalStatus;
  documentIds: string[];
  dispute?: DisputeRecord;
  comments: RecordComment[];
  history: AuditLog[];
}

export interface Delivery {
  id: string;
  projectId: string;
  purchaseId: string;
  quantityDelivered: number;
  deliveryDate: string;
  vehicleNumber?: string;
  challanNumber: string;
  recordedBy: string;
  recordedAt: string;
  notes?: string;
  approvalStatus: ApprovalStatus;
  documentIds: string[];
  dispute?: DisputeRecord;
  comments: RecordComment[];
}

export interface Payment {
  id: string;
  projectId: string;
  linkedType: 'expense' | 'purchase';
  linkedId: string;
  linkedLabel: string;
  recipient: string;
  amountPaid: number;
  paymentDate: string;
  dueDate?: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  status: 'Completed' | 'Overdue';
  recordedBy: string;
  recordedAt: string;
  notes?: string;
  documentIds: string[];
}

export interface ProgressStage {
  id: string;
  projectId: string;
  order: number;
  name: string;
  status: StageStatus;
  reportedProgress: number;
  startDate?: string;
  expectedCompletionDate: string;
  actualCompletionDate?: string;
  contractorNotes: string;
}

export interface ProgressUpdate {
  id: string;
  projectId: string;
  stageId: string;
  stageName: string;
  date: string;
  description: string;
  reportedPercentage: number;
  photoUrls: string[];
  submittedBy: string;
  submittedAt: string;
  approvalStatus: ApprovalStatus;
  comments: RecordComment[];
  dispute?: DisputeRecord;
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  name: string;
  category: DocumentCategory;
  relatedLabel?: string;
  relatedId?: string;
  uploadedBy: string;
  uploadedByRole: UserRole;
  uploadDate: string;
  fileType: 'PDF' | 'JPG' | 'PNG' | 'DOCX';
  fileSize: string;
  previewUrl?: string;
  summaryText?: string;
}

export interface ActivityItem {
  id: string;
  projectId: string;
  description: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string;
  statusLabel?: string;
  statusTone?: 'green' | 'amber' | 'red' | 'blue' | 'neutral';
  targetRoute?: string;
}

export interface AppNotification {
  id: string;
  projectId: string;
  targetRole: UserRole | 'both';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'expense' | 'approval' | 'dispute' | 'delivery' | 'payment' | 'progress';
  link: string;
}

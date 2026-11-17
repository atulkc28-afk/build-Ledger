import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityItem,
  AppNotification,
  ApprovalStatus,
  Delivery,
  DocumentCategory,
  DocumentRecord,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  MaterialCategory,
  Payment,
  PaymentMethod,
  ProgressStage,
  ProgressUpdate,
  Project,
  ProjectMember,
  Purchase,
  StageStatus,
  User,
  UserRole,
  Vendor,
} from '../types';
import {
  DEMO_USERS,
  INITIAL_ACTIVITIES,
  INITIAL_DELIVERIES,
  INITIAL_DOCUMENTS,
  INITIAL_EXPENSES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PAYMENTS,
  INITIAL_PROGRESS_UPDATES,
  INITIAL_PROJECTS,
  INITIAL_PURCHASES,
  INITIAL_STAGES,
  INITIAL_VENDORS,
} from '../data/mockData';
import { generateReferenceId } from '../utils/formatters';

interface PersistedState {
  isAuthenticated: boolean;
  currentRole: UserRole;
  activeProjectId: string;
  customUser: User | null;
  projects: Project[];
  vendors: Vendor[];
  expenses: Expense[];
  purchases: Purchase[];
  deliveries: Delivery[];
  payments: Payment[];
  stages: ProgressStage[];
  progressUpdates: ProgressUpdate[];
  documents: DocumentRecord[];
  activities: ActivityItem[];
  notifications: AppNotification[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'error' | 'info';
}

interface AddExpenseInput {
  description: string;
  category: ExpenseCategory;
  vendor: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  linkedPurchaseId?: string;
  stageName: string;
  notes?: string;
  status: 'Draft' | 'Pending';
  documentName?: string;
}

interface AddPurchaseInput {
  materialName: string;
  category: MaterialCategory;
  supplier: string;
  quantityOrdered: number;
  unit: string;
  unitPrice: number;
  purchaseDate: string;
  expectedDeliveryDate: string;
  notes?: string;
  documentName?: string;
  createLinkedExpense?: boolean;
}

interface AddDeliveryInput {
  purchaseId: string;
  quantityDelivered: number;
  deliveryDate: string;
  vehicleNumber?: string;
  challanNumber: string;
  notes?: string;
  documentName?: string;
}

interface AddPaymentInput {
  linkedType: 'expense' | 'purchase';
  linkedId: string;
  linkedLabel: string;
  recipient: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  notes?: string;
  documentName?: string;
}

interface AddProgressUpdateInput {
  stageId: string;
  date: string;
  description: string;
  reportedPercentage: number;
  stageStatus: StageStatus;
  photoUrls: string[];
}

interface AppContextValue extends PersistedState {
  currentUser: User;
  activeProject: Project;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  pushToast: (title: string, description?: string, tone?: 'success' | 'error' | 'info') => void;
  switchRole: (role: UserRole) => void;
  loginUser: (email: string, role: UserRole, name?: string) => void;
  signupUser: (name: string, email: string, role: UserRole, companyName?: string) => void;
  logout: () => void;
  setActiveProjectId: (projectId: string) => void;
  addExpense: (input: AddExpenseInput) => void;
  updateExpense: (expenseId: string, patch: Partial<Expense>) => void;
  acknowledgeRecord: (
    kind: 'expense' | 'purchase' | 'delivery' | 'progress',
    id: string,
    commentText?: string,
  ) => void;
  raiseDispute: (
    kind: 'expense' | 'purchase' | 'delivery' | 'progress',
    id: string,
    reason: string,
    description: string,
    attachmentName?: string,
  ) => void;
  respondToDispute: (
    kind: 'expense' | 'purchase' | 'delivery' | 'progress',
    id: string,
    responseText: string,
    markResolved: boolean,
    attachmentName?: string,
  ) => void;
  addComment: (
    kind: 'expense' | 'purchase' | 'delivery' | 'progress',
    id: string,
    text: string,
  ) => void;
  addPurchase: (input: AddPurchaseInput) => void;
  addDelivery: (input: AddDeliveryInput) => boolean;
  addPayment: (input: AddPaymentInput) => void;
  addProgressUpdate: (input: AddProgressUpdateInput) => void;
  uploadDocument: (doc: {
    name: string;
    category: DocumentCategory;
    relatedLabel?: string;
    relatedId?: string;
    fileType: 'PDF' | 'JPG' | 'PNG' | 'DOCX';
    summaryText?: string;
    previewUrl?: string;
  }) => void;
  updateProjectSettings: (projectId: string, patch: Partial<Project>) => void;
  inviteProjectMember: (projectId: string, member: Omit<ProjectMember, 'id' | 'addedDate'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoData: () => void;
}

const STORAGE_KEY = 'buildledger_state_v1';

const defaultPersistedState: PersistedState = {
  isAuthenticated: true,
  currentRole: 'homeowner',
  activeProjectId: 'PRJ-001',
  customUser: null,
  projects: INITIAL_PROJECTS,
  vendors: INITIAL_VENDORS,
  expenses: INITIAL_EXPENSES,
  purchases: INITIAL_PURCHASES,
  deliveries: INITIAL_DELIVERIES,
  payments: INITIAL_PAYMENTS,
  stages: INITIAL_STAGES,
  progressUpdates: INITIAL_PROGRESS_UPDATES,
  documents: INITIAL_DOCUMENTS,
  activities: INITIAL_ACTIVITIES,
  notifications: INITIAL_NOTIFICATIONS,
};

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPersistedState;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed.projects || parsed.projects.length === 0) return defaultPersistedState;
    return {
      ...defaultPersistedState,
      ...parsed,
    };
  } catch {
    return defaultPersistedState;
  }
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const pushToast = (
    title: string,
    description?: string,
    tone: 'success' | 'error' | 'info' = 'success',
  ) => {
    const id = `TST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  const currentUser: User = useMemo(() => {
    if (state.customUser && state.customUser.role === state.currentRole) {
      return state.customUser;
    }
    return DEMO_USERS[state.currentRole];
  }, [state.customUser, state.currentRole]);

  const activeProject: Project = useMemo(() => {
    return (
      state.projects.find((p) => p.id === state.activeProjectId) ?? state.projects[0]
    );
  }, [state.projects, state.activeProjectId]);

  const switchRole = (role: UserRole) => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      currentRole: role,
      customUser: null,
    }));
    pushToast(
      `Switched to ${role === 'homeowner' ? 'Homeowner' : 'Contractor'} View`,
      role === 'homeowner'
        ? 'Viewing as Ananya Rao (Greenwood Residence)'
        : 'Viewing as Rajesh Kulkarni (Kulkarni Civil Works LLP)',
      'info',
    );
  };

  const loginUser = (email: string, role: UserRole, name?: string) => {
    const base = DEMO_USERS[role];
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      currentRole: role,
      customUser:
        email === base.email
          ? null
          : {
              ...base,
              name: name || base.name,
              email,
            },
    }));
    pushToast('Signed in successfully', `Welcome back, ${name || base.name}.`);
  };

  const signupUser = (name: string, email: string, role: UserRole, companyName?: string) => {
    const base = DEMO_USERS[role];
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      currentRole: role,
      customUser: {
        ...base,
        id: `USR-${Date.now()}`,
        name,
        email,
        companyName: role === 'contractor' ? companyName || base.companyName : undefined,
      },
    }));
    pushToast('Account created', `Workspace initialized for ${name}.`);
  };

  const logout = () => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
    }));
  };

  const setActiveProjectId = (projectId: string) => {
    setState((prev) => ({ ...prev, activeProjectId: projectId }));
  };

  const createDocumentEntry = (
    prev: PersistedState,
    name: string,
    category: DocumentCategory,
    relatedLabel: string,
    relatedId: string,
    summaryText?: string,
    previewUrl?: string,
  ): DocumentRecord => {
    const id = generateReferenceId(
      'DOC',
      prev.documents.map((d) => d.id),
    );
    const ext = name.split('.').pop()?.toUpperCase();
    const fileType: DocumentRecord['fileType'] =
      ext === 'JPG' || ext === 'JPEG'
        ? 'JPG'
        : ext === 'PNG'
          ? 'PNG'
          : ext === 'DOCX'
            ? 'DOCX'
            : 'PDF';
    return {
      id,
      projectId: prev.activeProjectId,
      name,
      category,
      relatedLabel,
      relatedId,
      uploadedBy: currentUser.name,
      uploadedByRole: state.currentRole,
      uploadDate: new Date().toISOString().slice(0, 10),
      fileType,
      fileSize: '320 KB',
      summaryText,
      previewUrl,
    };
  };

  const addExpense = (input: AddExpenseInput) => {
    const now = new Date().toISOString();
    setState((prev) => {
      const expenseId = generateReferenceId(
        'EXP',
        prev.expenses.map((e) => e.id),
      );
      const docIds: string[] = [];
      let nextDocs = prev.documents;
      if (input.documentName) {
        const doc = createDocumentEntry(
          prev,
          input.documentName,
          'Invoices',
          expenseId,
          expenseId,
          `${input.description} · ${input.vendor}`,
        );
        docIds.push(doc.id);
        nextDocs = [doc, ...prev.documents];
      }

      const newExpense: Expense = {
        id: expenseId,
        projectId: prev.activeProjectId,
        description: input.description,
        category: input.category,
        vendor: input.vendor,
        amount: input.amount,
        date: input.date,
        paymentMethod: input.paymentMethod,
        linkedPurchaseId: input.linkedPurchaseId || undefined,
        stageName: input.stageName,
        submittedBy: currentUser.name,
        submittedAt: now,
        status: input.status,
        notes: input.notes,
        documentIds: docIds,
        comments: [],
        history: [
          {
            id: `HIS-${Date.now()}`,
            timestamp: now,
            actorName: currentUser.name,
            actorRole: prev.currentRole,
            action:
              input.status === 'Draft'
                ? 'Saved expense as draft'
                : `Submitted expense for review`,
          },
        ],
      };

      const nextActivities: ActivityItem[] =
        input.status === 'Draft'
          ? prev.activities
          : [
              {
                id: `ACT-${Date.now()}`,
                projectId: prev.activeProjectId,
                description: `Recorded expense: ${input.description}`,
                actorName: currentUser.name,
                actorRole: prev.currentRole,
                timestamp: now,
                statusLabel: 'Pending Review',
                statusTone: 'amber',
                targetRoute: 'expenses',
              },
              ...prev.activities,
            ];

      const nextNotifications: AppNotification[] =
        input.status === 'Draft'
          ? prev.notifications
          : [
              {
                id: `NTF-${Date.now()}`,
                projectId: prev.activeProjectId,
                targetRole: 'homeowner',
                title: 'New Expense Submitted',
                message: `${currentUser.name} recorded ${expenseId}: ${input.description}`,
                timestamp: now,
                read: false,
                type: 'expense',
                link: '/homeowner/expenses',
              },
              ...prev.notifications,
            ];

      return {
        ...prev,
        expenses: [newExpense, ...prev.expenses],
        documents: nextDocs,
        activities: nextActivities,
        notifications: nextNotifications,
      };
    });

    pushToast(
      input.status === 'Draft' ? 'Expense saved as draft' : 'Expense submitted',
      input.description,
    );
  };

  const updateExpense = (expenseId: string, patch: Partial<Expense>) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((exp) => {
        if (exp.id !== expenseId) return exp;
        const nextStatus: ExpenseStatus = patch.status ?? exp.status;
        return {
          ...exp,
          ...patch,
          status: nextStatus,
          history: [
            ...exp.history,
            {
              id: `HIS-${Date.now()}`,
              timestamp: now,
              actorName: currentUser.name,
              actorRole: prev.currentRole,
              action:
                patch.status === 'Pending' && exp.status === 'Draft'
                  ? 'Submitted draft expense for review'
                  : 'Updated expense details',
            },
          ],
        };
      }),
    }));
    pushToast('Expense updated', `${expenseId} saved.`);
  };

  const acknowledgeRecord = (
    kind: 'expense' | 'purchase' | 'delivery' | 'progress',
    id: string,
    commentText?: string,
  ) => {
    const now = new Date().toISOString();
    setState((prev) => {
      const nextComment = commentText?.trim()
        ? {
            id: `CMT-${Date.now()}`,
            authorName: currentUser.name,
            authorRole: prev.currentRole,
            timestamp: now,
            text: commentText.trim(),
          }
        : null;

      let label = id;
      let nextExpenses = prev.expenses;
      let nextPurchases = prev.purchases;
      let nextDeliveries = prev.deliveries;
      let nextUpdates = prev.progressUpdates;

      if (kind === 'expense') {
        nextExpenses = prev.expenses.map((e) => {
          if (e.id !== id) return e;
          label = `${e.id} (${e.description})`;
          return {
            ...e,
            status: 'Approved',
            dispute: e.dispute ? { ...e.dispute, resolved: true } : undefined,
            comments: nextComment ? [...e.comments, nextComment] : e.comments,
            history: [
              ...e.history,
              {
                id: `HIS-${Date.now()}`,
                timestamp: now,
                actorName: currentUser.name,
                actorRole: prev.currentRole,
                action: 'Acknowledged & approved submitted expense',
              },
            ],
          };
        });
      } else if (kind === 'purchase') {
        nextPurchases = prev.purchases.map((p) => {
          if (p.id !== id) return p;
          label = `${p.id} (${p.materialName})`;
          return {
            ...p,
            approvalStatus: 'Approved' as ApprovalStatus,
            dispute: p.dispute ? { ...p.dispute, resolved: true } : undefined,
            comments: nextComment ? [...p.comments, nextComment] : p.comments,
            history: [
              ...p.history,
              {
                id: `HIS-${Date.now()}`,
                timestamp: now,
                actorName: currentUser.name,
                actorRole: prev.currentRole,
                action: 'Acknowledged purchase order',
              },
            ],
          };
        });
      } else if (kind === 'delivery') {
        nextDeliveries = prev.deliveries.map((d) => {
          if (d.id !== id) return d;
          label = `${d.id} (Challan ${d.challanNumber})`;
          return {
            ...d,
            approvalStatus: 'Approved' as ApprovalStatus,
            dispute: d.dispute ? { ...d.dispute, resolved: true } : undefined,
            comments: nextComment ? [...d.comments, nextComment] : d.comments,
          };
        });
      } else if (kind === 'progress') {
        nextUpdates = prev.progressUpdates.map((u) => {
          if (u.id !== id) return u;
          label = `${u.id} (${u.stageName})`;
          return {
            ...u,
            approvalStatus: 'Approved' as ApprovalStatus,
            dispute: u.dispute ? { ...u.dispute, resolved: true } : undefined,
            comments: nextComment ? [...u.comments, nextComment] : u.comments,
          };
        });
      }

      return {
        ...prev,
        expenses: nextExpenses,
        purchases: nextPurchases,
        deliveries: nextDeliveries,
        progressUpdates: nextUpdates,
        activities: [
          {
            id: `ACT-${Date.now()}`,
            projectId: prev.activeProjectId,
            description: `Acknowledged ${label}`,
            actorName: currentUser.name,
            actorRole: prev.currentRole,
            timestamp: now,
            statusLabel: 'Approved',
            statusTone: 'green',
            targetRoute: 'approvals',
          },
          ...prev.activities,
        ],
        notifications: [
          {
            id: `NTF-${Date.now()}`,
            projectId: prev.activeProjectId,
            targetRole: 'contractor',
            title: 'Record Acknowledged',
            message: `${currentUser.name} acknowledged ${label}.`,
            timestamp: now,
            read: false,
            type: 'approval',
            link: '/contractor/notifications',
          },
          ...prev.notifications,
        ],
      };
    });
    pushToast('Record acknowledged', `${id} marked as acknowledged.`);
  };

  const raiseDispute = (
    kind: 'expense' | 'purchase' | 'delivery' | 'progress',
    id: string,
    reason: string,
    description: string,
    attachmentName?: string,
  ) => {
    const now = new Date().toISOString();
    setState((prev) => {
      const disputeObj = {
        reason,
        description,
        raisedBy: currentUser.name,
        raisedAt: now,
        attachmentName,
        resolved: false,
      };
      const commentObj = {
        id: `CMT-${Date.now()}`,
        authorName: currentUser.name,
        authorRole: prev.currentRole,
        timestamp: now,
        text: `Dispute raised (${reason}): ${description}`,
        attachmentName,
      };

      let nextExpenses = prev.expenses;
      let nextPurchases = prev.purchases;
      let nextDeliveries = prev.deliveries;
      let nextUpdates = prev.progressUpdates;

      if (kind === 'expense') {
        nextExpenses = prev.expenses.map((e) =>
          e.id === id
            ? {
                ...e,
                status: 'Disputed',
                dispute: disputeObj,
                comments: [...e.comments, commentObj],
                history: [
                  ...e.history,
                  {
                    id: `HIS-${Date.now()}`,
                    timestamp: now,
                    actorName: currentUser.name,
                    actorRole: prev.currentRole,
                    action: `Raised dispute: ${reason}`,
                  },
                ],
              }
            : e,
        );
      } else if (kind === 'purchase') {
        nextPurchases = prev.purchases.map((p) =>
          p.id === id
            ? {
                ...p,
                approvalStatus: 'Disputed',
                dispute: disputeObj,
                comments: [...p.comments, commentObj],
                history: [
                  ...p.history,
                  {
                    id: `HIS-${Date.now()}`,
                    timestamp: now,
                    actorName: currentUser.name,
                    actorRole: prev.currentRole,
                    action: `Raised dispute: ${reason}`,
                  },
                ],
              }
            : p,
        );
      } else if (kind === 'delivery') {
        nextDeliveries = prev.deliveries.map((d) =>
          d.id === id
            ? {
                ...d,
                approvalStatus: 'Disputed',
                dispute: disputeObj,
                comments: [...d.comments, commentObj],
              }
            : d,
        );
      } else if (kind === 'progress') {
        nextUpdates = prev.progressUpdates.map((u) =>
          u.id === id
            ? {
                ...u,
                approvalStatus: 'Disputed',
                dispute: disputeObj,
                comments: [...u.comments, commentObj],
              }
            : u,
        );
      }

      return {
        ...prev,
        expenses: nextExpenses,
        purchases: nextPurchases,
        deliveries: nextDeliveries,
        progressUpdates: nextUpdates,
        activities: [
          {
            id: `ACT-${Date.now()}`,
            projectId: prev.activeProjectId,
            description: `Raised dispute on ${id}: ${reason}`,
            actorName: currentUser.name,
            actorRole: prev.currentRole,
            timestamp: now,
            statusLabel: 'Disputed',
            statusTone: 'red',
            targetRoute: 'approvals',
          },
          ...prev.activities,
        ],
        notifications: [
          {
            id: `NTF-${Date.now()}`,
            projectId: prev.activeProjectId,
            targetRole: 'contractor',
            title: `Dispute Raised on ${id}`,
            message: `${currentUser.name}: ${reason}`,
            timestamp: now,
            read: false,
            type: 'dispute',
            link: '/contractor/notifications',
          },
          ...prev.notifications,
        ],
      };
    });
    pushToast('Dispute submitted', `${id} flagged for contractor response.`, 'info');
  };

  const respondToDispute = (
    kind: 'expense' | 'purchase' | 'delivery' | 'progress',
    id: string,
    responseText: string,
    markResolved: boolean,
    attachmentName?: string,
  ) => {
    const now = new Date().toISOString();
    setState((prev) => {
      let nextDocs = prev.documents;
      if (attachmentName) {
        const doc = createDocumentEntry(
          prev,
          attachmentName,
          'Receipts',
          `${id} · Dispute Response`,
          id,
          responseText,
        );
        nextDocs = [doc, ...prev.documents];
      }

      const replyComment = {
        id: `CMT-${Date.now()}`,
        authorName: currentUser.name,
        authorRole: prev.currentRole,
        timestamp: now,
        text: responseText,
        attachmentName,
      };

      let nextExpenses = prev.expenses;
      let nextPurchases = prev.purchases;
      let nextDeliveries = prev.deliveries;
      let nextUpdates = prev.progressUpdates;

      if (kind === 'expense') {
        nextExpenses = prev.expenses.map((e) => {
          if (e.id !== id) return e;
          return {
            ...e,
            status: markResolved ? 'Pending' : e.status,
            dispute: e.dispute
              ? {
                  ...e.dispute,
                  contractorResponse: responseText,
                  respondedAt: now,
                  resolved: markResolved,
                }
              : undefined,
            comments: [...e.comments, replyComment],
            history: [
              ...e.history,
              {
                id: `HIS-${Date.now()}`,
                timestamp: now,
                actorName: currentUser.name,
                actorRole: prev.currentRole,
                action: markResolved
                  ? 'Responded to dispute & resubmitted for homeowner acknowledgement'
                  : 'Added contractor response to dispute',
              },
            ],
          };
        });
      } else if (kind === 'purchase') {
        nextPurchases = prev.purchases.map((p) =>
          p.id === id
            ? {
                ...p,
                approvalStatus: markResolved ? 'Pending' : p.approvalStatus,
                dispute: p.dispute
                  ? {
                      ...p.dispute,
                      contractorResponse: responseText,
                      respondedAt: now,
                      resolved: markResolved,
                    }
                  : undefined,
                comments: [...p.comments, replyComment],
              }
            : p,
        );
      } else if (kind === 'delivery') {
        nextDeliveries = prev.deliveries.map((d) =>
          d.id === id
            ? {
                ...d,
                approvalStatus: markResolved ? 'Pending' : d.approvalStatus,
                dispute: d.dispute
                  ? {
                      ...d.dispute,
                      contractorResponse: responseText,
                      respondedAt: now,
                      resolved: markResolved,
                    }
                  : undefined,
                comments: [...d.comments, replyComment],
              }
            : d,
        );
      } else if (kind === 'progress') {
        nextUpdates = prev.progressUpdates.map((u) =>
          u.id === id
            ? {
                ...u,
                approvalStatus: markResolved ? 'Pending' : u.approvalStatus,
                dispute: u.dispute
                  ? {
                      ...u.dispute,
                      contractorResponse: responseText,
                      respondedAt: now,
                      resolved: markResolved,
                    }
                  : undefined,
                comments: [...u.comments, replyComment],
              }
            : u,
        );
      }

      return {
        ...prev,
        expenses: nextExpenses,
        purchases: nextPurchases,
        deliveries: nextDeliveries,
        progressUpdates: nextUpdates,
        documents: nextDocs,
        activities: [
          {
            id: `ACT-${Date.now()}`,
            projectId: prev.activeProjectId,
            description: `Contractor responded to dispute on ${id}`,
            actorName: currentUser.name,
            actorRole: prev.currentRole,
            timestamp: now,
            statusLabel: markResolved ? 'Pending Review' : 'Disputed',
            statusTone: markResolved ? 'amber' : 'red',
            targetRoute: 'approvals',
          },
          ...prev.activities,
        ],
        notifications: [
          {
            id: `NTF-${Date.now()}`,
            projectId: prev.activeProjectId,
            targetRole: 'homeowner',
            title: `Contractor Responded to ${id}`,
            message: responseText,
            timestamp: now,
            read: false,
            type: 'dispute',
            link: '/homeowner/approvals',
          },
          ...prev.notifications,
        ],
      };
    });
    pushToast('Response sent', `Updated ${id} with contractor explanation.`);
  };

  const addComment = (
    kind: 'expense' | 'purchase' | 'delivery' | 'progress',
    id: string,
    text: string,
  ) => {
    if (!text.trim()) return;
    const now = new Date().toISOString();
    const commentObj = {
      id: `CMT-${Date.now()}`,
      authorName: currentUser.name,
      authorRole: state.currentRole,
      timestamp: now,
      text: text.trim(),
    };
    setState((prev) => ({
      ...prev,
      expenses:
        kind === 'expense'
          ? prev.expenses.map((e) => (e.id === id ? { ...e, comments: [...e.comments, commentObj] } : e))
          : prev.expenses,
      purchases:
        kind === 'purchase'
          ? prev.purchases.map((p) => (p.id === id ? { ...p, comments: [...p.comments, commentObj] } : p))
          : prev.purchases,
      deliveries:
        kind === 'delivery'
          ? prev.deliveries.map((d) => (d.id === id ? { ...d, comments: [...d.comments, commentObj] } : d))
          : prev.deliveries,
      progressUpdates:
        kind === 'progress'
          ? prev.progressUpdates.map((u) =>
              u.id === id ? { ...u, comments: [...u.comments, commentObj] } : u,
            )
          : prev.progressUpdates,
    }));
    pushToast('Comment added');
  };

  const addPurchase = (input: AddPurchaseInput) => {
    const now = new Date().toISOString();
    const totalAmount = Math.round(input.quantityOrdered * input.unitPrice);

    setState((prev) => {
      const purchaseId = generateReferenceId(
        'PO',
        prev.purchases.map((p) => p.id),
      );
      const docIds: string[] = [];
      let nextDocs = prev.documents;
      if (input.documentName) {
        const doc = createDocumentEntry(
          prev,
          input.documentName,
          'Purchase orders',
          purchaseId,
          purchaseId,
          `${input.materialName} · ${input.quantityOrdered} ${input.unit} from ${input.supplier}`,
        );
        docIds.push(doc.id);
        nextDocs = [doc, ...prev.documents];
      }

      const newPurchase: Purchase = {
        id: purchaseId,
        projectId: prev.activeProjectId,
        materialName: input.materialName,
        category: input.category,
        supplier: input.supplier,
        quantityOrdered: input.quantityOrdered,
        unit: input.unit,
        unitPrice: input.unitPrice,
        totalAmount,
        purchaseDate: input.purchaseDate,
        expectedDeliveryDate: input.expectedDeliveryDate,
        notes: input.notes,
        submittedBy: currentUser.name,
        submittedAt: now,
        approvalStatus: 'Pending',
        documentIds: docIds,
        comments: [],
        history: [
          {
            id: `HIS-${Date.now()}`,
            timestamp: now,
            actorName: currentUser.name,
            actorRole: prev.currentRole,
            action: `Created PO for ${input.quantityOrdered} ${input.unit} of ${input.materialName}`,
          },
        ],
      };

      // Map MaterialCategory to ExpenseCategory if creating linked expense
      const mapMatToExpCategory = (cat: MaterialCategory): ExpenseCategory => {
        if (cat === 'Cement') return 'Cement';
        if (cat === 'Steel') return 'Steel';
        if (cat === 'Sand' || cat === 'Aggregates') return 'Sand';
        if (cat === 'Bricks' || cat === 'Blocks') return 'Bricks';
        if (cat === 'Electrical materials') return 'Electrical';
        if (cat === 'Plumbing materials') return 'Plumbing';
        if (cat === 'Tiles') return 'Flooring';
        if (cat === 'Paint') return 'Painting';
        return 'Other';
      };

      let nextExpenses = prev.expenses;
      if (input.createLinkedExpense !== false) {
        const expId = generateReferenceId(
          'EXP',
          prev.expenses.map((e) => e.id),
        );
        const linkedExpense: Expense = {
          id: expId,
          projectId: prev.activeProjectId,
          description: `${input.materialName} (${input.quantityOrdered} ${input.unit})`,
          category: mapMatToExpCategory(input.category),
          vendor: input.supplier,
          amount: totalAmount,
          date: input.purchaseDate,
          paymentMethod: 'Bank transfer',
          linkedPurchaseId: purchaseId,
          stageName:
            prev.stages.find(
              (s) => s.projectId === prev.activeProjectId && s.status === 'In Progress',
            )?.name ?? 'Structural Framework',
          submittedBy: currentUser.name,
          submittedAt: now,
          status: 'Pending',
          notes: input.notes,
          documentIds: docIds,
          comments: [],
          history: [
            {
              id: `HIS-${Date.now()}-E`,
              timestamp: now,
              actorName: currentUser.name,
              actorRole: prev.currentRole,
              action: `Auto-linked expense created from ${purchaseId}`,
            },
          ],
        };
        nextExpenses = [linkedExpense, ...prev.expenses];
      }

      return {
        ...prev,
        purchases: [newPurchase, ...prev.purchases],
        expenses: nextExpenses,
        documents: nextDocs,
        activities: [
          {
            id: `ACT-${Date.now()}`,
            projectId: prev.activeProjectId,
            description: `Added material purchase: ${input.materialName} (${input.quantityOrdered} ${input.unit})`,
            actorName: currentUser.name,
            actorRole: prev.currentRole,
            timestamp: now,
            statusLabel: 'Pending Review',
            statusTone: 'amber',
            targetRoute: 'materials',
          },
          ...prev.activities,
        ],
        notifications: [
          {
            id: `NTF-${Date.now()}`,
            projectId: prev.activeProjectId,
            targetRole: 'homeowner',
            title: 'New Material Purchase Recorded',
            message: `${purchaseId}: ${input.materialName} (${input.quantityOrdered} ${input.unit})`,
            timestamp: now,
            read: false,
            type: 'expense',
            link: '/homeowner/materials',
          },
          ...prev.notifications,
        ],
      };
    });

    pushToast('Material purchase recorded', `${input.materialName} added.`);
  };

  const addDelivery = (input: AddDeliveryInput): boolean => {
    const purchase = state.purchases.find((p) => p.id === input.purchaseId);
    if (!purchase) return false;
    const alreadyDelivered = state.deliveries
      .filter((d) => d.purchaseId === input.purchaseId)
      .reduce((sum, d) => sum + d.quantityDelivered, 0);
    const remaining = Math.max(0, Number((purchase.quantityOrdered - alreadyDelivered).toFixed(2)));

    if (input.quantityDelivered <= 0 || input.quantityDelivered > remaining) {
      pushToast(
        'Invalid delivery quantity',
        `Quantity must be between 0.01 and remaining ${remaining} ${purchase.unit}.`,
        'error',
      );
      return false;
    }

    const now = new Date().toISOString();
    setState((prev) => {
      const deliveryId = generateReferenceId(
        'DEL',
        prev.deliveries.map((d) => d.id),
      );
      const docIds: string[] = [];
      let nextDocs = prev.documents;
      if (input.documentName) {
        const doc = createDocumentEntry(
          prev,
          input.documentName,
          'Receipts',
          `${deliveryId} · ${purchase.id}`,
          deliveryId,
          `Delivery challan ${input.challanNumber} for ${input.quantityDelivered} ${purchase.unit} of ${purchase.materialName}`,
        );
        docIds.push(doc.id);
        nextDocs = [doc, ...prev.documents];
      }

      const newDelivery: Delivery = {
        id: deliveryId,
        projectId: purchase.projectId,
        purchaseId: purchase.id,
        quantityDelivered: input.quantityDelivered,
        deliveryDate: input.deliveryDate,
        vehicleNumber: input.vehicleNumber,
        challanNumber: input.challanNumber,
        recordedBy: currentUser.name,
        recordedAt: now,
        notes: input.notes,
        approvalStatus: 'Pending',
        documentIds: docIds,
        comments: [],
      };

      const totalAfter = alreadyDelivered + input.quantityDelivered;
      const isFull = totalAfter >= purchase.quantityOrdered;

      return {
        ...prev,
        deliveries: [newDelivery, ...prev.deliveries],
        documents: nextDocs,
        activities: [
          {
            id: `ACT-${Date.now()}`,
            projectId: purchase.projectId,
            description: `Recorded delivery of ${input.quantityDelivered} ${purchase.unit} ${purchase.materialName} (${purchase.id})`,
            actorName: currentUser.name,
            actorRole: prev.currentRole,
            timestamp: now,
            statusLabel: isFull ? 'Delivered' : 'Partial Delivery',
            statusTone: isFull ? 'green' : 'blue',
            targetRoute: 'materials',
          },
          ...prev.activities,
        ],
        notifications: [
          {
            id: `NTF-${Date.now()}`,
            projectId: purchase.projectId,
            targetRole: 'homeowner',
            title: 'Material Delivery Recorded',
            message: `${input.quantityDelivered} ${purchase.unit} of ${purchase.materialName} received (Challan ${input.challanNumber}).`,
            timestamp: now,
            read: false,
            type: 'delivery',
            link: '/homeowner/materials',
          },
          ...prev.notifications,
        ],
      };
    });

    pushToast('Delivery recorded', `${input.quantityDelivered} ${purchase.unit} logged.`);
    return true;
  };

  const addPayment = (input: AddPaymentInput) => {
    const now = new Date().toISOString();
    setState((prev) => {
      const paymentId = generateReferenceId(
        'PAY',
        prev.payments.map((p) => p.id),
      );
      const docIds: string[] = [];
      let nextDocs = prev.documents;
      if (input.documentName) {
        const doc = createDocumentEntry(
          prev,
          input.documentName,
          'Payment proofs',
          paymentId,
          paymentId,
          `${input.paymentMethod} Ref ${input.referenceNumber} · ${input.recipient}`,
        );
        docIds.push(doc.id);
        nextDocs = [doc, ...prev.documents];
      }

      const newPayment: Payment = {
        id: paymentId,
        projectId: prev.activeProjectId,
        linkedType: input.linkedType,
        linkedId: input.linkedId,
        linkedLabel: input.linkedLabel,
        recipient: input.recipient,
        amountPaid: input.amountPaid,
        paymentDate: input.paymentDate,
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber,
        status: 'Completed',
        recordedBy: currentUser.name,
        recordedAt: now,
        notes: input.notes,
        documentIds: docIds,
      };

      return {
        ...prev,
        payments: [newPayment, ...prev.payments],
        documents: nextDocs,
        activities: [
          {
            id: `ACT-${Date.now()}`,
            projectId: prev.activeProjectId,
            description: `Recorded payment of ₹${input.amountPaid.toLocaleString('en-IN')} to ${input.recipient}`,
            actorName: currentUser.name,
            actorRole: prev.currentRole,
            timestamp: now,
            statusLabel: 'Paid',
            statusTone: 'green',
            targetRoute: 'payments',
          },
          ...prev.activities,
        ],
        notifications: [
          {
            id: `NTF-${Date.now()}`,
            projectId: prev.activeProjectId,
            targetRole: 'both',
            title: 'Payment Recorded',
            message: `${paymentId}: ₹${input.amountPaid.toLocaleString('en-IN')} paid to ${input.recipient}.`,
            timestamp: now,
            read: false,
            type: 'payment',
            link: prev.currentRole === 'homeowner' ? '/homeowner/payments' : '/contractor/payments',
          },
          ...prev.notifications,
        ],
      };
    });
    pushToast('Payment recorded', `${input.recipient} · Ref ${input.referenceNumber}`);
  };

  const addProgressUpdate = (input: AddProgressUpdateInput) => {
    const now = new Date().toISOString();
    setState((prev) => {
      const stage = prev.stages.find((s) => s.id === input.stageId);
      if (!stage) return prev;
      const updateId = generateReferenceId(
        'UPD',
        prev.progressUpdates.map((u) => u.id),
      );

      const newUpdate: ProgressUpdate = {
        id: updateId,
        projectId: stage.projectId,
        stageId: stage.id,
        stageName: stage.name,
        date: input.date,
        description: input.description,
        reportedPercentage: input.reportedPercentage,
        photoUrls: input.photoUrls,
        submittedBy: currentUser.name,
        submittedAt: now,
        approvalStatus: 'Pending',
        comments: [],
      };

      const nextStages = prev.stages.map((s) =>
        s.id === stage.id
          ? {
              ...s,
              status: input.stageStatus,
              reportedProgress: input.reportedPercentage,
              startDate: s.startDate || input.date,
              actualCompletionDate:
                input.stageStatus === 'Completed' ? input.date : s.actualCompletionDate,
              contractorNotes: input.description,
            }
          : s,
      );

      let nextDocs = prev.documents;
      if (input.photoUrls.length > 0) {
        const doc = createDocumentEntry(
          prev,
          `Site_Photo_${stage.name.replace(/\s+/g, '_')}_${input.date}.jpg`,
          'Progress photographs',
          `${updateId} · ${stage.name}`,
          updateId,
          input.description,
          input.photoUrls[0],
        );
        nextDocs = [doc, ...prev.documents];
      }

      return {
        ...prev,
        stages: nextStages,
        progressUpdates: [newUpdate, ...prev.progressUpdates],
        documents: nextDocs,
        activities: [
          {
            id: `ACT-${Date.now()}`,
            projectId: stage.projectId,
            description: `Reported ${stage.name} progress at ${input.reportedPercentage}%`,
            actorName: currentUser.name,
            actorRole: prev.currentRole,
            timestamp: now,
            statusLabel: 'Pending Review',
            statusTone: 'amber',
            targetRoute: 'progress',
          },
          ...prev.activities,
        ],
        notifications: [
          {
            id: `NTF-${Date.now()}`,
            projectId: stage.projectId,
            targetRole: 'homeowner',
            title: 'Construction Progress Update',
            message: `${stage.name} updated to ${input.reportedPercentage}% (contractor-reported).`,
            timestamp: now,
            read: false,
            type: 'progress',
            link: '/homeowner/progress',
          },
          ...prev.notifications,
        ],
      };
    });
    pushToast('Progress update submitted', 'Awaiting homeowner acknowledgement.');
  };

  const uploadDocument: AppContextValue['uploadDocument'] = (docInput) => {
    setState((prev) => {
      const doc = createDocumentEntry(
        prev,
        docInput.name,
        docInput.category,
        docInput.relatedLabel || 'General Project File',
        docInput.relatedId || prev.activeProjectId,
        docInput.summaryText,
        docInput.previewUrl,
      );
      return {
        ...prev,
        documents: [{ ...doc, fileType: docInput.fileType }, ...prev.documents],
      };
    });
    pushToast('Document uploaded', docInput.name);
  };

  const updateProjectSettings = (projectId: string, patch: Partial<Project>) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === projectId ? { ...p, ...patch } : p)),
    }));
    pushToast('Project settings saved');
  };

  const inviteProjectMember = (
    projectId: string,
    member: Omit<ProjectMember, 'id' | 'addedDate'>,
  ) => {
    const newMember: ProjectMember = {
      ...member,
      id: `MEM-${Date.now()}`,
      addedDate: new Date().toISOString().slice(0, 10),
    };
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? { ...p, members: [...p.members, newMember] } : p,
      ),
    }));
    pushToast('Member invited', `${member.name} added to project.`);
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(defaultPersistedState);
    pushToast('Demo workspace restored', 'All sample data reset to initial state.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        currentUser,
        activeProject,
        toasts,
        dismissToast,
        pushToast,
        switchRole,
        loginUser,
        signupUser,
        logout,
        setActiveProjectId,
        addExpense,
        updateExpense,
        acknowledgeRecord,
        raiseDispute,
        respondToDispute,
        addComment,
        addPurchase,
        addDelivery,
        addPayment,
        addProgressUpdate,
        uploadDocument,
        updateProjectSettings,
        inviteProjectMember,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

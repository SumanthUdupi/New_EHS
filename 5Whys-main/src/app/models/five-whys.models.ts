export interface FiveWhysAnalysis {
  id: string;
  parentObjectId?: string;
  parentObjectType?: string;
  problemStatement: string;
  causalPairs: CausalPair[];
  rootCause: string;
  actionItems: ActionItem[];
  status: AnalysisStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastSavedAt?: Date;
}

export interface CausalPair {
  level: number;
  question: string;
  answer: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assignedTo?: string;
  dueDate?: Date;
  priority: ActionPriority;
  status: ActionStatus;
}

export enum AnalysisStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  COMPLETED = 'completed'
}

export enum ActionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ActionStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold'
}

export enum WizardStep {
  PROBLEM_DEFINITION = 'problem_definition',
  PROGRESSIVE_QUESTIONING = 'progressive_questioning',
  ROOT_CAUSE_CONFIRMATION = 'root_cause_confirmation',
  CORRECTIVE_ACTIONS = 'corrective_actions',
  SUMMARY = 'summary'
}

export enum ComponentMode {
  SIDE_PANEL = 'side_panel',
  FULL_PAGE = 'full_page'
}

export enum ViewMode {
  CREATE = 'create',
  EDIT = 'edit',
  VIEW = 'view'
}

export interface WizardState {
  currentStep: WizardStep;
  currentWhyLevel: number;
  isValid: boolean;
  hasUnsavedChanges: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FiveWhysComponentState {
  analysis: Partial<FiveWhysAnalysis>;
  wizardState: WizardState;
  viewMode: ViewMode;
  componentMode: ComponentMode;
  isLoading: boolean;
  isSaving: boolean;
  validationErrors: ValidationError[];
  lastAutoSave?: Date;
}

export interface FiveWhysConfig {
  autoSaveInterval: number; // milliseconds
  maxWhyLevels: number;
  minWhyLevels: number;
  enableCollaboration: boolean;
  parentObjectTypes: string[];
}

export const DEFAULT_CONFIG: FiveWhysConfig = {
  autoSaveInterval: 30000, // 30 seconds
  maxWhyLevels: 10,
  minWhyLevels: 1,
  enableCollaboration: false,
  parentObjectTypes: ['incident', 'non_conformance', 'audit_finding', 'customer_complaint']
};

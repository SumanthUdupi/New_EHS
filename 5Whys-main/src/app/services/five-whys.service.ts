import { Injectable, signal } from "@angular/core";
import {
  FiveWhysAnalysis,
  FiveWhysComponentState,
  WizardStep,
  ComponentMode,
  ViewMode,
  AnalysisStatus,
  ValidationError,
  CausalPair,
  ActionItem,
  DEFAULT_CONFIG,
  FiveWhysConfig,
} from "../models/five-whys.models";
import { StorageService } from "./storage.service";

@Injectable({
  providedIn: "root",
})
export class FiveWhysService {
  private readonly config = signal<FiveWhysConfig>(DEFAULT_CONFIG);
  private readonly componentState = signal<FiveWhysComponentState>({
    analysis: {},
    wizardState: {
      currentStep: WizardStep.PROBLEM_DEFINITION,
      currentWhyLevel: 1,
      isValid: false,
      hasUnsavedChanges: false,
    },
    viewMode: ViewMode.CREATE,
    componentMode: ComponentMode.SIDE_PANEL,
    isLoading: false,
    isSaving: false,
    validationErrors: [],
    lastAutoSave: undefined,
  });

  // Auto-save timer
  private autoSaveTimer?: ReturnType<typeof setInterval>;

  constructor(private storageService: StorageService) {
    this.startAutoSave();
  }

  // State getters
  getComponentState() {
    return this.componentState.asReadonly();
  }

  getConfig() {
    return this.config.asReadonly();
  }

  // Initialize new analysis
  initializeNewAnalysis(
    parentObjectId?: string,
    parentObjectType?: string,
  ): void {
    const newAnalysis: Partial<FiveWhysAnalysis> = {
      id: this.generateId(),
      parentObjectId,
      parentObjectType,
      problemStatement: "",
      causalPairs: [],
      rootCause: "",
      actionItems: [],
      status: AnalysisStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "current-user", // In real app, get from auth service
    };

    this.componentState.update((state) => ({
      ...state,
      analysis: newAnalysis,
      viewMode: ViewMode.CREATE,
      wizardState: {
        currentStep: WizardStep.PROBLEM_DEFINITION,
        currentWhyLevel: 1,
        isValid: false,
        hasUnsavedChanges: false,
      },
      validationErrors: [],
    }));
  }

  // Load existing analysis
  loadAnalysis(analysis: FiveWhysAnalysis): void {
    this.componentState.update((state) => ({
      ...state,
      analysis,
      viewMode: ViewMode.VIEW,
      wizardState: {
        currentStep: WizardStep.SUMMARY,
        currentWhyLevel: analysis.causalPairs.length,
        isValid: true,
        hasUnsavedChanges: false,
      },
      validationErrors: [],
    }));
  }

  // Update problem statement
  updateProblemStatement(problemStatement: string): void {
    this.componentState.update((state) => ({
      ...state,
      analysis: {
        ...state.analysis,
        problemStatement,
        updatedAt: new Date(),
      },
      wizardState: {
        ...state.wizardState,
        hasUnsavedChanges: true,
        isValid: this.validateProblemStatement(problemStatement),
      },
      validationErrors: this.validateStep(WizardStep.PROBLEM_DEFINITION, {
        problemStatement,
      }),
    }));
  }

  // Add or update causal pair
  updateCausalPair(level: number, answer: string): void {
    const currentState = this.componentState();
    const causalPairs = [...(currentState.analysis.causalPairs || [])];

    const question = this.generateWhyQuestion(level, causalPairs);
    const existingIndex = causalPairs.findIndex((pair) => pair.level === level);

    if (existingIndex >= 0) {
      causalPairs[existingIndex] = { level, question, answer };
    } else {
      causalPairs.push({ level, question, answer });
    }

    // Remove subsequent levels if editing an earlier one
    const filteredPairs = causalPairs.filter((pair) => pair.level <= level);

    this.componentState.update((state) => ({
      ...state,
      analysis: {
        ...state.analysis,
        causalPairs: filteredPairs,
        updatedAt: new Date(),
      },
      wizardState: {
        ...state.wizardState,
        hasUnsavedChanges: true,
        currentWhyLevel: level,
      },
      validationErrors: this.validateStep(WizardStep.PROGRESSIVE_QUESTIONING, {
        answer,
      }),
    }));
  }

  // Set root cause
  setRootCause(rootCause: string): void {
    this.componentState.update((state) => ({
      ...state,
      analysis: {
        ...state.analysis,
        rootCause,
        updatedAt: new Date(),
      },
      wizardState: {
        ...state.wizardState,
        hasUnsavedChanges: true,
      },
      validationErrors: this.validateStep(WizardStep.ROOT_CAUSE_CONFIRMATION, {
        rootCause,
      }),
    }));
  }

  // Add action item
  addActionItem(actionItem: Omit<ActionItem, "id">): void {
    const currentState = this.componentState();
    const newActionItem: ActionItem = {
      ...actionItem,
      id: this.generateId(),
    };

    this.componentState.update((state) => ({
      ...state,
      analysis: {
        ...state.analysis,
        actionItems: [...(state.analysis.actionItems || []), newActionItem],
        updatedAt: new Date(),
      },
      wizardState: {
        ...state.wizardState,
        hasUnsavedChanges: true,
      },
    }));
  }

  // Remove action item
  removeActionItem(actionItemId: string): void {
    this.componentState.update((state) => ({
      ...state,
      analysis: {
        ...state.analysis,
        actionItems: (state.analysis.actionItems || []).filter(
          (item) => item.id !== actionItemId,
        ),
        updatedAt: new Date(),
      },
      wizardState: {
        ...state.wizardState,
        hasUnsavedChanges: true,
      },
    }));
  }

  // Navigation methods
  goToStep(step: WizardStep): void {
    this.componentState.update((state) => ({
      ...state,
      wizardState: {
        ...state.wizardState,
        currentStep: step,
      },
    }));
  }

  goToNextWhy(): void {
    const currentState = this.componentState();
    const nextLevel = currentState.wizardState.currentWhyLevel + 1;

    this.componentState.update((state) => ({
      ...state,
      wizardState: {
        ...state.wizardState,
        currentWhyLevel: nextLevel,
      },
    }));
  }

  // Component mode management
  toggleComponentMode(): void {
    this.componentState.update((state) => ({
      ...state,
      componentMode:
        state.componentMode === ComponentMode.SIDE_PANEL
          ? ComponentMode.FULL_PAGE
          : ComponentMode.SIDE_PANEL,
    }));
  }

  // Auto-save functionality
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      const state = this.componentState();
      if (state.wizardState.hasUnsavedChanges && !state.isSaving) {
        this.autoSave();
      }
    }, this.config().autoSaveInterval);
  }

  private autoSave(): void {
    const currentState = this.componentState();

    this.componentState.update((state) => ({
      ...state,
      isSaving: true,
    }));

    // Simulate API call
    setTimeout(() => {
      this.componentState.update((state) => ({
        ...state,
        isSaving: false,
        lastAutoSave: new Date(),
        wizardState: {
          ...state.wizardState,
          hasUnsavedChanges: false,
        },
      }));
    }, 1000);
  }

  // Manual save
  saveAnalysis(): void {
    this.autoSave();
  }

  // Submit analysis
  submitAnalysis(): void {
    this.componentState.update((state) => ({
      ...state,
      analysis: {
        ...state.analysis,
        status: AnalysisStatus.SUBMITTED,
        updatedAt: new Date(),
      },
      wizardState: {
        ...state.wizardState,
        hasUnsavedChanges: false,
      },
    }));

    // In real app, make API call here
    console.log("Analysis submitted:", this.componentState().analysis);
  }

  // Validation methods
  private validateProblemStatement(problemStatement: string): boolean {
    return problemStatement.trim().length >= 10;
  }

  private validateStep(step: WizardStep, data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (step) {
      case WizardStep.PROBLEM_DEFINITION:
        if (
          !data.problemStatement ||
          data.problemStatement.trim().length < 10
        ) {
          errors.push({
            field: "problemStatement",
            message: "Problem statement must be at least 10 characters long",
          });
        }
        break;

      case WizardStep.PROGRESSIVE_QUESTIONING:
        if (!data.answer || data.answer.trim().length === 0) {
          errors.push({
            field: "answer",
            message: "Please provide an answer to continue the analysis",
          });
        }
        break;

      case WizardStep.ROOT_CAUSE_CONFIRMATION:
        if (!data.rootCause || data.rootCause.trim().length === 0) {
          errors.push({
            field: "rootCause",
            message: "Please confirm the root cause",
          });
        }
        break;
    }

    return errors;
  }

  // Helper methods
  private generateWhyQuestion(
    level: number,
    causalPairs: CausalPair[],
  ): string {
    if (level === 1) {
      return "Why did this happen?";
    }

    const previousAnswer = causalPairs.find(
      (pair) => pair.level === level - 1,
    )?.answer;
    return previousAnswer
      ? `Why did "${previousAnswer}" happen?`
      : `Why did this happen? (Level ${level})`;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Clear resources
  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
  }

  // Export functionality
  exportAnalysis(analysis: FiveWhysAnalysis): string {
    return JSON.stringify(analysis, null, 2);
  }

  // Storage wrappers
  getAllAnalyses(): FiveWhysAnalysis[] {
    return this.storageService.getAllAnalyses();
  }

  deleteAnalysis(id: string): void {
    this.storageService.deleteAnalysis(id);
  }

  // Check for unsaved draft
  hasDraft(): boolean {
    const draft = this.storageService.getDraft();
    return draft !== null && Object.keys(draft).length > 1;
  }

  // Clear current draft
  clearDraft(): void {
    this.storageService.clearDraft();
  }

  // Cleanup
  ngOnDestroy(): void {
    this.destroy();
  }
}

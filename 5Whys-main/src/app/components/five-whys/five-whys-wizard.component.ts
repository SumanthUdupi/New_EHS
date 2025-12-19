import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ComponentMode,
  WizardStep,
  ActionPriority,
  ActionStatus,
} from "../../models/five-whys.models";
import { FiveWhysService } from "../../services/five-whys.service";
import { VisualCausalChainComponent } from "./visual-causal-chain.component";

@Component({
  selector: "app-five-whys-wizard",
  standalone: true,
  imports: [CommonModule, FormsModule, VisualCausalChainComponent],
  template: `
    <div class="flex flex-col h-full">
      <!-- Progress Indicator -->
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            @for (step of progressSteps; track step.key) {
              <div class="flex items-center">
                <div
                  [class]="getStepClasses(step.key)"
                  [attr.aria-current]="
                    step.key === currentStep() ? 'step' : null
                  "
                >
                  @if (isStepCompleted(step.key)) {
                    <svg
                      class="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  } @else {
                    <span class="text-xs font-medium">{{ step.number }}</span>
                  }
                </div>
                @if (!$last) {
                  <div
                    [class]="getConnectorClasses(step.key)"
                    class="w-8 h-0.5 mx-2"
                  ></div>
                }
              </div>
            }
          </div>
          <span class="text-sm text-gray-500"
            >Step {{ getCurrentStepNumber() }} of
            {{ progressSteps.length }}</span
          >
        </div>
        <div class="mt-2">
          <h3 class="text-lg font-medium text-gray-900">
            {{ getCurrentStepTitle() }}
          </h3>
          <p class="text-sm text-gray-600">{{ getCurrentStepDescription() }}</p>
        </div>
      </div>

      <!-- Step Content -->
      <div class="flex-1 overflow-y-auto">
        <div [class]="contentClasses()">
          <!-- Step 1: Problem Definition -->
          @if (currentStep() === WizardStep.PROBLEM_DEFINITION) {
            <div class="space-y-6">
              <div>
                <label
                  for="problem-statement"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Problem Statement <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="problem-statement"
                  [(ngModel)]="problemStatement"
                  (input)="onProblemStatementChange()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="4"
                  placeholder="Describe the specific problem factually, avoiding assumptions or blame. Be clear and concise."
                ></textarea>
                @if (getProblemStatementError()) {
                  <p class="mt-1 text-sm text-red-600">
                    {{ getProblemStatementError() }}
                  </p>
                }
              </div>

              <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div class="flex">
                  <svg
                    class="w-5 h-5 text-blue-400 mt-0.5 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <div class="text-sm text-blue-700">
                    <p class="font-medium mb-1">
                      Tips for a good problem statement:
                    </p>
                    <ul class="list-disc list-inside space-y-1 text-blue-600">
                      <li>Focus on observable facts, not assumptions</li>
                      <li>Avoid blame or personal opinions</li>
                      <li>Be specific about what went wrong</li>
                      <li>Include relevant context (when, where, what)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Step 2: Progressive Questioning -->
          @if (currentStep() === WizardStep.PROGRESSIVE_QUESTIONING) {
            <div class="space-y-6">
              <!-- Problem Statement Display -->
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">
                  Problem Statement:
                </h4>
                <p class="text-gray-900">
                  {{ state().analysis.problemStatement }}
                </p>
              </div>

              <!-- Previous Whys -->
              @if (state().analysis.causalPairs?.length) {
                <div class="space-y-4">
                  @for (
                    pair of state().analysis.causalPairs;
                    track pair.level
                  ) {
                    <div class="border-l-4 border-blue-200 pl-4">
                      <div class="text-sm font-medium text-gray-700">
                        {{ pair.question }}
                      </div>
                      <div class="text-gray-900 mt-1">{{ pair.answer }}</div>
                    </div>
                  }
                </div>
              }

              <!-- Current Why -->
              <div class="space-y-4">
                <div class="border-l-4 border-blue-500 pl-4">
                  <label
                    [for]="'why-' + currentWhyLevel()"
                    class="block text-sm font-medium text-gray-900 mb-2"
                  >
                    {{ getCurrentWhyQuestion() }}
                    <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    [id]="'why-' + currentWhyLevel()"
                    [(ngModel)]="currentAnswer"
                    (input)="onAnswerChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows="3"
                    placeholder="Provide a factual answer based on evidence and observation."
                  ></textarea>
                  @if (getAnswerError()) {
                    <p class="mt-1 text-sm text-red-600">
                      {{ getAnswerError() }}
                    </p>
                  }
                </div>
              </div>

              <!-- Continue or Finalize Options -->
              @if (currentWhyLevel() >= 3) {
                <div
                  class="bg-yellow-50 border border-yellow-200 rounded-md p-4"
                >
                  <div class="flex">
                    <svg
                      class="w-5 h-5 text-yellow-400 mt-0.5 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div class="text-sm text-yellow-700">
                      <p class="font-medium mb-1">Decision Point:</p>
                      <p>
                        You've completed {{ currentWhyLevel() }} levels of
                        analysis. Do you feel you've reached the root cause, or
                        should you continue investigating?
                      </p>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Step 3: Root Cause Confirmation -->
          @if (currentStep() === WizardStep.ROOT_CAUSE_CONFIRMATION) {
            <div class="space-y-6">
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 class="text-sm font-medium text-green-700 mb-2">
                  Analysis Chain:
                </h4>
                <div class="space-y-2">
                  @for (
                    pair of state().analysis.causalPairs;
                    track pair.level
                  ) {
                    <div class="text-sm">
                      <span class="font-medium text-green-700">{{
                        pair.question
                      }}</span>
                      <div class="text-green-600 ml-4">{{ pair.answer }}</div>
                    </div>
                  }
                </div>
              </div>

              <div>
                <label
                  for="root-cause"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Root Cause <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="root-cause"
                  [(ngModel)]="rootCause"
                  (input)="onRootCauseChange()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="3"
                  placeholder="Confirm this as the root cause of the problem."
                ></textarea>
                @if (getRootCauseError()) {
                  <p class="mt-1 text-sm text-red-600">
                    {{ getRootCauseError() }}
                  </p>
                }
              </div>

              <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div class="flex items-start">
                  <input
                    type="checkbox"
                    id="root-cause-validation"
                    [(ngModel)]="rootCauseValidated"
                    class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    for="root-cause-validation"
                    class="ml-3 text-sm text-blue-700"
                  >
                    <span class="font-medium">Validation Check:</span> If this
                    root cause were corrected, would it prevent the original
                    problem from recurring?
                  </label>
                </div>
              </div>
            </div>
          }

          <!-- Step 4: Corrective Actions -->
          @if (currentStep() === WizardStep.CORRECTIVE_ACTIONS) {
            <div class="space-y-6">
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">
                  Root Cause:
                </h4>
                <p class="text-gray-900">{{ state().analysis.rootCause }}</p>
              </div>

              <!-- Existing Action Items -->
              @if (state().analysis.actionItems?.length) {
                <div class="space-y-3">
                  <h4 class="text-sm font-medium text-gray-700">
                    Corrective Actions:
                  </h4>
                  @for (
                    action of state().analysis.actionItems;
                    track action.id
                  ) {
                    <div class="border border-gray-200 rounded-lg p-4">
                      <div class="flex justify-between items-start">
                        <div class="flex-1">
                          <p class="text-gray-900">{{ action.description }}</p>
                          <div
                            class="mt-2 flex items-center space-x-4 text-sm text-gray-500"
                          >
                            @if (action.assignedTo) {
                              <span>Assigned to: {{ action.assignedTo }}</span>
                            }
                            @if (action.dueDate) {
                              <span>Due: {{ formatDate(action.dueDate) }}</span>
                            }
                            <span
                              class="px-2 py-1 rounded-full text-xs"
                              [class]="getPriorityClasses(action.priority)"
                            >
                              {{ action.priority }}
                            </span>
                          </div>
                        </div>
                        <button
                          (click)="removeAction(action.id)"
                          class="ml-4 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove action"
                        >
                          <svg
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Add New Action Form -->
              <div
                class="border-2 border-dashed border-gray-300 rounded-lg p-6"
              >
                <h4 class="text-sm font-medium text-gray-700 mb-4">
                  Add Corrective Action
                </h4>
                <div class="space-y-4">
                  <div>
                    <label
                      for="action-description"
                      class="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description <span class="text-red-500">*</span>
                    </label>
                    <textarea
                      id="action-description"
                      [(ngModel)]="newAction.description"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows="3"
                      placeholder="Describe the corrective action to be taken."
                    ></textarea>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label
                        for="action-assignee"
                        class="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Assigned To
                      </label>
                      <input
                        type="text"
                        id="action-assignee"
                        [(ngModel)]="newAction.assignedTo"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Team or person"
                      />
                    </div>

                    <div>
                      <label
                        for="action-due-date"
                        class="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Due Date
                      </label>
                      <input
                        type="date"
                        id="action-due-date"
                        [(ngModel)]="newActionDueDate"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label
                        for="action-priority"
                        class="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Priority
                      </label>
                      <select
                        id="action-priority"
                        [(ngModel)]="newAction.priority"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option [value]="ActionPriority.LOW">Low</option>
                        <option [value]="ActionPriority.MEDIUM">Medium</option>
                        <option [value]="ActionPriority.HIGH">High</option>
                        <option [value]="ActionPriority.CRITICAL">
                          Critical
                        </option>
                      </select>
                    </div>
                  </div>

                  <button
                    (click)="addAction()"
                    [disabled]="!newAction.description.trim()"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg
                      class="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Action
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- Step 5: Summary -->
          @if (currentStep() === WizardStep.SUMMARY) {
            <div class="space-y-6">
              <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 class="text-lg font-medium text-green-800 mb-4">
                  Analysis Complete
                </h3>
                <p class="text-green-700">
                  Review your complete 5 Whys analysis before submitting.
                </p>
              </div>

              <!-- Visual Summary -->
              <div class="bg-white border border-gray-200 rounded-lg">
                <app-visual-causal-chain
                  [analysis]="state().analysis"
                  [showInteractive]="false"
                />
              </div>
            </div>
          }

          <!-- Live Preview for Progressive Questioning -->
          @if (
            currentStep() === WizardStep.PROGRESSIVE_QUESTIONING &&
            (state().analysis.causalPairs?.length || 0) > 0
          ) {
            <div class="mt-8 pt-6 border-t border-gray-200">
              <h4 class="text-sm font-medium text-gray-700 mb-4">
                Analysis Preview
              </h4>
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <app-visual-causal-chain
                  [analysis]="state().analysis"
                  [showInteractive]="false"
                />
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Navigation Footer -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div class="flex justify-between items-center">
          <div>
            @if (canGoBack()) {
              <button
                (click)="goBack()"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
            }
          </div>

          <div class="flex items-center space-x-3">
            @if (
              currentStep() === WizardStep.PROGRESSIVE_QUESTIONING &&
              currentWhyLevel() >= 3
            ) {
              <button
                (click)="finalizeAsRootCause()"
                [disabled]="!canFinalizeAsRootCause()"
                class="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Finalize as Root Cause
              </button>
            }

            @if (currentStep() === WizardStep.SUMMARY) {
              <button
                (click)="submitAnalysis()"
                class="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Submit Analysis
              </button>
            } @else {
              <button
                (click)="goNext()"
                [disabled]="!canGoNext()"
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <svg
                  class="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class FiveWhysWizardComponent {
  @Input() componentMode: ComponentMode = ComponentMode.SIDE_PANEL;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  protected readonly WizardStep = WizardStep;
  protected readonly ActionPriority = ActionPriority;
  protected readonly ActionStatus = ActionStatus;

  // Form data
  protected problemStatement = "";
  protected currentAnswer = "";
  protected rootCause = "";
  protected rootCauseValidated = false;
  protected newAction = {
    description: "",
    assignedTo: "",
    priority: ActionPriority.MEDIUM,
    status: ActionStatus.NOT_STARTED,
  };
  protected newActionDueDate = "";

  protected progressSteps = [
    {
      key: WizardStep.PROBLEM_DEFINITION,
      number: 1,
      title: "Problem",
      description: "Define the problem",
    },
    {
      key: WizardStep.PROGRESSIVE_QUESTIONING,
      number: 2,
      title: "Analysis",
      description: "Ask why questions",
    },
    {
      key: WizardStep.ROOT_CAUSE_CONFIRMATION,
      number: 3,
      title: "Root Cause",
      description: "Confirm root cause",
    },
    {
      key: WizardStep.CORRECTIVE_ACTIONS,
      number: 4,
      title: "Actions",
      description: "Define corrective actions",
    },
    {
      key: WizardStep.SUMMARY,
      number: 5,
      title: "Summary",
      description: "Review and submit",
    },
  ];

  private fiveWhysService = inject(FiveWhysService);
  protected state = this.fiveWhysService.getComponentState();

  constructor() {}
  protected currentStep = computed(() => this.state().wizardState.currentStep);
  protected currentWhyLevel = computed(
    () => this.state().wizardState.currentWhyLevel,
  );

  protected contentClasses = computed(() => {
    return this.componentMode === ComponentMode.SIDE_PANEL
      ? "p-6"
      : "p-8 max-w-4xl mx-auto";
  });

  // Step navigation methods
  protected canGoBack(): boolean {
    const step = this.currentStep();
    return step !== WizardStep.PROBLEM_DEFINITION;
  }

  protected canGoNext(): boolean {
    const step = this.currentStep();
    const errors = this.state().validationErrors;

    switch (step) {
      case WizardStep.PROBLEM_DEFINITION:
        return this.problemStatement.trim().length >= 10 && errors.length === 0;
      case WizardStep.PROGRESSIVE_QUESTIONING:
        return this.currentAnswer.trim().length > 0 && errors.length === 0;
      case WizardStep.ROOT_CAUSE_CONFIRMATION:
        return (
          this.rootCause.trim().length > 0 &&
          this.rootCauseValidated &&
          errors.length === 0
        );
      case WizardStep.CORRECTIVE_ACTIONS:
        return true; // Actions are optional
      default:
        return false;
    }
  }

  protected goNext(): void {
    const step = this.currentStep();

    switch (step) {
      case WizardStep.PROBLEM_DEFINITION:
        this.fiveWhysService.updateProblemStatement(this.problemStatement);
        this.fiveWhysService.goToStep(WizardStep.PROGRESSIVE_QUESTIONING);
        break;
      case WizardStep.PROGRESSIVE_QUESTIONING:
        this.fiveWhysService.updateCausalPair(
          this.currentWhyLevel(),
          this.currentAnswer,
        );
        this.fiveWhysService.goToNextWhy();
        this.currentAnswer = "";
        break;
      case WizardStep.ROOT_CAUSE_CONFIRMATION:
        this.fiveWhysService.setRootCause(this.rootCause);
        this.fiveWhysService.goToStep(WizardStep.CORRECTIVE_ACTIONS);
        break;
      case WizardStep.CORRECTIVE_ACTIONS:
        this.fiveWhysService.goToStep(WizardStep.SUMMARY);
        break;
    }
  }

  protected goBack(): void {
    const step = this.currentStep();

    switch (step) {
      case WizardStep.PROGRESSIVE_QUESTIONING:
        this.fiveWhysService.goToStep(WizardStep.PROBLEM_DEFINITION);
        break;
      case WizardStep.ROOT_CAUSE_CONFIRMATION:
        this.fiveWhysService.goToStep(WizardStep.PROGRESSIVE_QUESTIONING);
        break;
      case WizardStep.CORRECTIVE_ACTIONS:
        this.fiveWhysService.goToStep(WizardStep.ROOT_CAUSE_CONFIRMATION);
        break;
      case WizardStep.SUMMARY:
        this.fiveWhysService.goToStep(WizardStep.CORRECTIVE_ACTIONS);
        break;
    }
  }

  // Progressive questioning methods
  protected getCurrentWhyQuestion(): string {
    const level = this.currentWhyLevel();
    const analysis = this.state().analysis;

    if (level === 1) {
      return "Why did this happen?";
    }

    const previousAnswer = analysis.causalPairs?.find(
      (pair) => pair.level === level - 1,
    )?.answer;
    return previousAnswer
      ? `Why did "${previousAnswer}" happen?`
      : `Why did this happen? (Level ${level})`;
  }

  protected canFinalizeAsRootCause(): boolean {
    return this.currentAnswer.trim().length > 0;
  }

  protected finalizeAsRootCause(): void {
    this.fiveWhysService.updateCausalPair(
      this.currentWhyLevel(),
      this.currentAnswer,
    );
    this.rootCause = this.currentAnswer;
    this.fiveWhysService.goToStep(WizardStep.ROOT_CAUSE_CONFIRMATION);
  }

  // Action management
  protected addAction(): void {
    if (!this.newAction.description.trim()) return;

    const actionItem = {
      ...this.newAction,
      dueDate: this.newActionDueDate
        ? new Date(this.newActionDueDate)
        : undefined,
    };

    this.fiveWhysService.addActionItem(actionItem);

    // Reset form
    this.newAction = {
      description: "",
      assignedTo: "",
      priority: ActionPriority.MEDIUM,
      status: ActionStatus.NOT_STARTED,
    };
    this.newActionDueDate = "";
  }

  protected removeAction(actionId: string): void {
    this.fiveWhysService.removeActionItem(actionId);
  }

  // Event handlers
  protected onProblemStatementChange(): void {
    this.fiveWhysService.updateProblemStatement(this.problemStatement);
  }

  protected onAnswerChange(): void {
    // Just update local state, actual save happens on next/finalize
  }

  protected onRootCauseChange(): void {
    this.fiveWhysService.setRootCause(this.rootCause);
  }

  protected submitAnalysis(): void {
    this.submit.emit();
  }

  // Progress indicator helpers
  protected getStepClasses(step: WizardStep): string {
    const baseClasses =
      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium";

    if (this.isStepCompleted(step)) {
      return `${baseClasses} bg-green-600 text-white`;
    } else if (step === this.currentStep()) {
      return `${baseClasses} bg-blue-600 text-white`;
    } else {
      return `${baseClasses} bg-gray-300 text-gray-600`;
    }
  }

  protected getConnectorClasses(step: WizardStep): string {
    return this.isStepCompleted(step) ? "bg-green-600" : "bg-gray-300";
  }

  protected isStepCompleted(step: WizardStep): boolean {
    const currentStep = this.currentStep();
    const stepOrder = [
      WizardStep.PROBLEM_DEFINITION,
      WizardStep.PROGRESSIVE_QUESTIONING,
      WizardStep.ROOT_CAUSE_CONFIRMATION,
      WizardStep.CORRECTIVE_ACTIONS,
      WizardStep.SUMMARY,
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    return stepIndex < currentIndex;
  }

  protected getCurrentStepNumber(): number {
    return (
      this.progressSteps.find((s) => s.key === this.currentStep())?.number || 1
    );
  }

  protected getCurrentStepTitle(): string {
    return (
      this.progressSteps.find((s) => s.key === this.currentStep())?.title || ""
    );
  }

  protected getCurrentStepDescription(): string {
    return (
      this.progressSteps.find((s) => s.key === this.currentStep())
        ?.description || ""
    );
  }

  // Validation helpers
  protected getProblemStatementError(): string | null {
    const error = this.state().validationErrors.find(
      (e) => e.field === "problemStatement",
    );
    return error?.message || null;
  }

  protected getAnswerError(): string | null {
    const error = this.state().validationErrors.find(
      (e) => e.field === "answer",
    );
    return error?.message || null;
  }

  protected getRootCauseError(): string | null {
    const error = this.state().validationErrors.find(
      (e) => e.field === "rootCause",
    );
    return error?.message || null;
  }

  // Utility helpers
  protected formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  protected getPriorityClasses(priority: ActionPriority): string {
    const baseClasses = "font-medium";
    switch (priority) {
      case ActionPriority.LOW:
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case ActionPriority.MEDIUM:
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case ActionPriority.HIGH:
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case ActionPriority.CRITICAL:
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }
}

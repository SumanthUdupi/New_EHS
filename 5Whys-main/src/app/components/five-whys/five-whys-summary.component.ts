import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FiveWhysAnalysis,
  ComponentMode,
  ActionPriority,
  ActionStatus,
} from "../../models/five-whys.models";
import { VisualCausalChainComponent } from "./visual-causal-chain.component";

@Component({
  selector: "app-five-whys-summary",
  standalone: true,
  imports: [CommonModule, VisualCausalChainComponent],
  template: `
    <div class="h-full overflow-y-auto">
      <div [class]="contentClasses()">
        <!-- Analysis Header -->
        <div
          class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                5 Whys Analysis Summary
              </h3>
              @if (analysis?.parentObjectId) {
                <p class="text-sm text-gray-600 mb-1">
                  Related to:
                  <span class="font-medium"
                    >{{ analysis?.parentObjectType }} #{{
                      analysis?.parentObjectId
                    }}</span
                  >
                </p>
              }
              <div class="flex items-center space-x-4 text-sm text-gray-500">
                <span>Created: {{ formatDate(analysis?.createdAt) }}</span>
                <span>Updated: {{ formatDate(analysis?.updatedAt) }}</span>
                @if (analysis?.createdBy) {
                  <span>By: {{ analysis?.createdBy }}</span>
                }
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span
                [class]="getStatusClasses(analysis?.status)"
                class="px-3 py-1 rounded-full text-xs font-medium"
              >
                {{ getStatusLabel(analysis?.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Problem Statement -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-lg font-medium text-gray-900">Problem Statement</h4>
            <button
              (click)="editSection('problem')"
              class="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
              title="Edit problem statement"
            >
              <svg
                class="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
          </div>
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p class="text-gray-900 leading-relaxed">
              {{ analysis?.problemStatement }}
            </p>
          </div>
        </div>

        <!-- Visual Causal Chain Analysis -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-medium text-gray-900">
              Causal Chain Analysis
            </h4>
            <button
              (click)="editSection('analysis')"
              class="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
              title="Edit analysis"
            >
              <svg
                class="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
          </div>

          <!-- Visual Flowchart -->
          <div class="bg-gray-50 border border-gray-200 rounded-lg">
            <app-visual-causal-chain
              [analysis]="analysis"
              [showInteractive]="true"
            />
          </div>
        </div>

        <!-- Root Cause -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-lg font-medium text-gray-900">Root Cause</h4>
            <button
              (click)="editSection('root-cause')"
              class="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
              title="Edit root cause"
            >
              <svg
                class="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
          </div>
          <div class="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div class="flex items-start">
              <svg
                class="w-5 h-5 text-red-400 mt-0.5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div class="flex-1">
                <h5 class="text-sm font-medium text-red-800 mb-1">
                  Identified Root Cause
                </h5>
                <p class="text-red-700">
                  {{ analysis?.rootCause || "No root cause identified" }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Corrective Actions -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-medium text-gray-900">
              Corrective Actions
            </h4>
            <button
              (click)="editSection('actions')"
              class="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
              title="Edit actions"
            >
              <svg
                class="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
          </div>

          @if (getActionItems().length > 0) {
            <div class="space-y-4">
              @for (action of getActionItems(); track action.id) {
                <div
                  class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <p class="text-gray-900 mb-2">{{ action.description }}</p>
                      <div class="flex flex-wrap items-center gap-4 text-sm">
                        @if (action.assignedTo) {
                          <div class="flex items-center text-gray-600">
                            <svg
                              class="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            {{ action.assignedTo }}
                          </div>
                        }

                        @if (action.dueDate) {
                          <div class="flex items-center text-gray-600">
                            <svg
                              class="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Due: {{ formatDate(action.dueDate) }}
                          </div>
                        }

                        <span
                          [class]="getPriorityClasses(action.priority)"
                          class="px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {{ getPriorityLabel(action.priority) }}
                        </span>

                        <span
                          [class]="getActionStatusClasses(action.status)"
                          class="px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {{ getActionStatusLabel(action.status) }}
                        </span>
                      </div>
                    </div>

                    <button
                      (click)="editAction(action.id)"
                      class="ml-4 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit action"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div
              class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
            >
              <svg
                class="w-8 h-8 text-gray-400 mx-auto mb-2"
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
              <p class="text-gray-500">No corrective actions defined</p>
              <button
                (click)="editSection('actions')"
                class="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Add corrective actions
              </button>
            </div>
          }
        </div>

        <!-- Export and Actions -->
        <div class="border-t border-gray-200 pt-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center space-x-3">
              <button
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export PDF
              </button>

              <button
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
                Share
              </button>
            </div>

            <div class="flex items-center space-x-3">
              <button
                (click)="close.emit()"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Close
              </button>
            </div>
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
export class FiveWhysSummaryComponent {
  @Input() analysis?: Partial<FiveWhysAnalysis>;
  @Input() componentMode: ComponentMode = ComponentMode.SIDE_PANEL;
  @Output() edit = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  protected contentClasses = computed(() => {
    return this.componentMode === ComponentMode.SIDE_PANEL
      ? "p-6"
      : "p-8 max-w-4xl mx-auto";
  });

  protected getCausalPairs() {
    return this.analysis?.causalPairs || [];
  }

  protected getActionItems() {
    return this.analysis?.actionItems || [];
  }

  protected editSection(section: string): void {
    this.edit.emit(section);
  }

  protected editCausalPair(level: number): void {
    this.edit.emit(`causal-pair-${level}`);
  }

  protected editAction(actionId: string): void {
    this.edit.emit(`action-${actionId}`);
  }

  protected formatDate(date?: Date): string {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  protected getStatusClasses(status?: string): string {
    const baseClasses = "border";
    switch (status) {
      case "draft":
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-300`;
      case "in_progress":
        return `${baseClasses} bg-blue-100 text-blue-800 border-blue-300`;
      case "submitted":
        return `${baseClasses} bg-green-100 text-green-800 border-green-300`;
      case "completed":
        return `${baseClasses} bg-purple-100 text-purple-800 border-purple-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-300`;
    }
  }

  protected getStatusLabel(status?: string): string {
    switch (status) {
      case "draft":
        return "Draft";
      case "in_progress":
        return "In Progress";
      case "submitted":
        return "Submitted";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  }

  protected getPriorityClasses(priority: ActionPriority): string {
    const baseClasses = "border";
    switch (priority) {
      case ActionPriority.LOW:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-300`;
      case ActionPriority.MEDIUM:
        return `${baseClasses} bg-blue-100 text-blue-800 border-blue-300`;
      case ActionPriority.HIGH:
        return `${baseClasses} bg-orange-100 text-orange-800 border-orange-300`;
      case ActionPriority.CRITICAL:
        return `${baseClasses} bg-red-100 text-red-800 border-red-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-300`;
    }
  }

  protected getPriorityLabel(priority: ActionPriority): string {
    switch (priority) {
      case ActionPriority.LOW:
        return "Low";
      case ActionPriority.MEDIUM:
        return "Medium";
      case ActionPriority.HIGH:
        return "High";
      case ActionPriority.CRITICAL:
        return "Critical";
      default:
        return "Medium";
    }
  }

  protected getActionStatusClasses(status: ActionStatus): string {
    const baseClasses = "border";
    switch (status) {
      case ActionStatus.NOT_STARTED:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-300`;
      case ActionStatus.IN_PROGRESS:
        return `${baseClasses} bg-blue-100 text-blue-800 border-blue-300`;
      case ActionStatus.COMPLETED:
        return `${baseClasses} bg-green-100 text-green-800 border-green-300`;
      case ActionStatus.ON_HOLD:
        return `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-300`;
    }
  }

  protected getActionStatusLabel(status: ActionStatus): string {
    switch (status) {
      case ActionStatus.NOT_STARTED:
        return "Not Started";
      case ActionStatus.IN_PROGRESS:
        return "In Progress";
      case ActionStatus.COMPLETED:
        return "Completed";
      case ActionStatus.ON_HOLD:
        return "On Hold";
      default:
        return "Not Started";
    }
  }
}

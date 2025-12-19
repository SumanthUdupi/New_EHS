import { Component, Input, Output, EventEmitter, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentMode, FiveWhysAnalysis, ViewMode } from '../../models/five-whys.models';
import { FiveWhysService } from '../../services/five-whys.service';
import { FiveWhysWizardComponent } from './five-whys-wizard.component';
import { FiveWhysSummaryComponent } from './five-whys-summary.component';

@Component({
  selector: 'app-five-whys-analysis',
  standalone: true,
  imports: [CommonModule, FiveWhysWizardComponent, FiveWhysSummaryComponent],
  template: `
    <div [class]="containerClasses()">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">5 Whys Analysis</h2>
            <p class="text-sm text-gray-500">Root Cause Analysis</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <!-- Status Indicator -->
          <div class="flex items-center space-x-2 text-sm">
            @if (state().isSaving) {
              <div class="flex items-center space-x-1 text-blue-600">
                <div class="w-3 h-3 border border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            } @else if (state().lastAutoSave) {
              <span class="text-green-600">
                Saved {{ formatTime(state().lastAutoSave!) }}
              </span>
            }
          </div>

          <!-- Mode Toggle -->
          @if (state().componentMode === ComponentMode.SIDE_PANEL) {
            <button
              (click)="toggleMode()"
              class="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              title="Expand to Focus Mode"
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
              </svg>
              Focus Mode
            </button>
          } @else {
            <button
              (click)="toggleMode()"
              class="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              title="Return to Side Panel"
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Exit Focus
            </button>
          }

          <!-- Close Button -->
          <button
            (click)="onClose()"
            class="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            title="Close"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-hidden">
        @if (state().viewMode === ViewMode.CREATE || state().viewMode === ViewMode.EDIT) {
          <app-five-whys-wizard 
            [componentMode]="state().componentMode"
            (close)="onClose()"
            (submit)="onSubmit()"
          />
        } @else {
          <app-five-whys-summary 
            [analysis]="state().analysis"
            [componentMode]="state().componentMode"
            (edit)="onEdit($event)"
            (close)="onClose()"
          />
        }
      </div>
    </div>

    <!-- Backdrop for full-page mode -->
    @if (state().componentMode === ComponentMode.FULL_PAGE) {
      <div 
        class="fixed inset-0 bg-gray-900 bg-opacity-50 z-40"
        (click)="toggleMode()"
      ></div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class FiveWhysAnalysisComponent {
  @Input() initialAnalysis?: FiveWhysAnalysis;
  @Input() parentObjectId?: string;
  @Input() parentObjectType?: string;
  @Input() initialMode: ComponentMode = ComponentMode.SIDE_PANEL;
  
  @Output() close = new EventEmitter<void>();
  @Output() analysisSubmitted = new EventEmitter<FiveWhysAnalysis>();

  protected readonly ComponentMode = ComponentMode;
  protected readonly ViewMode = ViewMode;

  private fiveWhysService = inject(FiveWhysService);
  protected state = this.fiveWhysService.getComponentState();

  constructor() {
    // Initialize component when inputs change
    effect(() => {
      if (this.initialAnalysis) {
        this.fiveWhysService.loadAnalysis(this.initialAnalysis);
      } else {
        this.fiveWhysService.initializeNewAnalysis(this.parentObjectId, this.parentObjectType);
      }
    });
  }

  protected containerClasses = computed(() => {
    const mode = this.state().componentMode;
    const baseClasses = 'flex flex-col bg-white shadow-xl';
    
    if (mode === ComponentMode.SIDE_PANEL) {
      return `${baseClasses} fixed right-0 top-0 h-full w-96 lg:w-[32rem] z-50 transform transition-transform duration-300 ease-in-out`;
    } else {
      return `${baseClasses} fixed inset-4 z-50 rounded-lg max-w-6xl mx-auto`;
    }
  });

  protected toggleMode(): void {
    this.fiveWhysService.toggleComponentMode();
  }

  protected onClose(): void {
    const state = this.state();
    if (state.wizardState.hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        this.close.emit();
      }
    } else {
      this.close.emit();
    }
  }

  protected onSubmit(): void {
    this.fiveWhysService.submitAnalysis();
    const analysis = this.state().analysis as FiveWhysAnalysis;
    this.analysisSubmitted.emit(analysis);
  }

  protected onEdit(section: string): void {
    // Switch to edit mode and navigate to appropriate step
    // This will be implemented when we create the wizard component
    console.log('Edit section:', section);
  }

  protected formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ago`;
    }
  }
}

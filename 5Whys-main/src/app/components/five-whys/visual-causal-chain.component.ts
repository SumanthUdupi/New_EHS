import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FiveWhysAnalysis, CausalPair } from "../../models/five-whys.models";

@Component({
  selector: "app-visual-causal-chain",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="getContainerClasses()">
      <!-- Problem Statement -->
      <div [class]="getItemClasses()">
        <div
          class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <div class="flex items-center justify-center mb-2">
            <svg
              class="w-5 h-5 text-blue-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 class="text-sm font-semibold text-blue-800">
              Problem Statement
            </h3>
          </div>
          <p class="text-blue-700 text-sm leading-relaxed">
            {{ analysis?.problemStatement || "Define the problem to analyze" }}
          </p>
        </div>

        <!-- Arrow Down -->
        @if (getCausalChain().length > 0 || analysis?.rootCause) {
          <div class="flex justify-center my-3">
            <svg
              class="w-6 h-6 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        }
      </div>

      <!-- Causal Chain Steps -->
      @for (item of getCausalChain(); track item.level; let isLast = $last) {
        <div [class]="getItemClasses()">
          <!-- Why Question -->
          <div [class]="getWhyBoxClasses(item.level)">
            <div class="flex items-center justify-center mb-2">
              <div
                class="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2"
              >
                {{ item.level }}
              </div>
              <h4 class="text-sm font-semibold text-teal-800">
                {{ getOrdinalNumber(item.level) }} Why?
              </h4>
            </div>
            <p class="text-teal-700 text-sm leading-relaxed">
              {{ item.answer }}
            </p>
          </div>

          <!-- Arrow Down -->
          @if (!isLast || analysis?.rootCause) {
            <div class="flex justify-center my-3">
              <svg
                class="w-6 h-6 text-teal-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          }
        </div>
      }

      <!-- Root Cause -->
      @if (analysis?.rootCause) {
        <div [class]="getItemClasses()">
          <div
            class="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div class="flex items-center justify-center mb-2">
              <svg
                class="w-5 h-5 text-red-600 mr-2"
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
              <h3 class="text-sm font-semibold text-red-800">Root Cause</h3>
            </div>
            <p class="text-red-700 text-sm leading-relaxed font-medium">
              {{ analysis?.rootCause }}
            </p>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (getCausalChain().length === 0 && !analysis?.rootCause) {
        <div [class]="getItemClasses()">
          <div
            class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
          >
            <svg
              class="w-8 h-8 text-gray-400 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="text-gray-500 text-sm">
              Start asking "Why?" to build your causal chain
            </p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* Animation for chain items */
      .chain-item {
        animation: slideInUp 0.3s ease-out;
      }

      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Hover effects for interactive elements */
      .chain-box:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease-in-out;
      }
    `,
  ],
})
export class VisualCausalChainComponent {
  @Input() analysis?: Partial<FiveWhysAnalysis>;
  @Input() showInteractive: boolean = false;
  @Input() currentLevel?: number; // For highlighting current step in wizard
  @Input() compact: boolean = false; // For smaller displays

  protected getCausalChain(): CausalPair[] {
    if (!this.analysis?.causalPairs) {
      return [];
    }

    // Sort by level to ensure proper order
    return [...this.analysis.causalPairs].sort((a, b) => a.level - b.level);
  }

  protected getContainerClasses(): string {
    const baseClasses = "flex flex-col items-center space-y-4";
    const sizeClasses = this.compact ? "py-4" : "py-6";
    return `${baseClasses} ${sizeClasses}`;
  }

  protected getItemClasses(): string {
    return this.compact ? "w-full max-w-sm" : "w-full max-w-md";
  }

  protected getWhyBoxClasses(level: number): string {
    const baseClasses =
      "bg-teal-50 border-2 rounded-lg p-4 text-center shadow-sm transition-all duration-200 hover:shadow-md";

    // Highlight current level in wizard
    if (this.currentLevel === level) {
      return `${baseClasses} border-teal-400 ring-2 ring-teal-200`;
    }

    return `${baseClasses} border-teal-200`;
  }

  protected getOrdinalNumber(num: number): string {
    const ordinals = [
      "",
      "1st",
      "2nd",
      "3rd",
      "4th",
      "5th",
      "6th",
      "7th",
      "8th",
      "9th",
      "10th",
    ];

    if (num <= 10) {
      return ordinals[num];
    }

    // For numbers beyond 10, use generic ordinal rules
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return `${num}th`;
    }

    switch (lastDigit) {
      case 1:
        return `${num}st`;
      case 2:
        return `${num}nd`;
      case 3:
        return `${num}rd`;
      default:
        return `${num}th`;
    }
  }
}

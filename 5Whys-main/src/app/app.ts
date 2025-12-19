import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FiveWhysTreeDemoComponent } from "./components/five-whys-tree/five-whys-tree-demo.component";
import {
  ComponentMode,
  FiveWhysAnalysis,
  AnalysisStatus,
  ActionPriority,
  ActionStatus,
} from "./models/five-whys.models";
import { FiveWhysService } from "./services/five-whys.service";
import { StorageService } from "./services/storage.service";

@Component({
  selector: "app-root",
  imports: [CommonModule, FiveWhysTreeDemoComponent],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App implements OnInit, OnDestroy {
  private fiveWhysService = inject(FiveWhysService);
  private storageService = inject(StorageService);

  protected readonly title = signal("5 Whys Analysis System");
  protected readonly showAnalysis = signal(false);
  protected readonly analysisMode = signal<"new" | "existing">("new");
  protected readonly existingAnalysis = signal<FiveWhysAnalysis | undefined>(
    undefined,
  );
  protected readonly savedAnalyses = signal<FiveWhysAnalysis[]>([]);

  protected readonly hasData = computed(() => this.savedAnalyses().length > 0);
  protected readonly hasDraft = computed(() => this.fiveWhysService.hasDraft());

  ngOnInit(): void {
    this.loadSavedAnalyses();
  }

  ngOnDestroy(): void {
    // Component cleanup handled by service
  }

  private loadSavedAnalyses(): void {
    const analyses = this.fiveWhysService.getAllAnalyses();
    this.savedAnalyses.set(analyses);
  }

  // Sample data for demonstration (if no real data exists)
  private getSampleAnalyses(): FiveWhysAnalysis[] {
    return [
      {
        id: "1",
        problemStatement:
          "Production line stopped for 2 hours causing delivery delays",
        causalPairs: [
          {
            level: 1,
            question: "Why did this happen?",
            answer: "The conveyor belt motor overheated and shut down",
          },
          {
            level: 2,
            question:
              'Why did "The conveyor belt motor overheated and shut down" happen?',
            answer: "The cooling system was not working properly",
          },
          {
            level: 3,
            question:
              'Why did "The cooling system was not working properly" happen?',
            answer: "The air filter was completely clogged with dust",
          },
        ],
        rootCause: "The air filter was completely clogged with dust",
        actionItems: [
          {
            id: "1",
            description:
              "Implement weekly air filter inspection and cleaning schedule",
            assignedTo: "Maintenance Team",
            dueDate: new Date("2024-02-15"),
            priority: ActionPriority.HIGH,
            status: ActionStatus.NOT_STARTED,
          },
          {
            id: "2",
            description: "Install automated filter monitoring system",
            assignedTo: "Engineering Team",
            dueDate: new Date("2024-03-01"),
            priority: ActionPriority.MEDIUM,
            status: ActionStatus.NOT_STARTED,
          },
        ],
        status: AnalysisStatus.COMPLETED,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-12"),
        createdBy: "John Smith",
        parentObjectId: "INC-2024-001",
        parentObjectType: "incident",
      },
      {
        id: "2",
        problemStatement:
          "Customer complaint about product quality - scratched surface finish",
        causalPairs: [
          {
            level: 1,
            question: "Why did this happen?",
            answer:
              "The packaging material scratched the product surface during shipping",
          },
          {
            level: 2,
            question:
              'Why did "The packaging material scratched the product surface during shipping" happen?',
            answer:
              "The protective foam padding was insufficient for the shipping distance",
          },
        ],
        rootCause:
          "The protective foam padding was insufficient for the shipping distance",
        actionItems: [
          {
            id: "3",
            description:
              "Review and upgrade packaging standards for long-distance shipping",
            assignedTo: "Quality Team",
            dueDate: new Date("2024-02-20"),
            priority: ActionPriority.HIGH,
            status: ActionStatus.IN_PROGRESS,
          },
        ],
        status: AnalysisStatus.SUBMITTED,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-16"),
        createdBy: "Sarah Johnson",
        parentObjectId: "COMP-2024-005",
        parentObjectType: "customer_complaint",
      },
    ];
  }

  protected getDisplayAnalyses(): FiveWhysAnalysis[] {
    const saved = this.savedAnalyses();
    return saved.length > 0 ? saved : this.getSampleAnalyses();
  }

  protected startNewAnalysis(): void {
    this.analysisMode.set("new");
    this.existingAnalysis.set(undefined);
    this.showAnalysis.set(true);
  }

  protected viewExistingAnalysis(analysis: FiveWhysAnalysis): void {
    this.analysisMode.set("existing");
    this.existingAnalysis.set(analysis);
    this.showAnalysis.set(true);
  }

  protected onAnalysisClose(): void {
    this.showAnalysis.set(false);
  }

  protected onAnalysisSubmitted(analysis: FiveWhysAnalysis): void {
    console.log("Analysis submitted:", analysis);
    this.loadSavedAnalyses(); // Refresh the list
    this.showAnalysis.set(false);
  }

  protected deleteAnalysis(analysisId: string, event: Event): void {
    event.stopPropagation();
    if (confirm("Are you sure you want to delete this analysis?")) {
      this.fiveWhysService.deleteAnalysis(analysisId);
      this.loadSavedAnalyses();
    }
  }

  protected exportAnalysis(analysis: FiveWhysAnalysis, event: Event): void {
    event.stopPropagation();
    const exportData = this.fiveWhysService.exportAnalysis(analysis);
    const blob = new Blob([exportData], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `5-whys-analysis-${analysis.id}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  protected loadDraft(): void {
    // The service automatically loads draft on init
    this.startNewAnalysis();
  }

  protected clearDraft(): void {
    if (confirm("Are you sure you want to clear the saved draft?")) {
      this.fiveWhysService.clearDraft();
    }
  }

  protected getStatusBadgeClasses(status: AnalysisStatus): string {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium border";
    switch (status) {
      case AnalysisStatus.DRAFT:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-300`;
      case AnalysisStatus.IN_PROGRESS:
        return `${baseClasses} bg-blue-100 text-blue-800 border-blue-300`;
      case AnalysisStatus.SUBMITTED:
        return `${baseClasses} bg-green-100 text-green-800 border-green-300`;
      case AnalysisStatus.COMPLETED:
        return `${baseClasses} bg-purple-100 text-purple-800 border-purple-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-300`;
    }
  }

  protected getStatusLabel(status: AnalysisStatus): string {
    switch (status) {
      case AnalysisStatus.DRAFT:
        return "Draft";
      case AnalysisStatus.IN_PROGRESS:
        return "In Progress";
      case AnalysisStatus.SUBMITTED:
        return "Submitted";
      case AnalysisStatus.COMPLETED:
        return "Completed";
      default:
        return "Unknown";
    }
  }

  protected formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

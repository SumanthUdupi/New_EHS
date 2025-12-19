import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FiveWhysTreeComponent } from "./five-whys-tree.component";
import { FiveWhysTreeData, FiveWhysNode } from "./five-whys-tree.models";

@Component({
  selector: "app-five-whys-tree-demo",
  standalone: true,
  imports: [CommonModule, FormsModule, FiveWhysTreeComponent],
  template: `
    <div class="demo-container">
      <div class="header">
        <h1>5 Whys Tree Analysis</h1>
        <p>
          Interactive tree visualization with parent-child relationships and
          branching.
        </p>
      </div>

      <div class="section">
        <label for="problem-statement" class="label">Problem Statement</label>
        <textarea
          id="problem-statement"
          [(ngModel)]="problemStatement"
          (input)="updateProblemStatement()"
          class="textarea"
          rows="2"
          placeholder="Describe the problem you want to analyze..."
        ></textarea>
      </div>

      <div class="section">
        <app-five-whys-tree
          [treeData]="treeData"
          [readonly]="readonly"
          (dataChange)="onDataChange($event)"
          (nodeAdded)="onNodeAdded($event)"
          (nodeRemoved)="onNodeRemoved($event)"
          (nodeUpdated)="onNodeUpdated($event)"
        ></app-five-whys-tree>
      </div>

      <div class="section controls">
        <div class="left-controls">
          <label class="checkbox">
            <input type="checkbox" [(ngModel)]="readonly" />
            <span>Read-only mode</span>
          </label>
          <button class="btn btn-danger" (click)="clearTree()">
            Clear Tree
          </button>
        </div>
        <div class="right-actions">
          <button class="btn" (click)="loadSampleData()">Load Sample</button>
          <button class="btn btn-primary" (click)="exportData()">
            Export JSON
          </button>
        </div>
      </div>

      <div class="event-log">
        <div class="event-log__header">
          <h3>Event Log</h3>
        </div>
        <div class="event-log__body">
          @if (eventLog().length === 0) {
            <p class="muted">No events yet</p>
          } @else {
            @for (event of eventLog(); track event.id) {
              <div class="event-row">
                <span>{{ event.message }}</span>
                <span class="time">{{ formatTime(event.timestamp) }}</span>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .demo-container {
        max-width: 1100px;
        margin: 0 auto;
        padding: 16px;
        font-family:
          system-ui,
          -apple-system,
          Segoe UI,
          Roboto,
          Arial,
          sans-serif;
      }
      .header {
        margin-bottom: 16px;
      }
      .header h1 {
        margin: 0 0 6px;
        font-size: 22px;
      }
      .header p {
        margin: 0;
        color: #555;
      }

      .section {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
      }
      .label {
        display: block;
        font-weight: 600;
        margin-bottom: 6px;
        color: #333;
      }
      .textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 8px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        resize: vertical;
        font: inherit;
      }
      .textarea:focus {
        outline: 2px solid #60a5fa;
        border-color: #60a5fa;
      }

      .controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .left-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .checkbox {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        user-select: none;
      }

      .btn {
        padding: 6px 10px;
        border: 1px solid #d1d5db;
        background: #f3f4f6;
        color: #111827;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }
      .btn:hover {
        background: #e5e7eb;
      }
      .btn-primary {
        background: #dbeafe;
        color: #1e40af;
        border-color: #bfdbfe;
      }
      .btn-primary:hover {
        background: #bfdbfe;
      }
      .btn-danger {
        color: #b91c1c;
        background: #fee2e2;
        border-color: #fecaca;
      }
      .btn-danger:hover {
        background: #fecaca;
      }

      .event-log {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-top: 12px;
        overflow: hidden;
      }
      .event-log__header {
        padding: 12px;
        border-bottom: 1px solid #e5e7eb;
      }
      .event-log__header h3 {
        margin: 0;
        font-size: 16px;
      }
      .event-log__body {
        max-height: 180px;
        overflow: auto;
        padding: 12px;
      }
      .muted {
        color: #6b7280;
        font-size: 14px;
      }
      .event-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 14px;
      }
      .event-row .time {
        color: #9ca3af;
        font-size: 12px;
      }

      @media (max-width: 800px) {
        .stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .controls {
          flex-direction: column;
          align-items: stretch;
        }
        .right-actions {
          display: flex;
          gap: 8px;
        }
      }
    `,
  ],
})
export class FiveWhysTreeDemoComponent {
  protected treeData = signal<FiveWhysTreeData | null>(null);
  protected readonly = false;
  protected problemStatement = "";
  protected eventLog = signal<
    Array<{ id: string; message: string; timestamp: Date }>
  >([]);

  constructor() {
    this.initializeDemo();
  }

  private initializeDemo(): void {
    const initialData: FiveWhysTreeData = {
      problemStatement:
        "Production line stopped unexpectedly during peak hours",
      rootNode: {
        id: "1",
        level: 1,
        question: "Why did this happen?",
        answer: "Machine overheated and triggered safety shutdown",
        children: [],
      },
    };

    this.treeData.set(initialData);
    this.problemStatement = initialData.problemStatement;
  }

  protected updateProblemStatement(): void {
    const current = this.treeData();
    if (current) {
      current.problemStatement = this.problemStatement;
      this.treeData.set({ ...current });
    }
  }

  protected onDataChange(data: FiveWhysTreeData): void {
    this.treeData.set(data);
    this.addEvent("Tree data updated");
  }

  protected onNodeAdded(node: FiveWhysNode): void {
    this.addEvent(`Added ${this.getOrdinalNumber(node.level)} Why node`);
  }

  protected onNodeRemoved(nodeId: string): void {
    this.addEvent(`Removed node ${nodeId}`);
  }

  protected onNodeUpdated(node: FiveWhysNode): void {
    this.addEvent(
      `Updated ${this.getOrdinalNumber(node.level)} Why ${node.isRootCause ? "(marked as root cause)" : ""}`,
    );
  }

  protected clearTree(): void {
    if (confirm("Are you sure you want to clear the entire tree?")) {
      this.treeData.set(null);
      this.problemStatement = "";
      this.addEvent("Tree cleared");
    }
  }

  protected loadSampleData(): void {
    const sampleData: FiveWhysTreeData = {
      problemStatement: "Customer complaint: Product arrived damaged",
      rootNode: {
        id: "1",
        level: 1,
        question: "Why did this happen?",
        answer: "Package was damaged during shipping",
        children: [
          {
            id: "2",
            level: 2,
            question: "Why was the package damaged during shipping?",
            answer: "Insufficient protective packaging",
            parentId: "1",
            children: [
              {
                id: "3",
                level: 3,
                question: "Why was there insufficient protective packaging?",
                answer: "Packaging guidelines not followed",
                parentId: "2",
                children: [
                  {
                    id: "4",
                    level: 4,
                    question: "Why were packaging guidelines not followed?",
                    answer: "Staff not properly trained on new guidelines",
                    parentId: "3",
                    isRootCause: true,
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            id: "5",
            level: 2,
            question: "Why was the package damaged during shipping?",
            answer: "Rough handling by shipping carrier",
            parentId: "1",
            children: [
              {
                id: "6",
                level: 3,
                question: "Why was there rough handling by shipping carrier?",
                answer: "No fragile labels on package",
                parentId: "5",
                children: [],
              },
            ],
          },
        ],
      },
    };

    this.treeData.set(sampleData);
    this.problemStatement = sampleData.problemStatement;
    this.addEvent("Sample data loaded");
  }

  protected exportData(): void {
    const data = this.treeData();
    if (data) {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `5-whys-analysis-${Date.now()}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      this.addEvent("Data exported");
    }
  }

  protected getNodeCount(): number {
    return this.countNodesRecursive(this.treeData()?.rootNode);
  }

  protected getMaxDepth(): number {
    return this.getMaxDepthRecursive(this.treeData()?.rootNode);
  }

  protected getBranchCount(): number {
    return this.countBranchesRecursive(this.treeData()?.rootNode);
  }

  protected getRootCauseCount(): number {
    return this.countRootCausesRecursive(this.treeData()?.rootNode);
  }

  private countNodesRecursive(node: FiveWhysNode | undefined): number {
    if (!node) return 0;
    return (
      1 +
      node.children.reduce(
        (sum, child) => sum + this.countNodesRecursive(child),
        0,
      )
    );
  }

  private getMaxDepthRecursive(node: FiveWhysNode | undefined): number {
    if (!node) return 0;
    const childDepths = node.children.map((child) =>
      this.getMaxDepthRecursive(child),
    );
    return (
      node.level +
      (childDepths.length > 0 ? Math.max(...childDepths) - node.level : 0)
    );
  }

  private countBranchesRecursive(node: FiveWhysNode | undefined): number {
    if (!node) return 0;
    const branches = node.children.length > 1 ? 1 : 0;
    return (
      branches +
      node.children.reduce(
        (sum, child) => sum + this.countBranchesRecursive(child),
        0,
      )
    );
  }

  private countRootCausesRecursive(node: FiveWhysNode | undefined): number {
    if (!node) return 0;
    const isRootCause = node.isRootCause ? 1 : 0;
    return (
      isRootCause +
      node.children.reduce(
        (sum, child) => sum + this.countRootCausesRecursive(child),
        0,
      )
    );
  }

  private addEvent(message: string): void {
    const newEvent = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
    };
    this.eventLog.update((events) => [newEvent, ...events.slice(0, 19)]);
  }

  protected formatTime(date: Date): string {
    return date.toLocaleTimeString();
  }

  private getOrdinalNumber(num: number): string {
    const lastTwo = num % 100;
    if (lastTwo >= 11 && lastTwo <= 13) return `${num}th`;
    switch (num % 10) {
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

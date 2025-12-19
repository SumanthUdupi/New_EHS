import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  FiveWhysNode,
  FiveWhysTreeData,
  NodePosition,
  TreeDimensions,
} from "./five-whys-tree.models";

@Component({
  selector: "app-five-whys-tree",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="five-whys-tree">
      <!-- Problem Statement Header -->
      <div class="tree-header">
        <div class="tree-header__inner">
          <h3 class="title">Problem Statement</h3>
          <div class="ps-box">
            <p>
              {{
                treeData()?.problemStatement || "Define the problem to analyze"
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- Tree Visualization Container -->
      <div class="tree-canvas" [style.min-height.px]="treeDimensions().height">
        <!-- SVG for level bands and connecting lines -->
        <svg
          class="tree-svg"
          [attr.width]="treeDimensions().width"
          [attr.height]="treeDimensions().height"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"></path>
            </marker>
          </defs>

          <!-- Level bands -->
          @for (lvl of levels(); track lvl) {
            <rect
              [attr.x]="0"
              [attr.y]="(lvl - 1) * treeDimensions().levelHeight + 10"
              [attr.width]="treeDimensions().width"
              [attr.height]="treeDimensions().levelHeight - 20"
              class="level-band"
              [attr.fill]="lvl % 2 === 0 ? '#f8fafc' : '#ffffff'"
            />
          }

          <!-- Connecting lines with halo and colored stroke -->
          @for (connection of connections(); track connection.id) {
            <path [attr.d]="connection.path" class="connector-halo"></path>
            <path
              [attr.d]="connection.path"
              class="connector-line"
              [attr.stroke]="getLevelStroke(connection.level)"
              [attr.marker-end]="
                connection.kind === 'edge' ? 'url(#arrow)' : null
              "
            ></path>
            @if (connection.kind === "edge") {
              <circle
                [attr.cx]="connection.startX"
                [attr.cy]="connection.startY"
                r="3"
                class="connector-dot"
              ></circle>
              <circle
                [attr.cx]="connection.endX"
                [attr.cy]="connection.endY"
                r="3"
                class="connector-dot"
              ></circle>
            }
          }
        </svg>

        <!-- Tree Nodes -->
        @if (treeData()?.rootNode) {
          <div class="nodes-layer">
            @for (position of nodePositions(); track position.nodeId) {
              <div
                class="node-wrap"
                [style.left.px]="position.x"
                [style.top.px]="position.y"
                [style.width.px]="treeDimensions().nodeWidth"
              >
                @for (node of [getNodeById(position.nodeId)]; track node?.id) {
                  @if (node) {
                    <div class="node-card" [class]="getNodeClasses(node)">
                      <!-- Node Header -->
                      <div class="node-header">
                        <div class="node-title">
                          <div
                            class="level-badge"
                            [class]="getLevelBadgeClasses(node.level)"
                          >
                            {{ node.level }}
                          </div>
                          <span class="why-label"
                            >{{ getOrdinalNumber(node.level) }} Why?</span
                          >
                        </div>
                        <div class="node-actions">
                          @if (!node.isRootCause && canAddChild(node)) {
                            <button
                              (click)="addChildNode(node.id)"
                              class="icon-btn"
                              title="Add child node"
                            >
                              <svg
                                class="icon"
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
                            </button>
                          }
                          @if (node.parentId) {
                            <button
                              (click)="removeNode(node.id)"
                              class="icon-btn danger"
                              title="Remove node"
                            >
                              <svg
                                class="icon"
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
                          }
                        </div>
                      </div>

                      <div class="question">
                        <p>{{ node.question }}</p>
                      </div>

                      <div class="answer">
                        @if (editingNodeId() === node.id) {
                          <textarea
                            [(ngModel)]="editingAnswer"
                            (blur)="saveAnswer(node.id)"
                            (keydown.enter)="saveAnswer(node.id)"
                            (keydown.escape)="cancelEdit()"
                            rows="2"
                            placeholder="Enter the answer..."
                            class="answer-input"
                          ></textarea>
                        } @else {
                          <div
                            (click)="startEdit(node.id, node.answer)"
                            class="answer-display"
                          >
                            {{ node.answer || "Click to add answer..." }}
                          </div>
                        }
                      </div>

                      <div class="root-toggle" [class.disabled]="!node.answer">
                        <input
                          type="checkbox"
                          [id]="'root-cause-' + node.id"
                          [checked]="!!node.isRootCause"
                          (change)="toggleRootCause(node.id)"
                          [disabled]="readonly || !node.answer"
                        />
                        <label [for]="'root-cause-' + node.id"
                          >Mark as Root Cause</label
                        >
                      </div>

                      @if (node.children.length > 0) {
                        <div class="children-count">
                          <span
                            >{{ node.children.length }} child
                            {{
                              node.children.length === 1 ? "node" : "nodes"
                            }}</span
                          >
                        </div>
                      }
                    </div>
                  }
                }
              </div>
            }
          </div>
        }

        <!-- Empty State -->
        @if (!treeData()?.rootNode) {
          <div class="empty">
            <svg
              class="empty-icon"
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
            <p>Start by defining your problem statement</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .five-whys-tree {
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: auto;
      }
      .tree-header {
        position: sticky;
        top: 0;
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
        z-index: 10;
      }
      .tree-header__inner {
        max-width: 880px;
        margin: 0 auto;
        padding: 12px;
      }
      .title {
        margin: 0 0 6px;
        font-size: 16px;
        font-weight: 600;
        color: #111827;
      }
      .ps-box {
        background: #eff6ff;
        border-left: 4px solid #60a5fa;
        padding: 8px 12px;
        border-radius: 4px;
      }
      .ps-box p {
        margin: 0;
        color: #1d4ed8;
      }

      .tree-canvas {
        position: relative;
        padding: 16px;
      }
      .tree-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
      }
      .level-band {
        opacity: 0.6;
      }
      .connector-halo {
        stroke: #ffffff;
        stroke-width: 6;
        fill: none;
        opacity: 0.9;
        stroke-linecap: round;
      }
      .connector-line {
        stroke: #64748b;
        stroke-width: 2.5;
        fill: none;
        opacity: 0.95;
        stroke-linecap: round;
      }
      .connector-dot {
        fill: #94a3b8;
        opacity: 0.9;
      }
      .tree-svg {
        shape-rendering: geometricPrecision;
      }

      .nodes-layer {
        position: relative;
        z-index: 1;
      }
      .node-wrap {
        position: absolute;
        transition:
          left 0.3s ease,
          top 0.3s ease;
      }

      .node-card {
        background: #fff;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
        padding: 12px;
        transition:
          box-shadow 0.2s ease,
          transform 0.2s ease;
      }
      .node-card:hover {
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
      }

      .node-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .node-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .level-badge {
        width: 24px;
        height: 24px;
        border-radius: 9999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        color: #fff;
      }
      .why-label {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }

      .icon-btn {
        width: 24px;
        height: 24px;
        border-radius: 9999px;
        background: #ecfdf5;
        color: #059669;
        border: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .icon-btn:hover {
        background: #d1fae5;
      }
      .icon-btn.danger {
        background: #fee2e2;
        color: #b91c1c;
      }
      .icon-btn.danger:hover {
        background: #fecaca;
      }
      .icon {
        width: 12px;
        height: 12px;
      }

      .question p {
        margin: 0;
        font-size: 13px;
        color: #4b5563;
        font-weight: 600;
      }
      .answer {
        margin-top: 6px;
      }
      .answer-display {
        min-height: 32px;
        padding: 6px 8px;
        font-size: 13px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        cursor: text;
      }
      .answer-display:hover {
        background: #f3f4f6;
      }
      .answer-input {
        width: 100%;
        padding: 6px 8px;
        font-size: 13px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        resize: none;
        font-family: inherit;
      }
      .answer-input:focus {
        outline: 2px solid #93c5fd;
        border-color: #93c5fd;
      }

      .root-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
        font-size: 12px;
        color: #6b7280;
      }
      .root-toggle.disabled {
        opacity: 0.6;
      }

      .children-count {
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid #f3f4f6;
        font-size: 12px;
        color: #6b7280;
      }

      .node-level-1 {
        border-color: #3b82f6;
      }
      .node-level-2 {
        border-color: #10b981;
      }
      .node-level-3 {
        border-color: #f59e0b;
      }
      .node-level-4 {
        border-color: #ef4444;
      }
      .node-level-5 {
        border-color: #8b5cf6;
      }

      .node-root-cause {
        border-color: #dc2626 !important;
        background-color: #fef2f2;
      }

      textarea:focus {
        outline: none;
      }

      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 256px;
        gap: 8px;
        color: #6b7280;
      }
      .empty-icon {
        width: 48px;
        height: 48px;
        color: #9ca3af;
      }
    `,
  ],
})
export class FiveWhysTreeComponent {
  @Input() treeData = signal<FiveWhysTreeData | null>(null);
  @Input() readonly: boolean = false;
  @Output() dataChange = new EventEmitter<FiveWhysTreeData>();
  @Output() nodeAdded = new EventEmitter<FiveWhysNode>();
  @Output() nodeRemoved = new EventEmitter<string>();
  @Output() nodeUpdated = new EventEmitter<FiveWhysNode>();

  // Internal state
  protected editingNodeId = signal<string | null>(null);
  protected editingAnswer = "";

  // Tree layout calculations
  protected treeDimensions = computed(() => this.calculateTreeDimensions());
  protected nodePositions = computed(() => this.calculateNodePositions());
  protected connections = computed(() => this.calculateConnections());
  protected levels = computed(() =>
    Array.from({ length: this.getMaxLevel() }, (_, i) => i + 1),
  );

  protected getLevelStroke(level: number): string {
    const colors = [
      "#9ca3af",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
    ]; // default + levels 1..5
    return colors[level] || "#9ca3af";
  }

  constructor() {
    // Initialize with default structure if no data provided
    effect(() => {
      if (!this.treeData()) {
        this.initializeDefaultTree();
      }
    });
  }

  private initializeDefaultTree(): void {
    const rootNode: FiveWhysNode = {
      id: this.generateId(),
      level: 1,
      question: "Why did this happen?",
      answer: "",
      children: [],
    };

    const defaultData: FiveWhysTreeData = {
      problemStatement: "",
      rootNode,
    };

    this.treeData.set(defaultData);
  }

  protected addChildNode(parentId: string): void {
    if (this.readonly) return;
    const parentNode = this.getNodeById(parentId);
    if (!parentNode) return;
    // Only 1st Why can have multiple children; 2nd+ can have at most one
    if (parentNode.level >= 2 && parentNode.children.length >= 1) return;

    const newNode: FiveWhysNode = {
      id: this.generateId(),
      level: parentNode.level + 1,
      question: this.generateQuestionForLevel(
        parentNode.level + 1,
        parentNode.answer,
      ),
      answer: "",
      parentId: parentId,
      children: [],
    };

    parentNode.children.push(newNode);
    this.touchTree();
    this.emitDataChange();
    this.nodeAdded.emit(newNode);

    // Start editing the new node
    setTimeout(() => this.startEdit(newNode.id, ""), 0);
  }

  protected removeNode(nodeId: string): void {
    if (this.readonly) return;
    if (this.removeNodeRecursive(this.treeData()?.rootNode, nodeId)) {
      this.touchTree();
      this.emitDataChange();
      this.nodeRemoved.emit(nodeId);
    }
  }

  private removeNodeRecursive(
    node: FiveWhysNode | undefined,
    nodeId: string,
  ): boolean {
    if (!node) return false;

    const childIndex = node.children.findIndex((child) => child.id === nodeId);
    if (childIndex >= 0) {
      node.children.splice(childIndex, 1);
      return true;
    }

    return node.children.some((child) =>
      this.removeNodeRecursive(child, nodeId),
    );
  }

  protected startEdit(nodeId: string, currentAnswer: string): void {
    if (this.readonly) return;
    this.editingNodeId.set(nodeId);
    this.editingAnswer = currentAnswer;
  }

  protected saveAnswer(nodeId: string): void {
    if (this.readonly) return;
    const node = this.getNodeById(nodeId);
    if (node) {
      node.answer = this.editingAnswer.trim();

      // Update children questions if answer changed
      this.updateChildrenQuestions(node);

      this.touchTree();
      this.emitDataChange();
      this.nodeUpdated.emit(node);
    }

    this.cancelEdit();
  }

  protected cancelEdit(): void {
    this.editingNodeId.set(null);
    this.editingAnswer = "";
  }

  protected toggleRootCause(nodeId: string): void {
    if (this.readonly) return;
    const node = this.getNodeById(nodeId);
    if (node) {
      // Clear other root causes in the tree
      this.clearAllRootCauses(this.treeData()?.rootNode);

      node.isRootCause = !node.isRootCause;
      this.touchTree();
      this.emitDataChange();
      this.nodeUpdated.emit(node);
    }
  }

  private clearAllRootCauses(node: FiveWhysNode | undefined): void {
    if (!node) return;

    node.isRootCause = false;
    node.children.forEach((child) => this.clearAllRootCauses(child));
  }

  protected getNodeById(nodeId: string): FiveWhysNode | null {
    return this.findNodeRecursive(this.treeData()?.rootNode, nodeId);
  }

  private findNodeRecursive(
    node: FiveWhysNode | undefined,
    nodeId: string,
  ): FiveWhysNode | null {
    if (!node) return null;
    if (node.id === nodeId) return node;

    for (const child of node.children) {
      const found = this.findNodeRecursive(child, nodeId);
      if (found) return found;
    }

    return null;
  }

  private updateChildrenQuestions(parentNode: FiveWhysNode): void {
    parentNode.children.forEach((child) => {
      child.question = this.generateQuestionForLevel(
        child.level,
        parentNode.answer,
      );
      this.updateChildrenQuestions(child);
    });
  }

  private generateQuestionForLevel(
    level: number,
    parentAnswer: string,
  ): string {
    if (level === 1) return "Why did this happen?";
    if (parentAnswer) {
      return `Why did "${parentAnswer}" happen?`;
    }
    return `Why did this happen? (Level ${level})`;
  }

  protected getOrdinalNumber(num: number): string {
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

  protected getNodeClasses(node: FiveWhysNode): string {
    let classes = `node-level-${node.level}`;
    if (node.isRootCause) {
      classes += " node-root-cause";
    }
    return classes;
  }

  protected getLevelBadgeClasses(level: number): string {
    const colors = [
      "",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
    ];
    return colors[level] || "bg-gray-500";
  }

  private calculateTreeDimensions(): TreeDimensions {
    const nodeWidth = 300;
    const nodeHeight = 160;
    const levelHeight = 200;

    const totalWidth = this.getSubtreeWidth(
      this.treeData()?.rootNode,
      nodeWidth,
      40,
    );
    const maxLevel = this.getMaxLevel();

    return {
      width: Math.max(900, totalWidth + 100),
      height: Math.max(500, maxLevel * levelHeight + 100),
      nodeWidth,
      nodeHeight,
      levelHeight,
    } as TreeDimensions;
  }

  private calculateNodePositions(): NodePosition[] {
    const positions: NodePosition[] = [];
    const dimensions = this.treeDimensions();
    const root = this.treeData()?.rootNode;
    if (root) {
      const totalWidth = this.getSubtreeWidth(root, dimensions.nodeWidth, 40);
      const left = (dimensions.width - totalWidth) / 2;
      this.calculateNodePositionsRecursive(
        root,
        positions,
        left,
        20,
        dimensions,
        40,
      );
    }
    return positions;
  }

  private calculateNodePositionsRecursive(
    node: FiveWhysNode,
    positions: NodePosition[],
    left: number,
    top: number,
    dimensions: TreeDimensions,
    gap: number,
  ): number {
    const subtreeWidth = this.getSubtreeWidth(node, dimensions.nodeWidth, gap);
    const nodeX = left + (subtreeWidth - dimensions.nodeWidth) / 2;

    positions.push({ nodeId: node.id, x: nodeX, y: top, level: node.level });

    if (node.children.length === 0) return left + subtreeWidth;

    let currentLeft = left;
    node.children.forEach((child, index) => {
      const childWidth = this.getSubtreeWidth(child, dimensions.nodeWidth, gap);
      this.calculateNodePositionsRecursive(
        child,
        positions,
        currentLeft,
        top + dimensions.levelHeight,
        dimensions,
        gap,
      );
      currentLeft += childWidth + gap;
    });

    return left + subtreeWidth;
  }

  private calculateConnections(): Array<{
    id: string;
    path: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    level: number;
    kind: "edge" | "bus" | "trunk";
  }> {
    const connections: Array<{
      id: string;
      path: string;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      level: number;
      kind: "edge" | "bus" | "trunk";
    }> = [];
    const positions = this.nodePositions();
    const dimensions = this.treeDimensions();

    const root = this.treeData()?.rootNode;
    if (root) {
      this.calculateConnectionsRecursive(
        root,
        positions,
        dimensions,
        connections,
      );
    }

    return connections;
  }

  private calculateConnectionsRecursive(
    node: FiveWhysNode,
    positions: NodePosition[],
    dimensions: TreeDimensions,
    connections: Array<{
      id: string;
      path: string;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      level: number;
      kind: "edge" | "bus" | "trunk";
    }>,
  ): void {
    const nodePos = positions.find((p) => p.nodeId === node.id);
    if (!nodePos) return;

    if (node.children.length === 0) return;

    const busY =
      nodePos.y +
      dimensions.nodeHeight +
      (dimensions.levelHeight - dimensions.nodeHeight) / 2;

    // Compute ends for children
    const childPositions = node.children
      .map((c) => ({ c, pos: positions.find((p) => p.nodeId === c.id) }))
      .filter((x): x is { c: FiveWhysNode; pos: NodePosition } => !!x.pos);

    if (childPositions.length === 0) return;

    const startX = nodePos.x + dimensions.nodeWidth / 2;
    const startY = nodePos.y + dimensions.nodeHeight;
    const minX = Math.min(
      ...childPositions.map(({ pos }) => pos.x + dimensions.nodeWidth / 2),
    );
    const maxX = Math.max(
      ...childPositions.map(({ pos }) => pos.x + dimensions.nodeWidth / 2),
    );

    // Trunk from parent to bus
    connections.push({
      id: `${node.id}-trunk`,
      path: `M ${startX} ${startY} L ${startX} ${busY}`,
      startX,
      startY,
      endX: startX,
      endY: busY,
      level: node.level + 1,
      kind: "trunk",
    });

    // Bus line across children
    connections.push({
      id: `${node.id}-bus`,
      path: `M ${minX} ${busY} L ${maxX} ${busY}`,
      startX: minX,
      startY: busY,
      endX: maxX,
      endY: busY,
      level: node.level + 1,
      kind: "bus",
    });

    // Drops from bus to each child
    childPositions.forEach(({ c, pos }) => {
      const endX = pos.x + dimensions.nodeWidth / 2;
      const endY = pos.y;
      const path = `M ${endX} ${busY} L ${endX} ${endY}`;
      connections.push({
        id: `${node.id}-${c.id}`,
        path,
        startX: endX,
        startY: busY,
        endX,
        endY,
        level: c.level,
        kind: "edge",
      });
    });

    node.children.forEach((child) =>
      this.calculateConnectionsRecursive(
        child,
        positions,
        dimensions,
        connections,
      ),
    );
  }

  private getMaxLevel(): number {
    return this.getMaxLevelRecursive(this.treeData()?.rootNode) || 1;
  }

  private getMaxLevelRecursive(node: FiveWhysNode | undefined): number {
    if (!node) return 0;

    let maxLevel = node.level;
    node.children.forEach((child) => {
      maxLevel = Math.max(maxLevel, this.getMaxLevelRecursive(child));
    });

    return maxLevel;
  }

  private getMaxNodesAtAnyLevel(): number {
    const levelCounts = new Map<number, number>();
    this.countNodesAtLevels(this.treeData()?.rootNode, levelCounts);
    return Math.max(1, ...Array.from(levelCounts.values()));
  }

  private getSubtreeWidth(
    node: FiveWhysNode | undefined,
    nodeWidth: number,
    gap: number,
  ): number {
    if (!node) return 0;
    if (!node.children || node.children.length === 0) return nodeWidth;
    const widths = node.children.map((c) =>
      this.getSubtreeWidth(c, nodeWidth, gap),
    );
    const sum = widths.reduce((a, b) => a + b, 0);
    const gaps = gap * Math.max(0, node.children.length - 1);
    return Math.max(nodeWidth, sum + gaps);
  }

  // no-op retained (unused); bus built with straight segments

  private countNodesAtLevels(
    node: FiveWhysNode | undefined,
    levelCounts: Map<number, number>,
  ): void {
    if (!node) return;

    levelCounts.set(node.level, (levelCounts.get(node.level) || 0) + 1);
    node.children.forEach((child) =>
      this.countNodesAtLevels(child, levelCounts),
    );
  }

  private emitDataChange(): void {
    if (this.treeData()) {
      this.dataChange.emit(this.treeData()!);
    }
  }

  private touchTree(): void {
    if (this.treeData()) {
      const current = this.treeData()!;
      this.treeData.set({ ...current });
    }
  }

  protected canAddChild(node: FiveWhysNode): boolean {
    if (this.readonly) return false;
    if (node.level === 1) return true;
    return node.children.length === 0;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

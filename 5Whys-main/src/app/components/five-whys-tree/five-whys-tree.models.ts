export interface FiveWhysNode {
  id: string;
  level: number;
  question: string;
  answer: string;
  parentId?: string;
  children: FiveWhysNode[];
  isRootCause?: boolean;
  position?: {
    x: number;
    y: number;
  };
}

export interface FiveWhysTreeData {
  problemStatement: string;
  rootNode: FiveWhysNode;
}

export interface NodePosition {
  nodeId: string;
  x: number;
  y: number;
  level: number;
}

export interface TreeDimensions {
  width: number;
  height: number;
  nodeWidth: number;
  nodeHeight: number;
  levelHeight: number;
}

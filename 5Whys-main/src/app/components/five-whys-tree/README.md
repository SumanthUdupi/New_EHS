# 5 Whys Tree Component

A standalone Angular component for interactive 5 Whys root cause analysis with tree visualization, parent-child relationships, and branching capabilities.

## Features

- **Tree Structure**: Visual representation of parent-child relationships
- **Multiple Branches**: Each "Why" can have multiple answers/branches
- **Interactive Editing**: Click to edit answers inline
- **Root Cause Marking**: Mark nodes as root causes
- **Responsive Layout**: Automatically adjusts to tree size
- **SVG Connections**: Visual lines connecting parent and child nodes
- **Level Limits**: Respects the 5 Why methodology (max 5 levels)
- **Export/Import**: JSON data format for persistence

## Usage

### Basic Implementation

```typescript
import { FiveWhysTreeComponent } from "./components/five-whys-tree/five-whys-tree.component";

@Component({
  selector: "my-component",
  imports: [FiveWhysTreeComponent],
  template: `
    <app-five-whys-tree
      [treeData]="myTreeData"
      [readonly]="false"
      (dataChange)="onTreeDataChange($event)"
      (nodeAdded)="onNodeAdded($event)"
      (nodeRemoved)="onNodeRemoved($event)"
      (nodeUpdated)="onNodeUpdated($event)"
    />
  `,
})
export class MyComponent {
  myTreeData: FiveWhysTreeData = {
    problemStatement: "Your problem description",
    rootNode: {
      id: "1",
      level: 1,
      question: "Why did this happen?",
      answer: "",
      children: [],
    },
  };

  onTreeDataChange(data: FiveWhysTreeData) {
    this.myTreeData = data;
    // Save to your backend/storage
  }
}
```

### Data Structure

```typescript
interface FiveWhysTreeData {
  problemStatement: string;
  rootNode: FiveWhysNode;
}

interface FiveWhysNode {
  id: string;
  level: number; // 1-5
  question: string; // Auto-generated based on parent answer
  answer: string; // User input
  parentId?: string; // Reference to parent node
  children: FiveWhysNode[]; // Array of child nodes
  isRootCause?: boolean; // Mark as root cause
}
```

## Component API

### Inputs

| Property   | Type                               | Default | Description                  |
| ---------- | ---------------------------------- | ------- | ---------------------------- |
| `treeData` | `Signal<FiveWhysTreeData \| null>` | `null`  | The tree data structure      |
| `readonly` | `Signal<boolean>`                  | `false` | Disable editing capabilities |

### Outputs

| Event         | Type               | Description                             |
| ------------- | ------------------ | --------------------------------------- |
| `dataChange`  | `FiveWhysTreeData` | Emitted when tree structure changes     |
| `nodeAdded`   | `FiveWhysNode`     | Emitted when a new node is added        |
| `nodeRemoved` | `string`           | Emitted when a node is removed (nodeId) |
| `nodeUpdated` | `FiveWhysNode`     | Emitted when a node is updated          |

## Interactive Features

### Adding Nodes

- Click the green "+" button on any node to add a child
- Maximum 5 levels supported
- Questions auto-generate based on parent answers

### Editing Answers

- Click on any answer field to edit inline
- Press Enter or click away to save
- Press Escape to cancel editing

### Root Cause Marking

- Check "Root Cause" checkbox on level 3+ nodes
- Only one root cause allowed per tree
- Visually highlighted with red styling

### Removing Nodes

- Click the red "×" button to remove a node
- Removes the node and all its children
- Root node cannot be removed

## Styling

The component uses Tailwind CSS classes and can be customized by:

1. **CSS Custom Properties**: Override colors and spacing
2. **Tailwind Classes**: Modify existing classes in the template
3. **CSS Injection**: Add custom styles for specific elements

### Color Coding

- **Level 1**: Blue border (`border-blue-500`)
- **Level 2**: Green border (`border-green-500`)
- **Level 3**: Yellow border (`border-yellow-500`)
- **Level 4**: Red border (`border-red-500`)
- **Level 5**: Purple border (`border-purple-500`)
- **Root Cause**: Red background (`bg-red-50`)

## Example Implementation

See `five-whys-tree-demo.component.ts` for a complete example with:

- Problem statement input
- Event logging
- Statistics display
- Sample data loading
- JSON export functionality

## Integration Notes

This component is designed to be:

- **Framework Agnostic**: Easy to port to other frameworks
- **Standalone**: No external dependencies except Angular core
- **Lightweight**: Minimal bundle size impact
- **Accessible**: Keyboard and screen reader friendly
- **Mobile Friendly**: Touch-enabled interactions

## Browser Support

- Modern browsers with ES2020+ support
- Chrome 88+, Firefox 78+, Safari 14+, Edge 88+

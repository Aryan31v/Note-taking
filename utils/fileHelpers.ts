import { KnowledgeNode } from '../types';

// Secure ID generator using crypto API
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Recursive function to update a node in the tree
export const updateNodeInTree = (
  nodes: KnowledgeNode[], 
  nodeId: string, 
  updates: Partial<KnowledgeNode>
): KnowledgeNode[] => {
  return nodes.map(node => {
    if (node.id === nodeId) {
      return { ...node, ...updates, updatedAt: Date.now() };
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: updateNodeInTree(node.children, nodeId, updates)
      };
    }
    return node;
  });
};

// Recursive function to add a child
export const addChildToNode = (
  nodes: KnowledgeNode[],
  parentId: string | null,
  newNode: KnowledgeNode
): KnowledgeNode[] => {
  if (parentId === null) {
    return [...nodes, newNode];
  }
  return nodes.map(node => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...node.children, newNode],
        updatedAt: Date.now()
      };
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: addChildToNode(node.children, parentId, newNode)
      };
    }
    return node;
  });
};

// Find a node by ID
export const findNode = (nodes: KnowledgeNode[], id: string): KnowledgeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children.length > 0) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Find a child node by title within a specific parent context
export const findChildByTitle = (
  nodes: KnowledgeNode[], 
  parentId: string | null, 
  title: string
): KnowledgeNode | null => {
  // If parentId is null, search root level
  if (parentId === null) {
    return nodes.find(n => n.parentId === null && n.title === title) || null;
  }
  
  const parent = findNode(nodes, parentId);
  if (!parent) return null;
  
  return parent.children.find(child => child.title === title) || null;
};

// Delete a node and its children
export const deleteNodeFromTree = (nodes: KnowledgeNode[], nodeId: string): KnowledgeNode[] => {
  return nodes
    .filter(node => node.id !== nodeId)
    .map(node => {
      if (node.children.length > 0) {
        return {
          ...node,
          children: deleteNodeFromTree(node.children, nodeId)
        };
      }
      return node;
    });
};

// Deeply duplicate a node
const deepCloneWithNewIds = (node: KnowledgeNode): KnowledgeNode => {
  const newId = generateId();
  return {
    ...node,
    id: newId,
    title: `${node.title} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    children: node.children.map(deepCloneWithNewIds)
  };
};

export const duplicateNodeInTree = (nodes: KnowledgeNode[], nodeId: string): KnowledgeNode[] => {
  return nodes.reduce((acc: KnowledgeNode[], node) => {
    if (node.id === nodeId) {
      const clone = deepCloneWithNewIds(node);
      return [...acc, node, clone];
    }
    if (node.children.length > 0) {
      return [...acc, { ...node, children: duplicateNodeInTree(node.children, nodeId) }];
    }
    return [...acc, node];
  }, []);
};

// Move a node to a new parent (Drag & Drop)
export const moveNodeInTree = (
  nodes: KnowledgeNode[],
  nodeId: string,
  newParentId: string | null
): KnowledgeNode[] => {
  const nodeToMove = findNode(nodes, nodeId);
  if (!nodeToMove) return nodes;

  if (newParentId) {
    let checkNode = findNode(nodes, newParentId);
    const isChildOfMovingNode = (parent: KnowledgeNode, targetId: string): boolean => {
      if (parent.id === targetId) return true;
      return parent.children.some(child => isChildOfMovingNode(child, targetId));
    };
    
    if (nodeToMove.type === 'folder' && isChildOfMovingNode(nodeToMove, newParentId)) {
      console.warn("Cannot move folder into its own child");
      return nodes;
    }
  }

  const nodesWithoutMoved = deleteNodeFromTree(nodes, nodeId);
  const updatedNode = { ...nodeToMove, parentId: newParentId };
  return addChildToNode(nodesWithoutMoved, newParentId, updatedNode);
};

// Flatten tree for statistics
export const flattenNodes = (nodes: KnowledgeNode[]): KnowledgeNode[] => {
  let flat: KnowledgeNode[] = [];
  nodes.forEach(node => {
    flat.push(node);
    if (node.children.length > 0) {
      flat = flat.concat(flattenNodes(node.children));
    }
  });
  return flat;
};

// SEARCH HELPERS
export interface SearchResult {
  node: KnowledgeNode;
  path: string;
}

export const flattenNodesWithBreadcrumbs = (nodes: KnowledgeNode[], parentPath: string = ''): SearchResult[] => {
  let flat: SearchResult[] = [];
  nodes.forEach(node => {
    // Don't repeat the parent path if it's empty
    const currentPath = parentPath ? `${parentPath} / ${node.title || 'Untitled'}` : (node.title || 'Untitled');
    
    // We add the current node with its *Parent's* path context
    flat.push({ node, path: parentPath });
    
    if (node.children.length > 0) {
      flat = flat.concat(flattenNodesWithBreadcrumbs(node.children, currentPath));
    }
  });
  return flat;
};

export const searchNodes = (nodes: KnowledgeNode[], query: string): SearchResult[] => {
  if (!query) return [];
  const lowerQ = query.toLowerCase();
  const all = flattenNodesWithBreadcrumbs(nodes);
  return all.filter(({ node }) => 
    (node.title && node.title.toLowerCase().includes(lowerQ)) || 
    (node.content && node.content.toLowerCase().includes(lowerQ))
  );
};

// LINKING HELPERS
export const findNodeByTitle = (nodes: KnowledgeNode[], title: string): KnowledgeNode | undefined => {
  const all = flattenNodes(nodes);
  return all.find(n => n.title.toLowerCase() === title.toLowerCase());
};

export const findBacklinks = (targetTitle: string, nodes: KnowledgeNode[]): KnowledgeNode[] => {
  if (!targetTitle) return [];
  const all = flattenNodes(nodes);
  const regex = new RegExp(`\\[\\[${targetTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'i');
  return all.filter(n => n.content && regex.test(n.content));
};

// Generate Obsidian-compatible Markdown
export const generateMarkdown = (node: KnowledgeNode): string => {
  const frontmatter = [
    '---',
    `id: ${node.id}`,
    `title: ${node.title}`,
    `type: ${node.type}`,
    `created: ${new Date(node.createdAt).toISOString()}`,
    `updated: ${new Date(node.updatedAt).toISOString()}`,
    `tags: [${node.tags.join(', ')}]`,
    node.completed !== undefined ? `completed: ${node.completed}` : '',
    node.priority ? `priority: ${node.priority}` : '',
    node.dueDate ? `due: ${node.dueDate}` : '',
    '---',
    '',
    `# ${node.title}`,
    '',
    node.content
  ].filter(line => line !== '').join('\n');

  return frontmatter;
};

export const downloadMarkdown = (node: KnowledgeNode) => {
  const markdown = generateMarkdown(node);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${node.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
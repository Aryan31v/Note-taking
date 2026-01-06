export type NodeType = 'folder' | 'note' | 'todo' | 'session';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
}

export interface KnowledgeNode {
  id: string;
  parentId: string | null;
  type: NodeType;
  title: string;
  content: string; // Markdown content
  children: KnowledgeNode[];
  completed?: boolean; // For to-dos
  createdAt: number;
  updatedAt: number;
  tags: string[];
  sessionDuration?: number; // In seconds, for session types
  
  // Todo Specific Fields
  priority?: Priority;
  dueDate?: string; // ISO Date YYYY-MM-DD
  dueTime?: string; // HH:MM
  completedAt?: number;
  estimatedMinutes?: number;
  actualMinutes?: number;
  subtasks?: Subtask[];
  notes?: string; // Extra context for todo
  recurring?: RecurringConfig;
}

export interface SessionData {
  isActive: boolean;
  startTime: number | null;
  elapsed: number; // seconds
  linkedNodeId: string | null; // The project/topic being learned
}

export interface AppState {
  nodes: KnowledgeNode[];
  activeNodeId: string | null;
  expandedNodeIds: string[];
  sidebarOpen: boolean;
  currentView: 'dashboard' | 'browser' | 'search' | 'todos';
  session: SessionData;
  theme: 'light' | 'dark';
  searchQuery: string; 
}
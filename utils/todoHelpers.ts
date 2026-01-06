import { KnowledgeNode, Priority } from '../types';
import { flattenNodes } from './fileHelpers';

// Extract all todos from the tree
export const getAllTodos = (nodes: KnowledgeNode[]): KnowledgeNode[] => {
  return flattenNodes(nodes).filter(node => node.type === 'todo');
};

// Filter Types
export type FilterType = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'no-date';

export const filterTodos = (todos: KnowledgeNode[], filter: FilterType): KnowledgeNode[] => {
  const today = new Date().toISOString().split('T')[0];
  
  switch (filter) {
    case 'all':
      return todos.filter(t => !t.completed);
    case 'completed':
      return todos.filter(t => t.completed);
    case 'today':
      return todos.filter(t => !t.completed && t.dueDate === today);
    case 'overdue':
      return todos.filter(t => !t.completed && t.dueDate && t.dueDate < today);
    case 'upcoming':
      return todos.filter(t => !t.completed && t.dueDate && t.dueDate > today);
    case 'no-date':
      return todos.filter(t => !t.completed && !t.dueDate);
    default:
      return todos;
  }
};

// Sort Helper
export const sortTodos = (todos: KnowledgeNode[], sortBy: 'priority' | 'date' | 'created'): KnowledgeNode[] => {
  const priorityWeight = (p?: Priority) => {
    switch(p) {
        case 'urgent': return 4;
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 0;
    }
  };

  return [...todos].sort((a, b) => {
    if (sortBy === 'priority') {
      const weightDiff = priorityWeight(b.priority) - priorityWeight(a.priority);
      if (weightDiff !== 0) return weightDiff;
      // Secondary sort by date
      return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
    }
    if (sortBy === 'date') {
      const dateA = a.dueDate || '9999-99-99';
      const dateB = b.dueDate || '9999-99-99';
      return dateA.localeCompare(dateB);
    }
    if (sortBy === 'created') {
      return b.createdAt - a.createdAt;
    }
    return 0;
  });
};

export const getTodoStats = (todos: KnowledgeNode[]) => {
  const today = new Date().toISOString().split('T')[0];
  return {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    overdue: todos.filter(t => !t.completed && t.dueDate && t.dueDate < today).length,
    today: todos.filter(t => !t.completed && t.dueDate === today).length
  };
};
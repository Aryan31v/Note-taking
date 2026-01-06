import { KnowledgeNode } from './types';

export const INITIAL_NODES: KnowledgeNode[] = [
  {
    id: 'root-1',
    parentId: null,
    type: 'folder',
    title: 'My Projects',
    content: '',
    children: [
      {
        id: 'p-1',
        parentId: 'root-1',
        type: 'folder',
        title: 'Learn React Native',
        content: '# Learning Plan\nGoal is to build a mobile app.',
        children: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['coding', 'mobile']
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: []
  },
  {
    id: 'root-2',
    parentId: null,
    type: 'folder',
    title: 'Inbox',
    content: '',
    children: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: []
  }
];
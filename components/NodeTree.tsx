import React, { useState, useRef, useEffect } from 'react';
import { KnowledgeNode } from '../types';
import { Icons } from './Icon';

interface NodeTreeProps {
  nodes: KnowledgeNode[];
  activeNodeId: string | null;
  expandedNodeIds: string[];
  onNodeClick: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onAction: (action: 'rename' | 'delete' | 'duplicate', nodeId: string) => void;
  onMove?: (nodeId: string, targetId: string | null) => void;
  level?: number;
}

const NodeTree: React.FC<NodeTreeProps> = ({ 
  nodes, 
  activeNodeId, 
  expandedNodeIds, 
  onNodeClick, 
  onToggleExpand,
  onAction,
  onMove,
  level = 0
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.setData('application/react-dnd-node-id', nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, node: KnowledgeNode) => {
    e.preventDefault();
    if (node.type === 'folder') {
      setDragOverId(node.id);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetNode: KnowledgeNode) => {
    e.preventDefault();
    setDragOverId(null);
    const draggedId = e.dataTransfer.getData('application/react-dnd-node-id');
    
    if (draggedId && draggedId !== targetNode.id && onMove) {
      if (targetNode.type === 'folder') {
        onMove(draggedId, targetNode.id);
      }
    }
  };

  if (!nodes || nodes.length === 0) return null;

  return (
    <div className="flex flex-col">
      {nodes
        .filter(node => node.type !== 'todo') // Filter out todos from knowledge tree
        .map(node => {
        const isExpanded = expandedNodeIds.includes(node.id);
        const isActive = activeNodeId === node.id;
        const hasChildren = node.children && node.children.some(c => c.type !== 'todo'); // Only show expand if non-todo children exist
        const isMenuOpen = openMenuId === node.id;
        const isDragOver = dragOverId === node.id;

        const getIcon = () => {
          switch (node.type) {
            case 'folder': return <Icons.Folder size={16} className={isActive ? 'text-inherit' : 'text-gray-400'} />;
            case 'session': return <Icons.Clock size={16} className={isActive ? 'text-inherit' : 'text-gray-400'} />;
            default: return <Icons.FileText size={16} className={isActive ? 'text-inherit' : 'text-gray-400'} />;
          }
        };

        return (
          <div key={node.id} className="select-none relative group">
            <div 
              draggable
              onDragStart={(e) => handleDragStart(e, node.id)}
              onDragOver={(e) => handleDragOver(e, node)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, node)}
              className={`
                flex items-center py-1.5 px-2 cursor-pointer transition-all duration-150 rounded-md mx-2
                ${isActive 
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-900'
                }
                ${isDragOver ? 'ring-2 ring-black dark:ring-white' : ''}
              `}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              onClick={(e) => {
                e.stopPropagation();
                onNodeClick(node.id);
              }}
            >
              <button 
                className={`mr-1 p-0.5 rounded hover:bg-white/20 dark:hover:bg-black/20 ${hasChildren ? 'visible' : 'invisible'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(node.id);
                }}
              >
                {isExpanded ? <Icons.ChevronDown size={14} /> : <Icons.ChevronRight size={14} />}
              </button>
              
              <span className="mr-2 opacity-90">{getIcon()}</span>
              <span className={`text-sm truncate font-medium flex-1`}>
                {node.title || 'Untitled'}
              </span>

              {/* Context Menu Button */}
              <button
                className={`
                  p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity 
                  ${isActive ? 'hover:bg-gray-700 dark:hover:bg-gray-300 text-gray-200 dark:text-gray-800' : 'hover:bg-gray-300 dark:hover:bg-neutral-800 text-gray-500'}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(isMenuOpen ? null : node.id);
                }}
              >
                 <Icons.MoreHorizontal size={14} />
              </button>
            </div>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div 
                ref={menuRef}
                className="absolute right-4 top-8 z-50 w-40 bg-white dark:bg-black rounded-lg shadow-xl border border-gray-200 dark:border-neutral-800 py-1 animate-fade-in origin-top-right"
                style={{ zIndex: 100 }}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); onAction('rename', node.id); setOpenMenuId(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-900 flex items-center"
                >
                  <Icons.Edit size={14} className="mr-2 text-gray-400" /> Rename
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onAction('duplicate', node.id); setOpenMenuId(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-900 flex items-center"
                >
                  <Icons.Copy size={14} className="mr-2 text-gray-400" /> Duplicate
                </button>
                <div className="h-px bg-gray-100 dark:bg-neutral-800 my-1"></div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onAction('delete', node.id); setOpenMenuId(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-neutral-900 flex items-center"
                >
                  <Icons.Trash size={14} className="mr-2" /> Delete
                </button>
              </div>
            )}

            {isExpanded && hasChildren && (
              <NodeTree 
                nodes={node.children}
                activeNodeId={activeNodeId}
                expandedNodeIds={expandedNodeIds}
                onNodeClick={onNodeClick}
                onToggleExpand={onToggleExpand}
                onAction={onAction}
                onMove={onMove}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default NodeTree;
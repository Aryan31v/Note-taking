import React, { useState, useEffect } from 'react';
import { KnowledgeNode, Priority, Subtask } from '../types';
import { Icons } from './Icon';
import { generateId, findNodeByTitle, findBacklinks } from '../utils/fileHelpers';

interface TodoDetailModalProps {
  todo: KnowledgeNode;
  allNodes: KnowledgeNode[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<KnowledgeNode>) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
}

const TodoDetailModal: React.FC<TodoDetailModalProps> = ({ 
  todo, 
  allNodes, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete,
  onNavigate 
}) => {
  const [title, setTitle] = useState(todo.title);
  const [content, setContent] = useState(todo.content || '');
  const [newSubtask, setNewSubtask] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    setTitle(todo.title);
    setContent(todo.content || '');
  }, [todo]);

  if (!isOpen) return null;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    
    const subtask: Subtask = {
      id: generateId(),
      title: newSubtask,
      completed: false
    };
    
    onUpdate(todo.id, { 
      subtasks: [...(todo.subtasks || []), subtask] 
    });
    setNewSubtask('');
  };

  const toggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = (todo.subtasks || []).map(s => 
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    onUpdate(todo.id, { subtasks: updatedSubtasks });
  };

  const deleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = (todo.subtasks || []).filter(s => s.id !== subtaskId);
    onUpdate(todo.id, { subtasks: updatedSubtasks });
  };

  // Render content with Wiki Links: [[Concept]]
  const renderContent = (text: string) => {
    if (!text) return <p className="text-gray-400 italic">No detailed notes added.</p>;

    // Split by wiki link pattern
    const parts = text.split(/(\[\[.*?\]\])/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const linkTitle = part.slice(2, -2);
        const targetNode = findNodeByTitle(allNodes, linkTitle);
        
        return (
          <span 
            key={i} 
            onClick={() => targetNode ? onNavigate(targetNode.id) : null}
            className={`
              cursor-pointer font-medium px-1 rounded transition-colors
              ${targetNode 
                ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30' 
                : 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-80'
              }
            `}
            title={targetNode ? `Go to: ${linkTitle}` : 'Page not created'}
          >
            {linkTitle}
          </span>
        );
      }
      // Preserve newlines
      return <span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  const backlinks = findBacklinks(todo.title, allNodes).filter(n => n.id !== todo.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white dark:bg-black w-full max-w-2xl h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-neutral-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-900">
          <div className="flex items-center space-x-3 flex-1 mr-4">
            <button 
              onClick={() => onUpdate(todo.id, { completed: !todo.completed })}
              className={`p-1 rounded-full ${todo.completed ? 'text-green-500' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-900'}`}
            >
              {todo.completed ? <Icons.CheckCircle size={24} fill="currentColor" className="opacity-20" /> : <Icons.Circle size={24} />}
            </button>
            <input 
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                onUpdate(todo.id, { title: e.target.value });
              }}
              className="flex-1 bg-transparent text-xl font-bold text-black dark:text-white outline-none placeholder-gray-300"
              placeholder="Task name"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => onDelete(todo.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
              <Icons.Trash size={20} />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900">
              <Icons.Close size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Priority */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                <Icons.Flag size={12} className="mr-1" /> Priority
              </label>
              <div className="flex space-x-2">
                {(['low', 'medium', 'high', 'urgent'] as Priority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => onUpdate(todo.id, { priority: p })}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all
                      ${todo.priority === p 
                        ? 'bg-black text-white dark:bg-white dark:text-black ring-2 ring-offset-2 ring-black dark:ring-white dark:ring-offset-black' 
                        : 'bg-gray-100 dark:bg-neutral-900 text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-800'
                      }
                    `}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                <Icons.Calendar size={12} className="mr-1" /> Due Date
              </label>
              <input 
                type="date"
                value={todo.dueDate || ''}
                onChange={(e) => onUpdate(todo.id, { dueDate: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                  <Icons.List size={12} className="mr-1" /> Subtasks
                </label>
                <span className="text-xs text-gray-400">
                  {(todo.subtasks?.filter(s => s.completed).length || 0)} / {(todo.subtasks?.length || 0)}
                </span>
             </div>
             
             {/* Progress Bar */}
             {(todo.subtasks?.length || 0) > 0 && (
               <div className="h-1.5 w-full bg-gray-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-blue-500 transition-all duration-300"
                   style={{ width: `${Math.round(((todo.subtasks?.filter(s => s.completed).length || 0) / (todo.subtasks?.length || 1)) * 100)}%` }}
                 ></div>
               </div>
             )}

             <div className="space-y-2">
               {todo.subtasks?.map(subtask => (
                 <div key={subtask.id} className="flex items-center group">
                   <button 
                     onClick={() => toggleSubtask(subtask.id)}
                     className={`mr-3 ${subtask.completed ? 'text-gray-400' : 'text-gray-300 hover:text-gray-500'}`}
                   >
                     {subtask.completed ? <Icons.CheckSquare size={18} /> : <Icons.Square size={18} />}
                   </button>
                   <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-black dark:text-white'}`}>
                     {subtask.title}
                   </span>
                   <button 
                     onClick={() => deleteSubtask(subtask.id)}
                     className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                   >
                     <Icons.Close size={14} />
                   </button>
                 </div>
               ))}
             </div>
             
             <form onSubmit={handleAddSubtask} className="flex items-center">
               <Icons.Plus size={18} className="text-gray-400 mr-3" />
               <input 
                 value={newSubtask}
                 onChange={(e) => setNewSubtask(e.target.value)}
                 placeholder="Add a subtask..."
                 className="flex-1 bg-transparent text-sm outline-none text-black dark:text-white placeholder-gray-400"
               />
             </form>
          </div>

          {/* Notes / Content Editor */}
          <div className="space-y-2">
             <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                    <Icons.FileText size={12} className="mr-1" /> Description & Notes
                </label>
                <div className="flex bg-gray-100 dark:bg-neutral-900 rounded-lg p-0.5">
                  <button
                    onClick={() => setMode('edit')}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${mode === 'edit' ? 'bg-white dark:bg-black shadow-sm text-black dark:text-white' : 'text-gray-400'}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setMode('preview')}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${mode === 'preview' ? 'bg-white dark:bg-black shadow-sm text-black dark:text-white' : 'text-gray-400'}`}
                  >
                    Preview
                  </button>
                </div>
             </div>
             
             {mode === 'edit' ? (
                <textarea 
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    onUpdate(todo.id, { content: e.target.value });
                  }}
                  className="w-full h-48 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-3 text-sm font-mono text-black dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white resize-none"
                  placeholder="Use [[Wiki Links]] to connect concepts..."
                />
             ) : (
                <div className="w-full h-48 overflow-y-auto bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-3 text-sm prose dark:prose-invert max-w-none">
                    {renderContent(content)}
                </div>
             )}
          </div>

          {/* Linked References / Backlinks */}
          {backlinks.length > 0 && (
            <div className="pt-4 border-t border-gray-100 dark:border-neutral-900">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center mb-3">
                 <Icons.Link size={12} className="mr-1" /> Linked References
               </h3>
               <div className="space-y-2">
                 {backlinks.map(backlink => (
                   <div 
                     key={backlink.id}
                     onClick={() => {
                        onClose();
                        onNavigate(backlink.id);
                     }}
                     className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-900 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                   >
                     <div className="flex items-center space-x-2">
                        {backlink.type === 'note' ? <Icons.FileText size={14} className="text-gray-400" /> : <Icons.CheckSquare size={14} className="text-gray-400" />}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{backlink.title}</span>
                     </div>
                     <Icons.ArrowRight size={12} className="text-gray-400" />
                   </div>
                 ))}
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TodoDetailModal;
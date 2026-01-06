import React, { useState, useMemo } from 'react';
import { KnowledgeNode, Priority, NodeType } from '../types';
import { Icons } from './Icon';
import { getAllTodos, filterTodos, FilterType, sortTodos, getTodoStats } from '../utils/todoHelpers';
import TodoDetailModal from './TodoDetailModal';

interface TodoSectionProps {
  nodes: KnowledgeNode[];
  onUpdateNode: (id: string, updates: Partial<KnowledgeNode>) => void;
  onNavigate: (id: string) => void;
  onDeleteNode: (id: string) => void;
  onCreateNode: (type: NodeType, parentId: string | null, initialData?: Partial<KnowledgeNode>) => void;
}

const TodoSection: React.FC<TodoSectionProps> = ({ 
  nodes, 
  onUpdateNode, 
  onNavigate,
  onDeleteNode,
  onCreateNode 
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  
  const allTodos = useMemo(() => getAllTodos(nodes), [nodes]);
  const stats = useMemo(() => getTodoStats(allTodos), [allTodos]);
  
  const filteredTodos = useMemo(() => {
    const filtered = filterTodos(allTodos, activeFilter);
    return sortTodos(filtered, activeFilter === 'all' ? 'created' : 'priority');
  }, [allTodos, activeFilter]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;

    // Create a new todo in the Inbox (or root if Inbox missing)
    // For simplicity, we create at root or active context. 
    // Ideally we find an "Inbox" folder.
    const inbox = nodes.find(n => n.title === 'Inbox' && n.type === 'folder');
    
    onCreateNode('todo', inbox ? inbox.id : null, {
        title: quickAddTitle,
        priority: 'medium',
        dueDate: activeFilter === 'today' ? new Date().toISOString().split('T')[0] : undefined
    });
    setQuickAddTitle('');
  };

  const renderFilterBtn = (filter: FilterType, label: string, icon: React.ReactNode, count: number, colorClass: string) => (
    <button 
      onClick={() => setActiveFilter(filter)}
      className={`
        w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 transition-colors
        ${activeFilter === filter 
            ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-900'
        }
      `}
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span className="font-medium text-sm">{label}</span>
      </div>
      {count > 0 && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeFilter === filter ? 'bg-white/20' : 'bg-gray-100 dark:bg-neutral-800'} ${colorClass}`}>
          {count}
        </span>
      )}
    </button>
  );

  const selectedTodo = selectedTodoId ? allTodos.find(t => t.id === selectedTodoId) : null;

  return (
    <div className="flex h-full bg-white dark:bg-black overflow-hidden animate-fade-in">
        {/* Sidebar Filters */}
        <div className="w-64 border-r border-gray-200 dark:border-neutral-800 p-4 flex flex-col hidden md:flex">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Smart Lists</h2>
            
            {renderFilterBtn('all', 'All Tasks', <Icons.List size={18} />, stats.total, 'text-gray-500')}
            {renderFilterBtn('today', 'Today', <Icons.Calendar size={18} />, stats.today, 'text-blue-500')}
            {renderFilterBtn('upcoming', 'Upcoming', <Icons.Calendar size={18} />, 0, 'text-purple-500')}
            {renderFilterBtn('overdue', 'Overdue', <Icons.Alert size={18} />, stats.overdue, 'text-red-500')}
            {renderFilterBtn('no-date', 'No Date', <Icons.FileText size={18} />, 0, 'text-gray-500')}
            
            <div className="mt-8">
               <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Completed</h2>
               {renderFilterBtn('completed', 'Done', <Icons.CheckCircle size={18} />, stats.completed, 'text-green-500')}
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full min-w-0">
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-black dark:text-white capitalize">
                        {activeFilter === 'no-date' ? 'No Due Date' : activeFilter}
                    </h1>
                    <div className="text-sm text-gray-500">
                        {filteredTodos.length} tasks
                    </div>
                </div>
                
                {/* Quick Add Bar */}
                {activeFilter !== 'completed' && (
                    <form onSubmit={handleQuickAdd} className="mt-4 relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Icons.Plus size={20} className="text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            value={quickAddTitle}
                            onChange={(e) => setQuickAddTitle(e.target.value)}
                            placeholder="Add a new task..."
                            className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-black dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all shadow-sm"
                        />
                    </form>
                )}
            </div>

            {/* Todo List */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
                {filteredTodos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Icons.CheckCircle size={48} className="mb-4 opacity-20" />
                        <p>No tasks found in this view.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredTodos.map(todo => (
                            <div 
                                key={todo.id}
                                className="group flex items-center p-3 bg-white dark:bg-black border-b border-gray-100 dark:border-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-900/30 transition-colors cursor-pointer"
                                onClick={() => setSelectedTodoId(todo.id)}
                            >
                                <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      onUpdateNode(todo.id, { completed: !todo.completed });
                                  }}
                                  className={`mr-4 ${todo.completed ? 'text-green-500' : 'text-gray-300 hover:text-gray-500'}`}
                                >
                                    {todo.completed ? <Icons.CheckCircle size={22} fill="currentColor" className="opacity-20" /> : <Icons.Circle size={22} />}
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                    <div className={`text-base truncate ${todo.completed ? 'line-through text-gray-400' : 'text-black dark:text-white'}`}>
                                        {todo.title || 'Untitled Task'}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-0.5">
                                        {todo.priority && todo.priority !== 'medium' && (
                                            <span className={`text-[10px] font-bold uppercase px-1 rounded ${
                                                todo.priority === 'urgent' ? 'text-red-600 bg-red-100' : 
                                                todo.priority === 'high' ? 'text-orange-600 bg-orange-100' : 'text-gray-500 bg-gray-100'
                                            }`}>
                                                {todo.priority}
                                            </span>
                                        )}
                                        {todo.dueDate && (
                                            <span className={`text-[10px] flex items-center ${
                                                todo.dueDate < new Date().toISOString().split('T')[0] ? 'text-red-500 font-bold' : 'text-gray-400'
                                            }`}>
                                                <Icons.Calendar size={10} className="mr-1" />
                                                {todo.dueDate}
                                            </span>
                                        )}
                                        {(todo.subtasks?.length || 0) > 0 && (
                                            <span className="text-[10px] text-gray-400 flex items-center">
                                                <Icons.List size={10} className="mr-1" />
                                                {todo.subtasks?.filter(s => s.completed).length}/{todo.subtasks?.length}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNavigate(todo.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-black dark:hover:text-white"
                                    title="Go to location"
                                >
                                    <Icons.ArrowRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Filters Overlay for Mobile */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 p-2 flex justify-center space-x-2 bg-gradient-to-t from-white dark:from-black to-transparent pb-6 pointer-events-none">
             <div className="bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg p-1 flex pointer-events-auto">
                <button onClick={() => setActiveFilter('all')} className={`p-2 rounded-full ${activeFilter === 'all' ? 'bg-gray-700 dark:bg-gray-300' : ''}`}><Icons.List size={20} /></button>
                <button onClick={() => setActiveFilter('today')} className={`p-2 rounded-full ${activeFilter === 'today' ? 'bg-gray-700 dark:bg-gray-300' : ''}`}><Icons.Calendar size={20} /></button>
                <button onClick={() => setActiveFilter('overdue')} className={`p-2 rounded-full ${activeFilter === 'overdue' ? 'bg-gray-700 dark:bg-gray-300' : ''}`}><Icons.Alert size={20} /></button>
             </div>
        </div>

        {/* Detail Modal */}
        {selectedTodo && (
            <TodoDetailModal 
                todo={selectedTodo}
                allNodes={nodes}
                isOpen={!!selectedTodoId}
                onClose={() => setSelectedTodoId(null)}
                onUpdate={onUpdateNode}
                onDelete={(id) => {
                    onDeleteNode(id);
                    setSelectedTodoId(null);
                }}
                onNavigate={onNavigate}
            />
        )}
    </div>
  );
};

export default TodoSection;
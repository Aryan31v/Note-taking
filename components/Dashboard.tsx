import React, { useMemo, useState } from 'react';
import { KnowledgeNode, Priority } from '../types';
import { flattenNodes } from '../utils/fileHelpers';
import { Icons } from './Icon';

interface DashboardProps {
  nodes: KnowledgeNode[];
  onNavigate: (id: string) => void;
  onUpdateNode: (id: string, updates: Partial<KnowledgeNode>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ nodes, onNavigate, onUpdateNode }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');
  const allNodes = flattenNodes(nodes);
  
  // Statistics
  const totalNotes = allNodes.filter(n => n.type === 'note').length;
  const totalTodos = allNodes.filter(n => n.type === 'todo').length;
  const completedTodos = allNodes.filter(n => n.type === 'todo' && n.completed).length;
  const totalSessions = allNodes.filter(n => n.type === 'session').length;
  const totalDuration = allNodes
    .filter(n => n.type === 'session' && n.sessionDuration)
    .reduce((acc, curr) => acc + (curr.sessionDuration || 0), 0);

  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;
  const hoursLearned = (totalDuration / 3600).toFixed(1);

  // Task Data Logic
  const taskGroups = useMemo(() => {
    const todos = allNodes.filter(n => n.type === 'todo' && !n.completed);
    const today = new Date().toISOString().split('T')[0];
    
    const overdue = todos.filter(t => t.dueDate && t.dueDate < today);
    const dueToday = todos.filter(t => t.dueDate === today);
    const upcoming = todos.filter(t => t.dueDate && t.dueDate > today);
    const noDate = todos.filter(t => !t.dueDate);
    
    // Sort by priority logic (helper)
    const priorityWeight = (p?: Priority) => {
        switch(p) {
            case 'urgent': return 4;
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            default: return 0;
        }
    };
    
    const sortByPriority = (a: KnowledgeNode, b: KnowledgeNode) => priorityWeight(b.priority) - priorityWeight(a.priority);

    return {
        overdue: overdue.sort(sortByPriority),
        dueToday: dueToday.sort(sortByPriority),
        upcoming: upcoming.sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || '')),
        noDate: noDate.sort(sortByPriority)
    };
  }, [allNodes]);

  // Real data for the chart (Activity over last 7 days)
  const activityData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const data = [];
    
    // Generate last 7 days (including today) in reverse chronological order initially
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        d.setHours(0,0,0,0);
        
        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        // Find sessions created on this day
        const dayDuration = allNodes
            .filter(n => n.type === 'session' && n.sessionDuration && n.createdAt >= d.getTime() && n.createdAt < nextD.getTime())
            .reduce((acc, curr) => acc + (curr.sessionDuration || 0), 0);
            
        data.push({
            name: days[d.getDay()],
            minutes: Math.round(dayDuration / 60)
        });
    }
    return data;
  }, [allNodes]);
  
  const maxMinutes = Math.max(...activityData.map(d => d.minutes), 60);

  const renderPriorityBadge = (p?: Priority) => {
    switch(p) {
        case 'urgent': return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-red-100 text-red-600 rounded">Urgent</span>;
        case 'high': return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">High</span>;
        case 'medium': return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">Med</span>;
        default: return null;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in pb-24">
      <header className="mb-6 border-b border-gray-200 dark:border-neutral-800 pb-0">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold text-black dark:text-white">Dashboard</h1>
                <p className="text-gray-500 dark:text-neutral-400">Your mind, quantified.</p>
            </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-6">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'}`}
            >
                Overview
            </button>
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'}`}
            >
                Tasks & Todos
            </button>
        </div>
      </header>

      {activeTab === 'overview' ? (
      <>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-black p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm hover:border-black dark:hover:border-white transition-colors">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 dark:text-neutral-500 text-sm font-medium">Notes</h3>
                <Icons.FileText size={20} className="text-black dark:text-white" />
            </div>
            <p className="text-3xl font-bold text-black dark:text-white">{totalNotes}</p>
            </div>

            <div className="bg-white dark:bg-black p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm hover:border-black dark:hover:border-white transition-colors">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 dark:text-neutral-500 text-sm font-medium">Completion</h3>
                <Icons.CheckSquare size={20} className="text-black dark:text-white" />
            </div>
            <p className="text-3xl font-bold text-black dark:text-white">{completionRate}%</p>
            <span className="text-xs text-gray-400">{completedTodos}/{totalTodos}</span>
            </div>

            <div className="bg-white dark:bg-black p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm hover:border-black dark:hover:border-white transition-colors">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 dark:text-neutral-500 text-sm font-medium">Focus Time</h3>
                <Icons.Clock size={20} className="text-black dark:text-white" />
            </div>
            <p className="text-3xl font-bold text-black dark:text-white">{hoursLearned}h</p>
            </div>

            <div className="bg-white dark:bg-black p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm hover:border-black dark:hover:border-white transition-colors">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 dark:text-neutral-500 text-sm font-medium">Sessions</h3>
                <Icons.Dashboard size={20} className="text-black dark:text-white" />
            </div>
            <p className="text-3xl font-bold text-black dark:text-white">{totalSessions}</p>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-black p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-lg font-bold text-black dark:text-white mb-6">Weekly Activity</h3>
            
            <div className="h-64 w-full flex items-end justify-between space-x-2 sm:space-x-4">
                {activityData.map((d, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 group cursor-default">
                    <div className="relative w-full flex justify-center items-end h-48 bg-gray-50 dark:bg-neutral-900 rounded-sm overflow-hidden">
                        <div 
                            className={`w-full mx-1 rounded-t-sm transition-all duration-700 ease-out bg-black dark:bg-white`}
                            style={{ height: `${(d.minutes / maxMinutes) * 100}%` }}
                        ></div>
                        
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-black dark:bg-white text-white dark:text-black text-xs py-1 px-2 rounded transition-opacity whitespace-nowrap z-10 pointer-events-none font-bold">
                            {d.minutes}m
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 mt-2 font-medium uppercase">{d.name}</span>
                    </div>
                ))}
            </div>
            </div>

            <div className="bg-white dark:bg-black p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm flex flex-col justify-center items-center text-center">
                <h3 className="text-lg font-bold text-black dark:text-white mb-2">Current Streak</h3>
                <div className="my-6 relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-gray-100 dark:border-neutral-900 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-black dark:border-white rounded-full border-t-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
                    <div className="flex flex-col">
                        <span className="text-4xl font-bold text-black dark:text-white">3</span>
                        <span className="text-xs text-gray-400 uppercase tracking-widest mt-1">Days</span>
                    </div>
                </div>
                <p className="text-gray-500 dark:text-neutral-500 text-sm max-w-xs">Consistency is the key to mastery.</p>
            </div>
        </div>
      </>
      ) : (
      /* Task List View */
      <div className="space-y-8 animate-fade-in">
        {[
            { title: '⚠️ Overdue', items: taskGroups.overdue, color: 'text-red-500' },
            { title: '🗓️ Today', items: taskGroups.dueToday, color: 'text-blue-500' },
            { title: '📅 Upcoming', items: taskGroups.upcoming, color: 'text-gray-500' },
            { title: '📂 Backlog', items: taskGroups.noDate, color: 'text-gray-400' }
        ].map(group => group.items.length > 0 && (
            <div key={group.title} className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
                <div className={`px-4 py-3 border-b border-gray-100 dark:border-neutral-900 bg-gray-50 dark:bg-neutral-900/50 font-bold text-sm uppercase tracking-wide flex justify-between ${group.color}`}>
                    <span>{group.title}</span>
                    <span className="bg-white dark:bg-neutral-800 px-2 rounded-full text-xs py-0.5 border border-gray-200 dark:border-neutral-700">{group.items.length}</span>
                </div>
                <div>
                    {group.items.map(todo => (
                        <div key={todo.id} className="group flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-900 last:border-0 hover:bg-gray-50 dark:hover:bg-neutral-900/30 transition-colors">
                            <div className="flex items-center space-x-3 flex-1">
                                <button 
                                  onClick={() => onUpdateNode(todo.id, { completed: true, completedAt: Date.now() })}
                                  className="text-gray-400 hover:text-green-500 transition-colors"
                                >
                                    <Icons.Square size={20} />
                                </button>
                                <div className="flex flex-col">
                                    <span 
                                        onClick={() => onNavigate(todo.id)}
                                        className="font-medium text-black dark:text-white cursor-pointer hover:underline"
                                    >
                                        {todo.title || 'Untitled Task'}
                                    </span>
                                    <div className="flex items-center space-x-2 mt-1">
                                        {renderPriorityBadge(todo.priority)}
                                        {todo.dueDate && (
                                            <span className="text-[10px] text-gray-400 flex items-center">
                                                <Icons.Calendar size={10} className="mr-1" />
                                                {todo.dueDate}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button 
                              onClick={() => onNavigate(todo.id)}
                              className="text-gray-300 hover:text-black dark:hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Icons.ArrowRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        ))}
        
        {totalTodos === 0 && (
            <div className="text-center py-12 text-gray-400">
                <Icons.CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
                <p>No tasks found. Create a Todo node to get started.</p>
            </div>
        )}
      </div>
      )}
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import NodeTree from './components/NodeTree';
import Dashboard from './components/Dashboard';
import NodeEditor from './components/NodeEditor';
import SessionTimer from './components/SessionTimer';
import TodoSection from './components/TodoSection';
import { RenameModal, DeleteModal } from './components/Modals';
import { Icons } from './components/Icon';
import { AppState, KnowledgeNode, NodeType } from './types';
import { INITIAL_NODES } from './constants';
import { saveStateToDB, loadStateFromDB } from './utils/storage';
import { 
  updateNodeInTree, 
  addChildToNode, 
  findNode, 
  generateId, 
  deleteNodeFromTree,
  duplicateNodeInTree,
  moveNodeInTree,
  findChildByTitle,
  searchNodes,
  SearchResult
} from './utils/fileHelpers';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  // --- State ---
  const [state, setState] = useState<AppState>({
      nodes: INITIAL_NODES,
      activeNodeId: null,
      expandedNodeIds: ['root-1'],
      sidebarOpen: true,
      currentView: 'dashboard',
      session: {
        isActive: false,
        startTime: null,
        elapsed: 0,
        linkedNodeId: null
      },
      theme: 'light',
      searchQuery: ''
  });

  // Action State
  const [modalState, setModalState] = useState<{
    type: 'none' | 'rename' | 'delete';
    nodeId: string | null;
  }>({ type: 'none', nodeId: null });

  // Derived State: Search Results
  const searchResults: SearchResult[] = state.searchQuery 
    ? searchNodes(state.nodes, state.searchQuery)
    : [];

  // --- Effects ---
  useEffect(() => {
    const init = async () => {
      const loadedState = await loadStateFromDB();
      if (loadedState) {
        setState({ ...loadedState, searchQuery: '' }); // Ensure search is clear on load
      }
      setTimeout(() => setIsLoading(false), 500);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Don't save searchQuery to DB
      const { searchQuery, ...persistedState } = state;
      saveStateToDB(persistedState as AppState);
    }
  }, [state, isLoading]);

  // --- Actions ---
  const handleNodeClick = (id: string) => {
    setState(prev => ({
      ...prev,
      activeNodeId: id,
      currentView: 'browser',
      sidebarOpen: window.innerWidth >= 768,
      searchQuery: '' // Clear search on selection
    }));
  };

  const handleToggleExpand = (id: string) => {
    setState(prev => ({
      ...prev,
      expandedNodeIds: prev.expandedNodeIds.includes(id)
        ? prev.expandedNodeIds.filter(eid => eid !== id)
        : [...prev.expandedNodeIds, id]
    }));
  };

  const handleCreateNode = (type: NodeType, parentId: string | null = null, initialData: Partial<KnowledgeNode> = {}) => {
    const newNode: KnowledgeNode = {
      id: generateId(),
      parentId,
      type,
      title: type === 'session' ? 'Learning Session' : '',
      content: '',
      children: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
      completed: type === 'todo' ? false : undefined,
      priority: type === 'todo' ? 'medium' : undefined,
      ...initialData
    };

    setState(prev => {
      const targetParentId = parentId || (prev.activeNodeId && findNode(prev.nodes, prev.activeNodeId)?.type === 'folder' ? prev.activeNodeId : null);
      const updatedNodes = addChildToNode(prev.nodes, targetParentId, newNode);
      const newExpanded = targetParentId ? [...prev.expandedNodeIds, targetParentId] : prev.expandedNodeIds;

      return {
        ...prev,
        nodes: updatedNodes,
        activeNodeId: newNode.id,
        expandedNodeIds: newExpanded,
        currentView: initialData ? prev.currentView : 'browser' // Stay in current view if programmatic create (like quick add)
      };
    });
  };

  // --- Daily Journal Feature ---
  const handleOpenDailyJournal = () => {
    const today = new Date();
    const dateTitle = today.toISOString().split('T')[0];
    
    setState(prev => {
      let currentNodes = prev.nodes;
      let expanded = [...prev.expandedNodeIds];
      
      let journalFolder = findChildByTitle(currentNodes, null, 'Journal');
      let journalId = journalFolder?.id;
      
      if (!journalFolder) {
        const newFolder: KnowledgeNode = {
          id: generateId(),
          parentId: null,
          type: 'folder',
          title: 'Journal',
          content: '',
          children: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: ['journal']
        };
        currentNodes = addChildToNode(currentNodes, null, newFolder);
        journalId = newFolder.id;
        expanded.push(journalId);
      } else {
        if (!expanded.includes(journalId!)) expanded.push(journalId!);
      }

      const getFreshNode = (list: KnowledgeNode[], id: string) => findNode(list, id);
      
      let dailyNoteId: string;
      const freshJournal = getFreshNode(currentNodes, journalId!);
      const existingDaily = freshJournal?.children.find(c => c.title === dateTitle);
      
      if (existingDaily) {
        dailyNoteId = existingDaily.id;
      } else {
        const newNote: KnowledgeNode = {
          id: generateId(),
          parentId: journalId!,
          type: 'note',
          title: dateTitle,
          content: `# Daily Log: ${dateTitle}\n\n## 🎯 Focus for Today\n- \n\n## 📝 Notes\n`,
          children: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: ['daily']
        };
        currentNodes = addChildToNode(currentNodes, journalId!, newNote);
        dailyNoteId = newNote.id;
      }
      
      return {
        ...prev,
        nodes: currentNodes,
        expandedNodeIds: expanded,
        activeNodeId: dailyNoteId,
        currentView: 'browser',
        sidebarOpen: window.innerWidth >= 768
      };
    });
  };

  const handleUpdateNode = (id: string, updates: Partial<KnowledgeNode>) => {
    setState(prev => ({
      ...prev,
      nodes: updateNodeInTree(prev.nodes, id, updates)
    }));
  };

  const handleMoveNode = (nodeId: string, targetId: string | null) => {
    setState(prev => ({
      ...prev,
      nodes: moveNodeInTree(prev.nodes, nodeId, targetId)
    }));
  };

  const handleDeleteNode = (id: string) => {
    setState(prev => ({
      ...prev,
      nodes: deleteNodeFromTree(prev.nodes, id),
      activeNodeId: prev.activeNodeId === id ? null : prev.activeNodeId,
      currentView: prev.activeNodeId === id ? 'dashboard' : prev.currentView
    }));
  };

  // --- Feature Actions ---
  const handleTreeAction = (action: 'rename' | 'delete' | 'duplicate', nodeId: string) => {
    if (action === 'rename') {
      setModalState({ type: 'rename', nodeId });
    } else if (action === 'delete') {
      setModalState({ type: 'delete', nodeId });
    } else if (action === 'duplicate') {
      setState(prev => ({
        ...prev,
        nodes: duplicateNodeInTree(prev.nodes, nodeId)
      }));
    }
  };

  const confirmDelete = () => {
    if (modalState.nodeId) {
      handleDeleteNode(modalState.nodeId);
      setModalState({ type: 'none', nodeId: null });
    }
  };

  const confirmRename = (newTitle: string) => {
    if (modalState.nodeId) {
      handleUpdateNode(modalState.nodeId, { title: newTitle });
      setModalState({ type: 'none', nodeId: null });
    }
  };

  const toggleSession = () => {
    setState(prev => {
      const now = Date.now();
      if (prev.session.isActive) {
        return { ...prev, session: { ...prev.session, isActive: false } };
      } else {
        return { ...prev, session: { ...prev.session, isActive: true, startTime: now - (prev.session.elapsed * 1000) } };
      }
    });
  };

  const updateSessionElapsed = (elapsed: number) => {
    setState(prev => ({ ...prev, session: { ...prev.session, elapsed } }));
  };

  const stopAndSaveSession = () => {
    setState(prev => {
      const duration = prev.session.elapsed;
      const sessionNode: KnowledgeNode = {
        id: generateId(),
        parentId: prev.session.linkedNodeId || null,
        type: 'session',
        title: `Session: ${new Date().toLocaleDateString()}`,
        content: `### Summary\nFocused for ${Math.floor(duration/60)} minutes.\n\n### Key Takeaways\n- `,
        children: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['session'],
        sessionDuration: duration
      };

      const targetParent = prev.session.linkedNodeId || null;
      const updatedNodes = addChildToNode(prev.nodes, targetParent, sessionNode);

      return {
        ...prev,
        nodes: updatedNodes,
        activeNodeId: sessionNode.id,
        currentView: 'browser',
        session: { isActive: false, startTime: null, elapsed: 0, linkedNodeId: null }
      };
    });
  };

  // --- Render ---
  const activeNode = state.activeNodeId ? findNode(state.nodes, state.activeNodeId) : null;
  const actionNode = modalState.nodeId ? findNode(state.nodes, modalState.nodeId) : null;

  if (isLoading) {
    return (
      <div className={`${state.theme} h-screen w-screen flex items-center justify-center bg-white dark:bg-black`}>
        <div className="flex flex-col items-center animate-fade-in">
          <Icons.Loader className="animate-spin text-black dark:text-white mb-4" size={32} />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Initializing Second Brain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${state.theme} h-screen w-screen overflow-hidden`}>
      <div 
        className="flex h-full w-full bg-white dark:bg-black text-black dark:text-white relative transition-colors duration-200"
        style={{ 
          paddingTop: 'env(safe-area-inset-top)', 
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
      >
        
        {/* Sidebar */}
        <aside 
          className={`
            absolute md:relative z-40 h-full w-64 
            bg-gray-50 dark:bg-black 
            border-r border-gray-200 dark:border-neutral-800 
            transform transition-all duration-300 ease-in-out
            ${state.sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            flex flex-col shadow-xl md:shadow-none
          `}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-black dark:text-white font-bold text-lg">
                    <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black">
                        <Icons.Folder size={18} />
                    </div>
                    <span>Cortex</span>
                </div>
                
                <div className="flex items-center space-x-1">
                <button 
                    onClick={() => setState(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-full"
                    title="Toggle Theme"
                >
                    {state.theme === 'light' ? <Icons.Moon size={18} /> : <Icons.Sun size={18} />}
                </button>
                <button onClick={() => setState(s => ({...s, sidebarOpen: false}))} className="md:hidden text-gray-500">
                    <Icons.Close />
                </button>
                </div>
            </div>

            {/* Global Search Bar */}
            <div className="relative">
                <Icons.Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={state.searchQuery}
                  onChange={(e) => setState(s => ({ ...s, searchQuery: e.target.value }))}
                  placeholder="Search notes..."
                  className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg py-1.5 pl-9 pr-3 text-sm text-black dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none"
                />
                {state.searchQuery && (
                    <button 
                      onClick={() => setState(s => ({ ...s, searchQuery: '' }))}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white"
                    >
                        <Icons.Close size={12} />
                    </button>
                )}
            </div>
          </div>

          <div className="p-2 space-y-1 border-b border-gray-200 dark:border-neutral-800">
            <button 
              onClick={() => setState(s => ({ ...s, currentView: 'dashboard', activeNodeId: null, sidebarOpen: false }))}
              className={`
                w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors 
                ${state.currentView === 'dashboard' 
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-900'
                }
              `}
            >
              <Icons.Dashboard size={18} />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setState(s => ({ ...s, currentView: 'todos', activeNodeId: null, sidebarOpen: false }))}
              className={`
                w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors 
                ${state.currentView === 'todos' 
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-900'
                }
              `}
            >
              <Icons.CheckCircle size={18} />
              <span>My Tasks</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {state.searchQuery ? (
                // Search Results View
                <div>
                   <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex justify-between">
                      <span>Search Results</span>
                      <span>{searchResults.length}</span>
                   </div>
                   {searchResults.length === 0 ? (
                       <div className="p-4 text-center text-gray-400 text-sm italic">No matches found</div>
                   ) : (
                       <div className="px-2 space-y-1">
                           {searchResults.map(({ node, path }) => (
                               <div 
                                 key={node.id}
                                 onClick={() => handleNodeClick(node.id)}
                                 className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 cursor-pointer"
                               >
                                   <div className="text-sm font-medium text-black dark:text-white">{node.title || 'Untitled'}</div>
                                   <div className="text-[10px] text-gray-400 truncate">{path}</div>
                               </div>
                           ))}
                       </div>
                   )}
                </div>
            ) : (
                // Tree View
                <>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Knowledge Base
                    </div>
                    <NodeTree 
                    nodes={state.nodes} 
                    activeNodeId={state.activeNodeId} 
                    expandedNodeIds={state.expandedNodeIds}
                    onNodeClick={handleNodeClick}
                    onToggleExpand={handleToggleExpand}
                    onAction={handleTreeAction}
                    onMove={handleMoveNode}
                    />
                </>
            )}
          </div>

          {/* Quick Add Bottom Bar */}
          <div className="p-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black grid grid-cols-5 gap-1">
            <button onClick={() => handleCreateNode('note')} className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-900 text-gray-500 dark:text-gray-400">
              <Icons.FileText size={18} />
              <span className="text-[9px] mt-1">Note</span>
            </button>
            <button onClick={() => handleCreateNode('todo')} className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-900 text-gray-500 dark:text-gray-400">
              <Icons.CheckSquare size={18} />
              <span className="text-[9px] mt-1">Task</span>
            </button>
            <button onClick={handleOpenDailyJournal} className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-900 text-gray-900 dark:text-white font-bold bg-gray-100 dark:bg-neutral-900">
              <Icons.Calendar size={18} />
              <span className="text-[9px] mt-1">Today</span>
            </button>
            <button onClick={() => handleCreateNode('folder')} className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-900 text-gray-500 dark:text-gray-400">
              <Icons.Folder size={18} />
              <span className="text-[9px] mt-1">Folder</span>
            </button>
            <button 
              onClick={() => {
                setState(prev => ({
                  ...prev,
                  session: {
                    ...prev.session,
                    isActive: true,
                    startTime: Date.now(),
                    linkedNodeId: prev.activeNodeId
                  }
                }));
              }} 
              className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-900 text-gray-900 dark:text-gray-100"
            >
              <Icons.Clock size={18} />
              <span className="text-[9px] mt-1">Focus</span>
            </button>
          </div>
        </aside>

        {/* Main Content Overlay */}
        {state.sidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setState(s => ({...s, sidebarOpen: false}))}
          ></div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative bg-white dark:bg-black">
          {!state.sidebarOpen && (
            <button 
              onClick={() => setState(s => ({...s, sidebarOpen: true}))}
              className="absolute top-4 left-4 z-20 p-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-full shadow-md text-black dark:text-white md:hidden"
            >
              <Icons.Menu size={20} />
            </button>
          )}

          {state.currentView === 'dashboard' ? (
            <div className="flex-1 overflow-y-auto">
              <Dashboard 
                nodes={state.nodes} 
                onNavigate={handleNodeClick}
                onUpdateNode={handleUpdateNode}
              />
            </div>
          ) : state.currentView === 'todos' ? (
             <TodoSection 
               nodes={state.nodes}
               onNavigate={handleNodeClick}
               onUpdateNode={handleUpdateNode}
               onDeleteNode={handleDeleteNode}
               onCreateNode={handleCreateNode}
             />
          ) : activeNode ? (
            <NodeEditor 
              node={activeNode} 
              allNodes={state.nodes} // Pass full tree for linking
              onUpdate={handleUpdateNode}
              onNavigate={handleNodeClick} // Wiki Link Navigation
              onBack={() => setState(s => ({ ...s, currentView: 'dashboard', activeNodeId: null }))} 
              onOtterImport={(text) => console.log('Otter imported', text.length)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-neutral-600">
               <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mb-4">
                  <Icons.Search size={32} />
               </div>
              <p>Select a node or start a new project</p>
            </div>
          )}
        </main>

        {/* Floating Session Timer */}
        <SessionTimer 
          session={state.session} 
          onToggle={toggleSession}
          onStop={stopAndSaveSession}
          updateElapsed={updateSessionElapsed}
        />

        {/* Modals */}
        <RenameModal 
          isOpen={modalState.type === 'rename'}
          initialValue={actionNode?.title || ''}
          onClose={() => setModalState({ type: 'none', nodeId: null })}
          onConfirm={confirmRename}
        />

        <DeleteModal
          isOpen={modalState.type === 'delete'}
          title={actionNode?.title || 'Untitled'}
          isFolder={actionNode?.type === 'folder'}
          onClose={() => setModalState({ type: 'none', nodeId: null })}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
};

export default App;
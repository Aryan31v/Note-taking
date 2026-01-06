import React, { useState, useEffect, useRef } from 'react';
import { KnowledgeNode, Priority } from '../types';
import { Icons } from './Icon';
import { downloadMarkdown, findBacklinks, findNodeByTitle, generateId } from '../utils/fileHelpers';
import { saveImageToDB } from '../utils/storage';
import AsyncImage from './AsyncImage';

interface NodeEditorProps {
  node: KnowledgeNode;
  allNodes: KnowledgeNode[]; // Needed for backlinks and linking
  onUpdate: (id: string, updates: Partial<KnowledgeNode>) => void;
  onBack: () => void;
  onNavigate: (nodeId: string) => void;
  onOtterImport: (text: string) => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({ node, allNodes, onUpdate, onBack, onNavigate, onOtterImport }) => {
  const [title, setTitle] = useState(node.title);
  const [content, setContent] = useState(node.content);
  const [showOtterModal, setShowOtterModal] = useState(false);
  const [otterText, setOtterText] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [dueDate, setDueDate] = useState(node.dueDate || '');
  const [priority, setPriority] = useState<Priority | undefined>(node.priority);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when node changes
  useEffect(() => {
    setTitle(node.title);
    setContent(node.content);
    setDueDate(node.dueDate || '');
    setPriority(node.priority);
    setMode('edit'); // Reset to edit on navigation
  }, [node.id]);

  const handleOtterPaste = () => {
    if (otterText.trim()) {
      const timestamp = new Date().toLocaleTimeString();
      const formatted = `\n\n### 🎙️ Otter Transcription (${timestamp})\n> ${otterText}\n\n`;
      const newContent = content + formatted;
      setContent(newContent);
      onUpdate(node.id, { content: newContent });
      onOtterImport(otterText);
      setOtterText('');
      setShowOtterModal(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageId = generateId();
      
      try {
        // Save to IndexedDB (Lazy Storage)
        await saveImageToDB(imageId, file);
        
        // Insert Markdown syntax at cursor position
        const imageMarkdown = `\n![${file.name}](image:${imageId})\n`;
        const textarea = textareaRef.current;
        
        let newContent = content;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            newContent = content.substring(0, start) + imageMarkdown + content.substring(end);
        } else {
            newContent += imageMarkdown;
        }

        setContent(newContent);
        onUpdate(node.id, { content: newContent });
      } catch (err) {
        console.error("Failed to save image", err);
        alert("Failed to save image. Please try again.");
      }
    }
  };

  const handlePriorityChange = (p: Priority) => {
    setPriority(p);
    onUpdate(node.id, { priority: p });
  };

  const handleDateChange = (date: string) => {
    setDueDate(date);
    onUpdate(node.id, { dueDate: date });
  };

  // Render content with Wiki Links: [[Concept]] and Images: ![alt](image:id)
  const renderContent = (text: string) => {
    if (!text) return <p className="text-gray-400 italic">No content yet.</p>;

    // Regex to split by images OR wiki links
    // Image: !\[(.*?)\]\((image:.*?)\)
    // Wiki: \[\[(.*?)\]\]
    const regex = /(!\[.*?\]\(image:.*?\))|(\[\[.*?\]\])/g;
    
    const parts = text.split(regex).filter(p => p !== undefined);
    
    return parts.map((part, i) => {
      // Handle Image
      if (part.startsWith('![') && part.includes('](image:')) {
        const match = part.match(/!\[(.*?)\]\((image:.*?)\)/);
        if (match) {
          const altText = match[1];
          const imageId = match[2]; // includes 'image:' prefix
          return <AsyncImage key={i} id={imageId} alt={altText} />;
        }
      }

      // Handle Wiki Link
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
      
      // Plain Text (preserve newlines)
      return <span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  // Get Backlinks
  const backlinks = findBacklinks(node.title, allNodes).filter(n => n.id !== node.id);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black relative transition-colors duration-200">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-neutral-800 p-4 sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-10 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <button onClick={onBack} className="md:hidden mr-3 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-full">
              <Icons.Back size={20} />
            </button>
            <div className="flex-1">
              <input 
                type="text" 
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  onUpdate(node.id, { title: e.target.value });
                }}
                className="text-xl md:text-2xl font-bold text-black dark:text-white bg-transparent border-none outline-none w-full placeholder-gray-300 dark:placeholder-neutral-700"
                placeholder="Untitled Page"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-neutral-900 rounded-lg p-1 mr-2">
              <button
                onClick={() => setMode('edit')}
                className={`p-1.5 rounded-md transition-all ${mode === 'edit' ? 'bg-white dark:bg-black shadow-sm text-black dark:text-white' : 'text-gray-400'}`}
                title="Edit Mode"
              >
                <Icons.Edit size={16} />
              </button>
              <button
                onClick={() => setMode('preview')}
                className={`p-1.5 rounded-md transition-all ${mode === 'preview' ? 'bg-white dark:bg-black shadow-sm text-black dark:text-white' : 'text-gray-400'}`}
                title="Preview & Links"
              >
                <Icons.Eye size={16} />
              </button>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImageUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 dark:text-neutral-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-md transition-all"
              title="Insert Image"
            >
              <Icons.Image size={20} />
            </button>

            <button 
              onClick={() => setShowOtterModal(true)}
              className="p-2 text-gray-500 dark:text-neutral-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-md transition-all"
              title="Import Transcription"
            >
              <Icons.Mic size={20} />
            </button>
            <button 
              onClick={() => downloadMarkdown(node)}
              className="p-2 text-gray-500 dark:text-neutral-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-md transition-all"
              title="Export Markdown"
            >
              <Icons.Download size={20} />
            </button>
          </div>
        </div>

        {/* Todo & Metadata Controls */}
        {node.type === 'todo' && (
          <div className="flex flex-wrap items-center gap-3 pt-1 animate-fade-in">
             <div className="flex items-center space-x-2 bg-gray-50 dark:bg-neutral-900 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-neutral-800">
                <input 
                  type="checkbox" 
                  checked={node.completed || false}
                  onChange={(e) => onUpdate(node.id, { 
                    completed: e.target.checked,
                    completedAt: e.target.checked ? Date.now() : undefined
                  })}
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black dark:bg-black dark:border-neutral-700"
                />
                <span className={`text-sm font-medium ${node.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  Completed
                </span>
             </div>

             {/* Priority Selector */}
             <div className="flex items-center space-x-1 bg-gray-50 dark:bg-neutral-900 px-2 py-1 rounded-lg border border-gray-100 dark:border-neutral-800">
                <Icons.Flag size={14} className="text-gray-400" />
                <select 
                  value={priority || 'medium'} 
                  onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                  className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
             </div>

             {/* Due Date Picker */}
             <div className="flex items-center space-x-1 bg-gray-50 dark:bg-neutral-900 px-2 py-1 rounded-lg border border-gray-100 dark:border-neutral-800">
                <Icons.Calendar size={14} className="text-gray-400" />
                <input 
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 outline-none"
                />
             </div>
          </div>
        )}
      </div>

      {/* Editor / Preview Area */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'edit' ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onUpdate(node.id, { content: e.target.value });
            }}
            className="w-full h-full p-4 md:p-8 resize-none outline-none text-black dark:text-gray-200 leading-relaxed font-mono text-base bg-transparent placeholder-gray-300 dark:placeholder-neutral-700"
            placeholder="Start typing or use [[Wiki Links]] to connect concepts..."
          />
        ) : (
          <div className="w-full h-full p-4 md:p-8 prose dark:prose-invert max-w-none">
             <div className="leading-relaxed text-black dark:text-gray-200 font-sans whitespace-pre-wrap">
               {renderContent(content)}
             </div>
          </div>
        )}

        {/* Backlinks Footer */}
        {backlinks.length > 0 && (
          <div className="mt-8 p-6 bg-gray-50 dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center">
              <Icons.Link size={14} className="mr-2" />
              Linked References
            </h3>
            <div className="space-y-2">
              {backlinks.map(backlink => (
                <div 
                  key={backlink.id}
                  onClick={() => onNavigate(backlink.id)}
                  className="group flex items-center justify-between p-3 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-3">
                     <div className="text-gray-400">
                       {backlink.type === 'note' ? <Icons.FileText size={16} /> : <Icons.CheckSquare size={16} />}
                     </div>
                     <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white">
                       {backlink.title || 'Untitled'}
                     </span>
                  </div>
                  <Icons.ArrowRight size={14} className="text-gray-300 dark:text-neutral-700 group-hover:text-blue-500" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Otter Import Modal */}
      {showOtterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-black rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-gray-200 dark:border-neutral-800">
            <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center bg-gray-50 dark:bg-neutral-900">
              <h3 className="font-semibold text-black dark:text-white flex items-center">
                <Icons.Mic size={18} className="mr-2" />
                Import from Otter.ai
              </h3>
              <button onClick={() => setShowOtterModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <Icons.Close size={20} />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={otterText}
                onChange={(e) => setOtterText(e.target.value)}
                className="w-full h-48 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-black dark:text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none resize-none"
                placeholder="Speaker 1: Hello..."
              />
              <div className="mt-4 flex justify-end space-x-3">
                <button 
                  onClick={() => setShowOtterModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleOtterPaste}
                  className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black hover:opacity-80 rounded-lg text-sm font-bold"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeEditor;
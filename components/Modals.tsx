import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icon';

interface RenameModalProps {
  isOpen: boolean;
  initialValue: string;
  onClose: () => void;
  onConfirm: (newValue: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({ isOpen, initialValue, onClose, onConfirm }) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-black rounded-xl shadow-2xl p-6 w-full max-w-sm m-4 transform transition-all scale-100 border border-gray-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold text-black dark:text-white mb-4">Rename Item</h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm(value);
            if (e.key === 'Escape') onClose();
          }}
          className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-black text-black dark:text-white rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none mb-6"
        />
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-lg text-sm font-medium">
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(value)}
            className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black hover:opacity-80 rounded-lg text-sm font-bold"
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  isOpen: boolean;
  title: string;
  isFolder: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, title, isFolder, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-black rounded-xl shadow-2xl p-6 w-full max-w-sm m-4 border border-gray-200 dark:border-neutral-800">
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-100 dark:border-red-900/30">
            <Icons.Trash size={24} />
          </div>
          <h3 className="text-lg font-bold text-black dark:text-white">Delete Item?</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          Are you sure you want to delete <span className="font-semibold text-black dark:text-white">"{title}"</span>?
          {isFolder && (
            <span className="block mt-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/20">
              ⚠️ Warning: This will permanently delete all items inside this folder.
            </span>
          )}
        </p>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-lg text-sm font-medium">
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-bold shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
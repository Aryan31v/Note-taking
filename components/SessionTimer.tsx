import React, { useEffect } from 'react';
import { Icons } from './Icon';
import { SessionData } from '../types';

interface SessionTimerProps {
  session: SessionData;
  onToggle: () => void;
  onStop: () => void;
  updateElapsed: (elapsed: number) => void;
}

const SessionTimer: React.FC<SessionTimerProps> = ({ session, onToggle, onStop, updateElapsed }) => {
  useEffect(() => {
    let interval: any;
    if (session.isActive && session.startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - session.startTime!) / 1000);
        updateElapsed(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session.isActive, session.startTime, updateElapsed]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!session.isActive && session.elapsed === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black dark:bg-white text-white dark:text-black p-4 rounded-xl shadow-2xl flex items-center space-x-4 border border-gray-800 dark:border-gray-200 animate-fade-in">
      <div className="flex flex-col">
        <span className="text-xs text-gray-400 dark:text-neutral-500 font-medium uppercase tracking-wider">Focus</span>
        <span className="text-2xl font-mono font-bold">{formatTime(session.elapsed)}</span>
      </div>
      <div className="flex space-x-2">
        <button 
          onClick={onToggle}
          className="p-3 rounded-full bg-gray-800 dark:bg-gray-200 hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
        >
          {session.isActive ? <Icons.Square size={18} fill="currentColor" /> : <Icons.Play size={18} fill="currentColor" />}
        </button>
        {session.elapsed > 0 && !session.isActive && (
           <button 
           onClick={onStop}
           className="p-3 rounded-full bg-white text-black dark:bg-black dark:text-white hover:opacity-80 transition-opacity border border-gray-500"
           title="Save Session"
         >
           <Icons.Save size={18} />
         </button>
        )}
      </div>
    </div>
  );
};

export default SessionTimer;
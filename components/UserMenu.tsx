import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Cloud, RefreshCw, AlertCircle, Settings } from 'lucide-react';
import { UserProfile } from '../types';
import { authService } from '../services/authService';

interface UserMenuProps {
  user: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  onSync: () => Promise<void>;
  isSyncing: boolean;
  lastSyncTime: Date | null;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogin, onLogout, onSync, isSyncing, lastSyncTime }) => {
  const [isOpen, setIsOpen] = useState(false);
  const loginBtnRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Google Button when component mounts (or when user logs out)
    if (!user && loginBtnRef.current) {
        authService.renderButton(loginBtnRef.current);
    }
  }, [user, isOpen]); // Re-run if user status changes or menu opens (sometimes button needs re-render)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="relative" ref={menuRef}>
        <button 
           onClick={() => setIsOpen(!isOpen)}
           className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors border border-white/5"
        >
            <User className="w-5 h-5" />
        </button>

        {isOpen && (
           <div className="absolute right-0 top-full mt-2 w-72 bg-gray-950/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 z-50">
               <h3 className="text-sm font-bold text-white mb-2">Sign In</h3>
               <p className="text-xs text-gray-400 mb-4">
                 Sign in with Google to sync your hackathons across devices.
               </p>
               {/* Google Button Container */}
               <div ref={loginBtnRef} className="flex justify-center min-h-[40px]"></div>
               <p className="text-[10px] text-gray-500 mt-2 text-center">
                 Uses Mock Server Storage for demo.
               </p>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 transition-colors"
      >
        <img 
          src={user.picture} 
          alt={user.name} 
          className="w-7 h-7 rounded-full border border-white/10"
        />
        <span className="text-xs font-medium text-gray-200 truncate max-w-[80px] hidden md:block">
          {user.name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-gray-950/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-3 border-b border-white/5">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>

            <div className="p-2">
                <button 
                  onClick={() => {
                      onSync();
                  }}
                  disabled={isSyncing}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/10 flex items-center justify-between group transition-colors"
                >
                   <div className="flex items-center gap-2">
                      <Cloud className={`w-4 h-4 ${isSyncing ? 'text-accent-400' : 'text-gray-400'}`} />
                      <span>Sync Projects</span>
                   </div>
                   {isSyncing ? (
                       <RefreshCw className="w-3 h-3 animate-spin text-accent-400" />
                   ) : (
                       <div className="flex flex-col items-end">
                            {lastSyncTime && (
                                <span className="text-[10px] text-gray-500">
                                    {lastSyncTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            )}
                       </div>
                   )}
                </button>
            </div>
            
            <div className="border-t border-white/5 p-2">
                <button 
                  onClick={onLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                >
                   <LogOut className="w-4 h-4" />
                   Sign Out
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
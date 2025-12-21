import React, { useState, useEffect } from 'react';
import { X, Calendar, Globe, Loader2, Play } from 'lucide-react';
import { HackathonInfo } from '../types';
import { getUpcomingHackathons } from '../services/geminiService';

interface HackathonListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (hackathon: HackathonInfo) => void;
}

const HackathonListModal: React.FC<HackathonListModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [hackathons, setHackathons] = useState<HackathonInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen && hackathons.length === 0) {
      loadHackathons();
    }
  }, [isOpen]);

  const loadHackathons = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getUpcomingHackathons();
      setHackathons(data);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-2xl h-[80vh] shadow-2xl flex flex-col relative animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-accent-400" />
              Upcoming Hackathons
            </h2>
            <p className="text-xs text-gray-400 mt-1">Found via Google Search</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-accent-500" />
              <p>Searching for events...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-red-400 space-y-2">
              <p>Failed to load hackathons.</p>
              <button 
                onClick={loadHackathons}
                className="text-sm underline hover:text-red-300"
              >
                Try Again
              </button>
            </div>
          ) : hackathons.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">No hackathons found.</div>
          ) : (
            <div className="grid gap-4">
              {hackathons.map((h, idx) => (
                <div 
                  key={idx} 
                  className="bg-black/30 hover:bg-white/5 border border-white/10 rounded-xl p-5 transition-all group flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-lg text-gray-200 group-hover:text-accent-400 transition-colors">
                      {h.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-black/40 w-fit px-2 py-1 rounded border border-white/5">
                      <Calendar className="w-3 h-3" />
                      {new Date(h.dateISO).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {h.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelect(h)}
                    className="shrink-0 bg-white/10 hover:bg-accent-600 hover:text-white text-gray-200 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-accent-500/20 whitespace-nowrap"
                  >
                    Start Timer <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HackathonListModal;
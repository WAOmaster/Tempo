import React, { useState } from 'react';
import { Search, Calendar, ChevronRight, Loader2, Link2, Globe } from 'lucide-react';
import { findEventDeadline } from '../services/geminiService';
import { SearchResult, HackathonInfo } from '../types';
import HackathonListModal from './HackathonListModal';

interface EventSetupProps {
  onConfirm: (name: string, date: Date, description: string) => void;
}

const EventSetup: React.FC<EventSetupProps> = ({ onConfirm }) => {
  const [mode, setMode] = useState<'manual' | 'search'>('search');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  
  // Modal State
  const [isHackathonListOpen, setIsHackathonListOpen] = useState(false);
  
  // Manual state
  const [manualName, setManualName] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('23:59');
  const [manualDesc, setManualDesc] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearchResult(null);
    try {
      const result = await findEventDeadline(query);
      setSearchResult(result);
    } catch (e) {
      alert("Failed to find event details. Please try again or use manual entry.");
    } finally {
      setLoading(false);
    }
  };

  const confirmSearchResult = () => {
    if (!searchResult) return;
    onConfirm(searchResult.eventName, new Date(searchResult.dateISO), searchResult.description);
  };

  const confirmManual = () => {
    if (!manualName || !manualDate) return;
    const d = new Date(`${manualDate}T${manualTime}`);
    onConfirm(manualName, d, manualDesc);
  };

  const handleHackathonSelect = (h: HackathonInfo) => {
    onConfirm(h.name, new Date(h.dateISO), h.description);
    setIsHackathonListOpen(false);
  };

  return (
    <>
      <div className="max-w-2xl mx-auto mt-10 md:mt-20 px-4 w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-4">
            Tempo
          </h1>
          <p className="text-gray-300 text-lg drop-shadow-md">AI-Powered Hackathon Planner & Countdown</p>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative">
          
          {/* Tabs */}
          <div className="flex space-x-4 mb-8 border-b border-white/10 pb-1">
            <button
              onClick={() => setMode('search')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                mode === 'search' 
                  ? 'border-accent-500 text-accent-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                AI Search
              </div>
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                mode === 'manual' 
                  ? 'border-accent-500 text-accent-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Manual Entry
              </div>
            </button>
          </div>

          {mode === 'search' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-300 font-medium">Event URL or Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Gemini API Developer Competition"
                    className="w-full bg-black/50 border border-white/10 text-gray-100 rounded-lg py-3 px-4 focus:ring-2 focus:ring-accent-500/50 focus:border-transparent outline-none pr-12 transition-all placeholder:text-gray-600"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button 
                    onClick={handleSearch}
                    disabled={loading}
                    className="absolute right-2 top-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-gray-300 transition-colors disabled:opacity-50 border border-white/5"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                   <p className="text-xs text-gray-400">
                    Enter a hackathon name or paste a link.
                   </p>
                   <button 
                     onClick={() => setIsHackathonListOpen(true)}
                     className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 font-medium transition-colors"
                   >
                     <Globe className="w-3 h-3" /> Browse Upcoming
                   </button>
                </div>
              </div>

              {searchResult && (
                <div className="bg-black/30 border border-white/10 rounded-xl p-4 animate-in fade-in slide-in-from-top-4 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-100">{searchResult.eventName}</h3>
                    {searchResult.sourceUrl && (
                      <a href={searchResult.sourceUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-accent-400">
                        <Link2 className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <div className="text-accent-400 font-mono text-lg mb-2 shadow-black/50 drop-shadow-sm">
                    {new Date(searchResult.dateISO).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2 mb-4">
                    {searchResult.description}
                  </p>
                  <button
                    onClick={confirmSearchResult}
                    className="w-full bg-accent-600 hover:bg-accent-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent-500/20"
                  >
                    Start Countdown <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Project / Event Name</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-gray-100 focus:ring-1 focus:ring-accent-500/50 outline-none placeholder:text-gray-600"
                  placeholder="My Awesome Hackathon"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-gray-100 focus:ring-1 focus:ring-accent-500/50 outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-gray-100 focus:ring-1 focus:ring-accent-500/50 outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description (Optional)</label>
                <textarea
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-gray-100 focus:ring-1 focus:ring-accent-500/50 outline-none h-20 resize-none placeholder:text-gray-600"
                  placeholder="What are you building?"
                />
              </div>

              <button
                onClick={confirmManual}
                disabled={!manualName || !manualDate}
                className="w-full bg-accent-600 hover:bg-accent-500 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-lg shadow-accent-500/20"
              >
                Set Deadline <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <HackathonListModal 
        isOpen={isHackathonListOpen}
        onClose={() => setIsHackathonListOpen(false)}
        onSelect={handleHackathonSelect}
      />
    </>
  );
};

export default EventSetup;
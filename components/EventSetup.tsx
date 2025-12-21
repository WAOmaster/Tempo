import React, { useState } from 'react';
import { Search, Calendar, ChevronRight, Loader2, Link2 } from 'lucide-react';
import { findEventDeadline } from '../services/geminiService';
import { SearchResult } from '../types';

interface EventSetupProps {
  onConfirm: (name: string, date: Date, description: string) => void;
}

const EventSetup: React.FC<EventSetupProps> = ({ onConfirm }) => {
  const [mode, setMode] = useState<'manual' | 'search'>('search');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  
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

  return (
    <div className="max-w-2xl mx-auto mt-10 md:mt-20 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 mb-4">
          Tempo
        </h1>
        <p className="text-gray-400 text-lg">AI-Powered Hackathon Planner & Countdown</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl">
        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-800 pb-1">
          <button
            onClick={() => setMode('search')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              mode === 'search' 
                ? 'border-accent-500 text-accent-400' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
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
                : 'border-transparent text-gray-500 hover:text-gray-300'
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
              <label className="text-sm text-gray-400 font-medium">Event URL or Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Gemini API Developer Competition"
                  className="w-full bg-gray-950 border border-gray-800 text-gray-100 rounded-lg py-3 px-4 focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none pr-12 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button 
                  onClick={handleSearch}
                  disabled={loading}
                  className="absolute right-2 top-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-gray-300 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter a hackathon name or paste a link. Gemini will find the deadline.
              </p>
            </div>

            {searchResult && (
              <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-200">{searchResult.eventName}</h3>
                  {searchResult.sourceUrl && (
                     <a href={searchResult.sourceUrl} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-accent-400">
                       <Link2 className="w-4 h-4" />
                     </a>
                  )}
                </div>
                <div className="text-accent-400 font-mono text-lg mb-2">
                  {new Date(searchResult.dateISO).toLocaleString()}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {searchResult.description}
                </p>
                <button
                  onClick={confirmSearchResult}
                  className="w-full bg-accent-600 hover:bg-accent-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Start Countdown <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Project / Event Name</label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:ring-1 focus:ring-accent-500 outline-none"
                placeholder="My Awesome Hackathon"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:ring-1 focus:ring-accent-500 outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                <input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:ring-1 focus:ring-accent-500 outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description (Optional)</label>
              <textarea
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:ring-1 focus:ring-accent-500 outline-none h-20 resize-none"
                placeholder="What are you building?"
              />
            </div>

            <button
              onClick={confirmManual}
              disabled={!manualName || !manualDate}
              className="w-full bg-accent-600 hover:bg-accent-500 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              Set Deadline <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSetup;

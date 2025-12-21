import React from 'react';
import { X, BrainCircuit, Target, Lightbulb } from 'lucide-react';

interface MasterStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: string;
}

const MasterStrategyModal: React.FC<MasterStrategyModalProps> = ({ isOpen, onClose, strategy }) => {
  if (!isOpen) return null;

  // Simple Markdown-ish parser for display
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###') || trimmed.startsWith('**')) {
        return <h3 key={i} className="text-lg font-bold text-accent-400 mt-4 mb-2">{trimmed.replace(/#/g, '').replace(/\*\*/g, '')}</h3>;
      }
      if (trimmed.startsWith('- ')) {
        return <li key={i} className="ml-4 text-gray-300 mb-1">{trimmed.substring(2)}</li>;
      }
      if (trimmed.startsWith('1. ')) {
        return <li key={i} className="ml-4 text-gray-300 mb-1 list-decimal">{trimmed.substring(3)}</li>;
      }
      return <p key={i} className="text-gray-300 mb-2 leading-relaxed">{trimmed}</p>;
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-gray-950/90 backdrop-blur-2xl border border-accent-500/30 rounded-2xl w-full max-w-3xl h-[85vh] shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-300 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-accent-900/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-500/20 rounded-lg border border-accent-500/30">
                <BrainCircuit className="w-6 h-6 text-accent-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Master Strategy</h2>
              <p className="text-xs text-gray-400">AI-Powered Inter-Hackathon Planning</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="prose prose-invert max-w-none">
                {renderContent(strategy)}
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-accent-500/10 border border-accent-500/20 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-accent-400 font-bold text-sm uppercase">
                        <Target className="w-4 h-4" /> Strategic Focus
                    </div>
                    <p className="text-xs text-gray-400">
                        This plan prioritizes deadlines and shared resource usage to maximize your output across all competitions.
                    </p>
                </div>
                 <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-yellow-400 font-bold text-sm uppercase">
                        <Lightbulb className="w-4 h-4" /> Tip
                    </div>
                    <p className="text-xs text-gray-400">
                        Review this strategy weekly as you complete tasks to keep the AI's context up to date.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MasterStrategyModal;
import React, { useState, useRef } from 'react';
import { Sparkles, Wand2, Image as ImageIcon, Upload, Download, Loader2, Monitor } from 'lucide-react';
import { generateImage, editImage } from '../services/geminiService';
import { ImageSize } from '../types';

interface ImageStudioProps {
  onSetBackground: (url: string) => void;
}

const ImageStudio: React.FC<ImageStudioProps> = ({ onSetBackground }) => {
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  
  // Generation State
  const [genPrompt, setGenPrompt] = useState('');
  const [genSize, setGenSize] = useState<ImageSize>('1K');
  const [genResult, setGenResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);


  // Edit State
  const [editPrompt, setEditPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceMimeType, setSourceMimeType] = useState<string>('image/png');
  const [editResult, setEditResult] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);




  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;

    setIsGenerating(true);
    setGenResult(null);
    try {
      const result = await generateImage(genPrompt, genSize);
      setGenResult(result);
    } catch (error: any) {
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || !sourceImage) return;

    setIsEditing(true);
    setEditResult(null);
    try {
      const result = await editImage(sourceImage, sourceMimeType, editPrompt);
      setEditResult(result);
    } catch (error) {
      alert("Failed to edit image. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setSourceMimeType(file.type);
        setEditResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 space-y-6">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-accent-400" />
            Creative Studio
          </h2>
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 backdrop-blur-sm">
            <button
              onClick={() => setMode('generate')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'generate' ? 'bg-accent-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Generate (Pro)
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'edit' ? 'bg-accent-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Edit (Flash)
            </button>
          </div>
        </div>

        {mode === 'generate' ? (
          <div className="space-y-6">


            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prompt</label>
                <textarea
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder="A futuristic cyberpunk city with neon lights..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-gray-200 focus:ring-1 focus:ring-accent-500/50 outline-none h-24 resize-none placeholder:text-gray-600"
                />
              </div>
              <div className="w-full md:w-48 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resolution</label>
                  <select 
                    value={genSize}
                    onChange={(e) => setGenSize(e.target.value as ImageSize)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-gray-200 focus:ring-1 focus:ring-accent-500/50 outline-none appearance-none"
                  >
                    <option value="1K">1K (Square)</option>
                    <option value="2K">2K (High Res)</option>
                    <option value="4K">4K (Ultra Res)</option>
                  </select>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !genPrompt}
                  className="w-full h-12 bg-accent-600 hover:bg-accent-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-accent-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Generate
                </button>
              </div>
            </div>

            {genResult && (
              <div className="border border-white/10 rounded-xl overflow-hidden bg-black/50 relative group shadow-2xl backdrop-blur-md">
                <img src={genResult} alt="Generated" className="w-full h-auto object-contain max-h-[500px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 justify-between">
                  <button
                    onClick={() => downloadImage(genResult, `tempo-gen-${Date.now()}.png`)}
                    className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Save
                  </button>
                  <button
                    onClick={() => onSetBackground(genResult)}
                    className="bg-accent-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-accent-500 transition-colors shadow-lg shadow-accent-500/20"
                  >
                    <Monitor className="w-4 h-4" /> Set as Wallpaper
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Source Column */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Original Image</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed border-white/10 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-accent-500/50 hover:bg-white/5 relative overflow-hidden ${!sourceImage ? 'bg-black/30' : 'bg-black'}`}
                >
                  {sourceImage ? (
                    <img src={sourceImage} alt="Source" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Click to upload image</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Edit Controls */}
              <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Edit Instruction</label>
                   <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="E.g., Add a retro filter, Remove the person in the background..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-gray-200 focus:ring-1 focus:ring-accent-500/50 outline-none h-32 resize-none placeholder:text-gray-600"
                  />
                </div>
                <button
                  onClick={handleEdit}
                  disabled={isEditing || !editPrompt || !sourceImage}
                  className="w-full h-12 bg-accent-600 hover:bg-accent-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-accent-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  Apply Edit
                </button>
              </div>
            </div>

            {/* Result Area */}
            {editResult && (
              <div className="space-y-2 pt-4 border-t border-white/10">
                <label className="text-xs font-bold text-accent-400 uppercase tracking-wider">Result</label>
                <div className="border border-white/10 rounded-xl overflow-hidden bg-black/50 relative group shadow-2xl backdrop-blur-md">
                  <img src={editResult} alt="Edited" className="w-full h-auto object-contain max-h-[500px]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 justify-between">
                    <button
                      onClick={() => downloadImage(editResult, `tempo-edit-${Date.now()}.png`)}
                      className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={() => onSetBackground(editResult)}
                      className="bg-accent-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-accent-500 transition-colors shadow-lg shadow-accent-500/20"
                    >
                      <Monitor className="w-4 h-4" /> Set as Wallpaper
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageStudio;
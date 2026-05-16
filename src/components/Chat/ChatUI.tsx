import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, MoveUpRight, Camera } from 'lucide-react';
import { ChatMessage, analyzeMatchImage } from '../../services/geminiService';

interface ChatUIProps {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (input: string) => void;
  chatLoading: boolean;
  handleChatSend: () => void;
  handleImageAnalysis: (file: File) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatUI: React.FC<ChatUIProps> = ({
  chatOpen,
  setChatOpen,
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  handleChatSend,
  handleImageAnalysis,
  chatEndRef
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageAnalysis(file);
  };
  return (
    <>
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-bg rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(0,229,160,0.3)] hover:scale-110 active:scale-95 transition-all z-[90]"
      >
        <MessageSquare className="w-6 h-6 fill-current" />
      </button>

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[380px] h-[500px] bg-bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden"
          >
            <div className="bg-bg-alt border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  🤖
                </div>
                <div>
                  <h3 className="font-bold text-sm">CricketMind Assistant</h3>
                  <p className="text-[10px] text-text-muted">Powered by Gemini</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                      ? 'bg-accent text-bg rounded-tr-sm'
                      : 'bg-bg-alt border border-border text-gray-200 rounded-tl-sm'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-bg-alt border border-border p-3 rounded-2xl rounded-tl-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 bg-bg-alt border-t border-border">
              <div className="relative flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-bg border border-border rounded-xl text-accent hover:bg-accent/10 transition-colors"
                  title="Match Snap (Analyze Image)"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                    placeholder="Ask tactics..."
                    className="w-full bg-bg border border-border rounded-xl pl-4 pr-10 py-3 text-sm focus:border-accent focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || chatLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-accent hover:bg-accent/10 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    <MoveUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

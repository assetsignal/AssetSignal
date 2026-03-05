import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface ChatBotProps {
  profile: any;
  financialData: any;
  analysisResult: any;
  onUpdatePreleaseBeds: (beds: number) => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ profile, financialData, analysisResult, onUpdatePreleaseBeds }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const findGLLine = (query: string, data: any): any => {
    const search = (obj: any): any => {
      if (!obj) return null;
      if (obj.accountCode === query || (obj.name && obj.name.toLowerCase().includes(query.toLowerCase()))) {
        return obj;
      }
      if (obj.subcategories) {
        for (const sub of obj.subcategories) {
          const found = search(sub);
          if (found) return found;
        }
      }
      if (typeof obj === 'object') {
        for (const key in obj) {
          const found = search(obj[key]);
          if (found) return found;
        }
      }
      return null;
    };
    return search(data);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputText('');
    setIsLoading(true);

    try {
      const lower = userMessage.toLowerCase();
      const bedsMatch = lower.match(/(?:set|update)\s+.*?(\d{1,4})\s*(?:beds?)?/);
      if (bedsMatch) {
        const beds = Number(bedsMatch[1]);
        onUpdatePreleaseBeds(beds);
        setMessages(prev => [...prev, { role: 'model', text: `Updated preleased beds to ${beds}.` }]);
        return;
      }

      const glMatch = userMessage.match(/\b\d{4}\b|market rent|rental income|payroll|utilities|taxes|marketing|admin/i);
      if (glMatch) {
        const details = findGLLine(glMatch[0], financialData);
        if (details) {
          setMessages(prev => [...prev, {
            role: 'model',
            text: `Details for ${details.name} (${details.accountCode || 'N/A'}):\n- Current Month Actual: $${(details.currentMonthActual || 0).toLocaleString()}\n- Current Month Budget: $${(details.currentMonthBudget || 0).toLocaleString()}\n- YTD Actual: $${(details.actual || 0).toLocaleString()}\n- YTD Budget: $${(details.budget || 0).toLocaleString()}`
          }]);
        } else {
          setMessages(prev => [...prev, { role: 'model', text: `I could not find "${glMatch[0]}" in the loaded GL lines.` }]);
        }
        return;
      }

      const context = JSON.stringify({
        propertyName: profile.propertyName,
        totalBeds: profile.totalBeds,
        preleasedBeds: profile.preleasedBeds,
        attentionLevel: analysisResult?.attentionLevel || null,
      });

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: 'You are the Asset Signal Customer Service Assistant. Be professional, concise, and helpful.',
          history: messages,
          message: userMessage,
          context,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'AI chat request failed.');
      }
      setMessages(prev => [...prev, { role: 'model', text: data.text || "I'm sorry, I couldn't process that." }]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      if (error?.message?.includes('429') || error?.status === 429) {
        setMessages(prev => [...prev, { role: 'model', text: "OpenAI quota or rate limit reached. Please retry shortly or check your API plan." }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: "I encountered an error. Verify OPENAI_API_KEY in .env and try again." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-brand-line overflow-hidden flex flex-col"
            style={{ height: '500px' }}
          >
            {/* Header */}
            <div className="bg-brand-ink p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-tight">Asset Signal Assistant</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] opacity-60 uppercase font-bold">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-ink/[0.01]"
            >
              {messages.length === 0 && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-ink/5 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6 text-brand-ink/20" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-brand-ink">How can I help you today?</p>
                    <p className="text-xs text-brand-ink/40">Try: "Update prelease beds to 450" or "Tell me about Market Rent"</p>
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-brand-ink text-white rounded-tr-none' 
                      : 'bg-white border border-brand-line text-brand-ink shadow-sm rounded-tl-none'
                  }`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-brand-line p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-ink/40" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-brand-line bg-white">
              <div className="relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="w-full bg-brand-ink/5 border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-brand-ink/10 outline-none transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-ink text-white rounded-lg disabled:opacity-20 transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-brand-ink text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-brand-ink/90 transition-colors relative group"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
        )}
        <div className="absolute right-full mr-4 bg-brand-ink text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Chat with Assistant
        </div>
      </motion.button>
    </div>
  );
};

export default ChatBot;

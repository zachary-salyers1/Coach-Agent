import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { sendCoachMessage } from '../services/gemini';
import { saveChatHistory } from '../services/storage';
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface CoachChatProps {
  history: ChatMessage[];
  setHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  profile: UserProfile;
}

const CoachChat: React.FC<CoachChatProps> = ({ history, setHistory, profile }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input.trim(),
      timestamp: Date.now()
    };

    const updatedHistory = [...history, userMsg];
    setHistory(updatedHistory);
    saveChatHistory(updatedHistory);
    setInput('');
    setIsTyping(true);

    try {
      // Convert internal chat format to Gemini format
      const geminiHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const responseText = await sendCoachMessage(geminiHistory, userMsg.text, profile);

      const modelMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: responseText || "Sorry, I'm reflecting on that. Ask me again.",
        timestamp: Date.now()
      };

      const finalHistory = [...updatedHistory, modelMsg];
      setHistory(finalHistory);
      saveChatHistory(finalHistory);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    setHistory([]);
    saveChatHistory([]);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Bot className="text-indigo-400" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100">Coach Focus</h2>
            <p className="text-xs text-slate-400">Online & Ready</p>
          </div>
        </div>
        <button onClick={handleClear} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-4">
        {history.length === 0 && (
          <div className="text-center mt-20 opacity-50">
            <Bot size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">Ask me anything about your business strategy, <br/>marketing, or time management.</p>
          </div>
        )}
        
        {history.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
              }`}
            >
              <ReactMarkdown 
                components={{
                  ul: ({node, ...props}) => <ul className="list-disc pl-4 mt-2 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-indigo-300" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-700 flex items-center gap-2">
              <Loader2 className="animate-spin text-indigo-400" size={16} />
              <span className="text-xs text-slate-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your coach..."
            className="w-full bg-slate-900 border border-slate-800 rounded-full py-3 pl-4 pr-12 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 bg-indigo-600 hover:bg-indigo-500 p-2 rounded-full text-white disabled:opacity-50 disabled:bg-slate-700 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachChat;

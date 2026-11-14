import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, ShieldCheck } from 'lucide-react';
import { useSalon } from '../context/SalonContext';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

const renderInlineFormatted = (text: string) => {
  // Parse **bold** parts
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-purple-700 dark:text-yellow-300">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

const FormattedAiMessage: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const isBulletLine = (line: string) => {
    return (
      line.startsWith('•') ||
      line.startsWith('* ') ||
      line.startsWith('- ') ||
      /^\d+\.\s/.test(line)
    );
  };

  const cleanBullet = (line: string) => {
    return line.replace(/^[•\*\-]\s*/, '').replace(/^\d+\.\s*/, '');
  };

  const elements: React.ReactNode[] = [];
  let currentBullets: string[] = [];

  const flushBullets = (keyIdx: number) => {
    if (currentBullets.length > 0) {
      elements.push(
        <ul key={`ul-${keyIdx}`} className="space-y-1.5 my-1.5 pl-1">
          {currentBullets.map((bullet, bIdx) => (
            <li key={bIdx} className="flex items-start gap-2 text-[11px] sm:text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-yellow-400 shrink-0 mt-1.5"></span>
              <span className="leading-relaxed">{renderInlineFormatted(bullet)}</span>
            </li>
          ))}
        </ul>
      );
      currentBullets = [];
    }
  };

  lines.forEach((line, idx) => {
    if (isBulletLine(line)) {
      currentBullets.push(cleanBullet(line));
    } else {
      flushBullets(idx);
      elements.push(
        <p key={`p-${idx}`} className="text-[11px] sm:text-xs leading-relaxed">
          {renderInlineFormatted(line)}
        </p>
      );
    }
  });

  flushBullets(lines.length);

  return <div className="space-y-1.5">{elements}</div>;
};

export const AiAssistantWidget: React.FC = () => {
  const { isAiChatOpen, toggleAiChat, closeAiChat, openQuizModal, settings } = useSalon();
  
  const advPct = settings.advancePercentage || 10;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: `✨ **Welcome to Modern Unisex Salon • Mohol!**\nI am your AI Beauty & Grooming Consultant.\n• Ask about our haircuts, keratin, bridal makeover & facials\n• Inquire about our transparent ${advPct}% online advance booking policy\n• Hours: 09:00 AM - 10:00 PM Daily | Master Stylist: Dinesh Ghodake.\nHow can I help you today?`,
      time: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAiChatOpen) {
      scrollToBottom();
    }
  }, [messages, isAiChatOpen]);

  const getInstantExpertAnswer = (query: string): string | null => {
    const lower = query.toLowerCase();
    if (lower.includes('price') || lower.includes('cost') || lower.includes('rate') || lower.includes('advance') || lower.includes('deposit') || lower.includes('10%')) {
      return `💳 **Transparent Booking & Payment:**\n• **Online Reservation:** Pay only **${advPct}% Advance Deposit** via PhonePe or Google Pay UPI QR Scanner straight to our bank account.\n• **Balance Amount:** The remaining ${100 - Number(advPct)}% is paid at salon reception after your service.\n• **Zero Convenience Fee:** Direct UPI transfer saves all third-party charges!`;
    }
    if (lower.includes('timing') || lower.includes('hour') || lower.includes('time') || lower.includes('open') || lower.includes('close')) {
      return `⏰ **Salon Timings & Schedule:**\n• **Operating Hours:** Open Daily from **09:00 AM to 10:00 PM**\n• **Location:** Mohol, B.N. Gund Complex, Kurul Road\n• **Stylist & Founder:** Dinesh Ghodake\n• **Bookings:** Reserve your preferred 3-4 hour slot online!`;
    }
    if (lower.includes('owner') || lower.includes('dinesh') || lower.includes('stylist') || lower.includes('founder') || lower.includes('contact')) {
      return `💈 **Modern Unisex Salon Mohol:**\n• **Founder & Master Stylist:** Dinesh Ghodake\n• **Contact Phone:** +91 8104026257\n• **Email:** dineshghodake941@gmail.com\n• **Location:** B.N. Gund Complex, Opp. Market, Mohol`;
    }
    if (lower.includes('facial') || lower.includes('skin') || lower.includes('glow')) {
      return `🌸 **Glowing Skin & Facial Therapies:**\n• **Radiance Facial:** Barrier repair & deep hydration (₹1,800)\n• **Hydra-Glow Cleansing:** Fruit peel & pore extraction (₹2,500)\n• **Instant De-Tan Ritual:** Removes sun tan in 45 mins (₹1,200)\n• **Offer:** Apply available coupon in booking for up to 20% off!`;
    }
    if (lower.includes('hair') || lower.includes('cut') || lower.includes('keratin') || lower.includes('beard')) {
      return `✂️ **Hair & Grooming Excellence:**\n• **Precision Razor Haircut & Styling:** Designed for your face shape (₹850)\n• **Brazilian Keratin Smoothing:** Frizz-free, glassy hair for months (₹4,200)\n• **Executive Beard Sculpting & Charcoal Shave:** Sharp lines & skin detox (₹650)`;
    }
    return null;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Instant performance response check
    const instantAns = getInstantExpertAnswer(query);
    if (instantAns) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now() + 1}`,
            sender: 'ai',
            text: instantAns,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 120);
      return;
    }

    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: data.reply || `I am glad to assist you at Modern Unisex Salon Mohol. You can reserve any service with only a ${advPct}% advance deposit!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const fallback = getInstantExpertAnswer(query) || `✨ **Modern Unisex Salon • Mohol:**\n• **Services:** Hair styling, Facials, Keratin, Grooming, Bridal\n• **Hours:** 09:00 AM - 10:00 PM Daily\n• **Advance Deposit:** Only **${advPct}%** online via UPI scanner to confirm your seat!`;
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: fallback,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    `How does the ${advPct}% advance deposit work?`,
    "Salon timings & Mohol location",
    "Recommend a facial for dull skin",
    "Executive beard & haircut cost"
  ];

  return (
    <>
      {/* Floating Widget Trigger Button */}
      <div className="fixed bottom-[76px] right-3 sm:bottom-6 sm:right-6 z-40">
        <button
          id="ai-assistant-floating-btn"
          onClick={toggleAiChat}
          className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white dark:bg-gradient-to-r dark:from-yellow-500 dark:to-amber-500 dark:hover:from-yellow-400 dark:hover:to-amber-400 dark:text-black font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xl shadow-purple-600/30 dark:shadow-yellow-500/30 border border-purple-400/40 dark:border-yellow-300/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white dark:text-black" />
          <span>AI Assistant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-700 animate-pulse"></span>
        </button>
      </div>

      {/* Expandable Chat Drawer/Modal */}
      {isAiChatOpen && (
        <div className="fixed inset-x-3 bottom-20 sm:inset-x-auto sm:bottom-20 sm:right-6 z-50 sm:w-96 max-w-md rounded-2xl bg-white dark:bg-[#141418] border border-purple-300 dark:border-yellow-500/40 shadow-2xl overflow-hidden flex flex-col h-[480px] sm:h-[520px] max-h-[75vh] text-zinc-900 dark:text-zinc-200 animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="bg-purple-50/80 dark:bg-gradient-to-r dark:from-zinc-950 dark:via-[#1c190c] dark:to-zinc-950 border-b border-purple-200 dark:border-yellow-500/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-600/15 dark:bg-yellow-500/20 border border-purple-300 dark:border-yellow-500/40 flex items-center justify-center text-purple-700 dark:text-yellow-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-yellow-400 flex items-center gap-1.5">
                  <span>Modern Unisex Salon AI</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono font-bold">Online</span>
                </div>
                <div className="text-[10px] text-zinc-600 dark:text-zinc-400">Beauty &amp; Booking Consultant • Mohol</div>
              </div>
            </div>

            <button
              onClick={closeAiChat}
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Info Badge */}
          <div className="bg-purple-100/70 dark:bg-yellow-500/10 border-b border-purple-200 dark:border-yellow-500/20 px-3 py-1.5 text-[11px] text-purple-950 dark:text-yellow-300/90 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700 dark:text-yellow-400" />
              {advPct}% Advance Deposit Direct UPI Scanner
            </span>
            <button
              onClick={() => {
                closeAiChat();
                openQuizModal();
              }}
              className="underline text-purple-800 dark:text-yellow-400 font-bold cursor-pointer"
            >
              Take Quiz
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-purple-50/20 dark:bg-transparent">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-yellow-500/20 border border-purple-200 dark:border-yellow-500/30 flex items-center justify-center text-purple-700 dark:text-yellow-400 shrink-0 text-xs mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white dark:bg-yellow-500 dark:text-black font-medium rounded-tr-none'
                      : 'bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 rounded-tl-none space-y-1.5'
                  }`}
                >
                  {msg.sender === 'ai' ? (
                    <FormattedAiMessage text={msg.text} />
                  ) : (
                    <p>{msg.text}</p>
                  )}
                  <div className={`text-[9px] ${msg.sender === 'user' ? 'text-white/80 dark:text-black/70' : 'text-zinc-500 dark:text-zinc-500'} text-right mt-1`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-xs text-zinc-600 dark:text-zinc-400">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-yellow-500/20 flex items-center justify-center text-purple-700 dark:text-yellow-400 animate-spin">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>AI Expert typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 border-t border-purple-200/80 dark:border-zinc-800/80 bg-purple-50/50 dark:bg-zinc-950/60 overflow-x-auto flex gap-1.5 no-scrollbar">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 hover:bg-purple-100 dark:hover:bg-yellow-500/20 border border-purple-200 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-yellow-500/40 text-[10px] text-zinc-900 dark:text-zinc-300 hover:text-purple-800 dark:hover:text-yellow-400 transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-purple-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex gap-2">
            <input
              type="text"
              placeholder="Ask about treatments, pricing, offers..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-3 py-2 rounded-xl bg-purple-50/40 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-600 dark:focus:border-yellow-400"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-yellow-500 dark:hover:bg-yellow-400 disabled:opacity-40 text-white dark:text-black font-bold transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

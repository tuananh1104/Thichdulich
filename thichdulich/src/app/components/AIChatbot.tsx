"use client";

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MessageCircle, X, Send, Bot, User, Sparkles, MapPin, Clock, Star, Wallet, Users, CalendarDays, CreditCard, ArrowUpRight, ImageIcon, Palmtree } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import api, { getApiErrorMessage } from '../../services/api';
import { useTourManagement } from '../contexts/TourManagementContext';
import { AIRecommendationService } from '../services/AIRecommendationService';

interface ChatTour {
  id: string;
  name: string;
  location: string;
  type?: string;
  duration?: number;
  price?: number;
  image?: string;
  rating?: number;
  reviewCount?: number;
  url: string;
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  tours?: ChatTour[];
  timestamp: Date;
}

export function AIChatbot() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { tours: allTours } = useTourManagement();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>(
    localStorage.getItem('aiChatSessionId') || crypto.randomUUID()
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('aiChatSessionId', sessionIdRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen || messages.length === 0 || isTyping) return;

    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.type !== 'bot') return;

    const normalized = lastMessage.content.toLowerCase();
    const shouldCloseSoon =
      normalized.includes('hỗ trợ thêm gì không') ||
      normalized.includes('need any more help');
    const timeoutMs = shouldCloseSoon ? 120000 : 300000;

    idleTimerRef.current = window.setTimeout(() => {
      const closingMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: language === 'vi'
          ? 'Mình xin kết thúc cuộc trò chuyện tại đây. Khi cần hỗ trợ thêm, bạn cứ mở chat lại nhé.'
          : 'I will close this chat for now. Please reopen it whenever you need more help.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, closingMessage]);
      window.setTimeout(() => setIsOpen(false), 1200);
    }, timeoutMs);

    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [isOpen, messages, isTyping, language]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: language === 'vi'
          ? 'Xin chào! Tôi là trợ lý AI của Thích Du Lịch. Tôi có thể giúp bạn tìm tour theo địa điểm, ngày đi, số người, ngân sách, hoặc hướng dẫn thanh toán/hủy hoàn tiền.\n\nBạn muốn tìm tour như thế nào?'
          : 'Hello! I am Thich Du Lich AI assistant. I can help you find tours by destination, date, group size, budget, or explain payment/cancellation policies.\n\nWhat kind of tour are you looking for?',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, language]);

  const handleSendMessage = async (presetMessage?: string) => {
    const content = (typeof presetMessage === 'string' ? presetMessage : inputValue).trim();
    if (!content || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }

    try {
      const chatContext = messages
        .slice(-6)
        .map((message) => `${message.type === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
        .join('\n');
      const response = await api.sendChatMessage(content, language, chatContext, sessionIdRef.current);
      if (response.sessionId) {
        sessionIdRef.current = response.sessionId;
        localStorage.setItem('aiChatSessionId', response.sessionId);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.reply,
        tours: normalizeChatTours(response.tours),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const fallbackTours = AIRecommendationService.smartSearch(content, allTours).slice(0, 4);
      if (fallbackTours.length > 0) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: language === 'vi'
            ? `Tôi tìm được ${fallbackTours.length} tour phù hợp với "${content}". Bạn bấm vào card bên dưới để xem chi tiết.`
            : `I found ${fallbackTours.length} tours matching "${content}". Click a card below for details.`,
          tours: fallbackTours.map(tour => ({
            id: tour.id,
            name: language === 'vi' ? tour.name.vi : tour.name.en,
            location: tour.location,
            type: tour.type,
            duration: tour.duration,
            price: tour.price,
            image: tour.image,
            rating: tour.rating,
            reviewCount: tour.reviews,
            url: `/tours/${tour.id}`,
          })),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
        return;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: getApiErrorMessage(
          error,
          language === 'vi'
            ? 'Hiện tại trợ lý AI chưa phản hồi được, vui lòng thử lại sau.'
            : 'The AI assistant is unavailable right now. Please try again later.'
        ),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = language === 'vi' ? [
    { label: 'Tour biển hot', prompt: 'Gợi ý tour biển hot', icon: Palmtree, bg: '#FFFFFF', accent: '#E0F2FE' },
    { label: 'Tour cho gia đình', prompt: 'Gợi ý tour phù hợp cho gia đình', icon: Users, bg: '#FFFFFF', accent: '#ECFDF5' },
    { label: 'Tour 2-3 ngày', prompt: 'Tìm tour thời lượng 2 đến 3 ngày', icon: CalendarDays, bg: '#FFFFFF', accent: '#EFF6FF' },
    { label: 'Thanh toán & hoàn tiền', prompt: 'Hướng dẫn thanh toán, hủy tour và hoàn tiền', icon: CreditCard, bg: '#FFFFFF', accent: '#FDF2F8' },
  ] : [
    { label: 'Hot beach tours', prompt: 'Recommend hot beach tours', icon: Palmtree, bg: '#FFFFFF', accent: '#E0F2FE' },
    { label: 'Family tours', prompt: 'Recommend family-friendly tours', icon: Users, bg: '#FFFFFF', accent: '#ECFDF5' },
    { label: '2-3 day tours', prompt: 'Find tours lasting 2 to 3 days', icon: CalendarDays, bg: '#FFFFFF', accent: '#EFF6FF' },
    { label: 'Payment & refund', prompt: 'Explain payment, cancellation and refund policy', icon: CreditCard, bg: '#FFFFFF', accent: '#FDF2F8' },
  ];

  const formatPrice = (value?: number) => {
    if (!value) return language === 'vi' ? 'Liên hệ' : 'Contact';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const normalizeChatTours = (tours?: Partial<ChatTour>[]) => {
    if (!Array.isArray(tours)) return [];

    return tours
      .filter((tour) => tour && tour.id)
      .map((tour) => {
        const price = Number(tour.price);
        const rating = Number(tour.rating);
        const reviewCount = Number(tour.reviewCount);
        return {
          id: String(tour.id),
          name: tour.name || (language === 'vi' ? 'Tour chưa cập nhật tên' : 'Unnamed tour'),
          location: tour.location || (language === 'vi' ? 'Chưa cập nhật địa điểm' : 'Location pending'),
          type: tour.type,
          duration: Number.isFinite(Number(tour.duration)) ? Number(tour.duration) : undefined,
          price: Number.isFinite(price) && price > 0 ? price : undefined,
          image: getImageSrc(tour.image),
          rating: Number.isFinite(rating) && rating > 0 ? rating : undefined,
          reviewCount: Number.isFinite(reviewCount) && reviewCount >= 0 ? reviewCount : undefined,
          url: tour.url || `/tours/${tour.id}`,
        };
      });
  };

  const getImageSrc = (image?: string) => {
    if (!image) return '';
    if (image.startsWith('http') || image.startsWith('/')) return image;
    return `/${image.replace(/^\/+/, '')}`;
  };

  const formatRating = (rating?: number, reviewCount?: number) => {
    if (!rating) return language === 'vi' ? 'Chưa có đánh giá' : 'No reviews yet';
    const count = reviewCount ? ` (${reviewCount})` : '';
    return `${rating.toFixed(1)}${count}`;
  };

  const formatTourType = (type?: string) => {
    if (!type) return '';
    const labels: Record<string, { vi: string; en: string }> = {
      adventure: { vi: 'Phiêu lưu', en: 'Adventure' },
      beach: { vi: 'Biển đảo', en: 'Beach' },
      cultural: { vi: 'Văn hóa', en: 'Cultural' },
      food: { vi: 'Ẩm thực', en: 'Food' },
      nature: { vi: 'Thiên nhiên', en: 'Nature' },
      mountain: { vi: 'Núi', en: 'Mountain' },
      city: { vi: 'Thành phố', en: 'City' },
    };
    const key = type.toLowerCase().replace(/\s+/g, '_');
    if (labels[key]) return labels[key][language === 'vi' ? 'vi' : 'en'];

    const normalized = type.toLowerCase().replace(/_/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('aiChatSessionId');
    sessionIdRef.current = crypto.randomUUID();
    localStorage.setItem('aiChatSessionId', sessionIdRef.current);
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: language === 'vi'
        ? 'Xin chào! Tôi là trợ lý AI của Thích Du Lịch. Tôi có thể giúp bạn tìm tour theo địa điểm, ngày đi, số người, ngân sách, hoặc hướng dẫn thanh toán/hủy hoàn tiền.\n\nBạn muốn tìm tour như thế nào?'
        : 'Hello! I am Thich Du Lich AI assistant. I can help you find tours by destination, date, group size, budget, or explain payment/cancellation policies.\n\nWhat kind of tour are you looking for?',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
        style={isOpen
          ? { background: 'linear-gradient(135deg, #EF4444, #DC2626)', transform: 'rotate(90deg)', boxShadow: '0 8px 24px rgba(220,38,38,0.4)' }
          : { background: 'linear-gradient(135deg, #0064D2, #0091FF)', boxShadow: '0 8px 28px rgba(0,100,210,0.45)' }
        }
        aria-label="AI Chatbot"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed inset-x-3 bottom-20 z-50 flex flex-col overflow-hidden shadow-2xl animate-slide-up sm:left-auto sm:right-6 sm:bottom-24 sm:w-[390px]"
          style={{
            height: 'min(620px, calc(100dvh - 104px))',
            borderRadius: 24,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 30px 70px rgba(0,100,210,0.12), 0 0 0 1px rgba(0,100,210,0.05)',
          }}
        >
          {/* Header */}
          <div
            className="p-4 text-white flex items-center gap-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0A2540, #1E3A5F)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <Bot className="w-5 h-5 text-blue-300 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">
                  {language === 'vi' ? 'Trợ lý AI Thích Du Lịch' : 'Thichdulich AI'}
                </h3>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              </div>
              <p className="text-[11px]" style={{ color: 'rgba(180,210,255,0.65)' }}>
                {language === 'vi' ? 'Sẵn sàng hỗ trợ 24/7' : 'Available 24/7'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title={language === 'vi' ? 'Xóa lịch sử chat' : 'Clear history'}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 hover:text-white"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60 hover:text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'rgba(248, 250, 255, 0.5)' }}>
            {messages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                language={language}
                onNavigateTour={(url) => {
                  setIsOpen(false);
                  navigate(url);
                }}
                formatTourType={formatTourType}
                formatPrice={formatPrice}
                formatRating={formatRating}
              />
            ))}

            {isTyping && (
              <div className="flex gap-2.5 justify-start animate-pulse">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderBottomLeftRadius: 4 }}
                >
                  <div className="flex gap-1.5 items-center">
                    {[0, 150, 300].map(delay => (
                      <div
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: '#0064D2', animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Horizontal Scrollable Chips */}
          <div className="flex-shrink-0 px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto flex gap-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {quickQuestions.map((question, index) => {
              const Icon = question.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question.prompt)}
                  className="flex items-center gap-1.5 shrink-0 rounded-full border border-slate-200 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-xs font-bold text-slate-700 hover:text-blue-700 active:scale-[0.98]"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{question.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input */}
          <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid #F3F4F6', background: 'white' }}>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={language === 'vi' ? 'Hỏi gì đó...' : 'Ask something...'}
                className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{
                  border: '1.5px solid #E5E7EB',
                  background: '#F9FAFB',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#0064D2'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)', boxShadow: '0 4px 12px rgba(0,100,210,0.35)' }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Sub-component for typewriter text effect
interface TypewriterTextProps {
  text: string;
  onComplete?: () => void;
  speed?: number;
}

export function TypewriterText({ text, onComplete, speed = 6 }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span className="whitespace-pre-line leading-relaxed">{displayedText}</span>;
}

// Sub-component for chat bubble
interface ChatMessageBubbleProps {
  message: Message;
  language: string;
  onNavigateTour: (url: string) => void;
  formatTourType: (type?: string) => string;
  formatPrice: (value?: number) => string;
  formatRating: (rating?: number, reviewCount?: number) => string;
}

export function ChatMessageBubble({
  message,
  language,
  onNavigateTour,
  formatTourType,
  formatPrice,
  formatRating
}: ChatMessageBubbleProps) {
  const [isTypingDone, setIsTypingDone] = useState(message.type === 'user');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMarkdown = (txt: string) => {
    const lines = txt.split('\n');
    return lines.map((line, idx) => {
      let content = line;
      // parse bold **text** -> <strong>text</strong>
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      if (line.trim().startsWith('- ')) {
        const itemText = content.trim().substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: itemText }} />
        );
      }
      return (
        <p key={idx} className="text-xs leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: content }} />
      );
    });
  };

  return (
    <div className={`flex gap-2.5 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.type === 'bot' && (
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}
        >
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`${message.tours && message.tours.length > 0 ? 'max-w-[90%]' : 'max-w-[78%]'} px-3.5 py-2.5 rounded-2xl relative group`}
        style={message.type === 'user'
          ? {
              background: 'linear-gradient(135deg, #0064D2, #0091FF)',
              color: 'white',
              borderBottomRightRadius: 4,
            }
          : {
              background: 'white',
              color: '#1F2937',
              border: '1px solid rgba(0,0,0,0.06)',
              borderBottomLeftRadius: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }
        }
      >
        {/* Copy Button */}
        {message.type === 'bot' && (
          <button
            onClick={handleCopy}
            title={language === 'vi' ? 'Sao chép tin nhắn' : 'Copy message'}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            )}
          </button>
        )}

        {message.type === 'bot' && !isTypingDone ? (
          <TypewriterText
            text={message.content}
            speed={6}
            onComplete={() => setIsTypingDone(true)}
          />
        ) : (
          <div>{renderMarkdown(message.content)}</div>
        )}

        {/* Tour Cards (Rendered as horizontal slider if typing completed) */}
        {isTypingDone && message.type === 'bot' && message.tours && message.tours.length > 0 && (
          <div className="mt-3 flex overflow-x-auto gap-3 pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-200" style={{ maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
            {message.tours.map((tour) => (
              <button
                key={tour.id}
                onClick={() => onNavigateTour(tour.url || `/tours/${tour.id}`)}
                className="group w-[200px] shrink-0 overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg focus:outline-none"
                style={{ borderColor: '#E2E8F0' }}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  {tour.image ? (
                    <img
                      src={tour.image}
                      alt={tour.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-slate-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  {tour.type && (
                    <span className="absolute left-1.5 top-1.5 max-w-[calc(100%-12px)] truncate rounded bg-white/95 px-1.5 py-0.5 text-[8px] font-bold text-slate-700 shadow-sm">
                      {formatTourType(tour.type)}
                    </span>
                  )}
                </div>

                <div className="p-2.5">
                  <p className="line-clamp-2 min-h-[32px] text-[11px] font-bold leading-4 text-slate-950">
                    {tour.name}
                  </p>

                  <div className="mt-1.5 space-y-1 text-[9px] text-slate-600">
                    <div className="flex min-w-0 items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0 text-blue-500" />
                      <span className="truncate">{tour.location}</span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {tour.duration ? `${tour.duration} ${language === 'vi' ? 'ngày' : 'days'}` : (language === 'vi' ? 'Lịch linh hoạt' : 'Flexible')}
                        </span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {formatRating(tour.rating, tour.reviewCount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-1 border-t border-slate-100 pt-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-black text-blue-700">
                        {formatPrice(tour.price)}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                      {language === 'vi' ? 'Xem' : 'View'}
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        <p
          className="text-[10px] mt-1"
          style={{ color: message.type === 'user' ? 'rgba(255,255,255,0.6)' : '#94A3B8' }}
        >
          {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {message.type === 'user' && (
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #FF6000, #FF8C00)' }}
        >
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}

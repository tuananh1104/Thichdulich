"use client";

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MessageCircle, X, Send, Bot, User, Sparkles, MapPin, Clock, Star, Wallet, Users, CalendarDays, CreditCard, ArrowUpRight, ImageIcon } from 'lucide-react';
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
    const content = (presetMessage ?? inputValue).trim();
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
    { label: 'Tìm theo ngân sách', prompt: 'Tôi muốn tìm tour theo ngân sách', icon: Wallet, bg: '#FFFFFF', accent: '#FFF7ED' },
    { label: 'Tour cho gia đình', prompt: 'Gợi ý tour phù hợp cho gia đình', icon: Users, bg: '#FFFFFF', accent: '#ECFDF5' },
    { label: 'Tour 2-3 ngày', prompt: 'Tìm tour thời lượng 2 đến 3 ngày', icon: CalendarDays, bg: '#FFFFFF', accent: '#EFF6FF' },
    { label: 'Thanh toán & hoàn tiền', prompt: 'Hướng dẫn thanh toán, hủy tour và hoàn tiền', icon: CreditCard, bg: '#FFFFFF', accent: '#FDF2F8' },
  ] : [
    { label: 'Find by budget', prompt: 'I want to find tours by budget', icon: Wallet, bg: '#FFFFFF', accent: '#FFF7ED' },
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

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
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
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed inset-x-3 bottom-20 z-50 flex flex-col overflow-hidden shadow-2xl animate-slide-up sm:left-auto sm:right-6 sm:bottom-24 sm:w-[380px]"
          style={{
            height: 'min(580px, calc(100dvh - 104px))',
            borderRadius: 20,
            background: 'white',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,100,210,0.08)',
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
              <Bot className="w-5 h-5 text-blue-300" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">
                  {language === 'vi' ? 'Trợ lý AI Thích Du Lịch' : 'Thichdulich AI'}
                </h3>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              </div>
              <p className="text-xs" style={{ color: 'rgba(180,210,255,0.65)' }}>
                {language === 'vi' ? 'Sẵn sàng hỗ trợ 24/7' : 'Available 24/7'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#F8FAFF' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'bot' && (
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}
                  >
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`${message.tours && message.tours.length > 0 ? 'max-w-[86%]' : 'max-w-[78%]'} px-3.5 py-2.5 rounded-2xl`}
                  style={message.type === 'user'
                    ? {
                        background: 'linear-gradient(135deg, #0064D2, #0091FF)',
                        color: 'white',
                        borderBottomRightRadius: 4,
                      }
                    : {
                        background: 'white',
                        color: '#1F2937',
                        border: '1px solid #E5E7EB',
                        borderBottomLeftRadius: 4,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      }
                  }
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                  {message.type === 'bot' && message.tours && message.tours.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.tours.map((tour) => (
                        <button
                          key={tour.id}
                          onClick={() => {
                            setIsOpen(false);
                            navigate(tour.url || `/tours/${tour.id}`);
                          }}
                          className="group w-full overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                          style={{ borderColor: '#E2E8F0' }}
                        >
                          <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                            {tour.image ? (
                              <img
                                src={tour.image}
                                alt={tour.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-slate-400">
                                <ImageIcon className="h-7 w-7" />
                              </div>
                            )}
                            {tour.type && (
                              <span className="absolute left-2 top-2 max-w-[calc(100%-16px)] truncate rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
                                {formatTourType(tour.type)}
                              </span>
                            )}
                          </div>

                          <div className="p-3">
                            <p className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-slate-950">
                              {tour.name}
                            </p>

                            <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                <span className="truncate">{tour.location}</span>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex min-w-0 items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                  <span className="truncate">
                                    {tour.duration ? `${tour.duration} ${language === 'vi' ? 'ngày' : 'days'}` : (language === 'vi' ? 'Lịch linh hoạt' : 'Flexible schedule')}
                                  </span>
                                </span>
                                <span className="inline-flex shrink-0 items-center gap-1">
                                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                  {formatRating(tour.rating, tour.reviewCount)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-3 flex items-end justify-between gap-2 border-t border-slate-100 pt-2.5">
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase text-slate-400">
                                  {language === 'vi' ? 'Từ' : 'From'}
                                </p>
                                <p className="truncate text-sm font-black text-blue-700">
                                  {formatPrice(tour.price)}
                                </p>
                              </div>
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                {language === 'vi' ? 'Xem' : 'View'}
                                <ArrowUpRight className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <p
                    className="text-xs mt-1"
                    style={{ color: message.type === 'user' ? 'rgba(255,255,255,0.6)' : '#CBD5E1' }}
                  >
                    {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.type === 'user' && (
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #FF6000, #FF8C00)' }}
                  >
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{ background: 'white', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderBottomLeftRadius: 4 }}
                >
                  <div className="flex gap-1.5 items-center">
                    {[0, 150, 300].map(delay => (
                      <div
                        key={delay}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: '#CBD5E1', animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: '1px solid #E5E7EB', background: '#F8FAFC' }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: '#475569' }}>
                  {language === 'vi' ? 'Bạn có thể hỏi' : 'Try asking'}
                </p>
                <span className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: '#0F172A' }}>
                  <Sparkles className="h-2.5 w-2.5 text-amber-300" />
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickQuestions.map((question, index) => {
                  const Icon = question.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question.prompt)}
                      className="group flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md active:scale-[0.99]"
                      style={{
                        background: question.bg,
                        color: '#0F172A',
                      }}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-700"
                        style={{ background: question.accent }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 text-[11px] font-black leading-tight text-slate-800">
                        {question.label}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* Input */}
          <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid #F3F4F6', background: 'white' }}>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
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
                onClick={handleSendMessage}
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

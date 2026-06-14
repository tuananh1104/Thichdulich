"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Send, MessageSquare, X, MapPin, Clock,
  ChevronDown, CheckCheck, Check, Smile, Paperclip,
  Building2, Package, AlertCircle, CheckCircle, RefreshCw, XCircle,
  Star, Zap,
} from 'lucide-react';
import api from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  senderRole: 'admin' | 'provider';
  senderName: string;
  message: string;
  timestamp: string;
}

export interface Conversation {
  tourId: string;
  tourName: string;
  tourImage: string;
  tourStatus: string;
  providerName: string;
  providerId: string;
  messages: ChatMessage[];
}

interface MessagingSystemProps {
  initialConversations: Conversation[];
  /** 'admin' = right-side bubble is orange, 'provider' = right-side bubble is blue */
  role: 'admin' | 'provider';
  currentUserName: string;
  /** Quick reply chips shown only for admin */
  quickReplies?: string[];
  onUnreadCountChange?: (count: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const tourStatusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  approved:  { label: 'Đã duyệt',      color: '#059669', bg: '#D1FAE5', icon: CheckCircle },
  pending:   { label: 'Chờ duyệt',     color: '#D97706', bg: '#FEF3C7', icon: Clock },
  rejected:  { label: 'Bị từ chối',    color: '#DC2626', bg: '#FEE2E2', icon: XCircle },
  need_edit: { label: 'Cần chỉnh sửa', color: '#7C3AED', bg: '#F5F3FF', icon: AlertCircle },
  updated:   { label: 'Đã cập nhật',   color: '#0064D2', bg: '#DBEAFE', icon: RefreshCw },
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay === 1) return 'Hôm qua ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function getInitials(name: string): string {
  return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['#0064D2', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#BE185D'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function splitMessageImages(message: string): { text: string; images: string[] } {
  const imageUrls: string[] = [];
  const textLines = message.split('\n').filter(line => {
    const match = line.trim().match(/^(?:\d+\.\s*)?(https?:\/\/\S+)$/);
    if (!match) return true;
    imageUrls.push(match[1]);
    return false;
  });
  return { text: textLines.join('\n').trim(), images: imageUrls };
}

function MessageContent({ message, isSelf }: { message: string; isSelf: boolean }) {
  const { text, images } = splitMessageImages(message);

  return (
    <div className="space-y-2">
      {text && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          {images.map((url, index) => (
            <a
              key={`${url}-${index}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-lg border"
              style={{ borderColor: isSelf ? 'rgba(255,255,255,0.45)' : '#E2E8F0' }}
            >
              <img
                src={url}
                alt={`Anh bao cao ${index + 1}`}
                className="h-24 w-full object-cover"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const DEFAULT_QUICK_REPLIES = [
  'Đã nhận được thông tin, chúng tôi sẽ xem xét sớm.',
  'Vui lòng cập nhật lại thông tin và gửi để chúng tôi duyệt.',
  'Tour đã được duyệt, chúc mừng!',
  'Thông tin cần bổ sung: ảnh chất lượng cao và mô tả chi tiết.',
  'Vui lòng liên hệ hotline 1900xxxx để được hỗ trợ nhanh hơn.',
];

// ─── Component ────────────────────────────────────────────────────────────────
function latestMessageTime(conversation: Conversation): number {
  const latest = conversation.messages[conversation.messages.length - 1]?.timestamp;
  return new Date(latest || 0).getTime();
}

export function MessagingSystem({
  initialConversations,
  role,
  currentUserName,
  quickReplies = DEFAULT_QUICK_REPLIES,
  onUnreadCountChange,
}: MessagingSystemProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId]           = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].tourId : null
  );
  const [readAtByTour, setReadAtByTour] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`tour-message-read-${role}`) || '{}');
    } catch {
      return {};
    }
  });
  const [searchQuery, setSearchQuery]     = useState('');
  const [input, setInput]                 = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [sending, setSending]             = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  const accentColor  = role === 'admin' ? '#FF6000' : '#0064D2';
  const accentGrad   = role === 'admin'
    ? 'linear-gradient(135deg, #FF6000, #FF8C3A)'
    : 'linear-gradient(135deg, #0064D2, #0091FF)';

  const activeConv = conversations.find(c => c.tourId === activeId) ?? null;

  const markConversationRead = useCallback((tourId: string) => {
    setReadAtByTour(prev => {
      const next = { ...prev, [tourId]: Date.now() };
      localStorage.setItem(`tour-message-read-${role}`, JSON.stringify(next));
      return next;
    });
  }, [role]);

  const getUnreadCount = useCallback((conversation: Conversation) => {
    const readAt = readAtByTour[conversation.tourId] || 0;
    return conversation.messages.filter(message =>
      message.senderRole !== role && new Date(message.timestamp).getTime() > readAt
    ).length;
  }, [readAtByTour, role]);

  const mergeBackendMessages = useCallback(async () => {
    if (initialConversations.length === 0) {
      setConversations([]);
      setActiveId(null);
      return;
    }

    const loaded = await Promise.all(initialConversations.map(async conv => {
      try {
        const data = await api.getTourMessages(conv.tourId);
        const messages = (data || []).map((m: any) => ({
          id: m.id,
          senderRole: (m.senderRole || 'provider').toLowerCase() as ChatMessage['senderRole'],
          senderName: m.senderName,
          message: m.message,
          timestamp: m.sentAt || m.timestamp,
        }));
        return { ...conv, messages: messages.length > 0 ? messages : conv.messages };
      } catch {
        return conv;
      }
    }));

    const sorted = [...loaded].sort((a, b) => latestMessageTime(b) - latestMessageTime(a));
    setConversations(sorted);
    setActiveId(prev => prev && sorted.some(c => c.tourId === prev) ? prev : sorted[0]?.tourId ?? null);
  }, [initialConversations]);

  useEffect(() => {
    mergeBackendMessages();
  }, [mergeBackendMessages]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      mergeBackendMessages();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [mergeBackendMessages]);

  useEffect(() => {
    if (activeId) {
      markConversationRead(activeId);
    }
  }, [activeId, activeConv?.messages.length, markConversationRead]);

  useEffect(() => {
    const totalUnread = conversations.reduce((sum, conversation) => sum + getUnreadCount(conversation), 0);
    onUnreadCountChange?.(totalUnread);
  }, [conversations, getUnreadCount, onUnreadCountChange]);

  // Auto-scroll to bottom when messages change or active conversation changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages.length, activeId]);

  // Filter conversations
  const filteredConvs = conversations.filter(c =>
    c.tourName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.providerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeId || sending) return;
    setSending(true);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderRole: role,
      senderName: currentUserName,
      message: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setConversations(prev =>
      prev.map(c =>
        c.tourId === activeId
          ? { ...c, messages: [...c.messages, newMsg] }
          : c
      )
    );
    setInput('');
    setShowQuickReplies(false);
    api.sendTourMessage(activeId, newMsg.message, currentUserName)
      .then(saved => {
        const savedMsg: ChatMessage = {
          id: saved.id,
          senderRole: (saved.senderRole || role).toLowerCase() as ChatMessage['senderRole'],
          senderName: saved.senderName || currentUserName,
          message: saved.message || newMsg.message,
          timestamp: saved.sentAt || newMsg.timestamp,
        };
        setConversations(prev =>
          prev.map(c =>
            c.tourId === activeId
              ? { ...c, messages: c.messages.map(m => m.id === newMsg.id ? savedMsg : m) }
              : c
          )
        );
      })
      .catch(error => {
        console.error('Failed to send tour message:', error);
      })
      .finally(() => setSending(false));
  }, [input, activeId, sending, role, currentUserName]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Group messages by date
  const groupedMessages = (() => {
    if (!activeConv) return [];
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    activeConv.messages.forEach(msg => {
      const dateStr = formatDate(msg.timestamp);
      const last = groups[groups.length - 1];
      if (last && last.date === dateStr) {
        last.messages.push(msg);
      } else {
        groups.push({ date: dateStr, messages: [msg] });
      }
    });
    return groups;
  })();

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="flex min-h-0 overflow-hidden border border-gray-200 bg-white"
      style={{ height: '100%' }}
    >
      {/* ── LEFT: Conversation List ───────────────────────────────────── */}
      <div
        className="flex min-h-0 flex-col border-r border-gray-100 flex-shrink-0"
        style={{ width: 280 }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: accentGrad }}
            >
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="font-black text-gray-900 text-sm">Hội thoại</h3>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: '#F1F5F9', color: '#64748B' }}
            >
              {conversations.length}
            </span>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tour, nhà cung cấp..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-400">Không tìm thấy</p>
            </div>
          ) : filteredConvs.map(conv => {
            const isActive   = conv.tourId === activeId;
            const lastMsg    = conv.messages[conv.messages.length - 1];
            const statusConf = tourStatusConfig[conv.tourStatus] || tourStatusConfig.pending;
            const StatusIcon = statusConf.icon;
            const unread     = conv.tourId === activeId ? 0 : getUnreadCount(conv);

            return (
              <button
                key={conv.tourId}
                onClick={() => {
                  setActiveId(conv.tourId);
                  markConversationRead(conv.tourId);
                }}
                className="w-full text-left px-4 py-3 border-b border-gray-50 transition-all hover:bg-gray-50 relative"
                style={{ background: isActive ? `${accentColor}0D` : 'white' }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
                    style={{ background: accentColor }}
                  />
                )}
                <div className="flex gap-3">
                  {/* Tour image */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={conv.tourImage}
                      alt={conv.tourName}
                      className="w-11 h-11 rounded-xl object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=100'; }}
                    />
                    {unread > 0 && (
                      <div
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                        style={{ fontSize: '9px', fontWeight: 700, background: accentColor }}
                      >
                        {unread}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                        {conv.tourName}
                      </p>
                      {lastMsg && (
                        <p className="text-xs flex-shrink-0" style={{ color: '#94A3B8', fontSize: '10px' }}>
                          {formatTimestamp(lastMsg.timestamp)}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-1.5" style={{ fontSize: '10px' }}>
                      <Building2 className="w-2.5 h-2.5 inline mr-0.5" />
                      {conv.providerName}
                    </p>
                    {lastMsg ? (
                      <p className="text-xs text-gray-500 truncate leading-tight" style={{ fontSize: '11px' }}>
                        <span className={lastMsg.senderRole === role ? 'opacity-60' : 'font-medium'}>
                          {lastMsg.senderRole === role ? 'Bạn: ' : ''}
                        </span>
                        {lastMsg.message}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-300 italic" style={{ fontSize: '11px' }}>Chưa có tin nhắn</p>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                    style={{ background: statusConf.bg, color: statusConf.color, fontSize: '10px' }}
                  >
                    <StatusIcon className="w-2.5 h-2.5" />
                    {statusConf.label}
                  </span>
                  <span className="text-xs text-gray-400" style={{ fontSize: '10px' }}>
                    {conv.messages.length} tin
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Chat Window ─────────────────────────────────────────── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div
            className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #FAFBFC, #F1F5F9)' }}
          >
            <img
              src={activeConv.tourImage}
              alt={activeConv.tourName}
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-sm"
              onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=100'; }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-gray-900 text-sm truncate">{activeConv.tourName}</h4>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {activeConv.providerName}
                </span>
                {(() => {
                  const conf = tourStatusConfig[activeConv.tourStatus] || tourStatusConfig.pending;
                  const Icon = conf.icon;
                  return (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                      style={{ background: conf.bg, color: conf.color }}
                    >
                      <Icon className="w-3 h-3" />
                      {conf.label}
                    </span>
                  );
                })()}
              </div>
            </div>
            {/* Message count */}
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold" style={{ color: accentColor }}>{activeConv.messages.length}</p>
              <p className="text-xs text-gray-400">tin nhắn</p>
            </div>
          </div>

          {/* Messages area */}
          <div
            className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-1"
            style={{ background: '#F8FAFC' }}
          >
            {activeConv.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${accentColor}15` }}
                >
                  <MessageSquare className="w-8 h-8" style={{ color: accentColor }} />
                </div>
                <p className="font-bold text-gray-700 mb-1">Chưa có tin nhắn</p>
                <p className="text-sm text-gray-400 max-w-xs">
                  {role === 'admin'
                    ? 'Gửi tin nhắn đầu tiên để bắt đầu trao đổi với Provider về tour này.'
                    : 'Gửi câu hỏi hoặc phản hồi để trao đổi với Admin về tour này.'}
                </p>
              </div>
            ) : (
              groupedMessages.map((group, gi) => (
                <div key={gi}>
                  {/* Date separator */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{ background: '#E2E8F0', color: '#64748B' }}
                    >
                      {group.date}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div className="space-y-3">
                    {group.messages.map((msg, mi) => {
                      const isSelf    = msg.senderRole === role;
                      const prevMsg   = gi === 0 ? group.messages[mi - 1] : (mi === 0 ? groupedMessages[gi - 1]?.messages.slice(-1)[0] : group.messages[mi - 1]);
                      const nextMsg   = group.messages[mi + 1];
                      const isFirst   = !prevMsg || prevMsg.senderRole !== msg.senderRole;
                      const isLast    = !nextMsg || nextMsg.senderRole !== msg.senderRole;
                      const avatarCol = getAvatarColor(msg.senderName);

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2.5 ${isSelf ? 'flex-row-reverse' : 'flex-row'} ${isLast ? 'mb-3' : 'mb-0.5'}`}
                        >
                          {/* Avatar */}
                          <div className="flex-shrink-0 w-7">
                            {isLast && (
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black"
                                style={{ background: isSelf ? accentColor : avatarCol }}
                              >
                                {getInitials(msg.senderName)}
                              </div>
                            )}
                          </div>

                          {/* Bubble */}
                          <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[68%]`}>
                            {isFirst && (
                              <p className="text-xs font-bold mb-1 px-1" style={{ color: '#94A3B8' }}>
                                {isSelf ? 'Bạn' : msg.senderName}
                              </p>
                            )}
                            <div
                              className="px-4 py-2.5 shadow-sm"
                              style={{
                                background: isSelf ? accentGrad : 'white',
                                color: isSelf ? 'white' : '#1E293B',
                                borderRadius: isSelf
                                  ? (isFirst ? '18px 18px 4px 18px' : (isLast ? '18px 4px 18px 18px' : '18px 4px 4px 18px'))
                                  : (isFirst ? '18px 18px 18px 4px' : (isLast ? '4px 18px 18px 18px' : '4px 18px 18px 4px')),
                                border: isSelf ? 'none' : '1px solid #F1F5F9',
                                maxWidth: '100%',
                              }}
                            >
                              <MessageContent message={msg.message} isSelf={isSelf} />
                            </div>
                            {isLast && (
                              <div className={`flex items-center gap-1 mt-1 px-1 ${isSelf ? 'flex-row-reverse' : ''}`}>
                                <p className="text-xs" style={{ color: '#94A3B8', fontSize: '10px' }}>
                                  {formatTime(msg.timestamp)}
                                </p>
                                {isSelf && (
                                  <CheckCheck className="w-3 h-3" style={{ color: '#94A3B8' }} />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies (admin only) */}
          {role === 'admin' && showQuickReplies && (
            <div
              className="max-h-28 overflow-y-auto px-4 py-3 border-t border-gray-100 flex-shrink-0"
              style={{ background: '#FAFBFC' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <p className="text-xs font-bold" style={{ color: accentColor }}>Phản hồi nhanh</p>
                <button
                  onClick={() => setShowQuickReplies(false)}
                  className="ml-auto p-0.5 rounded hover:bg-gray-200"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(qr); setShowQuickReplies(false); inputRef.current?.focus(); }}
                    className="text-xs px-3 py-1.5 rounded-full border transition-all hover:shadow-sm text-left"
                    style={{ borderColor: '#E2E8F0', color: '#475569', background: 'white' }}
                  >
                    {qr.length > 50 ? qr.slice(0, 50) + '…' : qr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div
            className="px-4 py-3 border-t border-gray-100 flex-shrink-0"
            style={{ background: 'white' }}
          >
            <div
              className="flex items-end gap-3 rounded-2xl px-4 py-2.5"
              style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
            >
              {/* Quick reply toggle (admin only) */}
              {role === 'admin' && (
                <button
                  onClick={() => setShowQuickReplies(p => !p)}
                  className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
                  style={{
                    background: showQuickReplies ? `${accentColor}15` : 'transparent',
                    color: showQuickReplies ? accentColor : '#94A3B8',
                  }}
                  title="Phản hồi nhanh"
                >
                  <Zap className="w-4 h-4" />
                </button>
              )}

              <textarea
                ref={inputRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  // Auto resize
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 84) + 'px';
                }}
                onKeyDown={handleKeyDown}
                placeholder={role === 'admin'
                  ? 'Nhập tin nhắn trao đổi với Provider… (Enter để gửi)'
                  : 'Nhập câu hỏi hoặc phản hồi cho Admin… (Enter để gửi)'}
                className="flex-1 bg-transparent text-sm focus:outline-none resize-none text-gray-800 placeholder-gray-400"
                style={{ minHeight: 24, maxHeight: 84, lineHeight: '1.5' }}
                rows={1}
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{
                  background: input.trim() ? accentGrad : '#E2E8F0',
                  boxShadow: input.trim() ? `0 2px 8px ${accentColor}40` : 'none',
                }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 px-1">
              Shift+Enter để xuống dòng • Enter để gửi
            </p>
          </div>
        </div>
      ) : (
        /* Empty state - no conversation selected */
        <div className="flex-1 flex flex-col items-center justify-center" style={{ background: '#F8FAFC' }}>
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
            style={{ background: `${accentColor}12` }}
          >
            <MessageSquare className="w-10 h-10" style={{ color: accentColor }} />
          </div>
          <h3 className="font-black text-gray-800 text-lg mb-2">Chọn cuộc trò chuyện</h3>
          <p className="text-sm text-gray-400 text-center max-w-xs">
            Chọn một tour từ danh sách bên trái để xem và trao đổi tin nhắn
          </p>
        </div>
      )}
    </div>
  );
}

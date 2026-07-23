import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send, 
  ArrowUpRight,
  Loader2,
  Smartphone,
  ExternalLink,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { DeviceOrder } from '../types';

interface AdminSupportProps {
  orders: DeviceOrder[];
}

export default function AdminSupport({ orders }: AdminSupportProps) {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Listen to all support chats in real-time
  useEffect(() => {
    const q = query(collection(db, 'support_chats'), orderBy('lastActivity', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Filter out records without a valid topic to prevent empty initial docs
      setChats(list.filter((c) => c.topic));
    }, (err) => {
      console.warn("Firestore support_chats collection read blocked", err);
    });
    return () => unsub();
  }, []);

  // 2. Listen to the selected chat metadata
  useEffect(() => {
    if (!selectedChatId) {
      setSelectedChat(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'support_chats', selectedChatId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSelectedChat({ id: snap.id, ...data });

        // If chat is unread by admin, mark as read
        if (data.unreadByAdmin) {
          setDoc(doc(db, 'support_chats', selectedChatId), { unreadByAdmin: false }, { merge: true })
            .catch(err => console.warn(err));
        }
      }
    });
    return () => unsub();
  }, [selectedChatId]);

  // 3. Listen to messages for selected chat
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, 'support_chats', selectedChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMessages(list);
    }, (err) => {
      console.warn("Could not read message history", err);
    });
    return () => unsub();
  }, [selectedChatId]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter & Search Logic
  const filteredChats = React.useMemo(() => {
    return chats.filter((c) => {
      const matchesSearch = 
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.topic?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'open' && c.status === 'open') ||
        (statusFilter === 'resolved' && c.status === 'resolved');

      return matchesSearch && matchesStatus;
    });
  }, [chats, searchQuery, statusFilter]);

  // Find related order
  const relatedOrder = React.useMemo(() => {
    if (!selectedChat) return null;
    const userEmail = selectedChat.email?.toLowerCase();
    const userId = selectedChat.userId;
    // Find latest order for this user
    return orders.find(
      (o) => 
        (o.userId && o.userId === userId) || 
        (o.email && o.email.toLowerCase() === userEmail)
    );
  }, [selectedChat, orders]);

  // Stats calculations
  const stats = React.useMemo(() => {
    const open = chats.filter((c) => c.status === 'open').length;
    const resolved = chats.filter((c) => c.status === 'resolved').length;
    const pendingReplies = chats.filter((c) => c.status === 'open' && c.unreadByAdmin).length;
    return { open, resolved, pendingReplies };
  }, [chats]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatId || !selectedChat) return;

    const text = replyText.trim();
    setReplyText('');
    setSending(true);

    try {
      const msgId = 'msg_' + Math.random().toString(36).substring(2, 15);
      // 1. Add message
      await setDoc(doc(db, 'support_chats', selectedChatId, 'messages', msgId), {
        id: msgId,
        sender: 'admin',
        content: text,
        createdAt: new Date().toISOString(),
        read: false
      });

      // 2. Update chat parent metadata
      await setDoc(doc(db, 'support_chats', selectedChatId), {
        lastMessage: text,
        lastActivity: new Date().toISOString(),
        unreadByUser: true,
        unreadByAdmin: false
      }, { merge: true });

      // 3. Create Notification for user
      const notifId = 'notif_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        icon: 'MessageSquare',
        title: 'New Support Message',
        description: `Administrator: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
        time: new Date().toISOString(),
        read: false,
        type: 'chat',
        userId: selectedChatId
      });

    } catch (err) {
      console.error("Error sending admin reply:", err);
    } finally {
      setSending(false);
    }
  };

  const handleToggleStatus = async (status: 'open' | 'resolved') => {
    if (!selectedChatId || !selectedChat) return;
    try {
      await setDoc(doc(db, 'support_chats', selectedChatId), { status }, { merge: true });
      
      // Send message alert inside chat log
      const msgId = 'msg_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'support_chats', selectedChatId, 'messages', msgId), {
        id: msgId,
        sender: 'admin',
        content: `* System: Conversation marked as ${status.toUpperCase()} by Administrator. *`,
        createdAt: new Date().toISOString(),
        read: true
      });

      // Create Admin Log
      const logId = 'log_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'logs', logId), {
        id: logId,
        action: 'Support State Changed',
        details: `Administrator marked support chat of ${selectedChat.email} as ${status}`,
        user: 'Administrator',
        time: new Date().toISOString(),
        type: 'info'
      });

    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* 1. KEY METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm text-left flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold text-[10px] uppercase font-mono tracking-wider block">Open Conversations</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{stats.open}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1E4DFF]">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm text-left flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold text-[10px] uppercase font-mono tracking-wider block">Pending Replies (Unread)</span>
            <span className="text-2xl font-black text-amber-600 font-mono flex items-center gap-2">
              {stats.pendingReplies}
              {stats.pendingReplies > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm text-left flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold text-[10px] uppercase font-mono tracking-wider block">Resolved Tickets</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">{stats.resolved}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. CHAT LAYOUT COMPONENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left pane: Conversations List (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col h-[600px] overflow-hidden text-left">
          
          {/* Header Search & Filtering */}
          <div className="p-4 border-b border-slate-50 space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search email, username, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 text-xs pl-9 pr-4 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4DFF]"
              />
            </div>

            {/* Filter segments */}
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-[10px] font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({chats.length})
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                  statusFilter === 'open' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Open ({stats.open})
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                  statusFilter === 'resolved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Resolved ({stats.resolved})
              </button>
            </div>
          </div>

          {/* List display */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredChats.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-30 animate-pulse" />
                <p className="text-xs font-semibold">No support chats match current filters.</p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = chat.id === selectedChatId;
                const isUnread = chat.unreadByAdmin;
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`w-full p-4.5 text-left transition flex items-start gap-3.5 border-l-4 ${
                      isSelected 
                        ? 'bg-blue-50/40 border-l-[#1E4DFF]' 
                        : isUnread 
                          ? 'bg-amber-50/10 border-l-amber-400' 
                          : 'border-l-transparent hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-extrabold text-slate-600 text-xs">
                      {chat.email ? chat.email.charAt(0).toUpperCase() : 'C'}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-slate-900 truncate">
                          {chat.username || chat.email}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap font-mono shrink-0">
                          {chat.lastActivity ? new Date(chat.lastActivity).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'}) : ''}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-700 font-extrabold leading-none flex items-center gap-1">
                        <span className="truncate">{chat.topic}</span>
                        {chat.status === 'resolved' && (
                          <span className="text-[8px] font-black uppercase text-red-500 bg-red-50 px-1 rounded">Resolved</span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 truncate font-medium">
                        {chat.lastMessage || 'Open support conversation.'}
                      </p>
                    </div>

                    {isUnread && (
                      <span className="w-2.5 h-2.5 bg-[#1E4DFF] rounded-full shrink-0 mt-1 animate-pulse" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Chat details / Messages (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col h-[600px] overflow-hidden text-left">
          
          {!selectedChat ? (
            <div className="m-auto text-center space-y-3 px-6 py-24 text-slate-400">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto border border-slate-100 shadow-inner">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider font-mono">Select a Ticket</h4>
                <p className="text-[11px] text-slate-400 leading-normal max-w-xs mx-auto">
                  Click a customer support conversation in the left pane to read history and exchange real-time responses.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Active Header */}
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="text-left space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{selectedChat.username || 'Customer'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({selectedChat.email})</span>
                  </div>
                  <div className="text-[11px] text-[#1E4DFF] font-extrabold flex items-center gap-1.5">
                    <span>Topic: {selectedChat.topic}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className={`text-[9px] font-black uppercase tracking-wider ${selectedChat.status === 'resolved' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {selectedChat.status === 'resolved' ? 'Resolved' : '🟢 Open'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedChat.status === 'open' ? (
                    <button
                      onClick={() => handleToggleStatus('resolved')}
                      className="bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 font-bold text-[10px] px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Mark Resolved
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus('open')}
                      className="bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-600 font-bold text-[10px] px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Reopen Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Related Order Info box */}
              {relatedOrder && (
                <div className="bg-blue-50/30 border-y border-blue-100/30 px-4 py-2.5 flex items-center justify-between text-left text-[11px] shrink-0">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#1E4DFF]" />
                    <div>
                      <span className="font-bold text-slate-800">Related Order: </span>
                      <span className="font-mono text-slate-600 font-bold">{relatedOrder.id} ({relatedOrder.imei})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-[#1E4DFF] font-black text-[9px] px-2 py-0.5 rounded uppercase font-mono">
                      {relatedOrder.status.replace('_', ' ')}
                    </span>
                    <span className="font-extrabold text-slate-700">${relatedOrder.price} USDT</span>
                  </div>
                </div>
              )}

              {/* Message View Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <span className="text-xs font-medium font-mono">No messages logged.</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';
                    const isSystem = msg.content.startsWith('* System:');
                    
                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center">
                          <span className="inline-block bg-slate-100 border border-slate-200 text-slate-500 px-3 py-1 rounded-full text-[9px] font-bold font-mono">
                            {msg.content.replace(/\*/g, '').trim()}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={msg.id} 
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} text-left`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                          isAdmin 
                            ? 'bg-[#1E4DFF] text-white' 
                            : 'bg-white border border-slate-100 text-slate-800'
                        }`}>
                          <div className="flex items-center justify-between gap-6 mb-1 text-[9px] font-bold opacity-60">
                            <span>{isAdmin ? 'Administrator' : 'Customer'}</span>
                            <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                          </div>
                          <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send Reply Form */}
              <form 
                onSubmit={handleSendReply}
                className="p-4 border-t border-slate-50 bg-white flex items-center gap-3 shrink-0"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={selectedChat.status === 'resolved' ? "This ticket is resolved. Reopen it to reply..." : "Type reply message..."}
                  disabled={selectedChat.status === 'resolved'}
                  className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1E4DFF] disabled:bg-slate-50 disabled:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending || selectedChat.status === 'resolved'}
                  className="bg-[#1E4DFF] hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold px-5 py-2.5 rounded-xl transition cursor-pointer text-xs flex items-center gap-1 shadow-md shadow-blue-500/10 shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Reply
                    </>
                  )}
                </button>
              </form>
            </>
          )}

        </div>

      </div>

    </div>
  );
}

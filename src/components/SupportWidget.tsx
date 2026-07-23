import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Clock, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  ChevronDown, 
  Loader2,
  LifeBuoy,
  Headphones,
  Trash2
} from 'lucide-react';
import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs,
  deleteDoc
} from 'firebase/firestore';

interface SupportWidgetProps {
  currentUser: any;
  userEmail: string;
  onNavigateToTab: (tab: 'home' | 'prices' | 'my-account' | 'login') => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SHORTCUTS = [
  { id: 'check_status', label: '📦 Check Order Status' },
  { id: 'delayed', label: '⏳ Delayed Unlock' },
  { id: 'rejected', label: '❌ Rejected Order' },
  { id: 'payment', label: '💳 Payment Help' },
  { id: 'refund', label: '💰 Request Refund' },
  { id: 'activation', label: '🔓 Activation Help' },
  { id: 'compatibility', label: '📱 Device Compatibility' },
  { id: 'how_unlock_works', label: 'ℹ️ How Our Unlock Works' },
  { id: 'talk_support', label: '💬 Talk to Support' }
];

export default function SupportWidget({
  currentUser,
  userEmail,
  onNavigateToTab,
  isOpen,
  setIsOpen
}: SupportWidgetProps) {
  const [chatInfo, setChatInfo] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleResetChat = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    setShowConfirmReset(false);
    try {
      const chatId = currentUser.uid;
      
      // 1. Fetch and delete all messages in messages subcollection
      const msgCollection = collection(db, 'support_chats', chatId, 'messages');
      const querySnapshot = await getDocs(msgCollection);
      const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      // 2. Delete the main chat document
      const chatRef = doc(db, 'support_chats', chatId);
      await deleteDoc(chatRef);

      // 3. Reset local states
      setChatInfo(null);
      setMessages([]);
    } catch (err) {
      console.error("Error resetting support chat:", err);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Listen to the chat document
  useEffect(() => {
    if (!currentUser?.uid) return;

    const chatRef = doc(db, 'support_chats', currentUser.uid);
    const unsub = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setChatInfo(data);
        
        // If chat has unread messages for user AND widget is open, mark as read
        if (data.unreadByUser && isOpen) {
          setDoc(chatRef, { unreadByUser: false }, { merge: true }).catch(err => {
            console.warn("Could not clear unreadByUser", err);
          });
        }
      } else {
        setChatInfo(null);
      }
    }, (err) => {
      console.warn("Could not read support_chat metadata", err);
    });

    return () => unsub();
  }, [currentUser?.uid, isOpen]);

  // 2. Listen to the messages list
  useEffect(() => {
    if (!currentUser?.uid) return;

    const msgCollection = collection(db, 'support_chats', currentUser.uid, 'messages');
    const q = query(msgCollection, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMessages(list);
    }, (err) => {
      console.warn("Could not read support_chat messages", err);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  // 3. Mark unread admin messages as read when the chat is open
  useEffect(() => {
    if (isOpen && currentUser?.uid && messages.length > 0) {
      const unreadAdminMsgs = messages.filter(m => m.sender === 'admin' && !m.read);
      if (unreadAdminMsgs.length > 0) {
        unreadAdminMsgs.forEach((msg) => {
          const msgRef = doc(db, 'support_chats', currentUser.uid, 'messages', msg.id);
          setDoc(msgRef, { read: true }, { merge: true }).catch(err => {
            console.warn("Could not mark message as read:", err);
          });
        });
      }
    }
  }, [isOpen, messages, currentUser?.uid]);

  // Scroll to bottom whenever messages list changes or widget opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 150);
    }
  }, [messages, isOpen]);

  const handleShortcutSelect = async (shortcutLabel: string) => {
    if (!currentUser?.uid) return;
    setLoading(true);
    
    try {
      const topicName = shortcutLabel.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
      const chatId = currentUser.uid;
      const chatRef = doc(db, 'support_chats', chatId);

      // 1. Create or overwrite active chat doc
      const chatData = {
        id: chatId,
        userId: currentUser.uid,
        email: userEmail || currentUser.email || 'customer@gmail.com',
        username: currentUser.displayName || userEmail.split('@')[0],
        topic: topicName,
        status: 'open',
        lastMessage: `Started support session on ${topicName}`,
        lastActivity: new Date().toISOString(),
        unreadByAdmin: true,
        unreadByUser: false,
        createdAt: new Date().toISOString()
      };

      await setDoc(chatRef, chatData);

      // 2. Add first message to messages collection
      const msgId = 'msg_' + Math.random().toString(36).substring(2, 15);
      const firstMsgRef = doc(db, 'support_chats', chatId, 'messages', msgId);
      await setDoc(firstMsgRef, {
        id: msgId,
        sender: 'user',
        content: `Hello, I need help with: ${shortcutLabel}`,
        createdAt: new Date().toISOString(),
        read: false
      });

      // 3. Create Admin Notification
      const notifId = 'notif_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        icon: 'MessageSquare',
        title: 'New Support Conversation',
        description: `User ${userEmail} initiated chat: ${topicName}`,
        time: new Date().toISOString(),
        read: false,
        type: 'chat',
        userId: 'admin'
      });

      // 4. Create Activity Log
      const logId = 'log_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'logs', logId), {
        id: logId,
        action: 'Support Session Started',
        details: `${userEmail} started support on "${topicName}"`,
        user: userEmail,
        time: new Date().toISOString(),
        type: 'info'
      });

      // 5. If specific shortcut "How Our Unlock Works" is selected, auto-send detailed process explanation
      if (topicName.includes('How Our Unlock Works') || shortcutLabel.includes('How Our Unlock Works')) {
        const autoMsgId = 'msg_' + Math.random().toString(36).substring(2, 15);
        const autoMsgRef = doc(db, 'support_chats', chatId, 'messages', autoMsgId);
        
        const explanation = `Hello! Here is a summarized explanation of how our 3uUnlocks process works:

1️⃣ Check Device Eligibility
Navigate to the "Device Compatibility" check tab and input your device's IMEI or Serial Number. The system will perform an instant network, Find My (FMI), and blacklist status check.

2️⃣ Check Unlock Price
Depending on the FMI and blacklist results, the system will determine the unlock tier (Clean or Blacklisted/Lost) and display the exact USDT price for your specific model.

3️⃣ Make USDT Payment
Copy our corporate USDT (TRC20) address from the pricing panel or your account page. Transfer the exact amount, then enter your transaction hash (TxID) in the deposit panel.

4️⃣ Automated Network Queue
Our backend GSX servers will verify your TxID and add your device to the unlock queue. Standard unlocks are processed remotely and typically complete within the displayed time limit.

5️⃣ Download Custom Firmware (Optional)
For certain legacy devices, a custom clean IPSW is generated. You can download and flash it using standard tools to activate the device.

If you have any questions or your unlock is delayed, our 24/7 support team is here to assist! Feel free to send us a message below.`;

        await setDoc(autoMsgRef, {
          id: autoMsgId,
          sender: 'admin',
          content: explanation,
          createdAt: new Date().toISOString(),
          read: true
        });

        // Update main chat meta to reflect the auto-response
        await setDoc(chatRef, {
          lastMessage: "Provided summarized process explanation.",
          unreadByAdmin: false, // Auto-handled by the bot
          unreadByUser: true   // Highlight for the user
        }, { merge: true });
      }

    } catch (err) {
      console.error("Error creating support chat via shortcut:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.uid) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const chatId = currentUser.uid;
      const chatRef = doc(db, 'support_chats', chatId);

      // 1. Add message
      const msgId = 'msg_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'support_chats', chatId, 'messages', msgId), {
        id: msgId,
        sender: 'user',
        content: messageText,
        createdAt: new Date().toISOString(),
        read: false
      });

      // 2. Update parent chat doc metadata
      await setDoc(chatRef, {
        lastMessage: messageText,
        lastActivity: new Date().toISOString(),
        unreadByAdmin: true,
        // If previous conversation was resolved, reopen it!
        status: 'open' 
      }, { merge: true });

      // 3. Admin Notification
      const notifId = 'notif_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        icon: 'MessageSquare',
        title: 'New Support Message',
        description: `From ${userEmail}: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`,
        time: new Date().toISOString(),
        read: false,
        type: 'chat',
        userId: 'admin'
      });

    } catch (err) {
      console.error("Error sending custom message:", err);
    }
  };

  const handleStartNewSession = async () => {
    if (!currentUser?.uid) return;
    if (!window.confirm("Start a new support conversation? This will permanently delete your entire conversation history on the server.")) return;
    
    setLoading(true);
    try {
      const chatId = currentUser.uid;
      
      // 1. Fetch and delete all messages in messages subcollection
      const msgCollection = collection(db, 'support_chats', chatId, 'messages');
      const querySnapshot = await getDocs(msgCollection);
      const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      // 2. Delete the main chat document
      const chatRef = doc(db, 'support_chats', chatId);
      await deleteDoc(chatRef);

      // 3. Reset local states
      setChatInfo(null);
      setMessages([]);
    } catch (err) {
      console.error("Error starting new support session:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  const unreadCount = messages.filter(m => m.sender === 'admin' && !m.read).length;
  const displayUnreadCount = unreadCount > 0 ? unreadCount : (chatInfo?.unreadByUser ? 1 : 0);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* 1. SUPPORT CHAT EXPANDED CARD */}
      {isOpen && (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-2xl w-[350px] sm:w-[380px] h-[500px] flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5 duration-200 text-slate-800">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-4.5 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <LifeBuoy className="w-4 h-4 animate-spin-slow text-[#1E4DFF]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black uppercase font-mono tracking-wider">3uUnlocks Live Support</h4>
                <p className="text-[10px] text-slate-400 font-medium">We usually reply within minutes</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 flex flex-col">
            
            {loading ? (
              <div className="my-auto flex flex-col items-center justify-center text-center py-12">
                <Loader2 className="w-6 h-6 text-[#1E4DFF] animate-spin mb-2" />
                <span className="text-[11px] font-medium text-slate-500 font-mono">Initializing session...</span>
              </div>
            ) : !chatInfo || !chatInfo.topic ? (
              
              /* FIRST TIME / CHOOSE SHORTCUT VIEW */
              <div className="space-y-4 my-auto">
                <div className="text-center space-y-1">
                  <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider font-mono">Select a Topic</h5>
                  <p className="text-[11px] text-slate-500">Choose an option below to start your support ticket immediately:</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {SHORTCUTS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleShortcutSelect(item.label)}
                      className="w-full text-left bg-white hover:bg-blue-50 border border-slate-100 hover:border-blue-100 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer shadow-sm hover:shadow-md"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              
              /* CHAT LOG SCREEN */
              <div className="space-y-3 flex-1 flex flex-col justify-end">
                {/* Chat Details Box */}
                <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-[11px] shrink-0 text-left">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[9px] font-mono leading-none mb-1">active topic</span>
                    <span className="font-extrabold text-slate-800">{chatInfo.topic}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-slate-400 font-bold block uppercase text-[9px] font-mono leading-none mb-1">status</span>
                      <span className={`font-black uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-full ${
                        chatInfo.status === 'resolved' 
                          ? 'bg-red-50 text-red-600 border border-red-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {chatInfo.status === 'resolved' ? 'Resolved' : 'Active'}
                      </span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setShowConfirmReset(true)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete History & Start New"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Confirmation for Reset */}
                {showConfirmReset && (
                  <div className="bg-red-50 border border-red-100 p-3 rounded-2xl space-y-2 shrink-0 text-left">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[10px] font-bold text-red-800 uppercase tracking-wider font-mono">Delete Chat History?</h5>
                        <p className="text-[9px] text-red-600 leading-normal">Permanently delete all messages and start a new session. This cannot be undone.</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowConfirmReset(false)}
                        className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleResetChat}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Delete & Reset
                      </button>
                    </div>
                  </div>
                )}

                {/* Messages List container */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 pr-1 py-2">
                  {messages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} text-left`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                          isAdmin 
                            ? 'bg-white border border-slate-100 text-slate-800' 
                            : 'bg-[#1E4DFF] text-white'
                        }`}>
                          <div className="flex items-center justify-between gap-6 mb-1 text-[9px] font-bold opacity-60">
                            <span>{isAdmin ? '🔧 Support Team' : 'You'}</span>
                            <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Session Actions if resolved */}
                {chatInfo.status === 'resolved' && (
                  <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl space-y-2 text-center shrink-0">
                    <p className="text-[10px] text-slate-500 font-medium">This support session is closed. Need more help?</p>
                    <button
                      onClick={handleStartNewSession}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      New Conversation
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer Input Area */}
          {chatInfo && chatInfo.topic && (
            <form 
              onSubmit={handleSendMessage} 
              className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={chatInfo.status === 'resolved' ? "Type to reopen conversation..." : "Type your message..."}
                className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-[#1E4DFF] font-medium"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-[#1E4DFF] hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white p-2.5 rounded-xl transition cursor-pointer shadow-sm shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      )}

      {/* 2. FLOATING BUTTON TRIGGER WITH SUBTLE ANIMATION */}
      <button
        id="floating-support-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-gradient-to-tr from-slate-900 to-slate-950 text-white rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 relative border border-slate-800 ${
          !isOpen ? 'animate-slow-bounce-pulse' : ''
        }`}
        title="Live Support Chat"
      >
        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping duration-1000 scale-105" />
        
        {isOpen ? (
          <ChevronDown className="w-6 h-6 animate-in spin-in-90 duration-200" />
        ) : (
          <div className="relative">
            <Headphones className="w-6 h-6" />
            {/* Realtime Unread indicator bubble showing unread message count */}
            {displayUnreadCount > 0 && (
              <span className="absolute -top-2.5 -right-2.5 min-w-[20px] h-5 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white px-1 animate-pulse">
                {displayUnreadCount}
              </span>
            )}
          </div>
        )}
      </button>

    </div>
  );
}

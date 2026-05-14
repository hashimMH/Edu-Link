'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { connectTeacherSocket } from '@/lib/socket';
import { useSocket } from '@/components/SocketProvider';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const [convs, setConvs] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatMsgs, setChatMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const activeChatRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { clearUnread } = useSocket();

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { scrollToBottom(); }, [chatMsgs, scrollToBottom]);

  // Load conversations
  useEffect(() => {
    api.getConversations().then(setConvs).finally(() => setLoading(false));
  }, []);

  // Listen for new messages in open chat
  useEffect(() => {
    const socket = connectTeacherSocket();

    const handler = (msg: any) => {
      if (activeChatRef.current && msg.chatId === (activeChatRef.current.chatId || activeChatRef.current.id)) {
        setChatMsgs(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, { id: msg.id, text: msg.text, time: msg.time, sender: 'other' }];
        });
      }
      // Refresh conversation list
      api.getConversations().then(setConvs);
    };

    socket.on('new_message', handler);
    return () => { socket.off('new_message', handler); };
  }, []);

  const openChat = async (conv: any) => {
    setActiveChat(conv);
    activeChatRef.current = conv;
    clearUnread(conv.chatId || conv.id);
    try { setChatMsgs(await api.getChatMessages(conv.chatId || conv.id)); }
    catch { setChatMsgs([]); }
  };

  const sendMsg = async () => {
    if (!text.trim() || !activeChat) return;
    const msgText = text.trim();
    setText('');
    try {
      const msg = await api.sendMessage(activeChat.id, msgText);
      setChatMsgs(prev => [...prev, msg]);
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Messages</h2>
      <div className="flex gap-4 h-[calc(100vh-200px)]">
        <div className="w-80 bg-white rounded-xl shadow-sm border overflow-y-auto flex-shrink-0">
          {convs.map(c => (
            <button key={c.id} onClick={() => openChat(c)}
              className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${activeChat?.id === c.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
              <p className="font-medium text-sm">{c.name}</p>
              <p className="text-xs text-gray-400 mt-1 truncate">{c.message}</p>
              <p className="text-xs text-gray-300 mt-1">{c.time}</p>
            </button>
          ))}
          {convs.length === 0 && <p className="text-gray-400 text-center py-8">No conversations</p>}
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border flex flex-col">
          {activeChat ? (
            <>
              <div className="p-4 border-b flex items-center gap-3">
                <button onClick={() => { setActiveChat(null); setChatMsgs([]); }} className="p-1 hover:bg-gray-100 rounded"><ArrowLeft size={18} /></button>
                <p className="font-semibold">{activeChat.name}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`max-w-[70%] px-4 py-2 rounded-xl text-sm ${m.sender === 'You' ? 'bg-primary text-white ml-auto' : 'bg-gray-100'}`}>
                    {m.text}
                    <p className={`text-xs mt-1 ${m.sender === 'You' ? 'text-white/60' : 'text-gray-400'}`}>{m.time}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t flex gap-2">
                <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()}
                  placeholder="Type a message..." className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                <button onClick={sendMsg} className="bg-primary text-white p-2 rounded-lg hover:bg-primary-dark"><Send size={18} /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center"><MessageSquare size={48} className="mx-auto mb-2 opacity-30" /><p>Select a conversation</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

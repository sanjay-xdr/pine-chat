"use client";
import { useEffect, useState, FormEvent, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient as createSupabaseBrowserClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthProvider'; 
import type { Message, Profile } from '@/types/supabase'; 
import {
    PaperAirplaneIcon, PaperClipIcon, FaceSmileIcon, MicrophoneIcon, 
     MagnifyingGlassIcon as SearchInChatIcon,
    CheckIcon as SingleTickIcon, CheckBadgeIcon as DoubleTickIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
    ClockIcon,
    QueueListIcon,
    HashtagIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';

const profileCache = new Map<string, Profile>();
async function getSenderProfile(supabaseClient: any, senderId: string): Promise<Profile | null> {
    if (profileCache.has(senderId)) return profileCache.get(senderId)!;
    const { data, error } = await supabaseClient.from('profiles').select('id, username, avatar_url').eq('id', senderId).single();
    if (error) { console.error("Error fetching profile:", error); return null; }
    if (data) profileCache.set(senderId, data);
    return data;
}

export default function ChatRoomPage() {
  const supabase = createSupabaseBrowserClient();
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const chatId = params.chatId as string;
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [chatDetails, setChatDetails] = useState<{ name?: string, participantsList?: string[], avatar?: string } | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [activeInputTab, setActiveInputTab] = useState<'whatsapp' | 'note'>('whatsapp');

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  type Chat = {
  id: string;
  chat_participants: {
    profiles: {
      id: string;
      username: string;
      avatar_url?: string;
    };
  }[];
};

type IncomingMessage= {
    id: string;
    content: string;
    chat_id: string;
    created_at: string;
    sender_id: string;
    profiles: {
        id: string;
        username: string;
        avatar_url?: string;
    }[];
}[] | null

  useEffect(() => {
    if (!chatId || !user) return;
    const fetchChatInfo = async () => {
        const { data: chatData, error: chatError }  : { data: Chat | null; error: any } = await supabase
            .from('chats')
            .select('id, chat_participants!inner(profiles(id, username, avatar_url))')
            .eq('id', chatId)
            .single();

        if (chatError) console.error("Error fetching chat info", chatError);
        else if (chatData) {
            const participants = chatData.chat_participants.map(p => p.profiles) as Profile[];
            const otherParticipants = participants.filter(p => p.id !== user.id);
            
            let mainAvatar = null;

           

            if (otherParticipants.length === 1) { 
                mainAvatar = otherParticipants[0].avatar_url;
            }

            
            setChatDetails({
                name: "Chat",
                participantsList: participants.map(p => p.username || 'Unknown').slice(0, 3),
                avatar: mainAvatar || undefined 
            });
        }
    };
    fetchChatInfo();
  }, [chatId, user, supabase]);

  useEffect(() => {
    if (!chatId || !user) return;
    setLoadingMessages(true);
    const fetchMessages = async () => {
      const { data, error } :{data:IncomingMessage , error:any} = await supabase
        .from('messages')
        .select('id, content, chat_id, created_at, sender_id, profiles (id, username, avatar_url)')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) { console.error('Error fetching messages:', error); }
      else { setMessages(data as Message[] || []); }
      setLoadingMessages(false);
      setTimeout(() => scrollToBottom("auto"), 100);
    };
    fetchMessages();
  }, [chatId, user, supabase, scrollToBottom]);

  useEffect(() => {
    if (!chatId || !user) return;
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on<Message>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}`},
        async (payload) => {
          let fullMessage = payload.new as Message;
          if (!fullMessage.profiles && fullMessage.sender_id) {
              const profile = await getSenderProfile(supabase, fullMessage.sender_id);
              if (profile) fullMessage = { ...fullMessage, profiles: profile };
          }
          setMessages((prevMessages) => {
            if (prevMessages.find(msg => msg.id === fullMessage.id)) {
                return prevMessages;
            }
            return [...prevMessages, fullMessage]; 
          });
          //@ts-ignore
          if (fullMessage.sender_id !== user.id  ||  (messagesEndRef?.current?.getBoundingClientRect()?.bottom ) < window.innerHeight + 200) {
            scrollToBottom();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatId, user, supabase, scrollToBottom]);

  useEffect(() => { 
    if (messages.length > 0 && messages[messages.length - 1].sender_id === user?.id) {
        scrollToBottom();
    }
  }, [messages, user?.id, scrollToBottom]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const optimisticMessage: Message = {
      id: tempId,
      chat_id: chatId,
      sender_id: user.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      profiles: { id: user.id, username: user.user_metadata.username || user.email?.split('@')[0] || 'You' }
    };
    setMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = newMessage.trim();
    setNewMessage("");

    const { data: insertedMessage, error } = await supabase
      .from('messages')
      .insert({ chat_id: chatId, sender_id: user.id, content: messageToSend })
      .select() 
      .single(); 

    if (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId)); 
      setNewMessage(messageToSend);
      alert("Failed to send message: " + error.message);
    } else if (insertedMessage) {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === tempId ? { ...msg, ...insertedMessage, id: insertedMessage.id, created_at: insertedMessage.created_at } : msg
        )
      );
    }
  };

  if (authLoading) return <div className="flex-1 flex items-center justify-center text-gray-500 p-6">Loading authentication...</div>;
  if (!user) { router.push('/login'); return <div className="flex-1 flex items-center justify-center text-gray-500 p-6">Redirecting to login...</div>; }
  if (loadingMessages && messages.length === 0) return <div className="flex-1 flex items-center justify-center"><ArrowPathIcon className="h-8 w-8 text-green-500 animate-spin"/></div>;

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <header className="bg-white p-3.5 border-b border-gray-200 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-3">
            {chatDetails?.avatar ? (
                <img src={chatDetails.avatar} alt={chatDetails.name || "Chat Avatar"} className="h-10 w-10 rounded-full object-cover"/>
            ) : (
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-lg">
                    {chatDetails?.name?.charAt(0).toUpperCase() || '?'}
                </div>
            )}
            <div>
                <h1 className="text-base font-semibold text-gray-800 leading-tight">{chatDetails?.name || 'Chat'}</h1>
                {chatDetails?.participantsList && chatDetails.participantsList.length > 0 && (
                    <p className="text-xs text-gray-500 leading-tight truncate max-w-[200px] sm:max-w-xs">
                        {chatDetails.participantsList.join(', ')}
                    </p>
                )}
            </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden md:flex items-center -space-x-2">
                <img src="https://placehold.co/600x400?text=A" alt="Participant 1" className="h-7 w-7 rounded-full border-2 border-white ring-1 ring-gray-200" />
                <img src="https://placehold.co/600x400?text=B" alt="Participant 2" className="h-7 w-7 rounded-full border-2 border-white ring-1 ring-gray-200" />
                <span className="flex items-center justify-center h-7 w-7 text-xs bg-gray-200 text-gray-600 rounded-full border-2 border-white ring-1 ring-gray-200">+2</span>
            </div>
            <button className="p-1.5 text-gray-500 hover:text-green-500 hover:bg-gray-100 rounded-md transition-colors">
                <SearchInChatIcon className="h-5 w-5" />
            </button>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-1.5 bg-[url('/chat-bg-pattern.png')] bg-repeat">
        {messages.map((msg) => {
          const isSender = msg.sender_id === user.id;
          const senderName = isSender ? "You" : (msg.profiles?.username || `User ${msg.sender_id.substring(0,4)}`);
          const messageDate = new Date(msg.created_at);


          return (
            <div key={msg.id}>
              <div className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] sm:max-w-[65%] py-2 px-3 rounded-xl shadow-sm relative
                    ${ isSender
                      ? "bg-green-500 text-white rounded-br-lg" 
                      : "bg-white text-gray-700 rounded-bl-lg border border-gray-200" 
                    }`}
                >
                  {!isSender && (
                     <p className="text-xs font-semibold mb-0.5 text-indigo-600"> 
                        {senderName}
                     </p>
                  )}
                  <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                  <div className={`text-xs mt-1 flex items-center ${isSender ? 'text-green-100 justify-end' : 'text-gray-400 justify-end'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    {isSender && (
                        <SingleTickIcon className="w-4 h-4 ml-1 opacity-70" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-0.5" />
      </div>

     <div className="bg-gray-50 border-t border-gray-200 p-3">
        <div className="flex items-center mb-2 space-x-1.5">
            <button
                onClick={() => setActiveInputTab('whatsapp')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors
                ${activeInputTab === 'whatsapp' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-200'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="inline h-3.5 w-3.5 mr-1 -ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.35 3.43 16.84L2.05 22L7.31 20.62C8.75 21.39 10.36 21.81 12.04 21.81H12.05C17.5 21.81 21.95 17.36 21.95 11.91C21.95 9.27 20.92 6.81 19.14 4.99C17.33 3.17 14.83 2 12.04 2ZM17.99 15.1C17.74 15.62 16.83 16.11 16.33 16.17C15.84 16.24 15.17 16.25 14.71 16.08C14.25 15.91 13.29 15.6 12.18 14.58C10.83 13.34 10.01 11.93 9.79 11.56C9.57 11.19 9.39 10.95 9.39 10.65C9.39 10.35 9.24 10.19 9.07 10.02C8.91 9.85 8.69 9.77 8.43 9.77C8.17 9.77 7.96 9.77 7.75 9.77C7.54 9.77 7.19 9.85 6.94 10.33C6.69 10.81 5.99 11.46 5.99 12.72C5.99 13.98 6.97 15.18 7.14 15.35C7.31 15.52 9.26 18.43 12.13 19.73C13.14 20.17 13.88 20.36 14.39 20.48C15.09 20.64 15.75 20.61 16.22 20.43C16.78 20.22 17.64 19.68 17.91 19.13C18.18 18.58 18.18 18.14 18.11 18.01C18.04 17.87 17.86 17.79 17.62 17.69C17.37 17.58 16.66 17.24 16.43 17.15C16.19 17.06 16.05 17.01 15.9 17.26C15.76 17.51 15.33 18.01 15.19 18.18C15.06 18.35 14.92 18.38 14.71 18.25C14.51 18.12 13.79 17.86 12.91 17.07C12.18 16.43 11.71 15.62 11.54 15.33C11.37 15.04 11.48 14.91 11.62 14.78C11.74 14.67 11.89 14.49 12.03 14.33C12.17 14.17 12.23 14.06 12.34 13.9C12.45 13.74 12.4 13.61 12.33 13.48C12.26 13.35 11.77 12.15 11.56 11.67C11.36 11.19 11.15 11.25 11.01 11.25C10.86 11.25 10.72 11.25 10.58 11.25C10.44 11.25 10.16 11.31 9.95 11.56C9.73 11.81 9.2 12.31 9.2 13.33C9.2 14.34 9.98 15.11 10.11 15.28C10.25 15.45 11.23 16.84 12.67 17.46C13.53 17.82 14.02 17.99 14.34 18.07C14.79 18.18 15.31 18.14 15.6 18.07C15.97 17.97 16.71 17.53 16.91 17.01C17.12 16.48 17.12 16.05 17.05 15.91C16.98 15.78 16.88 15.71 16.74 15.64C16.6 15.56 16.24 15.43 15.97 15.33C15.7 15.24 15.58 15.27 15.49 15.39L15.49 15.39C15.49 15.39 17.99 15.1 17.99 15.1Z"></path></svg>
                WhatsApp
            </button>
            <button
                onClick={() => setActiveInputTab('note')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors
                ${activeInputTab === 'note' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-500 hover:bg-gray-200'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="inline h-3.5 w-3.5 mr-1 -ml-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                Private Note
            </button>
            <span className="text-xs text-gray-400 ml-auto tabular-nums">17925</span>
        </div>
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2.5">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={activeInputTab === 'whatsapp' ? "Message..." : "Add a private note..."}
            className="flex-grow px-0 py-2.5 bg-transparent focus:outline-none text-sm text-gray-800 placeholder-gray-500 border-b border-transparent focus:border-green-500 transition-colors"
          />
          <button
            type="submit"
            className={`p-1.5 rounded-full text-white flex-shrink-0 transition-colors
                        ${newMessage.trim() ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'}`}
            disabled={!newMessage.trim()}
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            {[
              { icon: PaperClipIcon, label: "Attach file" }, { icon: FaceSmileIcon, label: "Insert emoji" },
              { icon: ClockIcon, label: "Schedule message" }, { icon: QueueListIcon, label: "Use template/snippet" },
              { icon: HashtagIcon, label: "Add tags" }, { icon: MicrophoneIcon, label: "Record voice note" },
            ].map((item, idx) => (
              <button key={idx} type="button" title={item.label} className="p-1.5 text-gray-500 hover:text-green-500 rounded-full hover:bg-gray-100 transition-colors">
                <item.icon className="h-5 w-5" />
              </button>
            ))}
          </div>
          <button className="flex items-center text-xs text-gray-700 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50 shadow-sm transition-colors">
            <svg className="h-4 w-4 mr-1 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"></path></svg>
            Periskope
            <ChevronDownIcon className="h-3.5 w-3.5 ml-1.5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
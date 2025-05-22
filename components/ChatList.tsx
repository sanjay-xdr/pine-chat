"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'; 
import { useAuth } from '@/context/AuthProvider'; 
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Chat, Profile } from '@/types/supabase'; 
import { CheckIcon as SingleCheckIcon, CheckBadgeIcon as DoubleCheckIcon } from '@heroicons/react/20/solid'; 
import { UserCircleIcon, SpeakerWaveIcon ,ArrowPathIcon} from '@heroicons/react/24/outline';

interface EnrichedChat extends Chat {
  other_participant?: Profile;
  last_message_content?: string;
  last_message_sender_id?: string;
  last_message_at?: string;
  unread_count?: number;
  tags?: { name: string, color: string }[];
  is_muted?: boolean;
}

const getAvatarInfo = (username?: string) => {
    if (!username) return { initial: '?', colorClass: 'bg-gray-400' };
    const initial = username.charAt(0).toUpperCase();
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-600', 'bg-yellow-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500'];
    const colorClass = colors[username.length % colors.length];
    return { initial, colorClass };
};

export default function ChatList() {
  const supabase = createClient();
  const { user } = useAuth();
  const pathname = usePathname();
  const [chats, setChats] = useState<EnrichedChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      setLoading(true);
      const { data: chatParticipantsData, error: cpError } = await supabase
        .from('chat_participants').select('chat_id').eq('user_id', user.id);

      if (cpError || !chatParticipantsData) {
        console.error('Error fetching user chats:', cpError);
        setLoading(false); return;
      }

      const chatIds = chatParticipantsData.map(cp => cp.chat_id);
      if (chatIds.length === 0) {
        setChats([]); setLoading(false); return;
      }

      const { data: chatDetails, error: cdError } = await supabase
        .from('chats')
        .select(`
          id, created_at, updated_at,
          chat_participants!inner (user_id, profiles (id, username, avatar_url)),
          messages (content, created_at, sender_id)
        `)
        .in('id', chatIds)
        .order('updated_at', { ascending: false })
        .order('created_at', { referencedTable: 'messages', ascending: false, nullsFirst: false })
        .limit(1, { referencedTable: 'messages' });

      if (cdError) {
        console.error('Error fetching chat details:', cdError);
      } else {
        const enrichedChats = chatDetails?.map((chat, index) => {
          const otherParticipantProfile = chat.chat_participants
            .find(p => p.profiles?.id !== user.id)?.profiles;
          const lastMessage = chat.messages && chat.messages.length > 0 ? chat.messages[0] : null;
          
          const exampleTags = [];
          if (index % 4 === 0) exampleTags.push({ name: "Demo", color: "red" });
          if (index % 3 === 0) exampleTags.push({ name: "Internal", color: "blue" });
          if (chat.id.includes('a')) exampleTags.push({ name: "Support2", color: "green" });


          return {
            ...chat,
            other_participant: otherParticipantProfile,
            last_message_content: lastMessage?.content,
            last_message_sender_id: lastMessage?.sender_id,
            last_message_at: lastMessage?.created_at || chat.updated_at,
            tags: exampleTags,
            unread_count: index % 5 === 1 ? Math.floor(Math.random() * 3) + 1 : 0,
            is_muted: index % 6 === 0,
            
          } as any;
        }) || [];
        setChats(enrichedChats);
      }
      setLoading(false);
    };

    fetchChats();
  }, [user, supabase]);

  if (loading) return (
    <div className="p-4 text-center text-gray-500">
      <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto mb-2"/>
      Loading chats...
    </div>
  );

  return (
    <div className="h-full bg-white">
      {chats.length === 0 ? (
        <p className="text-gray-500 p-6 text-center">No active chats. Start one!</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {chats.map((chat) => {
            const isActive = pathname === `/dashboard/chat/${chat.id}`;
            const avatarInfo = getAvatarInfo(chat.other_participant?.username);
            const lastMessageTime = chat.last_message_at ? new Date(chat.last_message_at) : new Date(chat.updated_at);
            
            let timeString;
            const today = new Date();
            if (lastMessageTime.toDateString() === today.toDateString()) {
                timeString = lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (new Date(today.setDate(today.getDate() - 1)).toDateString() === lastMessageTime.toDateString()) {
                timeString = "Yesterday";
            } else {
                timeString = lastMessageTime.toLocaleDateString([], { day: '2-digit', month: 'short' });
            }
            
            const isLastMessageFromUser = chat.last_message_sender_id === user?.id;

            return (
              <li key={chat.id} className={`${isActive ? 'bg-green-50' : 'hover:bg-gray-50'} transition-colors`}>
                <Link href={`/dashboard/chat/${chat.id}`} className="block p-3.5">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 relative">
                      {chat.other_participant?.avatar_url ? (
                        <img className="h-11 w-11 rounded-full object-cover" src={chat.other_participant.avatar_url} alt="" />
                      ) : (
                        <span className={`h-11 w-11 rounded-full flex items-center justify-center text-white text-xl font-medium ${avatarInfo.colorClass}`}>
                            {avatarInfo.initial}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className={`text-sm font-semibold ${isActive ? 'text-green-700' : 'text-gray-800'} truncate`}>
                          {chat.other_participant?.username || 'Chat ' + chat.id.substring(0,6)}
                        </p>
                        <p className={`text-xs ${isActive ? 'text-green-600' : 'text-gray-500'}`}>{timeString}</p>
                      </div>
                      <div className="flex justify-between items-start mt-0.5">
                        <p className="text-sm text-gray-600 truncate flex-grow pr-2 flex items-center">
                          {isLastMessageFromUser && (
                            <SingleCheckIcon className="h-4 w-4 mr-1 text-blue-500 flex-shrink-0" />
                          )}
                          {chat.last_message_content || "No messages yet"}
                        </p>
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                            {chat.is_muted && <SpeakerWaveIcon className="h-4 w-4 text-gray-400"/>}
                            {chat.unread_count && chat.unread_count > 0 && (
                                <span className="text-xs bg-green-500 text-white font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                    {chat.unread_count}
                                </span>
                            )}
                            {isLastMessageFromUser && !chat.unread_count && (
                                <DoubleCheckIcon className="h-5 w-5 text-green-500" />
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {chat.tags && chat.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {chat.tags.map(tag => (
                        <span key={tag.name} className={`px-1.5 py-0.5 text-xs rounded-full font-medium
                            ${tag.color === 'red' ? 'bg-red-100 text-red-700' :
                              tag.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                              tag.color === 'green' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'}`}>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
// components/UserList.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Import the router
import { createClient } from '@/utils/supabase/client'; // Your Supabase client utility
import { useAuth } from '@/context/AuthProvider'; // Your Auth context
import { findOrCreateChat } from '@/app/action/chatAction'; // Import your server action (adjust path if needed)
// import type { Profile } from '@/types/supabase'; // Assuming you have a Profile type

// Define a basic Profile type here if not importing
interface Profile {
  id: string;
  username: string | null;
  avatar_url?: string | null;
}

export default function UserList() { // Removed onSelectUser prop as we'll handle logic internally
  const supabase = createClient();
  const { user, isLoading: authLoading } = useAuth(); // Get user and auth loading state
  const router = useRouter(); // Initialize the router

  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null); // To show loading for a specific user

  useEffect(() => {
    if (!user) { // If no user and auth is resolved, don't fetch
        if (!authLoading) setLoadingUsers(false); // Stop loading if auth is done and no user
        return;
    }

    const fetchUsers = async () => {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .not('id', 'eq', user.id); // Exclude current user

      if (error) {
        console.error('Error fetching users:', error);
        setUsers([]); // Set to empty array on error
      } else {
        setUsers((data as Profile[]) || []);
      }
      setLoadingUsers(false);
    };

    fetchUsers();
  }, [user, supabase, authLoading]); // Add authLoading as a dependency

  const handleStartChat = async (otherUser: Profile) => {
    if (!user) {
      alert("You must be logged in to start a chat.");
      router.push('/login'); // Or your login page
      return;
    }
    if (otherUser.id === user.id) {
      // This shouldn't happen if .not('id', 'eq', user.id) works correctly
      alert("You cannot chat with yourself.");
      return;
    }

    setStartingChatWith(otherUser.id);

    try {
      const result = await findOrCreateChat(otherUser.id); // Call the Server Action

      if (typeof result === 'string') { // Server action returned a chatId
        const chatId = result;
        router.push(`/dashboard/chat/${chatId}`); // Navigate to the chat room
      } else {
        // Server action returned an error object
        alert(`Error starting chat: ${result.error}`);
      }
    } catch (error) {
      console.error("Client-side error starting chat:", error);
      alert("An unexpected error occurred while trying to start the chat.");
    } finally {
      setStartingChatWith(null); // Reset loading state for this specific user
    }
  };

  if (authLoading) {
    return <p className="p-4 text-gray-400">Authenticating...</p>;
  }

  if (loadingUsers) {
    return <p className="p-4 text-gray-400">Loading users...</p>;
  }

  if (!user) { // If still no user after auth check (e.g. not logged in)
    return <p className="p-4 text-gray-400">Please log in to see users.</p>;
  }

  if (users.length === 0) {
    return <p className="p-4 text-gray-400">No other users found to chat with.</p>;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-3 text-white">Start a Chat With:</h2>
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id}>
            <button
              onClick={() => handleStartChat(u)}
              disabled={startingChatWith === u.id} // Disable button while this specific chat is being initiated
              className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startingChatWith === u.id ? 'Starting chat...' : (u.username || u.id.substring(0, 8))}
              {/* You can add avatar display here if you have u.avatar_url */}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
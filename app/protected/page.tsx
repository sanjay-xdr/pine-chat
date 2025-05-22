// components/UserList.tsx
"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthProvider'; // Your Auth context
// import type { Profile } from '@/types/supabase'; // Your types

interface UserListProps {
  onSelectUser: (userId: string, username: string) => void;
}

export default function UserList({ onSelectUser }: UserListProps) {
  const supabase = createClient();
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .not('id', 'eq', user.id); // Exclude current user

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [user, supabase]);

  if (loading) return <p className="text-gray-400">Loading users...</p>;
  if (!users.length) return <p className="text-gray-400">No other users found.</p>;

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-3 text-white">Start a Chat With:</h2>
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id}>
            <button
              onClick={() => onSelectUser(u.id, u.username || 'Unknown User')}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:bg-gray-700 text-white"
            >
              {u.username || u.id.substring(0, 8)}
              {/* Add avatar display here if you have avatar_url */}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
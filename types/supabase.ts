// You can generate these types from your Supabase schema using:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
// For now, manual basic types:
export interface Profile {
  id: string;
  username: string | null;
  avatar_url?: string | null;
}

export interface Chat {
  id: string;
  created_at: string;
  updated_at: string;
  // You'll often join participants and last message
  chat_participants?: { user_id: string, profiles: Profile }[];
  messages?: Message[]; // For last message preview
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: Profile; // Sender's profile
}
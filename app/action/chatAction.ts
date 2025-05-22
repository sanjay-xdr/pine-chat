// actions/chatActions.ts
"use server";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server"; // Server client
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function findOrCreateChat(otherUserId: string): Promise<string | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated." };
  }
  if (user.id === otherUserId) {
    return { error: "Cannot create chat with yourself." };
  }

  // Check if a 1-on-1 chat already exists
  // This query is a bit complex: find chats where BOTH users are participants.
  const { data: existingChats, error: existingChatsError } = await supabase
    .rpc('get_chat_with_users', { user_id_1: user.id, user_id_2: otherUserId });
    // We'll create this RPC function below.

  if (existingChatsError) {
    console.error("Error checking for existing chat:", existingChatsError);
    return { error: "Failed to check for existing chat." };
  }

  if (existingChats && existingChats.length > 0) {
    // Assuming get_chat_with_users returns the chat_id if found
    return existingChats[0].chat_id; // Redirect to existing chat
  }

  // If no existing chat, create a new one
  // 1. Create the chat entry
  const { data: newChat, error: newChatError } = await supabase
    .from('chats')
    .insert({})
    .select('id')
    .single();

  if (newChatError || !newChat) {
    console.error("Error creating new chat:", newChatError);
    return { error: "Failed to create new chat." };
  }

  // 2. Add participants to the chat
  const { error: participantsError } = await supabase
    .from('chat_participants')
    .insert([
      { chat_id: newChat.id, user_id: user.id },
      { chat_id: newChat.id, user_id: otherUserId },
    ]);

  if (participantsError) {
    console.error("Error adding participants:", participantsError);
    // Potentially delete the created chat if participants fail
    await supabase.from('chats').delete().eq('id', newChat.id);
    return { error: "Failed to add participants to chat." };
  }

  revalidatePath('/chat'); // Revalidate if you have a page listing all chats
  revalidatePath(`/chat/${newChat.id}`);
  return newChat.id;
}
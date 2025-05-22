import ChatList from '@/components/ChatList'
import { ChatBubbleLeftRightIcon , SparklesIcon} from '@heroicons/react/24/outline'
import React from 'react'



export default function page() {
  return (
 <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-center p-8">
      <div className="p-4 bg-green-100 rounded-full mb-6">
        <ChatBubbleLeftRightIcon className="h-16 w-16 text-green-500" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">
        Welcome to Your Chats!
      </h2>
      <p className="text-gray-500 max-w-sm mb-6">
        Select a conversation from the list on the left to start chatting, or begin a new one.
      </p>
      <div className="flex items-center text-sm text-gray-400">
        <SparklesIcon className="h-5 w-5 mr-2 text-yellow-400" />
        Your messages are end-to-end encrypted. Stay connected securely.
      </div>
    </div>
  )
}

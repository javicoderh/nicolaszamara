import { createContext, useContext, useEffect, useState } from 'react'
import { useChatbot } from '../../hooks/useChatbot/useChatbot.js'

const ChatbotContext = createContext(null)

// Memory belongs to this page lifetime: navigation preserves it; a reload resets it.
export function ChatbotProvider({ api, children }) {
  const chat = useChatbot(api)
  const [open, setOpen] = useState(false)
  const [contactSaved, setContactSaved] = useState(false)

  useEffect(() => { setContactSaved(false) }, [chat.session?.state.conversation_id])

  function ensureSession() {
    if (!chat.session && !chat.pending) chat.loadSession({ restoreMessages: false, fresh: true })
  }

  return <ChatbotContext.Provider value={{ chat, open, setOpen, contactSaved, setContactSaved, ensureSession }}>
    {children}
  </ChatbotContext.Provider>
}

export function useChatbotContext() { return useContext(ChatbotContext) }

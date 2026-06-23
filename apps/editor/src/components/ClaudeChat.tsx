import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Send, Bot, User, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import type { TimelineData } from '../App'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  timeline: TimelineData
  onTimelineUpdate: (timeline: TimelineData) => void
}

export default function ClaudeChat({ timeline, onTimelineUpdate }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const msg = input.trim()
    if (!msg || isLoading) return
    setInput('')

    const userMessage: Message = { role: 'user', content: msg }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const res = await axios.post('/api/claude/chat', {
        message: msg,
        timeline,
        history: messages.map(m => ({ role: m.role, content: m.content })),
      })

      const assistantMessage: Message = { role: 'assistant', content: res.data.text }
      setMessages(prev => [...prev, assistantMessage])

      if (res.data.updatedTimeline) {
        onTimelineUpdate(res.data.updatedTimeline as TimelineData)
        toast.success('Timeline updated by Claude')
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.error ?? 'Failed to reach Claude'
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errMsg}` }])
      if (errMsg.includes('ANTHROPIC_API_KEY')) {
        toast.error('Set ANTHROPIC_API_KEY in your .env file')
      }
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const SUGGESTIONS = [
    'Add bold white text "Subscribe!" to all scenes',
    'Make the first scene 5 seconds long',
    'Add a fade transition to every scene',
    'Change the video to 16:9 YouTube format',
    'Add captions: Hello world\nThis is my video',
  ]

  return (
    <div className="border-l border-editor-border flex flex-col bg-editor-panel" style={{ width: 300 }}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center justify-between px-3 py-2 border-b border-editor-border hover:bg-editor-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-medium">Claude AI Edits</span>
        </div>
        {isOpen ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronUp className="w-3 h-3 text-gray-500" />}
      </button>

      {isOpen && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[11px] text-gray-500 text-center">Describe any edit in plain English</p>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="w-full text-left text-[11px] text-gray-400 hover:text-indigo-300 border border-editor-border hover:border-indigo-500/50 rounded px-2 py-1.5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-700'
                }`}>
                  {msg.role === 'user'
                    ? <User className="w-3 h-3" />
                    : <Bot className="w-3 h-3 text-indigo-400" />
                  }
                </div>
                <div className={`max-w-[85%] text-[11px] leading-relaxed rounded-lg px-2.5 py-1.5 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600/30 border border-indigo-500/30 text-gray-200'
                    : 'bg-editor-bg border border-editor-border text-gray-300'
                }`}>
                  {/* Strip json blocks from display for cleanliness */}
                  {msg.content.replace(/```json[\s\S]*?```/g, '[✓ Timeline updated]').trim()}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-start">
                <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-indigo-400" />
                </div>
                <div className="bg-editor-bg border border-editor-border rounded-lg px-2.5 py-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-editor-border p-2">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={2}
                placeholder="Describe an edit... (Enter to send)"
                className="flex-1 bg-editor-bg border border-editor-border rounded text-[11px] px-2 py-1.5 resize-none outline-none focus:border-indigo-500 text-gray-300 placeholder-gray-600"
              />
              <button
                onClick={send}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 shrink-0"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[9px] text-gray-600 mt-1">Shift+Enter for newline</p>
          </div>
        </>
      )}
    </div>
  )
}

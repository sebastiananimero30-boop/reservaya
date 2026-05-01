import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, Sparkles } from 'lucide-react'
import ChatMessage from './ChatMessage'

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT = `Eres ReservaBot, el asistente virtual de ReservaYa, la plataforma de reservas de restaurantes #1 en Ibagué, Colombia.

Tu personalidad:
- Amigable, cálido y profesional
- Usas emojis con moderación para ser más expresivo
- Respondes siempre en español
- Eres conciso (máximo 3-4 oraciones por respuesta)

Tu función principal:
- Ayudar a los usuarios a encontrar y reservar restaurantes en Ibagué
- Recomendar restaurantes según el tipo de ocasión (romántica, familiar, negocios, etc.)
- Informar sobre disponibilidad, precios y menús
- Guiar al usuario para completar una reserva

Restaurantes disponibles en la plataforma (todos en Ibagué, Tolima):

🍲 TÍPICA & REGIONAL:
- La Comarca Típico (Picaleña) — lechona, tamal tolimense, ambiente campestre. 4.7★
- El Carnaval del Pollo (Mirolindo) — pollo asado y platos típicos, favorito familiar. 4.5★

🍝 ITALIANA:
- La Ricotta Trattoria (El Vergel) — pastas artesanales, pizzas, ideal para parejas. 4.8★
- Mi Trattoria (La Pola) — decoración rústica, risotto de hongos, tiramisú casera. 4.6★

🦞 MAR & FUSIÓN:
- María y el Mar (La Macarena) — cocina peruana y del Pacífico, ceviches premium. 4.9★
- Sakana Sushi Fusión (El Vergel) — sushi creativo con ingredientes locales. 4.7★

🥩 CARNES & PARRILLA:
- Tango Pasión por la Carne (La Macarena) — cortes madurados, ambiente sofisticado. 4.8★
- La Parrilla de Marcos (Centro) — clásico de la ciudad, chorizos artesanales. 4.6★

🌍 INTERNACIONAL:
- Augurio (Centro, cerca F-25) — cocina mexicana contemporánea, tacos de autor. 4.7★
- Paz Restaurante (Picaleña) — cocina de autor con influencias italianas, íntimo. 4.8★
- El Ilustre Bistrot (Centro histórico) — técnicas francesas con ingredientes locales. 4.7★

🍔 COMIDA RÁPIDA GOURMET:
- Frencheese Burger (Centro) — smash burgers con queso costeño y hogao. 4.5★

Si el usuario quiere reservar, dile que puede hacerlo iniciando sesión en la plataforma.
Si preguntan algo fuera del tema de restaurantes o comida, redirige amablemente la conversación.`

async function askGroq(history, userMessage) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10).map(msg => ({
      role: msg.from === 'user' ? 'user' : 'assistant',
      content: msg.text
    })),
    { role: 'user', content: userMessage }
  ]

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.8,
      max_tokens: 300,
    })
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    console.error('Groq error:', errBody)
    throw new Error(`${res.status}: ${errBody?.error?.message || 'Error desconocido'}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.'
}

const QUICK_OPTS = [
  { label: '🥂 Cena romántica' },
  { label: '👨‍👩‍👧 Almuerzo familiar' },
  { label: '💼 Reunión de negocios' },
  { label: '🍕 Recomiéndame algo' },
]

const WELCOME = '¡Hola! 👋 Soy **ReservaBot**, tu asistente para encontrar el restaurante perfecto en Ibagué. ¿Qué tipo de experiencia buscas hoy?'

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ from: 'bot', text: WELCOME, opts: QUICK_OPTS }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)
  const hasKey = !!GROQ_KEY && GROQ_KEY !== 'tu-groq-key'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const addBotMessage = (text, opts = null) => {
    setMessages(m => [...m, { from: 'bot', text, opts }])
  }

  const sendMessage = async (text) => {
    if (!text.trim() || typing) return
    setInput('')
    const userMsg = { from: 'user', text: text.trim() }
    setMessages(m => [...m, userMsg])
    setTyping(true)

    try {
      if (hasKey) {
        const history = messages.filter(m => m.from === 'user' || !m.opts)
        const reply = await askGroq(history, text.trim())
        setTyping(false)
        addBotMessage(reply)
      } else {
        await new Promise(r => setTimeout(r, 800))
        setTyping(false)
        addBotMessage('⚠️ Necesito una API key para responder. Usa las opciones rápidas de abajo.', QUICK_OPTS)
      }
    } catch (err) {
      setTyping(false)
      const msg = err?.message || ''
      if (msg.includes('429')) {
        addBotMessage('⏳ Demasiadas consultas. Espera unos segundos e intenta de nuevo.')
      } else {
        addBotMessage(`😅 Error al conectarme: ${msg}`)
      }
      console.error('Groq error:', err)
    }
  }

  const handleOpt = (opt) => sendMessage(opt.label)
  const handleSend = () => sendMessage(input)
  const reset = () => setMessages([{ from: 'bot', text: WELCOME, opts: QUICK_OPTS }])

  const lastMsg = messages[messages.length - 1]
  const currentOpts = !typing && lastMsg?.from === 'bot' ? lastMsg.opts : null

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-80 bg-white dark:bg-stone-800 rounded-3xl shadow-2xl border border-stone-100 dark:border-stone-700 overflow-hidden flex flex-col"
            style={{ height: '500px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-semibold text-sm">ReservaBot</p>
                  {hasKey && (
                    <span className="flex items-center gap-0.5 bg-white/20 rounded-full px-1.5 py-0.5 text-[10px] text-white/90 font-medium">
                      <Sparkles className="w-2.5 h-2.5" />
                      Llama 3.3
                    </span>
                  )}
                </div>
                <p className="text-white/70 text-xs">● En línea · te ayudo a reservar</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={reset} className="text-white/70 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
                  Nueva
                </button>
                <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {typing && (
                <div className="flex gap-1 items-center bg-stone-100 dark:bg-stone-700 w-fit px-4 py-3 rounded-2xl rounded-bl-sm">
                  {[0, 1, 2].map(i => (
                    <motion.span key={i} className="w-1.5 h-1.5 bg-stone-400 rounded-full block"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick options */}
            {currentOpts && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {currentOpts.map((opt, i) => (
                  <button key={i} onClick={() => handleOpt(opt)}
                    className="px-3 py-1.5 border-2 border-primary-300 dark:border-primary-600 text-primary-600 dark:text-primary-400 rounded-full text-xs font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-1 flex gap-2 border-t border-stone-100 dark:border-stone-700">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Pregúntame lo que quieras..."
                disabled={typing}
                className="flex-1 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent disabled:opacity-50"
              />
              <button onClick={handleSend} disabled={typing || !input.trim()}
                className="w-9 h-9 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={open ? {} : { y: [0, -4, 0] }}
        transition={open ? {} : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full shadow-2xl shadow-primary-500/40 flex items-center justify-center"
        aria-label="Abrir chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}

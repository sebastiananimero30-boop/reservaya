import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot } from 'lucide-react'
import ChatMessage from './ChatMessage'

const FLOWS = {
  start: {
    bot: '¡Hola! 👋 Soy ReservaBot. ¿Qué tipo de experiencia buscas hoy?',
    opts: [
      { label: '🥂 Cena romántica', next: 'romantic' },
      { label: '👨‍👩‍👧 Almuerzo familiar', next: 'family' },
      { label: '💼 Reunión de negocios', next: 'business' },
      { label: '🍝 Italiana Centro', next: 'italiana' },
    ]
  },
  romantic: {
    bot: '¡Perfecto! 🌹 Para una cena romántica te recomiendo **Sakura** (japonesa, ambiente íntimo, 4.8★) o **Bistró Francés** (elegante, vinos importados). ¿Cuántas personas?',
    opts: [
      { label: '👫 Solo 2 personas', next: 'time' },
      { label: '👥 Más de 2', next: 'time' },
      { label: '🗓️ Ver disponibilidad', next: 'time' },
    ]
  },
  family: {
    bot: '¡Qué rico! 👨‍👩‍👧 Para familia te recomiendo **El Tolimense** (regional, niños bienvenidos ✅) o **Pizza Da Marco** (todos comen bien). ¿Tienen niños?',
    opts: [
      { label: '✅ Sí, con niños', next: 'time' },
      { label: '👨‍👩‍👦 Solo adultos', next: 'time' },
    ]
  },
  business: {
    bot: '💼 Para negocios necesitas privacidad. **Sakura** tiene salones privados y **Bistró Francés** ofrece menú ejecutivo con sommelier. ¿Cuántas personas asisten?',
    opts: [
      { label: '2–4 personas', next: 'time' },
      { label: '5–10 personas', next: 'time' },
      { label: 'Más de 10', next: 'time' },
    ]
  },
  italiana: {
    bot: '🍕 ¡Excelente! **Pizza Da Marco** en Chapetón tiene horno de leña y masa madre. Calificación 4.6★, 22 reservas hoy. ¿Para qué hora?',
    opts: [
      { label: '⏰ Reserva 19:00', next: 'confirm' },
      { label: '⏰ Reserva 20:00', next: 'confirm' },
      { label: '📋 Ver menú primero', next: 'menu' },
    ]
  },
  time: {
    bot: '¿A qué hora prefieres? Tengo disponibilidad para hoy.',
    opts: [
      { label: '⏰ 18:30', next: 'confirm' },
      { label: '⏰ 19:00', next: 'confirm' },
      { label: '⏰ 20:00', next: 'confirm' },
      { label: '⏰ 21:00', next: 'confirm' },
    ]
  },
  confirm: {
    bot: '✅ ¡Listo! Voy a ayudarte a confirmar la reserva. Para continuar necesito que inicies sesión o te registres. ¡Es rápido! 🚀',
    opts: [
      { label: '🔑 Iniciar sesión', action: '/login' },
      { label: '✍️ Registrarse', action: '/registro' },
      { label: '🔍 Ver restaurantes', action: '/' },
    ]
  },
  menu: {
    bot: 'El menú incluye: **Margherita** ($18k), **Prosciutto e Rucola** ($28k), **4 Formaggi** ($25k) y **Tiramisú** de postre ($12k). ¿Quieres reservar?',
    opts: [
      { label: '✅ Sí, reservar', next: 'confirm' },
      { label: '🔙 Ver otros restaurantes', next: 'start' },
    ]
  },
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ from: 'bot', text: FLOWS.start.bot, opts: FLOWS.start.opts }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)
  const navigate = typeof window !== 'undefined'
    ? (path) => { window.location.href = path } : () => {}

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const addBotMessage = (text, opts) => {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages(m => [...m, { from: 'bot', text, opts }])
    }, 800)
  }

  const handleOpt = (opt) => {
    setMessages(m => [...m, { from: 'user', text: opt.label }])
    if (opt.action) { setTimeout(() => navigate(opt.action), 400); return }
    const flow = FLOWS[opt.next]
    if (flow) addBotMessage(flow.bot, flow.opts)
  }

  const handleSend = () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')
    setMessages(m => [...m, { from: 'user', text }])
    addBotMessage(
      'Entendido 😊 Déjame buscarte las mejores opciones en Ibagué para eso.',
      FLOWS.time.opts
    )
  }

  const reset = () => {
    setMessages([{ from: 'bot', text: FLOWS.start.bot, opts: FLOWS.start.opts }])
  }

  const lastMsg = messages[messages.length - 1]
  const currentOpts = lastMsg?.from === 'bot' ? lastMsg.opts : null

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-80 bg-white dark:bg-stone-800 rounded-3xl shadow-3xl border border-stone-100 dark:border-stone-700 overflow-hidden flex flex-col"
            style={{ height: '480px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">ReservaBot</p>
                <p className="text-white/70 text-xs">● En línea · te ayudo a reservar</p>
              </div>
              <div className="flex gap-1">
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
                  {[0,1,2].map(i => (
                    <motion.span key={i} className="w-1.5 h-1.5 bg-stone-400 rounded-full block"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Options */}
            {currentOpts && !typing && (
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
                placeholder="Escribe tu pregunta..."
                className="flex-1 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
              <button onClick={handleSend}
                className="w-9 h-9 bg-primary-500 hover:bg-primary-600 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
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

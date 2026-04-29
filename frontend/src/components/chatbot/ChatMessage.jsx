import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function ChatMessage({ message }) {
  const isBot = message.from === 'bot'
  const text = message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={clsx('flex', isBot ? 'justify-start' : 'justify-end')}
    >
      <div className={clsx(
        'max-w-[85%] px-4 py-2.5 text-sm leading-relaxed',
        isBot
          ? 'bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-2xl rounded-bl-sm'
          : 'bg-primary-500 text-white rounded-2xl rounded-br-sm'
      )}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </motion.div>
  )
}

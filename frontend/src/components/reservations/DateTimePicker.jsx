import { Calendar, Clock, Users } from 'lucide-react'
import clsx from 'clsx'

export default function DateTimePicker({ value, onChange }) {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  const today = localDate.toISOString().split('T')[0]
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const guestOptions = [1, 2, 3, 4, 5, 6, 7, 8]

  const handleTimeChange = (e) => {
    const newTime = e.target.value
    onChange({ ...value, time: newTime })
  }

  const handleDateChange = (e) => {
    const newDate = e.target.value
    // Si cambia a hoy y la hora ya pasó, limpiar la hora
    if (newDate === today && value.time) {
      const [h, m] = value.time.split(':').map(Number)
      if ((h * 60 + m) <= currentMinutes) {
        onChange({ ...value, date: newDate, time: '' })
        return
      }
    }
    onChange({ ...value, date: newDate })
  }

  // Calcular min/max para el input de hora si es hoy
  const minTime = value.date === today
    ? (() => {
        const h = String(now.getHours()).padStart(2, '0')
        const m = String(now.getMinutes()).padStart(2, '0')
        return `${h}:${m}`
      })()
    : '00:00'

  return (
    <div className="bg-stone-50 dark:bg-stone-700/50 rounded-2xl p-4 space-y-4">
      {/* Fecha */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          <Calendar className="w-4 h-4 text-primary-500" /> Fecha
        </label>
        <input
          type="date"
          min={today}
          value={value.date}
          onChange={handleDateChange}
          className="input-base text-sm"
        />
      </div>

      {/* Hora */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          <Clock className="w-4 h-4 text-primary-500" /> Hora
        </label>
        <input
          type="time"
          min={minTime}
          value={value.time}
          onChange={handleTimeChange}
          className="input-base text-sm"
          placeholder="HH:MM"
        />
        {value.date === today && value.time && (() => {
          const [h, m] = value.time.split(':').map(Number)
          return (h * 60 + m) <= currentMinutes
        })() && (
          <p className="text-xs text-red-500 mt-1">⚠️ Esa hora ya pasó, elige una hora futura.</p>
        )}
      </div>

      {/* Personas */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          <Users className="w-4 h-4 text-primary-500" /> Personas
        </label>
        <div className="flex flex-wrap gap-2">
          {guestOptions.map(n => (
            <button key={n} type="button"
              onClick={() => onChange({ ...value, guests: n })}
              className={clsx(
                'w-10 h-10 rounded-xl text-sm font-semibold transition-all',
                value.guests === n
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-primary-300'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

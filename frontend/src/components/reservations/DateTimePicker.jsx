import { Calendar, Clock, Users } from 'lucide-react'
import clsx from 'clsx'

// Convierte hora 24h (\"19:00\") a formato 12h (\"7:00 PM\")
function format12Hour(time24) {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const h = parseInt(hours, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${period}`
}

export default function DateTimePicker({ value, onChange }) {
  const today = new Date().toISOString().split('T')[0]
  const allTimes = ['12:00','12:30','13:00','13:30','14:00','14:30','15:00',
                    '15:30','16:00','16:30','17:00','17:30','18:00','18:30',
                    '19:00','19:30','20:00','20:30','21:00','21:30','22:00']
  const guestOptions = [1,2,3,4,5,6,7,8]

  // Si la fecha seleccionada es hoy, filtrar horas que ya pasaron
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const times = value.date === today
    ? allTimes.filter(t => {
        const [h, m] = t.split(':').map(Number)
        return (h * 60 + m) > currentMinutes
      })
    : allTimes

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
          onChange={e => {
            const newDate = e.target.value
            // Si cambia a hoy y la hora seleccionada ya pasó, resetear la hora
            if (newDate === today) {
              const [h, m] = (value.time || '12:00').split(':').map(Number)
              const selectedMinutes = h * 60 + m
              if (selectedMinutes <= currentMinutes) {
                const firstAvailable = allTimes.find(t => {
                  const [th, tm] = t.split(':').map(Number)
                  return (th * 60 + tm) > currentMinutes
                })
                onChange({ ...value, date: newDate, time: firstAvailable || '19:00' })
                return
              }
            }
            onChange({ ...value, date: newDate })
          }}
          className="input-base text-sm"
        />
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

      {/* Hora */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          <Clock className="w-4 h-4 text-primary-500" /> Hora preferida
        </label>
        <div className="flex flex-wrap gap-2">
          {times.length === 0 ? (
            <p className="text-xs text-stone-400">No hay horarios disponibles para hoy. Selecciona otro día.</p>
          ) : (
            times.map(t => (
              <button key={t} type="button"
                onClick={() => onChange({ ...value, time: t })}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  value.time === t
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-primary-300'
                )}
              >
                {format12Hour(t)}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

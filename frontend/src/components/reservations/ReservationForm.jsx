import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import DateTimePicker from './DateTimePicker'
import { createReservation } from '../../api/reservations'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useAvailability } from '../../hooks/useRestaurants'
import clsx from 'clsx'

export default function ReservationForm({ restaurant }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  const [datetime, setDatetime] = useState({ date: today, time: '19:00', guests: 2 })
  const [selectedTable, setSelectedTable] = useState(null)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const { data: availability = { tables: [] }, isLoading: loadingSlots } = useAvailability(
    restaurant?.id, datetime.date, datetime.time, datetime.guests
  )
  const availableTables = availability.tables ?? []

  useEffect(() => {
    setSelectedTable(null)
  }, [datetime.date, datetime.time, datetime.guests])

  const mutation = useMutation({
    mutationFn: createReservation,
    onSuccess: (res) => {
      const mesa = res?.data?.table?.name ?? res?.data?.table_id ?? ''
      const hora = datetime.time ?? ''
      toast.success(`¡Reserva confirmada! ${mesa ? `${mesa} @ ` : ''}${hora} 🎉`)
      navigate('/mis-reservas')
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Error al crear la reserva'
      if (err.response?.status === 409) {
        toast.error(`❌ Mesa ocupada, elige otra hora`)
      } else {
        toast.error(msg)
      }
    }
  })

  const onSubmit = (data) => {
    if (!user) { toast.error('Inicia sesión para reservar'); navigate('/login'); return }
    if (!selectedTable) { toast.error('Selecciona una mesa'); return }

    mutation.mutate({
      restaurant_id: restaurant.id,
      table_id: selectedTable,
      start_time: `${datetime.date}T${datetime.time}:00`,
      guests: datetime.guests,
      notes: data.notes,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <DateTimePicker value={datetime} onChange={setDatetime} />

      {/* Horarios disponibles */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-stone-700 dark:text-stone-300">
          Horarios disponibles
        </h4>
        {loadingSlots ? (
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Buscando disponibilidad...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button"
              disabled={!availableTables.length}
              className={clsx(
                'px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                !availableTables.length && 'opacity-40 cursor-not-allowed bg-stone-100 dark:bg-stone-700 text-stone-400',
                availableTables.length && 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              )}
            >
              {datetime.time}
              {!availableTables.length && <span className="block text-[10px]">sin mesas</span>}
            </button>
          </div>
        )}
      </div>

      {/* Mesas */}
      {availableTables.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 text-stone-700 dark:text-stone-300">
            Selecciona tu mesa
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {availableTables.map(mesa => (
              <button key={mesa.id} type="button"
                onClick={() => setSelectedTable(mesa.id)}
                className={clsx(
                  'p-3 rounded-xl text-sm font-medium transition-all border',
                  selectedTable === mesa.id && 'bg-primary-500 text-white border-primary-500 scale-105',
                  selectedTable !== mesa.id && 'bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 hover:border-primary-400'
                )}
              >
                <div className="text-lg">🪑</div>
                <div className="text-xs">Mesa {mesa.numero}</div>
                <div className="text-[10px] opacity-70">{mesa.capacidad} pers.</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notas */}
      <div>
        <label className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5 block">
          Notas especiales <span className="text-stone-400">(opcional)</span>
        </label>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder="Alergias, ocasión especial, preferencias de mesa..."
          className="input-base resize-none text-sm"
        />
      </div>

      {!user && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Debes <button type="button" onClick={() => navigate('/login')} className="underline font-semibold mx-1">iniciar sesión</button> para confirmar la reserva
        </div>
      )}

      <button type="submit" disabled={mutation.isPending}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3">
        {mutation.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando...</>
        ) : (
          <><CheckCircle className="w-4 h-4" /> Confirmar Reserva</>
        )}
      </button>
    </form>
  )
}

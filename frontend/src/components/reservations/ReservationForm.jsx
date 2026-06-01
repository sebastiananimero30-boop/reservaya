import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle, Loader2, AlertCircle, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import DateTimePicker from './DateTimePicker'
import StripePaymentModal from './StripePaymentModal'
import { createReservation } from '../../api/reservations'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useAvailability } from '../../hooks/useRestaurants'
import clsx from 'clsx'

const STRIPE_ENABLED = !!import.meta.env.VITE_STRIPE_KEY

// Convierte hora 24h ("19:00") a formato 12h ("7:00 PM")
function format12Hour(time24) {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const h = parseInt(hours, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${period}`
}

export default function ReservationForm({ restaurant }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  const today = localDate.toISOString().split('T')[0]

  const [datetime, setDatetime] = useState({ date: today, time: '', guests: 2 })
  const [selectedTable, setSelectedTable] = useState(null)
  const [payWithStripe, setPayWithStripe] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingData, setPendingData] = useState(null)

  const { register, handleSubmit } = useForm()

  const { data: availability = { tables: [] }, isLoading: loadingSlots } = useAvailability(
    restaurant?.id, datetime.date, datetime.time, datetime.guests
  )
  const availableTables = availability.tables ?? []
  const requiresDeposit = STRIPE_ENABLED
  const reservationBlocked = requiresDeposit && !payWithStripe

  useEffect(() => {
    setSelectedTable(null)
  }, [datetime.date, datetime.time, datetime.guests])

  const mutation = useMutation({
    mutationFn: createReservation,
    onSuccess: (res) => {
      if (res?.checkout_url) {
        window.location.href = res.checkout_url
        return
      }
      const mesa = res?.data?.table?.name ?? res?.table?.name ?? ''
      const hora = format12Hour(datetime.time ?? '')
      toast.success(`¡Reserva confirmada! ${mesa ? `${mesa} @ ` : ''}${hora} 🎉`)
      navigate('/mis-reservas')
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Error al crear la reserva'
      if (err.response?.status === 409) {
        toast.error('❌ Mesa ocupada, elige otra hora')
      } else {
        toast.error(msg)
      }
    },
  })

  const buildStartTime = () => {
    // Construir ISO 8601 con offset local correcto
    const dateStr = `${datetime.date}T${datetime.time}:00`
    const dt = new Date(dateStr)
    
    // tzOffset está en minutos (negativo = detrás de UTC, positivo = adelante)
    const offset = -dt.getTimezoneOffset()
    const sign = offset >= 0 ? '+' : '-'
    const absOffset = Math.abs(offset)
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0')
    const mins = String(absOffset % 60).padStart(2, '0')
    
    return `${dateStr}${sign}${hours}:${mins}`
  }

  const onSubmit = (data) => {
    if (!user) { toast.error('Inicia sesión para reservar'); navigate('/login'); return }
    if (!selectedTable) { toast.error('Selecciona una mesa'); return }
    if (reservationBlocked) { toast.error('Selecciona garantizar con deposito para reservar'); return }

    const reservationData = {
      restaurant_id: restaurant.id,
      table_id: selectedTable,
      start_time: buildStartTime(),
      guests: datetime.guests,
      notes: data.notes,
    }

    // Si quiere pagar con Stripe, abre el modal en vez de crear la reserva directamente
    if (requiresDeposit) {
      setPendingData(reservationData)
      setShowPaymentModal(true)
      return
    }

    mutation.mutate(reservationData)
  }

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    setPendingData(null)
    navigate('/mis-reservas')
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <DateTimePicker value={datetime} onChange={setDatetime} />

        {/* Disponibilidad de la hora seleccionada */}
        <div>
          {!datetime.time ? (
            <p className="text-sm text-stone-400">Selecciona una hora para ver disponibilidad.</p>
          ) : loadingSlots ? (
            <div className="flex items-center gap-2 text-sm text-stone-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Verificando disponibilidad...
            </div>
          ) : availableTables.length === 0 ? (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Esa hora no está disponible. Prueba con otra hora o fecha.
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-sm text-green-700 dark:text-green-400">
              ✅ Hora disponible — {availableTables.length} {availableTables.length === 1 ? 'mesa libre' : 'mesas libres'}
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

        {/* Opción de pago con Stripe */}
        {STRIPE_ENABLED && (
          <label className="flex items-start gap-3 rounded-xl border border-stone-200 dark:border-stone-700 p-3 bg-white dark:bg-stone-800 cursor-pointer hover:border-primary-300 transition-colors">
            <input
              type="checkbox"
              checked={payWithStripe}
              onChange={e => setPayWithStripe(e.target.checked)}
              className="mt-1 accent-primary-500"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-100">
                <CreditCard className="w-4 h-4 text-primary-500" />
                Garantizar con depósito ($5 USD)
              </span>
              <span className="block text-xs text-stone-500 mt-1">
                Paga un anticipo reembolsable para asegurar tu mesa. Evita no-shows.
              </span>
            </span>
          </label>
        )}

        {!user && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Debes <button type="button" onClick={() => navigate('/login')} className="underline font-semibold mx-1">iniciar sesión</button> para confirmar la reserva
          </div>
        )}

        <button type="submit" disabled={mutation.isPending || reservationBlocked}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed">
          {mutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando...</>
          ) : reservationBlocked ? (
            <><CreditCard className="w-4 h-4" /> Selecciona garantizar con deposito</>
          ) : (
            <><CheckCircle className="w-4 h-4" /> {payWithStripe ? 'Continuar al pago' : 'Confirmar Reserva'}</>
          )}
        </button>
      </form>

      {/* Modal de pago con Stripe */}
      <StripePaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        reservationData={pendingData}
        onSuccess={handlePaymentSuccess}
      />
    </>
  )
}

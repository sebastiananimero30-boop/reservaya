import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, QrCode, Users, X, CheckCircle, CreditCard } from 'lucide-react'
import { getMyReservations, cancelReservation, getStripeCheckoutSession } from '../api/reservations'
import { adaptReservation } from '../api/adapters'
import { useAuth } from '../hooks/useAuth'
import { Link, useSearchParams } from 'react-router-dom'
import Spinner from '../components/common/Spinner'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
  confirmada: { label: 'Confirmada', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  cancelada:  { label: 'Cancelada',  color: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' },
  completada: { label: 'Completada', color: 'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-400' },
  no_presentada: { label: 'No se presentó', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' },
}

export default function MyReservations() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => getMyReservations().then(res => (res.data ?? []).map(adaptReservation)),
    enabled: !!user,
  })

  const cancelMutation = useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => {
      toast.success('Reserva cancelada')
      queryClient.invalidateQueries(['my-reservations'])
    },
    onError: () => toast.error('No se pudo cancelar'),
  })

  useEffect(() => {
    const stripeStatus = searchParams.get('stripe')
    const sessionId = searchParams.get('session_id')

    if (stripeStatus === 'success' && sessionId) {
      getStripeCheckoutSession(sessionId)
        .then(() => {
          toast.success('Pago confirmado')
          queryClient.invalidateQueries(['my-reservations'])
        })
        .catch(() => toast.error('No se pudo confirmar el pago'))
        .finally(() => setSearchParams({}))
    }

    if (stripeStatus === 'cancelled') {
      toast.error('Pago cancelado')
      setSearchParams({})
    }
  }, [queryClient, searchParams, setSearchParams])

  if (!user) return (
    <div className="text-center py-24">
      <p className="text-stone-400 text-lg mb-4">Inicia sesión para ver tus reservas</p>
      <Link to="/login" className="btn-primary">Iniciar sesión</Link>
    </div>
  )

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Mis Reservas</h1>

      {!reservations.length ? (
        <div className="text-center py-24">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-stone-300" />
          <p className="text-stone-500 text-lg mb-2">Sin reservas todavía</p>
          <Link to="/" className="btn-primary">Buscar restaurantes</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res, i) => {
            const date = new Date(res.start_time)
            const cfg = STATUS_CONFIG[res.estado] || STATUS_CONFIG.pendiente
            return (
              <motion.div key={res.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-display font-semibold text-lg">{res.restaurant?.nombre}</h3>
                      <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.color)}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-stone-500 dark:text-stone-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary-400" />
                        {date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary-400" />
                        {date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary-400" />
                        {res.guests} {res.guests === 1 ? 'persona' : 'personas'}
                      </span>
                    </div>
                    {res.mesa && (
                      <p className="text-xs text-stone-400 mt-2">Mesa #{res.mesa.numero}</p>
                    )}
                    {res.payment_provider === 'stripe' && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                        <CreditCard className="w-3.5 h-3.5 text-primary-400" />
                        Stripe: {res.payment_status === 'pagado' ? 'pagado' : 'pendiente'}
                      </p>
                    )}
                    {res.qr_code && (
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <img
                          src={res.qr_code}
                          alt={`Codigo QR de la reserva ${res.code}`}
                          className="w-28 h-28 rounded-lg border border-stone-200 bg-white p-2"
                        />
                        <div className="text-sm text-stone-500">
                          <p className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
                            <QrCode className="w-4 h-4 text-primary-400" />
                            {res.code}
                          </p>
                          <p className="text-xs mt-1">Presenta este QR o el codigo al llegar.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {res.estado === 'confirmada' && (
                    <button
                      onClick={() => cancelMutation.mutate(res.id)}
                      disabled={cancelMutation.isPending}
                      className="text-xs text-red-500 border border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

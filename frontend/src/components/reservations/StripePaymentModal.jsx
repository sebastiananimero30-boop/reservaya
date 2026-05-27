import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Loader2, Lock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || '')

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1c1917',
      fontFamily: 'DM Sans, sans-serif',
      '::placeholder': { color: '#a8a29e' },
    },
    invalid: { color: '#ef4444' },
  },
}

// ── Formulario interno de Stripe ──────────────────────────────────────────────
function CheckoutForm({ reservationData, onSuccess, onClose }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements || !cardComplete) return

    setLoading(true)
    try {
      // 1. Crear el PaymentIntent en el backend
      const { data: intentData } = await api.post('/payments/create-intent', {
        ...reservationData,
        amount: 500, // $5.00 USD en centavos — depósito de reserva
      })

      // 2. Confirmar el pago con la tarjeta
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        intentData.client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      )

      if (error) {
        toast.error(error.message || 'Error al procesar el pago')
        setLoading(false)
        return
      }

      // 3. Confirmar la reserva en el backend
      const { data: reservationResult } = await api.post('/payments/confirm-reservation', {
        payment_intent_id: paymentIntent.id,
        ...reservationData,
      })

      toast.success('¡Pago y reserva confirmados! 🎉')
      onSuccess(reservationResult)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al procesar el pago')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Resumen de la reserva */}
      <div className="bg-stone-50 dark:bg-stone-700/50 rounded-xl p-4 space-y-1.5 text-sm">
        <p className="font-semibold text-stone-800 dark:text-stone-100">Resumen del pago</p>
        <div className="flex justify-between text-stone-500 dark:text-stone-400">
          <span>Depósito de reserva</span>
          <span className="font-semibold text-stone-800 dark:text-stone-100">$5.00 USD</span>
        </div>
        <p className="text-xs text-stone-400 mt-1">
          El depósito se reembolsa al completar tu visita al restaurante.
        </p>
      </div>

      {/* Campo de tarjeta */}
      <div>
        <label className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 block">
          Datos de la tarjeta
        </label>
        <div className="border border-stone-200 dark:border-stone-600 rounded-xl px-4 py-3.5 bg-white dark:bg-stone-800 focus-within:ring-2 focus-within:ring-primary-400 focus-within:border-transparent transition-all">
          <CardElement
            options={CARD_STYLE}
            onChange={(e) => setCardComplete(e.complete)}
          />
        </div>
      </div>

      {/* Botón de pago */}
      <button
        type="submit"
        disabled={!stripe || !cardComplete || loading}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Procesando pago...</>
        ) : (
          <><Lock className="w-4 h-4" /> Pagar $5.00 USD y confirmar reserva</>
        )}
      </button>

      <p className="text-center text-xs text-stone-400 flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" /> Pago seguro con Stripe
      </p>
    </form>
  )
}

// ── Modal flotante ─────────────────────────────────────────────────────────────
export default function StripePaymentModal({ open, onClose, reservationData, onSuccess }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-stone-800 rounded-3xl shadow-2xl w-full max-w-md p-6 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-stone-900 dark:text-stone-100">Pagar anticipo</h2>
                  <p className="text-xs text-stone-400">Reserva garantizada con depósito</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            {/* Stripe Elements */}
            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  reservationData={reservationData}
                  onSuccess={onSuccess}
                  onClose={onClose}
                />
              </Elements>
            ) : (
              <div className="text-center py-8 text-stone-400">
                <p className="text-sm">Stripe no está configurado.</p>
                <p className="text-xs mt-1">Agrega VITE_STRIPE_KEY al .env</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

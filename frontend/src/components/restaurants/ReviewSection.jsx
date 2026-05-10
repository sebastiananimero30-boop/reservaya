import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MessageSquare, Loader2, Trash2 } from 'lucide-react'
import { getReviews, createReview, deleteReview } from '../../api/reviews'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import clsx from 'clsx'

function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={clsx('transition-transform', !readonly && 'hover:scale-110 cursor-pointer')}
        >
          <Star
            className={clsx(
              'w-6 h-6 transition-colors',
              (hover || value) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-stone-200 text-stone-200 dark:fill-stone-600 dark:text-stone-600'
            )}
          />
        </button>
      ))}
    </div>
  )
}

export default function ReviewSection({ restaurantId }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', restaurantId],
    queryFn: () => getReviews(restaurantId).then(r => r.data ?? []),
  })
  const reviews = data ?? []

  // Verifica si el usuario ya dejó una reseña
  const myReview = user ? reviews.find(r => r.user_name === user.name) : null

  const createMutation = useMutation({
    mutationFn: () => createReview(restaurantId, { rating, comment }),
    onSuccess: () => {
      toast.success('¡Reseña publicada!')
      qc.invalidateQueries(['reviews', restaurantId])
      qc.invalidateQueries(['restaurant', restaurantId])
      setRating(0)
      setComment('')
      setShowForm(false)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'No se pudo publicar la reseña')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteReview(restaurantId),
    onSuccess: () => {
      toast.success('Reseña eliminada')
      qc.invalidateQueries(['reviews', restaurantId])
      qc.invalidateQueries(['restaurant', restaurantId])
    },
    onError: () => toast.error('No se pudo eliminar la reseña'),
  })

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-stone-100 dark:border-stone-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary-500" />
          <h2 className="font-semibold">Reseñas</h2>
          <span className="text-xs text-stone-400">{reviews.length} opiniones</span>
        </div>
        {user && !myReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-xs px-3 py-1.5"
          >
            Escribir reseña
          </button>
        )}
      </div>

      {/* Formulario de reseña */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-stone-100 dark:border-stone-700 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300">Tu calificación</p>
              <StarRating value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder="Cuéntanos tu experiencia (opcional)..."
                className="input-base resize-none text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setRating(0); setComment('') }}
                  className="btn-outline flex-1 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => createMutation.mutate()}
                  disabled={!rating || createMutation.isPending}
                  className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                >
                  {createMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</>
                    : 'Publicar reseña'
                  }
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de reseñas */}
      <div className="divide-y divide-stone-100 dark:divide-stone-700">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
          </div>
        ) : !reviews.length ? (
          <div className="text-center py-8 text-stone-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aún no hay reseñas. ¡Sé el primero!</p>
          </div>
        ) : (
          reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold text-sm">
                      {review.user_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{review.user_name}</p>
                    <p className="text-xs text-stone-400">{review.created_at}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} readonly />
                  {user && review.user_name === user.name && (
                    <button
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 ml-11 leading-relaxed">
                  {review.comment}
                </p>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

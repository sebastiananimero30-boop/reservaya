import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, Users, Clock, TrendingUp } from 'lucide-react'
import clsx from 'clsx'

const CATEGORY_EMOJIS = {
  'Parrilla': '🥩', 'Japonesa': '🍣', 'Vegetariana': '🥗', 'Colombiana': '🍲',
  'Francesa': '🥐', 'Italiana': '🍕', 'Mariscos': '🦞', 'Americana': '🍔',
}

const PRICE_COLORS = {
  '$': 'text-green-600 dark:text-green-400',
  '$$': 'text-yellow-600 dark:text-yellow-400',
  '$$$': 'text-orange-500',
  '$$$$': 'text-red-500',
}

export default function RestaurantCard({ restaurant, index = 0 }) {
  const emoji = CATEGORY_EMOJIS[restaurant.categoria] || '🍽️'

  const timeSlots = ['18:30', '19:00', '19:30', '20:00', '20:30']

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link to={`/restaurantes/${restaurant.id}`} className="block group">
        <div className="card card-3d cursor-pointer">
          {/* Imagen / portada */}
          <div className="relative h-48 bg-gradient-to-br from-stone-700 to-stone-900 overflow-hidden">
            {restaurant.imagen ? (
              <img src={restaurant.imagen} alt={restaurant.nombre}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-7xl opacity-60">{emoji}</span>
              </div>
            )}
            {/* Badge precio */}
            <div className="absolute top-3 right-3 bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm
                            px-2.5 py-1 rounded-lg text-xs font-bold shadow">
              <span className={PRICE_COLORS[restaurant.precio] || 'text-stone-600'}>{restaurant.precio}</span>
            </div>
            {/* Badge destacado */}
            {restaurant.destacado && (
              <div className="absolute top-3 left-3 bg-primary-500 text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Destacado
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 text-white text-xs font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />{restaurant.horario?.split(' ')[0] || 'Abierto'}
            </div>
          </div>

          {/* Contenido */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-display font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary-500 transition-colors">
                {restaurant.nombre}
              </h3>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={clsx('w-3.5 h-3.5',
                    i <= Math.round(restaurant.calificacion)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-stone-200 text-stone-200'
                  )} />
                ))}
              </div>
              <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                {Number(restaurant.calificacion).toFixed(1)}
              </span>
              <span className="text-xs text-stone-400">({restaurant.total_resenas})</span>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mb-3">
              <span className="flex items-center gap-1">
                <span>{emoji}</span>{restaurant.categoria}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{restaurant.zona}
              </span>
            </div>

            {/* Reservas hoy */}
            {restaurant.reservas_hoy > 0 && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-1">
                <Users className="w-3 h-3 text-primary-400" />
                Reservado <strong className="text-stone-700 dark:text-stone-300">{restaurant.reservas_hoy} veces</strong> hoy
              </p>
            )}

            {/* Time slots */}
            <div className="flex gap-1.5 flex-wrap">
              {timeSlots.map((slot, i) => (
                <span key={slot}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200',
                    i % 3 === 0
                      ? 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500'
                      : 'bg-primary-500 text-white hover:bg-primary-600 cursor-pointer hover:scale-105'
                  )}
                >
                  {slot}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function RestaurantCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48 rounded-none" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-4 w-2/3" />
        <div className="flex gap-2">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-7 w-14" />)}
        </div>
      </div>
    </div>
  )
}

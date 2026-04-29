import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, Clock, Phone, ArrowLeft, ChefHat } from 'lucide-react'
import { useRestaurant } from '../hooks/useRestaurants'
import ReservationForm from '../components/reservations/ReservationForm'
import Spinner from '../components/common/Spinner'
import clsx from 'clsx'

const CATEGORY_EMOJIS = {
  'Parrilla':'🥩','Japonesa':'🍣','Vegetariana':'🥗','Colombiana':'🍲',
  'Francesa':'🥐','Italiana':'🍕','Mariscos':'🦞','Americana':'🍔',
}

export default function RestaurantDetail() {
  const { id } = useParams()
  const { data: restaurant, isLoading, error } = useRestaurant(id)

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <Spinner size="lg" />
    </div>
  )

  if (error || !restaurant) return (
    <div className="text-center py-24">
      <p className="text-stone-400 text-lg">Restaurante no encontrado</p>
      <Link to="/" className="btn-primary mt-4 inline-block">Volver al inicio</Link>
    </div>
  )

  const emoji = CATEGORY_EMOJIS[restaurant.categoria] || '🍽️'
  const mapSrc = restaurant.latitud
    ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyD-dummy&q=${restaurant.latitud},${restaurant.longitud}&zoom=16`
    : null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-primary-500 mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver a restaurantes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative h-64 md:h-80 rounded-3xl overflow-hidden bg-gradient-to-br from-stone-700 to-stone-900"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8rem] opacity-40">{emoji}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="font-display text-3xl font-bold text-white mb-2">{restaurant.nombre}</h1>
              <div className="flex items-center gap-3 text-white/80 text-sm flex-wrap">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {Number(restaurant.calificacion).toFixed(1)} · {restaurant.total_resenas} reseñas
                </span>
                <span>·</span>
                <span>{emoji} {restaurant.categoria}</span>
                <span>·</span>
                <span>{restaurant.precio}</span>
              </div>
            </div>
          </motion.div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: MapPin, label: 'Dirección', val: restaurant.direccion },
              { icon: Clock, label: 'Horario', val: restaurant.horario },
              { icon: Phone, label: 'Teléfono', val: restaurant.telefono },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="bg-white dark:bg-stone-800 rounded-2xl p-4 border border-stone-100 dark:border-stone-700">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-primary-500" />
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">{label}</span>
                </div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{val || '—'}</p>
              </div>
            ))}
          </div>

          {/* Descripción */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700">
            <h2 className="font-display font-semibold text-xl mb-3">Sobre el restaurante</h2>
            <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{restaurant.descripcion}</p>
          </div>

          {/* Mapa */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-700">
            <div className="p-4 border-b border-stone-100 dark:border-stone-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-500" />
              <h2 className="font-semibold">Ubicación</h2>
            </div>
            <div className="h-56 bg-stone-100 dark:bg-stone-700 flex items-center justify-center relative overflow-hidden">
              {mapSrc ? (
                <iframe
                  src={mapSrc} width="100%" height="100%" style={{ border: 0 }}
                  allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa restaurante"
                />
              ) : (
                <div className="text-center text-stone-400">
                  <div className="text-5xl mb-2">🗺️</div>
                  <p className="text-sm">{restaurant.direccion}</p>
                  <p className="text-xs mt-1">{restaurant.zona}, Ibagué</p>
                </div>
              )}
            </div>
          </div>

          {/* Menú */}
          {restaurant.menu?.length > 0 && (
            <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 overflow-hidden">
              <div className="p-4 border-b border-stone-100 dark:border-stone-700 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-primary-500" />
                <h2 className="font-semibold">Menú</h2>
              </div>
              <div className="divide-y divide-stone-100 dark:divide-stone-700">
                {restaurant.menu.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors">
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-200">{item.nombre}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{item.descripcion}</p>
                      <span className="text-xs bg-stone-100 dark:bg-stone-700 text-stone-500 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {item.categoria}
                      </span>
                    </div>
                    <span className="font-semibold text-primary-500 text-sm ml-4 whitespace-nowrap">
                      ${item.precio?.toLocaleString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — reservation form */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="bg-white dark:bg-stone-800 rounded-3xl border border-stone-100 dark:border-stone-700 shadow-xl p-6"
            >
              <h2 className="font-display font-semibold text-xl mb-5">Hacer una reserva</h2>
              <ReservationForm restaurant={restaurant} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

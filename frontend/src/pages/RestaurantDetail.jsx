import { useState, useEffect, forwardRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MapPin, Clock, Phone, ArrowLeft, ChefHat, X, ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { useRestaurant } from '../hooks/useRestaurants'
import ReservationForm from '../components/reservations/ReservationForm'
import Spinner from '../components/common/Spinner'
import clsx from 'clsx'

const CATEGORY_EMOJIS = {
  'Parrilla':'🥩','Japonesa':'🍣','Vegetariana':'🥗','Colombiana':'🍲',
  'Francesa':'🥐','Italiana':'🍕','Mariscos':'🦞','Americana':'🍔',
}

// Imágenes placeholder por categoría de plato cuando no hay foto
const PLACEHOLDER_BY_CAT = {
  'Entradas':       'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400',
  'Platos Fuertes': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
  'Pastas':         'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
  'Pizzas':         'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
  'Postres':        'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400',
  'Bebidas':        'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
  'Carnes':         'https://images.unsplash.com/photo-1558030006-450675393462?w=400',
  'Sushi':          'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400',
  'Hamburguesas':   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
}
const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400'

function getPlaceholder(categoria) {
  return PLACEHOLDER_BY_CAT[categoria] || DEFAULT_PLACEHOLDER
}

// ── Galería hero del restaurante ─────────────────────────────────────────────
function RestaurantHero({ restaurant, emoji }) {
  const fotos = restaurant.fotos?.filter(f => f.url) ?? []
  const coverFirst = fotos.sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0))
  const images = coverFirst.length > 0
    ? coverFirst.map(f => f.url)
    : restaurant.imagen
      ? [restaurant.imagen]
      : []

  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const prev = (e) => { e.stopPropagation(); setCurrent(i => (i - 1 + images.length) % images.length) }
  const next = (e) => { e.stopPropagation(); setCurrent(i => (i + 1) % images.length) }

  // Si no hay fotos, muestra el hero original con emoji
  if (!images.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative h-64 md:h-80 rounded-3xl overflow-hidden bg-gradient-to-br from-stone-700 to-stone-900"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8rem] opacity-40">{emoji}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <HeroInfo restaurant={restaurant} emoji={emoji} />
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative h-64 md:h-80 rounded-3xl overflow-hidden bg-stone-900 cursor-pointer group"
        onClick={() => setLightbox(true)}
      >
        {/* Imagen activa */}
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={images[current]}
            alt={`${restaurant.nombre} foto ${current + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onError={e => { e.target.style.display = 'none' }}
          />
        </AnimatePresence>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Flechas — solo si hay más de 1 foto */}
        {images.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Puntos de navegación */}
        {images.length > 1 && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setCurrent(i) }}
                className={clsx('w-1.5 h-1.5 rounded-full transition-all',
                  i === current ? 'bg-white w-4' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        )}

        {/* Badge contador de fotos */}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            <Images className="w-3 h-3" />
            {current + 1} / {images.length}
          </div>
        )}

        <HeroInfo restaurant={restaurant} emoji={emoji} />
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setLightbox(false)}>
            <button onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            {images.length > 1 && (
              <>
                <button onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <motion.img
              key={current}
              src={images[current]}
              alt={`${restaurant.nombre} foto ${current + 1}`}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              onClick={e => e.stopPropagation()}
            />
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setCurrent(i) }}
                    className={clsx('w-2 h-2 rounded-full transition-all',
                      i === current ? 'bg-white w-5' : 'bg-white/40'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

function HeroInfo({ restaurant, emoji }) {
  return (
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
  )
}

// ── Modal detalle de plato ────────────────────────────────────────────────────
function MenuItemModal({ item, onClose }) {
  if (!item) return null
  const imgSrc = item.imagen || getPlaceholder(item.categoria)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative bg-white dark:bg-stone-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden z-10"
      >
        {/* Foto grande */}
        <div className="relative h-56 bg-stone-100 dark:bg-stone-700">
          <img src={imgSrc} alt={item.nombre}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = DEFAULT_PLACEHOLDER }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
          <span className="absolute bottom-3 left-3 text-xs bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full font-medium">
            {item.categoria}
          </span>
        </div>

        {/* Info */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-bold text-xl text-stone-900 dark:text-stone-100 leading-tight">{item.nombre}</h3>
            <span className="font-bold text-primary-500 text-xl whitespace-nowrap">
              ${Number(item.precio).toLocaleString('es-CO')}
            </span>
          </div>
          {item.descripcion && (
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{item.descripcion}</p>
          )}
          {!item.disponible && (
            <p className="text-xs text-red-500 mt-3 font-medium">⚠️ No disponible actualmente</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── Tarjeta de plato ──────────────────────────────────────────────────────────
const MenuCard = forwardRef(function MenuCard({ item, onClick }, ref) {
  const imgSrc = item.imagen || getPlaceholder(item.categoria)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={clsx(
        'bg-white dark:bg-stone-800 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-700',
        'cursor-pointer shadow-sm hover:shadow-lg transition-all duration-200',
        !item.disponible && 'opacity-60'
      )}
    >
      {/* Imagen */}
      <div className="relative h-40 bg-stone-100 dark:bg-stone-700 overflow-hidden">
        <img
          src={imgSrc} alt={item.nombre}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={e => { e.target.src = DEFAULT_PLACEHOLDER }}
          loading="lazy"
        />
        {!item.disponible && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1 rounded-full">No disponible</span>
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full font-medium">
          {item.categoria}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm leading-tight line-clamp-1">{item.nombre}</p>
        {item.descripcion && (
          <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">{item.descripcion}</p>
        )}
        <p className="font-bold text-primary-500 text-sm mt-2">
          ${Number(item.precio).toLocaleString('es-CO')}
        </p>
      </div>
    </motion.div>
  )
})

// ── Galería del menú ──────────────────────────────────────────────────────────
function MenuGallery({ items }) {
  const [activeTab, setActiveTab] = useState('Todos')
  const [selectedItem, setSelectedItem] = useState(null)

  const categories = ['Todos', ...new Set(items.map(i => i.categoria).filter(Boolean))]

  const filtered = activeTab === 'Todos'
    ? items
    : items.filter(i => i.categoria === activeTab)

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-stone-100 dark:border-stone-700 flex items-center gap-2">
        <ChefHat className="w-4 h-4 text-primary-500" />
        <h2 className="font-semibold">Menú</h2>
        <span className="ml-auto text-xs text-stone-400">{items.length} platos</span>
      </div>

      {/* Filtros por categoría */}
      {categories.length > 2 && (
        <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveTab(cat)}
              className={clsx(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                activeTab === cat
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600'
              )}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid de tarjetas */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map(item => (
            <MenuCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
          ))}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedItem && (
          <MenuItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </div>
  )
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
  const mapKey = import.meta.env.VITE_MAPS_KEY
  const mapSrc = restaurant.latitud && mapKey && mapKey !== 'tu-google-maps-key'
    ? `https://www.google.com/maps/embed/v1/place?key=${mapKey}&q=${restaurant.latitud},${restaurant.longitud}&zoom=16&language=es`
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
          {/* Hero — galería de fotos */}
          <RestaurantHero restaurant={restaurant} emoji={emoji} />

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
                <div className="text-center text-stone-400 px-4">
                  <div className="text-5xl mb-2">🗺️</div>
                  <p className="text-sm font-medium text-stone-600 dark:text-stone-300">{restaurant.direccion}</p>
                  <p className="text-xs mt-1 mb-3">{restaurant.zona}, Ibagué</p>
                  {restaurant.latitud && (
                    <a
                      href={`https://www.google.com/maps?q=${restaurant.latitud},${restaurant.longitud}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-primary-500 text-white px-3 py-1.5 rounded-full hover:bg-primary-600 transition-colors"
                    >
                      <MapPin className="w-3 h-3" /> Ver en Google Maps
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Menú — Galería */}
          {restaurant.menu?.length > 0 && (
            <MenuGallery items={restaurant.menu} />
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

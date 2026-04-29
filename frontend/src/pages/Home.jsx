import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Users, Search } from 'lucide-react'
import RestaurantFilters from '../components/restaurants/RestaurantFilters'
import RestaurantGrid from '../components/restaurants/RestaurantGrid'
import { useRestaurants } from '../hooks/useRestaurants'

export default function Home() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    categoria: '', zona: '', precio: '',
    search: searchParams.get('search') || ''
  })

  useEffect(() => {
    setFilters(f => ({ ...f, search: searchParams.get('search') || '' }))
  }, [searchParams])

  const { data, isLoading, error } = useRestaurants(filters)
  const restaurants = data?.data || []

  return (
    <div>
      {/* Hero banner */}
      <div className="relative bg-stone-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23f97316\' fill-opacity=\'0.4\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'4\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative max-w-7xl mx-auto px-4 py-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-primary-400 font-medium mb-3 text-sm tracking-widest uppercase"
          >
            🍽️ La mejor plataforma de reservas
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Reserva tu mesa perfecta<br />
            <span className="text-primary-400">en Ibagué</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-stone-400 text-lg mb-8"
          >
            Los mejores restaurantes, disponibilidad en tiempo real
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="max-w-3xl mx-auto bg-white dark:bg-stone-800 rounded-2xl p-2 flex flex-wrap gap-2 shadow-2xl"
          >
            <div className="flex items-center gap-2 flex-1 min-w-36 px-3">
              <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
              <span className="text-sm text-stone-500">Ibagué, Tolima</span>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-36 px-3 border-l border-stone-200 dark:border-stone-700">
              <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
              <span className="text-sm text-stone-500">Hoy</span>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-36 px-3 border-l border-stone-200 dark:border-stone-700">
              <Users className="w-4 h-4 text-primary-500 flex-shrink-0" />
              <span className="text-sm text-stone-500">2 personas</span>
            </div>
            <button className="btn-primary flex items-center gap-2 py-2.5">
              <Search className="w-4 h-4" />
              Buscar mesa
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-8 mt-8 text-stone-400 text-sm"
          >
            {[['24+', 'Restaurantes'], ['1,200+', 'Reservas'], ['4.7★', 'Promedio']].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-white font-bold text-xl">{n}</div>
                <div className="text-xs">{l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <RestaurantFilters filters={filters} onChange={setFilters} />

        <div className="flex items-center justify-between mb-6">
          <p className="text-stone-500 text-sm">
            {isLoading ? 'Buscando...' : (
              <><strong className="text-stone-800 dark:text-stone-200">{restaurants.length}</strong> restaurantes encontrados</>
            )}
          </p>
          {filters.search && (
            <p className="text-sm text-stone-500">
              Resultados para: <strong className="text-primary-500">"{filters.search}"</strong>
            </p>
          )}
        </div>

        {error ? (
          <div className="text-center py-12 text-red-500">
            Error al cargar restaurantes. Inténtalo de nuevo.
          </div>
        ) : (
          <RestaurantGrid restaurants={restaurants} isLoading={isLoading} />
        )}
      </div>
    </div>
  )
}

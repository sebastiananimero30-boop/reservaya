import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Users, Search, Star, ChevronDown } from 'lucide-react'
import RestaurantFilters from '../components/restaurants/RestaurantFilters'
import RestaurantGrid from '../components/restaurants/RestaurantGrid'
import { useRestaurants } from '../hooks/useRestaurants'

export default function Home() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    categoria: '', zona: '', precio: '',
    search: searchParams.get('search') || ''
  })
  const [heroSearch, setHeroSearch] = useState('')
  const [heroGuests, setHeroGuests] = useState(2)

  useEffect(() => {
    setFilters(f => ({ ...f, search: searchParams.get('search') || '' }))
  }, [searchParams])

  const handleHeroSearch = () => {
    setFilters(f => ({ ...f, search: heroSearch }))
    document.getElementById('restaurantes-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  const { data, isLoading, error } = useRestaurants(filters)
  const restaurants = data?.data || []

  return (
    <div>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-stone-950" style={{ minHeight: '700px' }}>

        {/* Video de fondo */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://videos.pexels.com/video-files/8626269/8626269-hd_1920_1080_25fps.mp4" type="video/mp4" />
       
        </video>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

        {/* Contenido alineado a la izquierda */}
        <div
          className="relative max-w-7xl mx-auto px-6 lg:px-12 flex flex-col justify-center"
          style={{ minHeight: '700px' }}
        >
          <div className="max-w-xl">

            {/* Badge animado */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 mb-6 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              <span className="text-white/80 text-xs font-semibold tracking-widest uppercase">
                Plataforma de reservas #1 en Ibagué
              </span>
            </motion.div>

            {/* Título grande */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] mb-5 tracking-tight"
            >
              Reserva tu<br />
              mesa perfecta<br />
              <span className="text-primary-400">en Ibagué</span>
            </motion.h1>

            {/* Subtítulo */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-white/55 text-lg leading-relaxed mb-10"
            >
              Descubre los mejores restaurantes de la ciudad<br className="hidden md:block" />
              y reserva tu mesa en segundos.
            </motion.p>

            {/* Barra de búsqueda */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-wrap"
            >
              {/* Ciudad */}
              <div className="flex items-center gap-3 flex-1 min-w-[130px] px-5 py-4 border-r border-stone-100">
                <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Ciudad</p>
                  <p className="text-sm font-semibold text-stone-800">Ibagué, Tolima</p>
                </div>
              </div>
              {/* Buscar restaurante */}
              <div className="flex items-center gap-3 flex-1 min-w-[180px] px-5 py-4 border-r border-stone-100">
                <Search className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Restaurante</p>
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={e => setHeroSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleHeroSearch()}
                    placeholder="Buscar cocina, zona..."
                    className="text-sm font-semibold text-stone-800 bg-transparent outline-none w-full placeholder:text-stone-400 placeholder:font-normal"
                  />
                </div>
              </div>
              {/* Personas */}
              <div className="flex items-center gap-3 flex-1 min-w-[110px] px-5 py-4">
                <Users className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Personas</p>
                  <select
                    value={heroGuests}
                    onChange={e => setHeroGuests(Number(e.target.value))}
                    className="text-sm font-semibold text-stone-800 bg-transparent outline-none cursor-pointer"
                  >
                    {[1,2,3,4,5,6,7,8].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Botón */}
              <button
                onClick={handleHeroSearch}
                className="bg-primary-500 hover:bg-primary-600 transition-colors text-white flex items-center gap-2 px-7 py-4 font-bold text-sm"
              >
                <Search className="w-4 h-4" />
                Buscar
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-0 mt-10 divide-x divide-white/15"
            >
              {[
                { value: '24+', label: 'Restaurantes' },
                { value: '1,200+', label: 'Reservas' },
                { value: '4.7', label: 'Calificación', icon: <Star className="w-3.5 h-3.5 fill-primary-400 text-primary-400 inline mb-0.5 ml-0.5" /> },
              ].map(({ value, label, icon }, i) => (
                <div key={label} className={`${i === 0 ? 'pr-6' : 'px-6'}`}>
                  <p className="text-white font-extrabold text-2xl leading-none">
                    {value}{icon}
                  </p>
                  <p className="text-white/40 text-xs mt-1 font-medium">{label}</p>
                </div>
              ))}
            </motion.div>

          </div>
        </div>

        {/* Flecha scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.div>
      </div>

      {/* ── Contenido ── */}
      <div id="restaurantes-section" className="max-w-7xl mx-auto px-4 py-8">
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

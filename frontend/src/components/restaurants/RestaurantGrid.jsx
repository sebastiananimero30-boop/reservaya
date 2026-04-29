import RestaurantCard, { RestaurantCardSkeleton } from './RestaurantCard'
import { motion } from 'framer-motion'
import { UtensilsCrossed } from 'lucide-react'

export default function RestaurantGrid({ restaurants, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
      </div>
    )
  }

  if (!restaurants?.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 text-stone-400"
      >
        <UtensilsCrossed className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No se encontraron restaurantes</p>
        <p className="text-sm mt-1">Intenta con otros filtros</p>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {restaurants.map((r, i) => (
        <RestaurantCard key={r.id} restaurant={r} index={i} />
      ))}
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import { useCategories } from '../../hooks/useRestaurants'
import clsx from 'clsx'

const ZONAS = ['Centro', 'Chapetón', 'La Pola', 'Ambalá', 'Calambeo', 'Picaleña']
const PRECIOS = ['$', '$$', '$$$', '$$$$']

export default function RestaurantFilters({ filters, onChange }) {
  const { data: categories = [] } = useCategories()
  const [open, setOpen] = useState(false)

  const set = (key, val) => onChange({ ...filters, [key]: filters[key] === val ? '' : val })
  const clear = () => onChange({ categoria: '', zona: '', precio: '', search: filters.search || '' })
  const activeCount = [filters.categoria, filters.zona, filters.precio].filter(Boolean).length

  return (
    <div className="mb-6">
      {/* Category tags */}
      <div className="flex gap-2 flex-wrap mb-3">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => set('categoria', cat.slug ?? cat.nombre)}
            className={clsx(
              'px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 hover:scale-105',
              filters.categoria === (cat.slug ?? cat.nombre)
                ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-primary-300'
            )}
          >
            {cat.nombre}
          </button>
        ))}

        <button
          onClick={() => setOpen(o => !o)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200',
            open || activeCount > 0
              ? 'bg-stone-800 dark:bg-white border-stone-800 dark:border-white text-white dark:text-stone-900'
              : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {activeCount > 0 && (
            <span className="bg-primary-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button onClick={clear}
            className="flex items-center gap-1 px-3 py-2 rounded-full text-sm text-red-500 border-2 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <X className="w-4 h-4" /> Limpiar
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold mb-3 text-stone-700 dark:text-stone-300">Zona</h4>
              <div className="flex flex-wrap gap-2">
                {ZONAS.map(z => (
                  <button key={z} onClick={() => set('zona', z)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm border transition-all',
                      filters.zona === z
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'border-stone-200 dark:border-stone-600 hover:border-primary-300 text-stone-600 dark:text-stone-400'
                    )}>
                    {z}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-stone-700 dark:text-stone-300">Precio</h4>
              <div className="flex gap-2">
                {PRECIOS.map(p => (
                  <button key={p} onClick={() => set('precio', p)}
                    className={clsx(
                      'px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all',
                      filters.precio === p
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'border-stone-200 dark:border-stone-600 hover:border-primary-300 text-stone-600 dark:text-stone-400'
                    )}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

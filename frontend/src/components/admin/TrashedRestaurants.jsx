import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, X, Building2 } from 'lucide-react'
import { getTrashedRestaurants, restoreRestaurant, forceDeleteRestaurant } from '../../api/admin'
import toast from 'react-hot-toast'

export default function TrashedRestaurants() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-restaurants-trashed'],
    queryFn: () => getTrashedRestaurants().then(r => r.data ?? []),
  })

  const restoreMutation = useMutation({
    mutationFn: restoreRestaurant,
    onSuccess: () => {
      toast.success('Restaurante restaurado')
      qc.invalidateQueries({ queryKey: ['admin-restaurants-trashed'] })
      qc.invalidateQueries({ queryKey: ['admin-restaurants'] })
    },
    onError: () => toast.error('No se pudo restaurar'),
  })

  const forceMutation = useMutation({
    mutationFn: forceDeleteRestaurant,
    onSuccess: () => {
      toast.success('Eliminado permanentemente')
      qc.invalidateQueries({ queryKey: ['admin-restaurants-trashed'] })
    },
    onError: () => toast.error('No se pudo eliminar'),
  })

  const items = data ?? []

  if (isLoading) return <p className="text-sm text-stone-400 py-4">Cargando papelera...</p>

  if (!items.length) return (
    <div className="text-center py-10 text-stone-400">
      <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm">La papelera está vacía</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {items.map(r => (
        <div key={r.id} className="flex items-center justify-between gap-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
              {r.cover_photo
                ? <img src={r.cover_photo} alt={r.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
              }
            </div>
            <div className="min-w-0">
              <p className="font-medium text-stone-700 dark:text-stone-300 truncate">{r.name}</p>
              <p className="text-xs text-stone-400">{r.zone} · {r.category?.name}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => restoreMutation.mutate(r.id)}
              disabled={restoreMutation.isPending}
              className="flex items-center gap-1.5 text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar
            </button>
            <button
              onClick={() => {
                if (confirm('¿Eliminar permanentemente? Esta acción no se puede deshacer.')) {
                  forceMutation.mutate(r.id)
                }
              }}
              disabled={forceMutation.isPending}
              className="flex items-center gap-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

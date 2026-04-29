import { useQuery } from '@tanstack/react-query'
import { getRestaurants, getRestaurant, getAvailability, getCategories } from '../api/restaurants'
import { adaptRestaurant, adaptTable } from '../api/adapters'

// Datos mock para desarrollo (cuando no hay backend)
const MOCK_RESTAURANTS = [
  { id: 1, nombre: 'La Leñita — Parrilla Ibaguereña', calificacion: 4.9, total_resenas: 142,
    categoria: 'Parrilla', zona: 'Chapetón', precio: '$$$', direccion: 'Cra 5 #12-34, Chapetón',
    descripcion: 'La mejor parrilla de Ibagué con cortes importados y carbón vegetal.',
    latitud: 4.4389, longitud: -75.2322, imagen: null,
    horario: 'Lun–Dom 12pm–10pm', telefono: '312 345 6789',
    destacado: true, reservas_hoy: 12 },
  { id: 2, nombre: 'Sakura Sushi & Ramen Bar', calificacion: 4.8, total_resenas: 203,
    categoria: 'Japonesa', zona: 'La Pola', precio: '$$$', direccion: 'Av. 60 #25-10, La Pola',
    descripcion: 'Auténtica cocina japonesa en el corazón de Ibagué.',
    latitud: 4.4425, longitud: -75.2289, imagen: null,
    horario: 'Mar–Dom 12pm–11pm', telefono: '310 987 6543',
    destacado: true, reservas_hoy: 18 },
  { id: 3, nombre: 'Tierra Viva — Cocina Saludable', calificacion: 4.5, total_resenas: 89,
    categoria: 'Vegetariana', zona: 'Centro', precio: '$$', direccion: 'Calle 10 #4-50, Centro',
    descripcion: 'Cocina saludable, vegetariana y vegana con ingredientes locales.',
    latitud: 4.4367, longitud: -75.2301, imagen: null,
    horario: 'Lun–Sáb 8am–8pm', telefono: '315 123 4567',
    destacado: false, reservas_hoy: 7 },
  { id: 4, nombre: 'El Tolimense — Cocina Regional', calificacion: 4.4, total_resenas: 56,
    categoria: 'Colombiana', zona: 'Ambalá', precio: '$', direccion: 'Tr 3 #8-21, Ambalá',
    descripcion: 'Sabores auténticos del Tolima: lechona, tamal y más.',
    latitud: 4.4350, longitud: -75.2340, imagen: null,
    horario: 'Lun–Dom 7am–7pm', telefono: '318 765 4321',
    destacado: false, reservas_hoy: 4 },
  { id: 5, nombre: 'Bistró Francés — Le Petit', calificacion: 4.7, total_resenas: 78,
    categoria: 'Francesa', zona: 'La Pola', precio: '$$$$', direccion: 'Cra 8 #30-15, La Pola',
    descripcion: 'Elegante bistró con vinos importados y croissants artesanales.',
    latitud: 4.4410, longitud: -75.2275, imagen: null,
    horario: 'Mar–Dom 12pm–10pm', telefono: '316 234 5678',
    destacado: true, reservas_hoy: 9 },
  { id: 6, nombre: 'Pizza Napolitana — Da Marco', calificacion: 4.6, total_resenas: 134,
    categoria: 'Italiana', zona: 'Chapetón', precio: '$$', direccion: 'Calle 15 #6-40, Chapetón',
    descripcion: 'Pizza al horno de leña con masa madre y tomates San Marzano.',
    latitud: 4.4395, longitud: -75.2315, imagen: null,
    horario: 'Lun–Dom 11am–11pm', telefono: '314 876 5432',
    destacado: false, reservas_hoy: 22 },
]

const MOCK_CATEGORIES = [
  { id: 1, nombre: 'Parrilla' }, { id: 2, nombre: 'Japonesa' },
  { id: 3, nombre: 'Vegetariana' }, { id: 4, nombre: 'Colombiana' },
  { id: 5, nombre: 'Francesa' }, { id: 6, nombre: 'Italiana' },
  { id: 7, nombre: 'Mariscos' }, { id: 8, nombre: 'Americana' },
]

const USE_MOCK = false // ✅ Conectado a API real

function toApiFilters(filters) {
  return {
    category: filters.categoria || undefined,
    zone: filters.zona || undefined,
    search: filters.search || undefined,
  }
}

export function useRestaurants(filters = {}) {
  return useQuery({
    queryKey: ['restaurants', filters],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 600))
        let data = [...MOCK_RESTAURANTS]
        if (filters.categoria) data = data.filter(r => r.categoria === filters.categoria)
        if (filters.zona)      data = data.filter(r => r.zona === filters.zona)
        if (filters.search)    data = data.filter(r =>
          r.nombre.toLowerCase().includes(filters.search.toLowerCase()))
        return { data, total: data.length }
      }
      return getRestaurants(toApiFilters(filters)).then(res => ({
        data: (res.data ?? []).map(adaptRestaurant),
        total: res.total ?? res.meta?.total ?? 0,
      }))
    },
  })
}

export function useRestaurant(id) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 400))
        const rest = MOCK_RESTAURANTS.find(r => r.id === Number(id))
        if (!rest) throw new Error('Restaurante no encontrado')
        return {
          ...rest,
          fotos: [],
          menu: [
            { id: 1, nombre: 'Bandeja Paisa', precio: 28000, descripcion: 'Clásico colombiano completo', categoria: 'Principal' },
            { id: 2, nombre: 'Lechona Tolimense', precio: 22000, descripcion: 'Especialidad de la casa', categoria: 'Principal' },
            { id: 3, nombre: 'Ajiaco Santafereño', precio: 18000, descripcion: 'Sopa tradicional colombiana', categoria: 'Sopas' },
            { id: 4, nombre: 'Limonada de Coco', precio: 8000, descripcion: 'Refrescante y cremosa', categoria: 'Bebidas' },
          ],
          mesas: [
            { id: 1, numero: 1, capacidad: 2, disponible: true },
            { id: 2, numero: 2, capacidad: 4, disponible: true },
            { id: 3, numero: 3, capacidad: 4, disponible: false },
            { id: 4, numero: 4, capacidad: 6, disponible: true },
            { id: 5, numero: 5, capacidad: 8, disponible: false },
          ]
        }
      }
      return getRestaurant(id).then(adaptRestaurant)
    },
    enabled: !!id,
  })
}

export function useAvailability(restaurantId, date, time, guests) {
  return useQuery({
    queryKey: ['availability', restaurantId, date, time, guests],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 500))
        const slots = ['12:00','12:30','13:00','13:30','18:00','18:30',
                       '19:00','19:30','20:00','20:30','21:00']
        return {
          time,
          tables: slots.map((t, i) => ({
            id: i + 1,
            numero: i + 1,
            capacidad: guests,
            disponible: Math.random() > 0.3,
          })),
        }
      }
      return getAvailability(restaurantId, date, time, guests).then(res => {
        const tables = res.tables ?? res
        return { time, tables: tables.map(adaptTable) }
      })
    },
    enabled: !!(restaurantId && date),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      if (USE_MOCK) return MOCK_CATEGORIES
      return getCategories().then(res => {
        const cats = res.data ?? res
        return cats.map(c => ({ id: c.id, nombre: c.name ?? c.nombre, slug: c.slug, icon: c.icon }))
      })
    },
  })
}

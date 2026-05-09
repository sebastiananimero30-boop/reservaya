import { describe, it, expect } from 'vitest'
import { adaptRestaurant, adaptTable, adaptReservation, adaptMenuItem } from '../../api/adapters'

describe('adaptRestaurant', () => {
  it('mapea campos del backend al formato del frontend', () => {
    const raw = {
      id: 1,
      name: 'La Ricotta',
      description: 'Restaurante italiano',
      address: 'Calle 10',
      zone: 'El Vergel',
      lat: 4.45,
      lng: -75.21,
      rating: 4.8,
      reviews_count: 42,
      category: { name: 'Italiana', slug: 'italiana', icon: '🍝' },
      cover_photo: 'https://img.com/foto.jpg',
      phone: '+57 315 000 0000',
    }

    const result = adaptRestaurant(raw)

    expect(result.nombre).toBe('La Ricotta')
    expect(result.descripcion).toBe('Restaurante italiano')
    expect(result.direccion).toBe('Calle 10')
    expect(result.zona).toBe('El Vergel')
    expect(result.latitud).toBe(4.45)
    expect(result.longitud).toBe(-75.21)
    expect(result.calificacion).toBe(4.8)
    expect(result.total_resenas).toBe(42)
    expect(result.categoria).toBe('Italiana')
    expect(result.imagen).toBe('https://img.com/foto.jpg')
  })

  it('usa valores por defecto cuando faltan campos', () => {
    const result = adaptRestaurant({ id: 1, name: 'Test' })
    expect(result.calificacion).toBe(0)
    expect(result.total_resenas).toBe(0)
    expect(result.categoria).toBe('')
    expect(result.imagen).toBeNull()
    expect(result.mesas).toEqual([])
    expect(result.menu).toEqual([])
  })

  it('retorna null si el input es null', () => {
    expect(adaptRestaurant(null)).toBeNull()
  })

  it('acepta campos ya en español (modo mock)', () => {
    const raw = { id: 1, nombre: 'Test', calificacion: 4.5, zona: 'Centro' }
    const result = adaptRestaurant(raw)
    expect(result.nombre).toBe('Test')
    expect(result.calificacion).toBe(4.5)
    expect(result.zona).toBe('Centro')
  })
})

describe('adaptTable', () => {
  it('mapea campos de mesa correctamente', () => {
    const raw = { id: 1, name: 'Mesa VIP', seats: 4, number: 1, price: 50000 }
    const result = adaptTable(raw)
    expect(result.id).toBe(1)
    expect(result.nombre).toBe('Mesa VIP')
    expect(result.capacidad).toBe(4)
    expect(result.numero).toBe(1)
    expect(result.precio).toBe(50000)
  })

  it('retorna null si el input es null', () => {
    expect(adaptTable(null)).toBeNull()
  })

  it('usa id como número si no hay number', () => {
    const result = adaptTable({ id: 5, name: 'Mesa 5', seats: 2 })
    expect(result.numero).toBe(5)
  })
})

describe('adaptMenuItem', () => {
  it('mapea campos de plato correctamente', () => {
    const raw = {
      id: 1,
      name: 'Pizza Margherita',
      description: 'Clásica italiana',
      category: 'Pizzas',
      price: 28000,
      image_url: 'https://img.com/pizza.jpg',
      is_available: true,
    }
    const result = adaptMenuItem(raw)
    expect(result.nombre).toBe('Pizza Margherita')
    expect(result.descripcion).toBe('Clásica italiana')
    expect(result.categoria).toBe('Pizzas')
    expect(result.precio).toBe(28000)
    expect(result.imagen).toBe('https://img.com/pizza.jpg')
    expect(result.disponible).toBe(true)
  })

  it('retorna null si el input es null', () => {
    expect(adaptMenuItem(null)).toBeNull()
  })
})

describe('adaptReservation', () => {
  it('normaliza el estado de inglés a español', () => {
    const raw = {
      id: 1,
      status: 'confirmed',
      start_time: '2026-05-10T19:00:00',
      guests: 2,
    }
    const result = adaptReservation(raw)
    expect(result.estado).toBe('confirmada')
  })

  it('normaliza todos los estados', () => {
    const estados = [
      ['confirmed', 'confirmada'],
      ['pending', 'pendiente'],
      ['cancelled', 'cancelada'],
      ['completed', 'completada'],
    ]
    estados.forEach(([input, expected]) => {
      const result = adaptReservation({ id: 1, status: input, start_time: '2026-05-10T19:00:00', guests: 1 })
      expect(result.estado).toBe(expected)
    })
  })

  it('retorna null si el input es null', () => {
    expect(adaptReservation(null)).toBeNull()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RestaurantFilters from '../../components/restaurants/RestaurantFilters'

// Mock del hook useCategories para no depender de la API
vi.mock('../../hooks/useRestaurants', () => ({
  useCategories: () => ({
    data: [
      { id: 1, nombre: 'Italiana', slug: 'italiana', icon: '🍝' },
      { id: 2, nombre: 'Parrilla', slug: 'parrilla', icon: '🥩' },
    ],
  }),
}))

function wrapper(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const defaultFilters = { categoria: '', zona: '', precio: '', search: '' }

describe('RestaurantFilters', () => {
  it('renderiza el botón de filtros', () => {
    wrapper(<RestaurantFilters filters={defaultFilters} onChange={vi.fn()} />)
    expect(screen.getByText(/filtros/i)).toBeInTheDocument()
  })

  it('muestra las categorías', () => {
    wrapper(<RestaurantFilters filters={defaultFilters} onChange={vi.fn()} />)
    expect(screen.getByText('Italiana')).toBeInTheDocument()
    expect(screen.getByText('Parrilla')).toBeInTheDocument()
  })

  it('llama onChange al seleccionar una categoría', () => {
    const onChange = vi.fn()
    wrapper(<RestaurantFilters filters={defaultFilters} onChange={onChange} />)
    fireEvent.click(screen.getByText('Italiana'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ categoria: 'italiana' }))
  })

  it('deselecciona la categoría al hacer clic de nuevo', () => {
    const onChange = vi.fn()
    const filters = { ...defaultFilters, categoria: 'italiana' }
    wrapper(<RestaurantFilters filters={filters} onChange={onChange} />)
    fireEvent.click(screen.getByText('Italiana'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ categoria: '' }))
  })

  it('abre el panel de filtros al hacer clic en Filtros', () => {
    wrapper(<RestaurantFilters filters={defaultFilters} onChange={vi.fn()} />)
    fireEvent.click(screen.getByText(/filtros/i))
    expect(screen.getByText('Zona')).toBeInTheDocument()
    expect(screen.getByText('Precio')).toBeInTheDocument()
  })

  it('muestra botón Limpiar cuando hay filtros activos', () => {
    const filters = { ...defaultFilters, zona: 'Centro' }
    wrapper(<RestaurantFilters filters={filters} onChange={vi.fn()} />)
    expect(screen.getByText(/limpiar/i)).toBeInTheDocument()
  })

  it('llama onChange con filtros vacíos al limpiar', () => {
    const onChange = vi.fn()
    const filters = { ...defaultFilters, zona: 'Centro', categoria: 'italiana' }
    wrapper(<RestaurantFilters filters={filters} onChange={onChange} />)
    fireEvent.click(screen.getByText(/limpiar/i))
    expect(onChange).toHaveBeenCalledWith({ categoria: '', zona: '', precio: '', search: '' })
  })
})

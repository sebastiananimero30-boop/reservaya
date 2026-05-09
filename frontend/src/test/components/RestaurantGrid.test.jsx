import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RestaurantGrid from '../../components/restaurants/RestaurantGrid'

const mockRestaurants = [
  { id: 1, nombre: 'La Ricotta', calificacion: 4.8, total_resenas: 42, categoria: 'Italiana', zona: 'El Vergel', precio: '$', imagen: null, destacado: false, reservas_hoy: 5, horario: 'Lun-Dom' },
  { id: 2, nombre: 'Tango Parrilla', calificacion: 4.6, total_resenas: 30, categoria: 'Parrilla', zona: 'Centro', precio: '$$', imagen: null, destacado: true, reservas_hoy: 0, horario: 'Lun-Dom' },
]

function wrapper(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('RestaurantGrid', () => {
  it('muestra skeletons mientras carga', () => {
    const { container } = wrapper(<RestaurantGrid restaurants={[]} isLoading={true} />)
    const skeletons = container.querySelectorAll('.skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('muestra mensaje cuando no hay restaurantes', () => {
    wrapper(<RestaurantGrid restaurants={[]} isLoading={false} />)
    expect(screen.getByText(/no se encontraron restaurantes/i)).toBeInTheDocument()
  })

  it('renderiza las tarjetas de restaurantes', () => {
    wrapper(<RestaurantGrid restaurants={mockRestaurants} isLoading={false} />)
    expect(screen.getByText('La Ricotta')).toBeInTheDocument()
    expect(screen.getByText('Tango Parrilla')).toBeInTheDocument()
  })

  it('muestra el número correcto de tarjetas', () => {
    wrapper(<RestaurantGrid restaurants={mockRestaurants} isLoading={false} />)
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('cada tarjeta enlaza al detalle del restaurante', () => {
    wrapper(<RestaurantGrid restaurants={mockRestaurants} isLoading={false} />)
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/restaurantes/1')
    expect(links[1]).toHaveAttribute('href', '/restaurantes/2')
  })
})

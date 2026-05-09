import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Navbar from '../../components/common/Navbar'
import { AuthProvider } from '../../context/AuthContext'

function wrapper(ui, { token } = {}) {
  if (token) localStorage.setItem('token', token)
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Navbar', () => {
  it('muestra el logo ReservaYa', () => {
    wrapper(<Navbar dark={false} setDark={vi.fn()} />)
    expect(screen.getByText('ReservaYa')).toBeInTheDocument()
  })

  it('muestra botones de login y registro cuando no hay sesión', () => {
    wrapper(<Navbar dark={false} setDark={vi.fn()} />)
    expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument()
    expect(screen.getByText(/registrarse/i)).toBeInTheDocument()
  })

  it('tiene botón de toggle de modo oscuro', () => {
    wrapper(<Navbar dark={false} setDark={vi.fn()} />)
    expect(screen.getByLabelText(/cambiar tema/i)).toBeInTheDocument()
  })

  it('llama setDark al hacer clic en el toggle', () => {
    const setDark = vi.fn()
    wrapper(<Navbar dark={false} setDark={setDark} />)
    fireEvent.click(screen.getByLabelText(/cambiar tema/i))
    expect(setDark).toHaveBeenCalled()
  })

  it('tiene barra de búsqueda en desktop', () => {
    wrapper(<Navbar dark={false} setDark={vi.fn()} />)
    expect(screen.getByPlaceholderText(/buscar restaurantes/i)).toBeInTheDocument()
  })
})

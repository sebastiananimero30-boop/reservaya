import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DateTimePicker from '../../components/reservations/DateTimePicker'

const today = new Date().toISOString().split('T')[0]

describe('DateTimePicker', () => {
  const defaultValue = { date: today, time: '19:00', guests: 2 }

  it('renderiza los tres selectores', () => {
    render(<DateTimePicker value={defaultValue} onChange={vi.fn()} />)
    // El label usa un ícono SVG + texto, buscamos por texto visible
    expect(screen.getByText(/fecha/i)).toBeInTheDocument()
    expect(screen.getByText(/personas/i)).toBeInTheDocument()
    expect(screen.getByText(/hora preferida/i)).toBeInTheDocument()
  })

  it('muestra la fecha actual por defecto', () => {
    render(<DateTimePicker value={defaultValue} onChange={vi.fn()} />)
    const input = screen.getByDisplayValue(today)
    expect(input).toBeInTheDocument()
  })

  it('llama onChange al cambiar la fecha', () => {
    const onChange = vi.fn()
    render(<DateTimePicker value={defaultValue} onChange={onChange} />)
    const input = screen.getByDisplayValue(today)
    fireEvent.change(input, { target: { value: '2026-06-01' } })
    expect(onChange).toHaveBeenCalledWith({ ...defaultValue, date: '2026-06-01' })
  })

  it('llama onChange al seleccionar número de personas', () => {
    const onChange = vi.fn()
    render(<DateTimePicker value={defaultValue} onChange={onChange} />)
    const btn4 = screen.getByRole('button', { name: '4' })
    fireEvent.click(btn4)
    expect(onChange).toHaveBeenCalledWith({ ...defaultValue, guests: 4 })
  })

  it('llama onChange al seleccionar hora', () => {
    const onChange = vi.fn()
    render(<DateTimePicker value={defaultValue} onChange={onChange} />)
    const btn = screen.getByRole('button', { name: '20:00' })
    fireEvent.click(btn)
    expect(onChange).toHaveBeenCalledWith({ ...defaultValue, time: '20:00' })
  })

  it('resalta la hora seleccionada', () => {
    render(<DateTimePicker value={{ ...defaultValue, time: '19:00' }} onChange={vi.fn()} />)
    const btn = screen.getByRole('button', { name: '19:00' })
    expect(btn.className).toContain('bg-primary-500')
  })

  it('resalta el número de personas seleccionado', () => {
    render(<DateTimePicker value={{ ...defaultValue, guests: 2 }} onChange={vi.fn()} />)
    const btn = screen.getByRole('button', { name: '2' })
    expect(btn.className).toContain('bg-primary-500')
  })

  it('no permite seleccionar fechas pasadas', () => {
    render(<DateTimePicker value={defaultValue} onChange={vi.fn()} />)
    const input = screen.getByDisplayValue(today)
    expect(input).toHaveAttribute('min', today)
  })

  it('muestra opciones de 1 a 8 personas', () => {
    render(<DateTimePicker value={defaultValue} onChange={vi.fn()} />)
    for (let i = 1; i <= 8; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument()
    }
  })
})

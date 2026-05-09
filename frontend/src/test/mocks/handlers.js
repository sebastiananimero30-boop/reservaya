import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000/api'

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json()
    if (email === 'test@test.com' && password === 'password123') {
      return HttpResponse.json({
        token: 'fake-token-123',
        user: { id: 1, name: 'Test User', email, role: 'client' },
      })
    }
    return HttpResponse.json(
      { message: 'Credenciales incorrectas' },
      { status: 422 }
    )
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      token: 'fake-token-123',
      user: { id: 2, name: body.name, email: body.email, role: 'client' },
    }, { status: 201 })
  }),

  http.get(`${BASE}/auth/me`, ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (auth === 'Bearer fake-token-123') {
      return HttpResponse.json({
        user: { id: 1, name: 'Test User', email: 'test@test.com', role: 'client' },
      })
    }
    return HttpResponse.json({ message: 'Unauthenticated' }, { status: 401 })
  }),

  http.post(`${BASE}/auth/logout`, () =>
    HttpResponse.json({ message: 'Sesión cerrada correctamente.' })
  ),

  // Restaurantes
  http.get(`${BASE}/restaurants`, () =>
    HttpResponse.json({
      data: [
        { id: 1, name: 'La Ricotta', rating: 4.8, category: { name: 'Italiana', slug: 'italiana' }, zone: 'El Vergel', address: 'Calle 10', is_active: true },
        { id: 2, name: 'Tango Parrilla', rating: 4.6, category: { name: 'Parrilla', slug: 'parrilla' }, zone: 'Centro', address: 'Cra 5', is_active: true },
      ],
      total: 2,
    })
  ),

  http.get(`${BASE}/restaurants/:id`, ({ params }) =>
    HttpResponse.json({
      id: Number(params.id),
      name: 'La Ricotta',
      description: 'Restaurante italiano',
      address: 'Calle 10',
      zone: 'El Vergel',
      rating: 4.8,
      reviews_count: 42,
      category: { name: 'Italiana', slug: 'italiana', icon: '🍝' },
      available_tables: [
        { id: 1, name: 'Mesa 1', seats: 2, number: 1 },
        { id: 2, name: 'Mesa 2', seats: 4, number: 2 },
      ],
      menu: [],
      photos: [],
      schedules: [],
    })
  ),

  http.get(`${BASE}/categories`, () =>
    HttpResponse.json({
      data: [
        { id: 1, name: 'Italiana', slug: 'italiana', icon: '🍝' },
        { id: 2, name: 'Parrilla', slug: 'parrilla', icon: '🥩' },
      ],
    })
  ),

  http.get(`${BASE}/restaurants/:id/availability`, () =>
    HttpResponse.json({
      tables: [
        { id: 1, name: 'Mesa 1', seats: 2, number: 1 },
        { id: 2, name: 'Mesa 2', seats: 4, number: 2 },
      ],
    })
  ),

  // Reservas
  http.post(`${BASE}/reservations`, () =>
    HttpResponse.json({
      id: 1,
      status: 'confirmed',
      qr_code: 'https://qr.example.com/test',
      start_time: '2026-05-10T19:00:00',
      guests: 2,
    }, { status: 201 })
  ),

  http.get(`${BASE}/my/reservations`, () =>
    HttpResponse.json({
      data: [
        {
          id: 1,
          status: 'confirmed',
          start_time: '2026-05-10T19:00:00',
          guests: 2,
          restaurant: { id: 1, name: 'La Ricotta' },
          table: { id: 1, name: 'Mesa 1' },
        },
      ],
    })
  ),

  http.patch(`${BASE}/reservations/:id/cancel`, () =>
    HttpResponse.json({ message: 'Reserva cancelada correctamente.' })
  ),
]

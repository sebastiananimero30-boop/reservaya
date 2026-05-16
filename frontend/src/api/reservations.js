import api from './axios'

export const createReservation = (data) =>
  api.post('/reservations', data).then(r => r.data)

export const getMyReservations = () =>
  api.get('/my/reservations').then(r => r.data)

export const cancelReservation = (id) =>
  api.patch(`/reservations/${id}/cancel`).then(r => r.data)

export const createStripeCheckoutSession = (reservationId) =>
  api.post(`/reservations/${reservationId}/checkout-session`).then(r => r.data)

export const getStripeCheckoutSession = (sessionId) =>
  api.get(`/payments/stripe/sessions/${sessionId}`).then(r => r.data)

import api from './axios'

export const createReservation = (data) =>
  api.post('/reservations', data).then(r => r.data)

export const getMyReservations = () =>
  api.get('/my/reservations').then(r => r.data)

export const cancelReservation = (id) =>
  api.patch(`/reservations/${id}/cancel`).then(r => r.data)

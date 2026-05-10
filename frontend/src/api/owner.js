import api from './axios'

export const getOwnerRestaurants = () =>
  api.get('/owner/restaurants').then(r => r.data)

export const getOwnerMenu = (restaurantId) =>
  api.get(`/owner/restaurants/${restaurantId}/menu`).then(r => r.data)

export const getOwnerReservations = (restaurantId, status = '') =>
  api.get(`/owner/restaurants/${restaurantId}/reservations`, { params: status ? { status } : {} }).then(r => r.data)

export const updateReservationStatus = (reservationId, status) =>
  api.patch(`/owner/reservations/${reservationId}/status`, { status }).then(r => r.data)

export const scanOwnerReservation = (restaurantId, code, complete = false) =>
  api.post(`/owner/restaurants/${restaurantId}/reservations/scan`, { code, complete }).then(r => r.data)

export const getOwnerStats = (restaurantId) =>
  api.get(`/owner/restaurants/${restaurantId}/stats`).then(r => r.data)

export const createMenuItem = (restaurantId, data) =>
  api.post(`/owner/restaurants/${restaurantId}/menu`, data).then(r => r.data)

export const updateMenuItem = (itemId, data) =>
  api.patch(`/owner/menu-items/${itemId}`, data).then(r => r.data)

export const deleteMenuItem = (itemId) =>
  api.delete(`/owner/menu-items/${itemId}`).then(r => r.data)

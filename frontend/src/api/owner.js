import api from './axios'

export const getOwnerRestaurants = () =>
  api.get('/owner/restaurants').then(r => r.data)

export const getOwnerMenu = (restaurantId) =>
  api.get(`/owner/restaurants/${restaurantId}/menu`).then(r => r.data)

export const getOwnerReservations = (restaurantId, filters = {}) => {
  const params = {}
  if (filters.status)     params.status     = filters.status
  if (filters.dateFrom)   params.date_from  = filters.dateFrom
  if (filters.dateTo)     params.date_to    = filters.dateTo
  if (filters.dateField)  params.date_field = filters.dateField
  return api.get(`/owner/restaurants/${restaurantId}/reservations`, { params }).then(r => r.data)
}

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

export const getTrashedMenuItems = (restaurantId) =>
  api.get(`/owner/restaurants/${restaurantId}/menu/trashed`).then(r => r.data)

export const restoreMenuItem = (itemId) =>
  api.patch(`/owner/menu-items/${itemId}/restore`).then(r => r.data)

export const forceDeleteMenuItem = (itemId) =>
  api.delete(`/owner/menu-items/${itemId}/force`).then(r => r.data)

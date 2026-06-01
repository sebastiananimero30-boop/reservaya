import api from './axios'

// ── Owners ────────────────────────────────────────────────────────────────────
export const getOwners = () =>
  api.get('/admin/owners').then(r => r.data)

export const createOwner = (data) =>
  api.post('/admin/owners', data).then(r => r.data)

export const deleteOwner = (id) =>
  api.delete(`/admin/owners/${id}`).then(r => r.data)

// ── Restaurantes ──────────────────────────────────────────────────────────────
export const getAdminRestaurants = () =>
  api.get('/admin/restaurants').then(r => r.data)

export const createRestaurant = (data) =>
  api.post('/admin/restaurants', data).then(r => r.data)

export const assignOwnerToRestaurant = (restaurantId, ownerId) =>
  api.patch(`/admin/restaurants/${restaurantId}/assign`, { owner_id: ownerId }).then(r => r.data)

export const updateRestaurantCover = (restaurantId, url) =>
  api.patch(`/admin/restaurants/${restaurantId}/cover`, { url }).then(r => r.data)

export const updateRestaurant = (restaurantId, data) =>
  api.patch(`/admin/restaurants/${restaurantId}`, data).then(r => r.data)

// ── Categorías ────────────────────────────────────────────────────────────────
export const getAdminCategories = () =>
  api.get('/admin/categories').then(r => r.data)

export const getAdminStats = () =>
  api.get('/admin/stats').then(r => r.data)

// ── Papelera de restaurantes ──────────────────────────────────────────────────
export const getTrashedRestaurants = () =>
  api.get('/admin/restaurants/trashed').then(r => r.data)

export const restoreRestaurant = (id) =>
  api.patch(`/admin/restaurants/${id}/restore`).then(r => r.data)

export const forceDeleteRestaurant = (id) =>
  api.delete(`/admin/restaurants/${id}/force`).then(r => r.data)

export const deleteRestaurant = (id) =>
  api.delete(`/admin/restaurants/${id}`).then(r => r.data)

// ── Contraseña de propietario ─────────────────────────────────────────────────
export const resetOwnerPassword = (id, password = null) =>
  api.patch(`/admin/owners/${id}/reset-password`, password ? { password } : {}).then(r => r.data)

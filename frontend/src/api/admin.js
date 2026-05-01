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

// ── Categorías ────────────────────────────────────────────────────────────────
export const getAdminCategories = () =>
  api.get('/admin/categories').then(r => r.data)

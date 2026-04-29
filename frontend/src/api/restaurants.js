import api from './axios'

function cleanRestaurantParams(params = {}) {
  const mapped = {
    ...params,
    category: params.category ?? params.categoria,
    zone: params.zone ?? params.zona,
    search: params.search,
  }

  delete mapped.categoria
  delete mapped.zona
  delete mapped.precio

  return Object.fromEntries(
    Object.entries(mapped).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

export const getRestaurants = (params) =>
  api.get('/restaurants', { params: cleanRestaurantParams(params) }).then(r => r.data)

export const getRestaurant = (id) =>
  api.get(`/restaurants/${id}`).then(r => r.data)

export const getAvailability = (restaurantId, date, time, guests) =>
  api.get(`/restaurants/${restaurantId}/availability`, {
    params: { date, time, guests }
  }).then(r => r.data)

export const getCategories = () =>
  api.get('/categories').then(r => r.data)
